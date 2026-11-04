from collections.abc import Generator
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings
from sqlalchemy import create_engine

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# Alurnya:
# 1. Request masuk.
# 2. FastAPI menjalankan get_db().
# 3. Database session diberikan kepada endpoint.
# 4. Endpoint menjalankan operasi database.
# 5. Setelah request selesai, session ditutup melalui finally.