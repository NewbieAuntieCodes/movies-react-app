from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from datetime import datetime
import os
import logging

from database import init_database
from routers import movies, users, watch_status, movie_edits, games

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("初始化数据库...")
    init_database()
    print("后端启动完成")
    yield
    # 关闭时执行（如果需要）
    print("后端关闭")

# 初始化FastAPI应用
app = FastAPI(
    title="Movies React App API",
    description="Movie app backend with user watch status tracking - FastAPI version",
    version="2.0.0",
    lifespan=lifespan
)

# CORS中间件配置
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3002,http://localhost:3007").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# 静态文件服务暂时禁用
# app.mount("/static", StaticFiles(directory="static"), name="static")

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "请求参数验证失败", "details": exc.errors(), "status_code": 422}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "服务器内部错误", "status_code": 500}
    )

# 注册路由
app.include_router(movies.router, prefix="/api/movies", tags=["movies"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(watch_status.router, prefix="/api/watch-status", tags=["watch-status"])
app.include_router(movie_edits.router, prefix="/api/movie-edits", tags=["movie-edits"])
app.include_router(games.router, prefix="/api/games", tags=["games"])

# 管理员面板路由
@app.get("/admin")
@app.get("/admin.html")
async def admin_panel():
    return FileResponse("static/admin.html")

@app.get("/login")
@app.get("/login.html")
async def admin_login():
    return FileResponse("static/login.html")

# 健康检查端点
@app.get("/api/health")
async def health_check():
    return {
        "message": "电影应用后端运行正常！",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0 (FastAPI)"
    }

# 根路径
@app.get("/")
async def root():
    return {
        "message": "🎬 电影应用 FastAPI 后端",
        "docs": "/docs",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )