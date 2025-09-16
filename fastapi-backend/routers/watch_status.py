from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from datetime import datetime
import json
import httpx
import os
from dotenv import load_dotenv
from typing import Optional, List

from database import get_db
from models import User, WatchStatus
from schemas import WatchStatusCreate, WatchStatusUpdate, WatchStatus as WatchStatusSchema
from auth import get_current_user

load_dotenv()

router = APIRouter()

@router.post("/", response_model=dict)
async def create_or_update_watch_status(
    watch_data: WatchStatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记电影观看状态"""
    try:
        # 验证状态值
        valid_statuses = ['watched', 'want_to_watch']
        if watch_data.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="无效的状态")
        
        # 设置观看日期
        watched_date = datetime.utcnow() if watch_data.status == 'watched' else watch_data.watched_date
        
        # 查找现有记录
        existing_status = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            WatchStatus.movie_id == watch_data.movie_id
        ).first()
        
        if existing_status:
            # 更新现有记录
            existing_status.movie_title = watch_data.movie_title
            existing_status.poster_path = watch_data.poster_path
            existing_status.status = watch_data.status
            existing_status.rating = watch_data.rating
            existing_status.notes = watch_data.notes
            existing_status.watched_date = watched_date
            existing_status.media_type = watch_data.media_type
            existing_status.release_date = watch_data.release_date
            existing_status.first_air_date = watch_data.first_air_date
            existing_status.genres = watch_data.genres
            existing_status.production_countries = watch_data.production_countries
            existing_status.vote_average = watch_data.vote_average
            existing_status.overview = watch_data.overview
            existing_status.director = watch_data.director
            existing_status.cast = watch_data.cast
            existing_status.updated_at = datetime.utcnow()
            
            record_id = existing_status.id
        else:
            # 创建新记录
            db_watch_status = WatchStatus(
                user_id=current_user.id,
                movie_id=watch_data.movie_id,
                movie_title=watch_data.movie_title,
                poster_path=watch_data.poster_path,
                status=watch_data.status,
                rating=watch_data.rating,
                notes=watch_data.notes,
                watched_date=watched_date,
                media_type=watch_data.media_type,
                release_date=watch_data.release_date,
                first_air_date=watch_data.first_air_date,
                genres=watch_data.genres,
                production_countries=watch_data.production_countries,
                vote_average=watch_data.vote_average,
                overview=watch_data.overview,
                director=watch_data.director,
                cast=watch_data.cast
            )
            
            db.add(db_watch_status)
            db.commit()
            db.refresh(db_watch_status)
            record_id = db_watch_status.id
        
        db.commit()
        
        return {
            "message": "观看状态保存成功",
            "id": record_id,
            "status": watch_data.status
        }
        
    except Exception as e:
        db.rollback()
        print(f"保存观看状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="保存观看状态失败")

@router.get("/", response_model=List[WatchStatusSchema])
async def get_watch_status_list(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户的观看状态列表"""
    try:
        query = db.query(WatchStatus).filter(WatchStatus.user_id == current_user.id)
        
        if status:
            query = query.filter(WatchStatus.status == status)
        
        watch_statuses = query.order_by(WatchStatus.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return watch_statuses
        
    except Exception as e:
        print(f"获取观看状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取观看状态失败")

@router.get("/{movie_id}")
async def get_movie_watch_status(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取特定电影的观看状态"""
    try:
        watch_status = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            WatchStatus.movie_id == movie_id
        ).first()
        
        return watch_status
        
    except Exception as e:
        print(f"获取观看状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取观看状态失败")

@router.delete("/{movie_id}")
async def delete_watch_status(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除观看状态"""
    try:
        watch_status = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            WatchStatus.movie_id == movie_id
        ).first()
        
        if not watch_status:
            raise HTTPException(status_code=404, detail="未找到观看记录")
        
        db.delete(watch_status)
        db.commit()
        
        return {"message": "观看状态删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"删除观看状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail="删除观看状态失败")

# 添加TMDB相关配置和辅助函数
API_KEY = os.getenv("TMDB_API_KEY", "be3849411a172c7f817c762b765ec656")
BASE_URL = "https://api.themoviedb.org/3"

# 国家名中文映射
country_name_map = {
    'United States of America': '美国',
    'United Kingdom': '英国',
    'China': '中国大陆',
    'Japan': '日本',
    'South Korea': '韩国',
    'France': '法国',
    'Germany': '德国',
    'Italy': '意大利',
    'Spain': '西班牙',
    'Canada': '加拿大',
    'Australia': '澳大利亚',
    'India': '印度',
    'Russia': '俄罗斯',
    'Hong Kong': '中国香港',
    'Taiwan': '中国台湾',
    'Thailand': '泰国',
    'Philippines': '菲律宾',
    'Singapore': '新加坡',
    'Malaysia': '马来西亚',
    'Indonesia': '印度尼西亚',
    'Vietnam': '越南',
    'Mexico': '墨西哥',
    'Brazil': '巴西',
    'Argentina': '阿根廷',
    'Sweden': '瑞典',
    'Norway': '挪威',
    'Denmark': '丹麦',
    'Netherlands': '荷兰',
    'Belgium': '比利时',
    'Switzerland': '瑞士',
    'Austria': '奥地利',
    'Poland': '波兰',
    'Czech Republic': '捷克',
    'Hungary': '匈牙利',
    'Greece': '希腊',
    'Turkey': '土耳其',
    'Iran': '伊朗',
    'Egypt': '埃及',
    'South Africa': '南非',
    'Israel': '以色列',
    'New Zealand': '新西兰'
}

def translate_countries(countries: List[dict]) -> str:
    """转换国家名为中文并返回逗号分隔的字符串"""
    if not countries:
        return '暂无出品信息'
    
    translated = [
        country_name_map.get(country["name"], country["name"])
        for country in countries
    ]
    return ', '.join(translated)

def get_genres_string(genres: List[dict]) -> str:
    """将genres列表转换为逗号分隔的字符串"""
    if not genres:
        return '暂无分类'
    
    return ', '.join([genre["name"] for genre in genres])

@router.post("/update-production-countries")
async def update_missing_production_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量补充缺少出品地区信息的电影数据"""
    try:
        # 查找当前用户所有缺少出品地区信息的电影
        missing_countries_movies = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            # 查找production_countries为空、null或"暂无出品信息"的记录
            or_(
                WatchStatus.production_countries == None,
                WatchStatus.production_countries == '',
                WatchStatus.production_countries == '暂无出品信息'
            )
        ).all()
        
        if not missing_countries_movies:
            return {
                "message": "没有需要补充地区信息的电影",
                "updated_count": 0
            }
        
        updated_count = 0
        failed_count = 0
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            for movie_record in missing_countries_movies:
                try:
                    # 首先尝试作为电影获取详情
                    movie_url = f"{BASE_URL}/movie/{movie_record.movie_id}"
                    response = await client.get(movie_url, params={
                        "api_key": API_KEY,
                        "language": "zh-CN"
                    })
                    
                    if response.status_code != 200:
                        # 如果电影API失败，尝试电视剧API
                        tv_url = f"{BASE_URL}/tv/{movie_record.movie_id}"
                        response = await client.get(tv_url, params={
                            "api_key": API_KEY,
                            "language": "zh-CN"
                        })
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # 提取制作国家信息
                        production_countries = data.get("production_countries", [])
                        countries_string = translate_countries(production_countries)
                        
                        # 同时更新其他可能缺少的信息
                        genres = data.get("genres", [])
                        genres_string = get_genres_string(genres)
                        
                        vote_average = data.get("vote_average", 0)
                        overview = data.get("overview", movie_record.overview or '暂无简介')
                        
                        # 更新数据库记录
                        movie_record.production_countries = countries_string
                        if not movie_record.genres or movie_record.genres == '暂无分类':
                            movie_record.genres = genres_string
                        if not movie_record.vote_average:
                            movie_record.vote_average = vote_average
                        if not movie_record.overview or movie_record.overview == '暂无简介':
                            movie_record.overview = overview
                        
                        movie_record.updated_at = datetime.utcnow()
                        
                        updated_count += 1
                        print(f"成功更新电影: {movie_record.movie_title} ({movie_record.movie_id}) - {countries_string}")
                        
                    else:
                        failed_count += 1
                        print(f"获取电影详情失败: {movie_record.movie_title} ({movie_record.movie_id})")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"处理电影失败: {movie_record.movie_title} ({movie_record.movie_id}) - {str(e)}")
                    continue
        
        # 提交所有更改
        db.commit()
        
        return {
            "message": f"批量更新完成",
            "updated_count": updated_count,
            "failed_count": failed_count,
            "total_processed": len(missing_countries_movies)
        }
        
    except Exception as e:
        db.rollback()
        print(f"批量更新失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量更新失败: {str(e)}")

def get_director_from_credits(credits: dict) -> str:
    """从credits中提取导演信息"""
    if not credits or "crew" not in credits:
        return "暂无导演信息"
    
    directors = [
        person["name"] for person in credits["crew"] 
        if person.get("job") == "Director"
    ]
    
    return ", ".join(directors[:3]) if directors else "暂无导演信息"

def get_cast_from_credits(credits: dict) -> str:
    """从credits中提取主演信息"""
    if not credits or "cast" not in credits:
        return "暂无主演信息"
    
    cast_list = [
        person["name"] for person in credits["cast"][:5]  # 只取前5位主演
    ]
    
    return ", ".join(cast_list) if cast_list else "暂无主演信息"

@router.post("/update-overview")
async def update_missing_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量补充缺少简介的电影数据"""
    try:
        # 查找当前用户所有缺少简介的电影
        missing_overview_movies = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            or_(
                WatchStatus.overview == None,
                WatchStatus.overview == '',
                WatchStatus.overview == '暂无简介'
            )
        ).all()
        
        if not missing_overview_movies:
            return {
                "message": "没有需要补充简介的电影",
                "updated_count": 0
            }
        
        updated_count = 0
        failed_count = 0
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            for movie_record in missing_overview_movies:
                try:
                    # 首先尝试作为电影获取详情
                    movie_url = f"{BASE_URL}/movie/{movie_record.movie_id}"
                    response = await client.get(movie_url, params={
                        "api_key": API_KEY,
                        "language": "zh-CN"
                    })
                    
                    if response.status_code != 200:
                        # 如果电影API失败，尝试电视剧API
                        tv_url = f"{BASE_URL}/tv/{movie_record.movie_id}"
                        response = await client.get(tv_url, params={
                            "api_key": API_KEY,
                            "language": "zh-CN"
                        })
                    
                    if response.status_code == 200:
                        data = response.json()
                        overview = data.get("overview", movie_record.overview or '暂无简介')
                        
                        if overview and overview != '暂无简介':
                            movie_record.overview = overview
                            movie_record.updated_at = datetime.utcnow()
                            updated_count += 1
                            print(f"成功更新简介: {movie_record.movie_title} ({movie_record.movie_id})")
                        else:
                            failed_count += 1
                    else:
                        failed_count += 1
                        print(f"获取电影详情失败: {movie_record.movie_title} ({movie_record.movie_id})")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"处理电影失败: {movie_record.movie_title} ({movie_record.movie_id}) - {str(e)}")
                    continue
        
        db.commit()
        
        return {
            "message": f"批量更新简介完成",
            "updated_count": updated_count,
            "failed_count": failed_count,
            "total_processed": len(missing_overview_movies)
        }
        
    except Exception as e:
        db.rollback()
        print(f"批量更新简介失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量更新简介失败: {str(e)}")

