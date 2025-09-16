from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# 初始化FastAPI应用
app = FastAPI(title="Simple Movies App API")

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "🎬 电影应用 FastAPI 后端",
        "status": "working",
        "version": "2.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {
        "message": "电影应用后端运行正常！",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0 (FastAPI)"
    }

@app.get("/api/movies/genres")
async def get_genres():
    """简单的分类端点用于测试"""
    return [
        {"id": 28, "name": "动作"},
        {"id": 35, "name": "喜剧"},
        {"id": 18, "name": "剧情"},
        {"id": 27, "name": "恐怖"}
    ]

@app.get("/api/movies/popular")
async def get_popular_movies(page: int = 1):
    """简单的热门电影端点用于测试"""
    return {
        "results": [
            {
                "id": 123,
                "title": "测试电影",
                "poster_path": "/test.jpg",
                "overview": "这是一个测试电影"
            }
        ],
        "total_pages": 1,
        "total_results": 1,
        "page": page
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )