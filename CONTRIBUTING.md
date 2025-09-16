# 团队协作指南

## 分支结构

### 主要分支
- **`main`** - 主分支，包含生产环境稳定代码
  - 只接受来自 `develop` 分支的 Pull Request
  - 禁止直接推送代码
  - 每次合并都应该打tag标记版本

- **`develop`** - 开发分支，日常开发的主要分支
  - 功能开发完成后合并到此分支
  - 定期合并到 `main` 分支发布

### 功能分支
- **`feature/功能名称`** - 新功能开发分支
  - 从 `develop` 分支创建
  - 开发完成后通过 Pull Request 合并回 `develop`
  - 例如: `feature/user-authentication`, `feature/movie-search`

- **`bugfix/问题描述`** - 问题修复分支
  - 从 `develop` 分支创建
  - 修复完成后通过 Pull Request 合并回 `develop`

- **`hotfix/紧急修复`** - 紧急修复分支
  - 从 `main` 分支创建
  - 修复完成后同时合并到 `main` 和 `develop`

## 工作流程

### 1. 开始新功能开发
```bash
# 切换到develop分支并更新
git checkout develop
git pull origin develop

# 创建新的功能分支
git checkout -b feature/你的功能名称

# 进行开发...
# 提交代码
git add .
git commit -m "feat: 添加新功能描述"

# 推送到远程
git push -u origin feature/你的功能名称
```

### 2. 创建Pull Request
1. 在GitHub上创建Pull Request
2. 目标分支选择 `develop`
3. 添加详细的描述和截图
4. 请求团队成员Review
5. 通过Review后合并

### 3. 合并后清理
```bash
# 删除本地功能分支
git checkout develop
git pull origin develop
git branch -d feature/你的功能名称

# 删除远程功能分支
git push origin --delete feature/你的功能名称
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` - 新功能
- `fix:` - 修复bug
- `docs:` - 文档更新
- `style:` - 代码格式调整
- `refactor:` - 代码重构
- `test:` - 测试相关
- `chore:` - 构建过程或辅助工具的变动

### 示例
```bash
feat: 添加电影搜索功能
fix: 修复登录页面验证问题
docs: 更新API文档
style: 统一代码格式
refactor: 重构电影卡片组件
test: 添加用户认证测试
chore: 更新依赖包版本
```

## 代码Review规范

### Review要点
1. **功能正确性** - 代码是否实现了预期功能
2. **代码质量** - 代码是否清晰、可维护
3. **性能考虑** - 是否有性能问题
4. **安全性** - 是否有安全隐患
5. **测试覆盖** - 是否有相应的测试

### Review态度
- 建设性的反馈
- 解释问题原因和建议
- 赞美好的代码实践
- 保持友善和专业

## 项目设置

### 前端 (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

### 后端 (FastAPI + Python)
```bash
cd fastapi-backend
pip install -r requirements.txt
python main.py
```

## 环境配置

### 开发环境
- Node.js >= 16
- Python >= 3.8
- Git

### 编辑器推荐配置
- VS Code + Prettier + ESLint
- Python Black formatter
- GitLens extension

## 问题报告

创建Issue时请包含：
1. 问题描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 环境信息
6. 截图（如适用）

## 联系方式

有任何问题请在项目Issues中提出或联系项目维护者。