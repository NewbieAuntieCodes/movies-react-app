# 🎬 电影管理项目

React + FastAPI 的电影搜索和标签管理应用

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/NewbieAuntieCodes/movies-react-app.git
cd movies-react-app

# 配置后端
cd fastapi-backend
cp .env.example .env
# 编辑.env文件，配置TMDB_API_KEY

# 启动后端
pip install -r requirements.txt
python main.py

# 启动前端
cd ../frontend
npm install
npm start
```

**访问地址：**
- 前端：http://localhost:3005
- 后端API：http://localhost:8000/docs

## ✨ 主要功能

- 🔍 电影搜索与筛选（支持多种条件）
- 👤 用户注册登录系统
- ⭐ 标记电影状态（已看过、想看）
- 🏷️ 拖拽式自定义标签管理
- 📊 观看统计数据

## 🐛 已知问题

**题材标签拖拽显示异常** - 详见 [KNOWN_ISSUES.md](KNOWN_ISSUES.md)

## 🛠️ 技术栈

**前端：** React 18 + TypeScript + Vite + Tailwind CSS
**后端：** Python + FastAPI + SQLite
**数据源：** TMDB API

## 🤝 团队协作

### 分支管理
- `main` - 主分支
- `develop` - 开发分支

### 开发流程
```bash
git checkout develop
git checkout -b feature/功能名称
# 开发完成后
git commit -m "feat: 功能描述"
git push origin feature/功能名称
# 创建Pull Request到develop分支
```

### 提交规范
- `feat:` - 新功能
- `fix:` - 修复bug
- `docs:` - 文档更新