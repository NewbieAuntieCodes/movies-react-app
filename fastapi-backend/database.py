from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./movies.db")

# 添加连接池配置
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,  # 验证连接有效性
    pool_recycle=3600,   # 每小时回收连接
    echo=False           # 生产环境关闭SQL日志
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    from models import User, WatchStatus, Favorite, MovieEdit  # Import models to register them
    print("初始化数据库...")

    # 创建基础表结构
    Base.metadata.create_all(bind=engine)

    print("数据库初始化完成")