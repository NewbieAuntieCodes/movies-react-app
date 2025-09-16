# 🎬 电影项目 - 团队协作开始！

## 📢 项目上线通知

**项目地址：** https://github.com/NewbieAuntieCodes/movies-react-app

**快速开始：**
```bash
# 1. 克隆项目
git clone https://github.com/NewbieAuntieCodes/movies-react-app.git
cd movies-react-app

# 2. 配置后端
cd fastapi-backend
cp .env.example .env
# 编辑.env文件，将TMDB_API_KEY改为：be3849411a172c7f817c762b765ec656

# 3. 启动后端
pip install -r requirements.txt
python main.py

# 4. 启动前端（新终端）
cd frontend
npm install
npm start
```

**访问地址：**
- 前端：http://localhost:3005
- 后端API：http://localhost:8000/docs

## 🐛 需要帮忙修复的问题

**问题描述：题材标签拖拽显示异常**

目前有个bug需要大家帮忙解决：
- 拖拽"古装"、"爱情"等题材标签到电影卡片上时
- 标签虽然能拖拽，但界面上显示的还是原来的题材
- 应该显示紫色的自定义标签，但实际没有出现

**详细技术分析：** 请查看项目中的 `KNOWN_ISSUES.md` 文件

**可能的方向：**
1. 后端API的custom_genre字段保存/读取问题
2. 前端组件状态管理问题
3. 渲染逻辑问题

## 🤝 协作方式

1. **开发分支：** 使用 `develop` 分支进行日常开发
2. **功能开发：** 创建 `feature/功能名` 分支
3. **提交规范：** 使用 `feat:`, `fix:`, `docs:` 等前缀
4. **Pull Request：** 合并到 `develop` 分支

**详细指南：** 查看 `CONTRIBUTING.md`

## 📋 项目特点

- ✅ 完整的电影搜索和管理功能
- ✅ 用户注册登录系统
- ✅ 拖拽式标签管理
- ✅ 包含真实数据库，即开即用
- ✅ React + TypeScript + FastAPI

## 🔧 开发环境

- **前端：** React 18 + Vite + Tailwind CSS
- **后端：** Python + FastAPI + SQLite
- **数据源：** TMDB API

有任何问题随时在群里或GitHub Issues提问！

让我们一起把这个项目完善吧！🚀