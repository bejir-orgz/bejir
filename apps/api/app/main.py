from fastapi import FastAPI

app = FastAPI(
  title="Bejir API",
  description="Flood Intelligence & Evacuation Assistant API",
  version="0.0.1",
)

@app.get("/")
async def root():
  return {
    "message": "Bejir API is running",
    "version": "0.1.0",
  }
