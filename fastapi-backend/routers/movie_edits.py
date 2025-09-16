from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from database import get_db
from models import User, MovieEdit
from schemas import MovieEditCreate, MovieEditUpdate, MovieEdit as MovieEditSchema
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=dict)
async def create_or_update_movie_edit(
    edit_data: MovieEditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建或更新电影编辑"""
    try:
        # 查找现有记录
        existing_edit = db.query(MovieEdit).filter(
            MovieEdit.user_id == current_user.id,
            MovieEdit.movie_id == edit_data.movie_id
        ).first()
        
        if existing_edit:
            # 更新现有记录
            existing_edit.movie_title = edit_data.movie_title
            existing_edit.custom_background_time = edit_data.custom_background_time
            existing_edit.custom_genre = edit_data.custom_genre
            existing_edit.notes = edit_data.notes
            existing_edit.updated_at = datetime.utcnow()

            record_id = existing_edit.id
        else:
            # 创建新记录
            db_movie_edit = MovieEdit(
                user_id=current_user.id,
                movie_id=edit_data.movie_id,
                movie_title=edit_data.movie_title,
                custom_background_time=edit_data.custom_background_time,
                custom_genre=edit_data.custom_genre,
                notes=edit_data.notes
            )
            
            db.add(db_movie_edit)
            db.commit()
            db.refresh(db_movie_edit)
            record_id = db_movie_edit.id
        
        db.commit()
        
        return {
            "message": "电影编辑保存成功",
            "id": record_id
        }
        
    except Exception as e:
        db.rollback()
        print(f"保存电影编辑失败: {str(e)}")
        raise HTTPException(status_code=500, detail="保存电影编辑失败")

@router.get("/{movie_id}")
async def get_movie_edit(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取特定电影的编辑信息"""
    try:
        movie_edit = db.query(MovieEdit).filter(
            MovieEdit.user_id == current_user.id,
            MovieEdit.movie_id == movie_id
        ).first()
        
        return movie_edit
        
    except Exception as e:
        print(f"获取电影编辑失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取电影编辑失败")

@router.get("/", response_model=List[MovieEditSchema])
async def get_movie_edits_list(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的所有电影编辑"""
    try:
        movie_edits = db.query(MovieEdit).filter(
            MovieEdit.user_id == current_user.id
        ).order_by(MovieEdit.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return movie_edits
        
    except Exception as e:
        print(f"获取电影编辑列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取电影编辑列表失败")

@router.delete("/{movie_id}")
async def delete_movie_edit(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除电影编辑"""
    try:
        movie_edit = db.query(MovieEdit).filter(
            MovieEdit.user_id == current_user.id,
            MovieEdit.movie_id == movie_id
        ).first()
        
        if not movie_edit:
            raise HTTPException(status_code=404, detail="未找到电影编辑记录")
        
        db.delete(movie_edit)
        db.commit()
        
        return {"message": "电影编辑删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除电影编辑失败: {str(e)}")
        raise HTTPException(status_code=500, detail="删除电影编辑失败")