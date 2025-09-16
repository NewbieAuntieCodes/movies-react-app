from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, PasswordChange, AdminCreateUser
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin

router = APIRouter()

@router.post("/admin/create-user", response_model=UserResponse)
async def admin_create_user(user_data: AdminCreateUser, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """管理员创建用户"""
    try:
        # 检查用户是否已存在
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
        
        # 创建新用户
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password,
            is_admin=user_data.is_admin if hasattr(user_data, 'is_admin') else False
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return UserResponse(
            message="用户创建成功",
            user=db_user,
            token=None
        )
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    except Exception as e:
        db.rollback()
        print(f"创建用户失败: {str(e)}")
        raise HTTPException(status_code=500, detail="创建用户失败")

@router.post("/login", response_model=UserResponse)
async def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        # 查找用户
        user = db.query(User).filter(User.username == user_data.username).first()
        
        if not user or not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        # 生成JWT令牌
        token = create_access_token(data={"userId": user.id, "username": user.username})
        
        return UserResponse(
            message="登录成功",
            user=user,
            token=token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"登录失败: {str(e)}")
        raise HTTPException(status_code=500, detail="登录失败")

@router.get("/admin/users", response_model=List[dict])
async def get_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """管理员获取所有用户列表"""
    try:
        users = db.query(User).all()
        return [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ]
    except Exception as e:
        print(f"获取用户列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取用户列表失败")

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """管理员删除用户"""
    try:
        if user_id == admin.id:
            raise HTTPException(status_code=400, detail="不能删除自己的账号")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户未找到")
        
        db.delete(user)
        db.commit()
        
        return {"message": "用户删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除用户失败: {str(e)}")
        raise HTTPException(status_code=500, detail="删除用户失败")

@router.post("/change-password")
async def change_password(password_data: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """用户修改密码"""
    try:
        # 验证当前密码
        if not verify_password(password_data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="当前密码错误")
        
        # 更新密码
        current_user.password_hash = get_password_hash(password_data.new_password)
        db.commit()
        
        return {"message": "密码修改成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"修改密码失败: {str(e)}")
        raise HTTPException(status_code=500, detail="修改密码失败")