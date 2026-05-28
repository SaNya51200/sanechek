from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import uvicorn

from routers import router as api_router

app = FastAPI(
    title="Smart Library API",
    description="Продвинутое REST API для управления каталогом книг",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1", tags=["Library Books"])

@app.get("/", include_in_schema=False)
async def welcome():
    return {
        "message": "API библиотеки успешно запущено!",
        "docs_url": "/docs",
        "health_check": "/health"
    }

@app.get("/health", include_in_schema=False)
async def check_health():
    return {"status": "ok", "date": date.today().isoformat()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
