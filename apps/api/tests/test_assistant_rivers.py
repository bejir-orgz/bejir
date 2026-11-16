import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.repositories.assistant import AssistantRepository
from app.repositories.geography.river import RiverRepository
from app.schemas.assistant import AssistantChatRequest
from app.services.assistant import settings


@pytest.fixture
def river_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        # Test spatial membership and SQL scoping without requiring a local PostGIS server.
        raw = connection.connection.driver_connection
        raw.create_function("ST_Transform", 2, lambda geometry, srid: geometry)
        raw.create_function("ST_Intersects", 2, lambda river, district: district in river.split(",") if river and district else False)
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        connection.exec_driver_sql("CREATE TABLE core.regency (id INTEGER PRIMARY KEY, name TEXT)")
        connection.exec_driver_sql("CREATE TABLE core.districts (id INTEGER PRIMARY KEY, name TEXT, regency_id INTEGER, geom TEXT)")
        connection.exec_driver_sql("CREATE TABLE core.rivers (id INTEGER PRIMARY KEY, name TEXT, river_type TEXT, geom TEXT)")
        connection.exec_driver_sql("INSERT INTO core.regency VALUES (1, 'Depok'), (2, 'Bandung')")
        connection.exec_driver_sql("INSERT INTO core.districts VALUES (1, 'Beji', 1, 'a'), (2, 'Cimanggis', 1, 'b'), (3, 'Coblong', 2, 'c'), (4, 'Kosong', 2, 'd')")
        connection.exec_driver_sql("INSERT INTO core.rivers VALUES (1, 'Ciliwung', 'Sungai', 'a,b'), (2, NULL, 'Saluran', 'b'), (3, 'Cikapundung', 'Sungai', 'c')")
        connection.commit()
        queries = []
        event.listen(engine, "before_cursor_execute", lambda conn, cursor, statement, parameters, context, many: queries.append(statement))
        with Session(bind=connection) as session:
            session.info["queries"] = queries
            yield session
    engine.dispose()


@pytest.mark.parametrize(("question", "count", "coverage"), [
    ("Sungai di Depok", 2, "mentioned_regions"),
    ("Sungai di Beji dan Cimanggis", 2, "mentioned_regions"),
    ("Sungai di Coblong", 1, "mentioned_regions"),
    ("Sungai di Kosong", 0, "mentioned_regions"),
    ("Sungai di lokasi tidak dikenal", 3, "entire_dataset"),
])
def test_river_context_scope_and_cross_boundary_deduplication(river_db, question, count, coverage):
    result = AssistantRepository.get_context(river_db, question=question, sources=["rivers"])["rivers"]
    assert result["segment_count"] == count
    assert result["scope"]["coverage"] == coverage
    assert all("geom" not in group for group in result["top_name_type_groups"])
    queries = river_db.info["queries"]
    assert len(queries) == 3  # location names, count, bounded groups
    assert not any("ST_As" in query for query in queries)
    if coverage == "mentioned_regions":
        assert "EXISTS" in queries[1] and "ST_Intersects(core.rivers.geom, ST_Transform(core.districts.geom" in queries[1]
    if count == 2:
        assert any(group["name"] is None for group in result["top_name_type_groups"])


def test_river_groups_bounded_and_source_opt_in(river_db):
    for i in range(4, 20):
        river_db.connection().exec_driver_sql("INSERT INTO core.rivers VALUES (?, ?, 'Sungai', 'a')", (i, f"Sungai {i}"))
    result = RiverRepository.get_assistant_summary(river_db)
    assert result["segment_count"] == 19
    assert len(result["top_name_type_groups"]) == 8
    river_db.info["queries"].clear()
    assert AssistantRepository.get_context(river_db, question="Depok", sources=[]) == {}
    assert not any("core.rivers" in query for query in river_db.info["queries"])


def test_chat_accepts_rivers_and_passes_grounded_context_to_provider(river_db, monkeypatch):
    captured = {}

    class Provider:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, **kwargs):
            import httpx
            captured.update(kwargs["json"])
            return httpx.Response(200, request=httpx.Request("POST", url), json={
                "candidates": [{"content": {"parts": [{"text": "Terdapat 2 segmen sungai di Depok."}]}}],
            })

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr("app.services.assistant.httpx.Client", Provider)
    app.dependency_overrides[get_db] = lambda: river_db
    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/assistant/chat", json={
                "messages": [{"role": "user", "content": "Sungai di Depok"}], "sources": ["rivers"],
            })
            assert response.status_code == 200
            assert response.json()["sources"] == ["rivers"]
            assert '"segment_count": 2' in captured["contents"][-1]["parts"][0]["text"]
            assert "Ciliwung" in captured["contents"][-1]["parts"][0]["text"]
            assert client.post("/api/v1/assistant/chat", json={
                "messages": [{"role": "user", "content": "Sungai"}], "sources": ["unknown"],
            }).status_code == 422
    finally:
        app.dependency_overrides.clear()

    request = AssistantChatRequest(messages=[{"role": "user", "content": "Data Bejir"}], sources=[
        "flood_history", "flood_susceptibility", "population_exposure", "evacuation_sites", "rivers",
    ])
    assert len(request.sources) == 5
