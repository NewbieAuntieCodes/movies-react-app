# 🐛 已知问题和待修复列表

## 🔥 高优先级问题

### 问题1: 题材标签拖拽后不能正常显示

**📋 问题描述：**
当用户拖拽题材标签到影视卡片上时，界面上显示的仍然是原始API的题材数据，而不是用户自定义的题材标签。

**🎯 预期行为：**
- 用户拖拽"古装"标签到《射雕英雄传》卡片上
- 卡片应该显示紫色的"古装"标签，替代原来的"剧情"标签
- 标签应该可以点击×删除

**❌ 实际行为：**
- 拖拽操作看起来成功（有拖拽效果）
- 但卡片仍然显示原始的"剧情"标签
- 自定义的"古装"标签没有出现

**🔍 问题范围：**
- ✅ 背景时间标签：工作正常
- ❌ 题材标签：不能正常显示
- ✅ 拖拽操作本身：正常工作
- ✅ 数据保存：后端API调用成功

**📊 技术细节：**

从控制台日志可以看到：
```
Creating movie edit with data: {
  movie_id: 856289,
  movie_title: '封神第一部：朝歌风云',
  custom_background_time: '商周',
  custom_genre: '古装'
}

Setting movieEdit to: {
  movie_id: 856289,
  movie_title: '封神第一部：朝歌风云',
  custom_background_time: '商周',
  custom_genre: '古装'
}

MovieEdit state updated

# 但随后显示：
Rendering genre for 封神第一部：朝歌风云: movieEdit?.custom_genre = null
```

**🔍 推测原因：**
1. **后端API问题**：`custom_genre`字段保存后读取为null
2. **状态管理问题**：本地状态被后续的API调用覆盖
3. **渲染逻辑问题**：组件没有正确响应状态变化

**📁 相关文件：**
- `frontend/src/components/MovieCard.tsx` - 主要组件
- `fastapi-backend/routers/movie_edits.py` - 后端API
- `fastapi-backend/models.py` - 数据模型

**🔧 临时解决方案：**
目前代码中已经实现了本地状态直接更新来绕过后端问题：
```typescript
// 直接更新本地状态，不依赖后端返回
setIsLocalUpdate(true);
setMovieEdit(editData as MovieEdit);
```

但这个方案仍然不起作用，需要进一步调试。

**🎯 修复建议：**
1. **检查后端API**：确认`movie_edits`表的`custom_genre`字段是否正确保存和返回
2. **调试状态管理**：确认`useEffect`的依赖项和执行时机
3. **验证组件渲染**：确认组件在状态更新后正确重新渲染

---

## 🔧 调试步骤

### 步骤1: 检查数据库
```sql
-- 查看movie_edit表结构
.schema movie_edit

-- 查看实际保存的数据
SELECT * FROM movie_edit WHERE custom_genre IS NOT NULL;
```

### 步骤2: 检查后端API
访问 `http://localhost:8000/docs` 测试：
1. `POST /api/movie-edits` - 创建/更新记录
2. `GET /api/movie-edits/{movie_id}` - 读取记录

### 步骤3: 前端调试
在 `MovieCard.tsx` 中添加更多调试信息：
```typescript
console.log('组件渲染 - movieEdit:', movieEdit);
console.log('custom_genre值:', movieEdit?.custom_genre);
```

---

## 📝 其他已知问题

### 问题2: 暂无其他严重问题
（其他问题请在这里添加）

---

## ✅ 最近修复的问题

### ✅ JWT密钥统一问题（已修复）
- **问题**：团队成员JWT密钥不一致导致登录状态不互通
- **修复**：统一使用 `dev-jwt-secret-key-for-team`
- **提交**：commit c1af080

---

## 🤝 贡献指南

发现新问题时请：
1. 在此文档中详细描述问题
2. 提供复现步骤和截图
3. 创建GitHub Issue关联此文档
4. 尝试修复并提交Pull Request

修复问题后请：
1. 将问题移到"已修复"部分
2. 记录修复方法和相关提交
3. 更新相关文档