@router.post("/update-director")
async def update_missing_director(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量补充缺少导演信息的电影数据"""
    try:
        # 查找当前用户所有缺少导演信息的电影
        missing_director_movies = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            or_(
                WatchStatus.director == None,
                WatchStatus.director == '',
                WatchStatus.director == '暂无导演信息'
            )
        ).all()
        
        if not missing_director_movies:
            return {
                "message": "没有需要补充导演信息的电影",
                "updated_count": 0
            }
        
        updated_count = 0
        failed_count = 0
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            for movie_record in missing_director_movies:
                try:
                    # 首先尝试作为电影获取演职员信息
                    credits_url = f"{BASE_URL}/movie/{movie_record.movie_id}/credits"
                    response = await client.get(credits_url, params={
                        "api_key": API_KEY,
                        "language": "zh-CN"
                    })
                    
                    if response.status_code != 200:
                        # 如果电影API失败，尝试电视剧API
                        tv_credits_url = f"{BASE_URL}/tv/{movie_record.movie_id}/credits"
                        response = await client.get(tv_credits_url, params={
                            "api_key": API_KEY,
                            "language": "zh-CN"
                        })
                    
                    if response.status_code == 200:
                        credits_data = response.json()
                        director = get_director_from_credits(credits_data)
                        
                        if director and director != '暂无导演信息':
                            movie_record.director = director
                            movie_record.updated_at = datetime.utcnow()
                            updated_count += 1
                            print(f"成功更新导演: {movie_record.movie_title} ({movie_record.movie_id}) - {director}")
                        else:
                            failed_count += 1
                    else:
                        failed_count += 1
                        print(f"获取演职员信息失败: {movie_record.movie_title} ({movie_record.movie_id})")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"处理电影失败: {movie_record.movie_title} ({movie_record.movie_id}) - {str(e)}")
                    continue
        
        db.commit()
        
        return {
            "message": f"批量更新导演信息完成",
            "updated_count": updated_count,
            "failed_count": failed_count,
            "total_processed": len(missing_director_movies)
        }
        
    except Exception as e:
        db.rollback()
        print(f"批量更新导演信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量更新导演信息失败: {str(e)}")

@router.post("/update-cast")
async def update_missing_cast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量补充缺少主演信息的电影数据"""
    try:
        # 查找当前用户所有缺少主演信息的电影
        missing_cast_movies = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            or_(
                WatchStatus.cast == None,
                WatchStatus.cast == '',
                WatchStatus.cast == '暂无主演信息'
            )
        ).all()
        
        if not missing_cast_movies:
            return {
                "message": "没有需要补充主演信息的电影",
                "updated_count": 0
            }
        
        updated_count = 0
        failed_count = 0
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            for movie_record in missing_cast_movies:
                try:
                    # 首先尝试作为电影获取演职员信息
                    credits_url = f"{BASE_URL}/movie/{movie_record.movie_id}/credits"
                    response = await client.get(credits_url, params={
                        "api_key": API_KEY,
                        "language": "zh-CN"
                    })
                    
                    if response.status_code != 200:
                        # 如果电影API失败，尝试电视剧API
                        tv_credits_url = f"{BASE_URL}/tv/{movie_record.movie_id}/credits"
                        response = await client.get(tv_credits_url, params={
                            "api_key": API_KEY,
                            "language": "zh-CN"
                        })
                    
                    if response.status_code == 200:
                        credits_data = response.json()
                        cast = get_cast_from_credits(credits_data)
                        
                        if cast and cast != '暂无主演信息':
                            movie_record.cast = cast
                            movie_record.updated_at = datetime.utcnow()
                            updated_count += 1
                            print(f"成功更新主演: {movie_record.movie_title} ({movie_record.movie_id}) - {cast}")
                        else:
                            failed_count += 1
                    else:
                        failed_count += 1
                        print(f"获取演职员信息失败: {movie_record.movie_title} ({movie_record.movie_id})")
                        
                except Exception as e:
                    failed_count += 1
                    print(f"处理电影失败: {movie_record.movie_title} ({movie_record.movie_id}) - {str(e)}")
                    continue
        
        db.commit()
        
        return {
            "message": f"批量更新主演信息完成",
            "updated_count": updated_count,
            "failed_count": failed_count,
            "total_processed": len(missing_cast_movies)
        }
        
    except Exception as e:
        db.rollback()
        print(f"批量更新主演信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量更新主演信息失败: {str(e)}")

