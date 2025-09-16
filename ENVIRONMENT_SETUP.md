# 🚀 快速开始指南

## 团队成员 5分钟启动

### 1. 克隆项目
```bash
git clone https://github.com/NewbieAuntieCodes/movies-react-app.git
cd movies-react-app
```

### 2. 配置API密钥
```bash
# 复制环境配置模板
cd fastapi-backend
cp .env.example .env

# 编辑 .env 文件，将 your-tmdb-api-key-here 替换为实际API密钥
# 联系项目负责人获取TMDB API密钥
```

### 3. 安装依赖并启动
```bash
# 安装后端依赖
pip install -r requirements.txt

# 启动后端服务
python main.py
```

```bash
# 新开一个终端，启动前端
cd frontend
npm install
npm start
```

### 4. 访问应用
- 前端：http://localhost:3005
- 后端API：http://localhost:8000/docs

## 🔑 获取API密钥

**TMDB API密钥（必需）：**
- 联系项目负责人获取
- 或自己申请：https://www.themoviedb.org/settings/api

## 📊 项目特点

✅ **包含完整数据库** - 直接有电影数据，无需额外配置
✅ **即开即用** - 只需配置一个API密钥
✅ **完整功能** - 用户注册、电影搜索、标签管理等

## 🛠️ 开发说明

- **数据库**：SQLite文件已包含在项目中
- **API密钥**：仅TMDB API需要配置，用于获取电影数据
- **用户数据**：注册的用户和观看记录都会保存在数据库中

## ❓ 常见问题

**Q: 启动失败？**
A: 检查.env文件是否配置了正确的TMDB_API_KEY

**Q: 没有电影数据？**
A: 数据库文件应该已包含，如有问题联系项目负责人

**Q: 端口冲突？**
A: 修改.env文件中的PORT值

---

需要帮助请在项目Issues中提问！