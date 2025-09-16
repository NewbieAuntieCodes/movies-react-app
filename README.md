# 🎬 电影筛选器 (React + FastAPI版)

一个现代化的电影筛选和观看状态管理应用，支持用户标记"已看过"、"想看"等状态，以及自定义标签管理功能。

## ✨ 功能特点

### 🎯 电影搜索与筛选
- 🔍 关键词搜索（支持中英文）
- 🎭 类型筛选（电影/电视剧/全部）
- 🏷️ 分类筛选（动作、喜剧、科幻等）
- 📅 年份筛选（1950-2025）
- 🌍 地区筛选（美国、中国、韩国、日本等）
- 📊 多种排序方式（热门度、评分、上映时间等）

### 👤 用户功能
- 🔐 用户注册/登录系统
- ⭐ 标记电影状态：已看过、想看
- 🏷️ 自定义标签管理：背景时间标签、题材标签
- 🎯 拖拽式标签分配
- 📈 观看统计数据
- 💾 数据持久化存储

### 🎨 界面设计
- 📱 响应式设计，支持移动端
- 🎨 现代化UI，使用Tailwind CSS
- 🖼️ 高质量电影海报展示
- ⚡ 流畅的交互体验

## 🛠️ 技术栈

### 前端
- **React 18** + TypeScript
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Axios** - HTTP客户端
- **Heroicons** - 图标库

### 后端
- **Python** + **FastAPI**
- **SQLite** - 数据库
- **JWT** - 身份认证
- **passlib** - 密码加密
- **pydantic** - 数据验证

### API
- **TMDB API** - 电影数据源

## 📁 项目结构

```
movies-react-app/
├── frontend/                    # React前端
│   ├── public/
│   ├── src/
│   │   ├── components/          # React组件
│   │   │   ├── MovieCard.tsx
│   │   │   ├── MultiFilterPanel.tsx
│   │   │   ├── TagManagementPanel.tsx
│   │   │   ├── BackgroundTimeTagSelector.tsx
│   │   │   └── LoginForm.tsx
│   │   ├── pages/              # 页面组件
│   │   │   ├── Home.tsx
│   │   │   ├── MyMovies.tsx
│   │   │   ├── MovieDetail.tsx
│   │   │   └── Admin.tsx
│   │   ├── services/           # API服务
│   │   ├── types/             # TypeScript类型定义
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tailwind.config.js
│
├── fastapi-backend/            # FastAPI后端
│   ├── main.py                # FastAPI入口
│   ├── database.py            # 数据库配置
│   ├── models/               # 数据模型
│   ├── schemas/              # Pydantic模式
│   ├── routers/              # API路由
│   └── requirements.txt
│
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd fastapi-backend
pip install -r requirements.txt

# 安装前端依赖  
cd ../frontend
npm install
```

### 2. 启动应用

**启动后端服务器：**
```bash
# 方法1: 使用启动脚本
./start-fastapi.sh

# 方法2: 手动启动
cd fastapi-backend
python main.py
```

**启动前端开发服务器：**
```bash
cd frontend
PORT=3005 npm start
```

### 3. 访问应用

- 前端：http://localhost:3005
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 📱 使用说明

### 游客模式
- 可以搜索和浏览电影
- 无法使用标记功能

### 用户模式（注册后）
1. **注册/登录** - 点击右上角按钮
2. **搜索电影** - 使用各种筛选条件
3. **标记状态** - 点击电影卡片上的按钮：
   - ✅ **已看过** - 标记为已观看
   - ⭐ **想看** - 添加到想看列表
4. **自定义标签** - 拖拽标签到电影卡片：
   - 🏷️ **背景时间标签** - 如"明朝"、"1980s"等
   - 🎭 **题材标签** - 如"动作"、"爱情"等

## 🔌 API接口

### 电影相关
- `GET /movies/search` - 搜索电影
- `GET /movies/{movie_id}` - 获取电影详情

### 用户相关
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /users/stats` - 获取用户统计

### 观看状态
- `GET /watch-status` - 获取观看状态列表
- `GET /watch-status/{movie_id}` - 获取特定电影状态
- `POST /watch-status` - 创建/更新观看状态
- `DELETE /watch-status/{movie_id}` - 删除观看状态

### 电影编辑（标签管理）
- `GET /movie-edit/{movie_id}` - 获取电影自定义信息
- `POST /movie-edit` - 创建/更新电影自定义信息

## 🗄️ 数据库结构

### users 表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### watch_status 表
```sql
CREATE TABLE watch_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  poster_path TEXT,
  status TEXT NOT NULL CHECK(status IN ('watched', 'want_to_watch')),
  media_type TEXT,
  genres TEXT,
  production_countries TEXT,
  vote_average REAL,
  overview TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, movie_id)
);
```

### movie_edit 表
```sql
CREATE TABLE movie_edit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  custom_background_time TEXT,
  custom_genre TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, movie_id)
);
```

## 📝 开发说明

### 构建生产版本

**前端构建：**
```bash
cd frontend
npm run build
```

**后端部署：**
```bash
cd fastapi-backend
pip install -r requirements.txt
python main.py
```

## 🤝 团队协作

### 分支结构
- **`main`** - 主分支，生产环境稳定代码
- **`develop`** - 开发分支，日常开发主分支
- **`feature/*`** - 功能分支，新功能开发
- **`bugfix/*`** - 修复分支，问题修复

### 开发流程
1. **准备开发环境**
   ```bash
   git clone https://github.com/NewbieAuntieCodes/movies-react-app.git
   cd movies-react-app
   git checkout develop
   ```

2. **开始新功能**
   ```bash
   git checkout -b feature/你的功能名称
   # 进行开发...
   git commit -m "feat: 添加新功能描述"
   git push -u origin feature/你的功能名称
   ```

3. **提交代码**
   - 在GitHub创建Pull Request到`develop`分支
   - 请求团队成员Review
   - Review通过后合并

4. **提交规范**
   - `feat:` - 新功能
   - `fix:` - 修复bug
   - `docs:` - 文档更新
   - `refactor:` - 代码重构

详细协作指南请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [TMDB](https://www.themoviedb.org/) - 电影数据提供
- [React](https://reactjs.org/) - 前端框架  
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

---

## 🚀 快速启动指令

### Windows 系统

**后端启动：**
```bash
cd fastapi-backend
python main.py
```

**前端启动：**
```bash
cd frontend  
npm start
```

### macOS/Linux 系统

**后端启动：**
```bash
cd fastapi-backend
python3 main.py
```

**前端启动：**
```bash  
cd frontend
npm start
```


### 访问地址
- 前端应用：http://localhost:3005
- 后端API：http://localhost:8000  
- API文档：http://localhost:8000/docs