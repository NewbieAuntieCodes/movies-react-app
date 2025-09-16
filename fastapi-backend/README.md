# 电影应用 FastAPI 后端

这是电影应用后端的 Python FastAPI 版本，提供与原 Express.js 后端相同的功能。

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 在项目根目录下运行
./start-fastapi.sh
```

### 方式二：手动启动

```bash
# 进入FastAPI后端目录
cd fastapi-backend

# 创建虚拟环境（首次运行）
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务器
python main.py
```

## 📚 API 文档

FastAPI 自动生成交互式 API 文档：

- **Swagger UI**: http://localhost:3002/docs
- **ReDoc**: http://localhost:3002/redoc

## 🛠️ 技术栈

- **FastAPI**: 现代、快速的 Python Web 框架
- **SQLAlchemy**: Python SQL 工具包和对象关系映射
- **Pydantic**: 数据验证和序列化
- **HTTPx**: 现代异步 HTTP 客户端
- **Uvicorn**: ASGI 服务器
- **SQLite**: 轻量级数据库
- **Passlib**: 密码哈希库
- **Python-JOSE**: JWT 处理

## 📁 项目结构

```
fastapi-backend/
├── main.py              # 主应用程序文件
├── database.py          # 数据库配置和连接
├── models.py            # SQLAlchemy 数据模型
├── schemas.py           # Pydantic 数据模式
├── auth.py              # 身份验证和授权
├── requirements.txt     # Python 依赖包
├── .env                # 环境变量配置
├── routers/            # API 路由模块
│   ├── __init__.py
│   ├── movies.py       # 电影相关 API
│   ├── users.py        # 用户认证 API
│   ├── watch_status.py # 观看状态 API
│   ├── movie_edits.py  # 电影编辑 API
│   └── games.py        # 游戏相关 API
└── movies.db           # SQLite 数据库文件
```

## 🔧 环境配置

编辑 `fastapi-backend/.env` 文件：

```bash
# 服务器配置
PORT=3002

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# TMDB API配置
TMDB_API_KEY=your-tmdb-api-key

# RAWG API配置（可选）
RAWG_API_KEY=your-rawg-api-key-here

# 数据库配置
DATABASE_URL=sqlite:///./movies.db
```

## 🌟 主要功能

### 1. 用户认证
- ✅ 用户注册和登录
- ✅ JWT token 验证
- ✅ 密码加密存储

### 2. 电影数据
- ✅ TMDB API 集成
- ✅ 电影搜索和分类
- ✅ 热门电影获取
- ✅ 多媒体类型支持（电影、电视剧、动漫等）

### 3. 用户功能
- ✅ 观看状态追踪（已看、想看）
- ✅ 电影评分和笔记
- ✅ 个人观影记录
- ✅ 电影自定义编辑

### 4. 游戏功能
- ✅ 游戏数据展示
- ✅ 游戏搜索和筛选
- ✅ 免费游戏 API 集成

## 📊 API 端点

### 认证
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录

### 电影
- `GET /api/movies/search` - 搜索电影
- `GET /api/movies/popular` - 获取热门电影
- `GET /api/movies/genres` - 获取电影分类

### 观看状态
- `POST /api/watch-status/` - 创建/更新观看状态
- `GET /api/watch-status/` - 获取观看列表
- `GET /api/watch-status/{movie_id}` - 获取特定电影状态
- `DELETE /api/watch-status/{movie_id}` - 删除观看状态

### 电影编辑
- `POST /api/movie-edits/` - 创建/更新电影编辑
- `GET /api/movie-edits/` - 获取编辑列表
- `GET /api/movie-edits/{movie_id}` - 获取特定电影编辑
- `DELETE /api/movie-edits/{movie_id}` - 删除电影编辑

### 游戏
- `GET /api/games/popular` - 获取热门游戏
- `GET /api/games/search` - 搜索游戏
- `GET /api/games/genres` - 获取游戏分类
- `GET /api/games/{game_id}` - 获取游戏详情

### 系统
- `GET /api/health` - 健康检查

## 🔄 从 Express.js 迁移

新的 FastAPI 后端保持了与原 Express.js 后端相同的 API 接口，前端可以无缝切换：

1. **相同的端口**: 默认运行在 3002 端口
2. **相同的路由**: API 路径保持不变
3. **相同的数据格式**: 请求和响应格式完全兼容
4. **相同的认证**: JWT token 认证方式不变

## 🚦 健康检查

访问 `http://localhost:3002/api/health` 检查服务状态。

## 🐛 调试和开发

FastAPI 提供了出色的开发体验：

- **自动重载**: 代码更改时自动重启服务器
- **详细错误信息**: 清晰的错误提示和堆栈跟踪
- **交互式文档**: 可直接在浏览器中测试 API
- **类型检查**: Pydantic 提供运行时类型验证

## ⚡ 性能优势

相比 Express.js 版本，FastAPI 版本提供：

- **更快的启动时间**: Python 异步特性
- **更好的并发处理**: 基于 ASGI 的异步架构
- **内置数据验证**: Pydantic 自动验证请求数据
- **自动 API 文档**: 无需额外配置即可生成完整文档

## 🔒 安全特性

- **密码加密**: 使用 bcrypt 安全存储密码
- **JWT 认证**: 安全的 token 验证机制
- **CORS 配置**: 跨域请求安全控制
- **输入验证**: Pydantic 自动验证所有输入数据

## 📝 注意事项

1. **Python 版本**: 需要 Python 3.7+
2. **虚拟环境**: 建议使用虚拟环境隔离依赖
3. **数据库**: 使用 SQLite，数据与原版本兼容
4. **API 密钥**: 记得配置 TMDB API 密钥

---

**享受使用 FastAPI 构建的现代化后端服务！** 🎉