def extract_director_cast_tv(credits: dict) -> tuple[str, str]:
    """专门为电视剧提取导演和主演信息"""
    director = "暂无导演信息"
    cast = "暂无主演信息"
    
    if credits and "crew" in credits:
        # 电视剧中查找制作人、导演、创作者等
        priority_jobs = ['Creator', 'Showrunner', 'Executive Producer', 'Director']
        directors = []
        
        for job in priority_jobs:
            job_people = [person for person in credits['crew'] if person.get('job') == job]
            if job_people:
                directors.extend(job_people[:2])
                if len(directors) >= 2:
                    break
        
        if directors:
            director_names = [person.get('name', '') for person in directors if person.get('name')]
            director = ', '.join(director_names[:2])
    
    # 提取主演（前5位）
    if credits and 'cast' in credits and credits['cast']:
        main_cast = credits['cast'][:5]
        cast_list = [person.get('name', '') for person in main_cast if person.get('name')]
        cast = ', '.join(cast_list) if cast_list else "暂无主演信息"
    
    return director, cast

@router.post("/{movie_id}/fix-metadata")
async def fix_single_movie_metadata(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """修复单个电影的完整元数据信息（导演、主演、题材、制作国家、简介等）"""
    try:
        # 查找该电影的观看记录
        watch_status = db.query(WatchStatus).filter(
            WatchStatus.user_id == current_user.id,
            WatchStatus.movie_id == movie_id
        ).first()
        
        if not watch_status:
            raise HTTPException(status_code=404, detail="未找到该电影的观看记录")
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 确定媒体类型
            media_type = watch_status.media_type if watch_status.media_type else 'movie'
            
            # 获取电影/电视剧详细信息
            if media_type == 'tv':
                details_url = f"{BASE_URL}/tv/{movie_id}"
                credits_url = f"{BASE_URL}/tv/{movie_id}/credits"
            else:
                details_url = f"{BASE_URL}/movie/{movie_id}"
                credits_url = f"{BASE_URL}/movie/{movie_id}/credits"
            
            # 获取详细信息
            details_response = await client.get(details_url, params={
                "api_key": API_KEY,
                "language": "zh-CN"
            })
            
            # 获取演职员信息
            credits_response = await client.get(credits_url, params={
                "api_key": API_KEY,
                "language": "zh-CN"
            })
            
            # 如果第一次尝试失败，尝试另一种媒体类型
            if details_response.status_code != 200 or credits_response.status_code != 200:
                if media_type == 'tv':
                    details_url = f"{BASE_URL}/movie/{movie_id}"
                    credits_url = f"{BASE_URL}/movie/{movie_id}/credits"
                    media_type = 'movie'
                else:
                    details_url = f"{BASE_URL}/tv/{movie_id}"
                    credits_url = f"{BASE_URL}/tv/{movie_id}/credits"
                    media_type = 'tv'
                
                details_response = await client.get(details_url, params={
                    "api_key": API_KEY,
                    "language": "zh-CN"
                })
                
                credits_response = await client.get(credits_url, params={
                    "api_key": API_KEY,
                    "language": "zh-CN"
                })
            
            if details_response.status_code != 200:
                raise HTTPException(status_code=400, detail="无法获取该电影的详细信息")
            
            if credits_response.status_code != 200:
                raise HTTPException(status_code=400, detail="无法获取该电影的演职员信息")
            
            details_data = details_response.json()
            credits_data = credits_response.json()
            
            # 保存原始信息以便比较
            changes = {}
            
            # 1. 更新导演和主演
            if media_type == 'tv':
                new_director, new_cast = extract_director_cast_tv(credits_data)
            else:
                new_director = get_director_from_credits(credits_data)
                new_cast = get_cast_from_credits(credits_data)
            
            if watch_status.director != new_director:
                changes["director"] = {"old": watch_status.director, "new": new_director}
                watch_status.director = new_director
            
            if watch_status.cast != new_cast:
                changes["cast"] = {"old": watch_status.cast, "new": new_cast}
                watch_status.cast = new_cast
            
            # 2. 更新题材信息
            genres = details_data.get("genres", [])
            new_genres = get_genres_string(genres)
            if watch_status.genres != new_genres:
                changes["genres"] = {"old": watch_status.genres, "new": new_genres}
                watch_status.genres = new_genres
            
            # 3. 更新制作国家
            production_countries = details_data.get("production_countries", [])
            new_countries = translate_countries(production_countries)
            if watch_status.production_countries != new_countries:
                changes["production_countries"] = {"old": watch_status.production_countries, "new": new_countries}
                watch_status.production_countries = new_countries
            
            # 4. 更新评分
            new_vote_average = details_data.get("vote_average", 0)
            if watch_status.vote_average != new_vote_average:
                changes["vote_average"] = {"old": watch_status.vote_average, "new": new_vote_average}
                watch_status.vote_average = new_vote_average
            
            # 5. 更新简介
            new_overview = details_data.get("overview", "暂无简介")
            if new_overview and new_overview != "暂无简介" and watch_status.overview != new_overview:
                changes["overview"] = {"old": watch_status.overview, "new": new_overview}
                watch_status.overview = new_overview
            
            # 6. 更新发布日期
            if media_type == 'tv':
                new_release_date = details_data.get("first_air_date", "")
                if new_release_date and watch_status.first_air_date != new_release_date:
                    changes["first_air_date"] = {"old": watch_status.first_air_date, "new": new_release_date}
                    watch_status.first_air_date = new_release_date
            else:
                new_release_date = details_data.get("release_date", "")
                if new_release_date and watch_status.release_date != new_release_date:
                    changes["release_date"] = {"old": watch_status.release_date, "new": new_release_date}
                    watch_status.release_date = new_release_date
            
            # 更新媒体类型
            if watch_status.media_type != media_type:
                changes["media_type"] = {"old": watch_status.media_type, "new": media_type}
                watch_status.media_type = media_type
            
            watch_status.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                "message": "电影元数据修复成功",
                "movie_title": watch_status.movie_title,
                "media_type": media_type,
                "changes_count": len(changes),
                "changes": changes
            }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"修复单个电影失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"修复失败: {str(e)}")