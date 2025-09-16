from fastapi import APIRouter, HTTPException, Query, Depends
import httpx
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from database import get_db
from models import WatchStatus, User
from auth import get_current_user_optional

load_dotenv()

router = APIRouter()

API_KEY = os.getenv("TMDB_API_KEY", "be3849411a172c7f817c762b765ec656")
BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

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

def translate_countries(countries: List[Dict]) -> List[Dict]:
    """转换国家名为中文"""
    return [
        {**country, "name": country_name_map.get(country["name"], country["name"])}
        for country in countries
    ]

def get_country_name_by_code(code: str) -> str:
    """根据国家代码获取国家名称"""
    code_to_name = {
        'US': 'United States of America',
        'CN': 'China',
        'JP': 'Japan',
        'KR': 'South Korea',
        'GB': 'United Kingdom',
        'FR': 'France',
        'DE': 'Germany',
        'IT': 'Italy',
        'HK': 'Hong Kong',
        'TW': 'Taiwan',
        'TH': 'Thailand',
        'IN': 'India'
    }
    return code_to_name.get(code, code)

async def get_credits_info(client: httpx.AsyncClient, movie_id: int, media_type: str) -> tuple:
    """获取电影/电视剧的演职人员信息"""
    try:
        credits_url = f"{BASE_URL}/{media_type}/{movie_id}/credits"
        credits_response = await client.get(credits_url, params={"api_key": API_KEY, "language": "zh-CN"})
        credits_data = credits_response.json()
        
        # 获取导演信息
        director = ""
        if media_type == "movie":
            # 电影的导演在crew中
            crew = credits_data.get("crew", [])
            directors = [person["name"] for person in crew if person.get("job") == "Director"]
            director = ", ".join(directors[:2])  # 最多显示2个导演
        else:
            # 电视剧的创作者在created_by中，但credits API可能不包含，所以从crew中寻找Executive Producer
            crew = credits_data.get("crew", [])
            creators = [person["name"] for person in crew if person.get("job") in ["Executive Producer", "Creator", "Showrunner"]]
            director = ", ".join(creators[:2])  # 最多显示2个创作者
        
        # 获取主演信息（前5个演员）
        cast_list = credits_data.get("cast", [])
        main_cast = [person["name"] for person in cast_list[:5]]
        cast = ", ".join(main_cast)
        
        return director, cast
    except Exception as e:
        print(f"获取演职人员信息失败: {movie_id}, {e}")
        return "", ""

def get_genres_by_ids(genre_ids: List[int]) -> List[Dict]:
    """转换genre ID为名称对象"""
    genre_map = {
        28: '动作', 12: '冒险', 16: '动画', 35: '喜剧', 80: '犯罪', 
        99: '纪录片', 18: '剧情', 10751: '家庭', 14: '奇幻', 36: '历史',
        27: '恐怖', 10402: '音乐', 9648: '悬疑', 10749: '爱情', 878: '科幻',
        10770: '电视电影', 53: '惊悚', 10752: '战争', 37: '西部', 10759: '动作冒险',
        10762: '儿童', 10763: '新闻', 10764: '真人秀', 10765: '科幻奇幻', 10766: '肥皂剧',
        10767: '脱口秀', 10768: '战争政治'
    }
    
    return [
        {"id": genre_id, "name": genre_map.get(genre_id, f"类型{genre_id}")}
        for genre_id in genre_ids
    ]

async def get_user_marked_movie_ids(user_id: int, db: Session) -> set:
    """获取用户已标记的电影ID集合"""
    try:
        watch_statuses = db.query(WatchStatus).filter(WatchStatus.user_id == user_id).all()
        return {status.movie_id for status in watch_statuses}
    except Exception as e:
        print(f"获取用户标记电影失败: {str(e)}")
        return set()

async def fetch_movies_until_enough(
    client: httpx.AsyncClient,
    url: str,
    params: dict,
    target_count: int,
    marked_ids: set,
    max_pages: int = 10
) -> tuple:
    """持续获取电影数据直到收集到足够的未标记电影"""
    all_movies = []
    current_page = params.get("page", 1)
    total_pages = 1
    total_results = 0
    
    for page_num in range(current_page, min(current_page + max_pages, 501)):  # TMDB最大500页
        params["page"] = page_num
        
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # 更新总页数和总结果数（只在第一次获取时）
            if page_num == current_page:
                total_pages = data.get("total_pages", 1)
                total_results = data.get("total_results", 0)
            
            movies = data.get("results", [])
            
            # 过滤掉已标记的电影
            unmarked_movies = [movie for movie in movies if movie["id"] not in marked_ids]
            all_movies.extend(unmarked_movies)
            
            # 如果收集到足够的电影，或者没有更多页面，停止
            if len(all_movies) >= target_count or page_num >= total_pages:
                break
                
        except Exception as e:
            print(f"获取第{page_num}页电影失败: {str(e)}")
            break
    
    return all_movies[:target_count], total_pages, total_results

@router.get("/search")
async def search_movies(
    query: Optional[str] = None,
    mediaType: str = "movie",
    genre: Optional[str] = None,
    year: Optional[str] = None,
    region: Optional[str] = None,
    sortBy: str = "popularity.desc",
    page: int = 1,
    excludeMarked: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """搜索电影"""
    try:
        # 获取用户已标记的电影ID（如果启用了排除功能）
        marked_movie_ids = set()
        if excludeMarked and current_user:
            marked_movie_ids = await get_user_marked_movie_ids(current_user.id, db)
            print(f"用户 {current_user.username} 已标记电影数量: {len(marked_movie_ids)}")
        
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            params = {
                "api_key": API_KEY,
                "language": "zh-CN",
                "page": page,
                "include_adult": False
            }

            if query and query.strip():
                # 搜索模式
                base_media_type = mediaType
                
                # 处理特殊类型的搜索
                if mediaType == "animation":
                    base_media_type = "movie"
                elif mediaType == "anime":
                    base_media_type = "tv"
                elif mediaType == "documentary":
                    base_media_type = "movie"
                elif mediaType == "variety":
                    base_media_type = "tv"
                elif mediaType == "live_action_movie":
                    base_media_type = "movie"
                elif mediaType == "live_action_tv":
                    base_media_type = "tv"
                
                if base_media_type == "all":
                    url = f"{BASE_URL}/search/multi"
                else:
                    url = f"{BASE_URL}/search/{base_media_type}"
                
                params["query"] = query.strip()
            else:
                # 发现模式
                base_media_type = mediaType
                genre_filter = genre
                
                # 处理特殊类型
                if mediaType == "animation":
                    base_media_type = "movie"
                    genre_filter = f"16,{genre_filter}" if genre_filter else "16"
                elif mediaType == "anime":
                    base_media_type = "tv"
                    genre_filter = f"16,{genre_filter}" if genre_filter else "16"
                elif mediaType == "documentary":
                    base_media_type = "movie"
                    genre_filter = f"99,{genre_filter}" if genre_filter else "99"
                elif mediaType == "variety":
                    base_media_type = "tv"
                    genre_filter = f"10767,10764,{genre_filter}" if genre_filter else "10767,10764"
                elif mediaType == "live_action_movie":
                    base_media_type = "movie"
                    # 真人电影：不包含动画类型(16)
                elif mediaType == "live_action_tv":
                    base_media_type = "tv"
                    # 真人电视剧：不包含动画类型(16)
                
                if base_media_type == "tv" or mediaType in ["anime", "variety", "live_action_tv"]:
                    url = f"{BASE_URL}/discover/tv"
                    params["sort_by"] = sortBy
                    if year:
                        if year == "before_1960":
                            params["first_air_date.lte"] = "1959-12-31"
                        elif "-" in year:  # 年代范围
                            start_year, end_year = year.split("-")
                            params["first_air_date.gte"] = f"{start_year}-01-01"
                            params["first_air_date.lte"] = f"{end_year}-12-31"
                        else:
                            params["first_air_date_year"] = year
                else:
                    url = f"{BASE_URL}/discover/movie"
                    params["sort_by"] = sortBy
                    if year:
                        if year == "before_1960":
                            params["primary_release_date.lte"] = "1959-12-31"
                        elif "-" in year:  # 年代范围
                            start_year, end_year = year.split("-")
                            params["primary_release_date.gte"] = f"{start_year}-01-01"
                            params["primary_release_date.lte"] = f"{end_year}-12-31"
                        else:
                            params["primary_release_year"] = year
                
                if genre_filter:
                    params["with_genres"] = genre_filter
                
                # 处理地区筛选
                if region:
                    if region == "OTHER":
                        params["without_origin_country"] = "CN,HK,TW,US,KR,JP,FR,IT,GB,DE,IN,TH"
                    else:
                        params["with_origin_country"] = region

            # 根据是否需要排除已标记电影采用不同策略
            if excludeMarked and current_user and marked_movie_ids:
                # 使用智能获取策略，确保有足够的未标记电影
                movies, total_pages, total_results = await fetch_movies_until_enough(
                    client, url, params, 20, marked_movie_ids, max_pages=5
                )
            else:
                # 常规单页获取
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                movies = data.get("results", [])
                total_pages = data.get("total_pages")
                total_results = data.get("total_results")

            # 检查是否需要特殊类型过滤或搜索模式
            needs_detailed_filtering = (query and query.strip() and 
                mediaType in ["animation", "anime", "documentary", "variety", "live_action_movie", "live_action_tv"])
            
            # 处理电影详情
            if needs_detailed_filtering:
                movies_with_details = []
                for movie in movies[:20]:
                    try:
                        media_type = "tv" if (movie.get("media_type") == "tv" or (not movie.get("title") and movie.get("name"))) else "movie"
                        detail_url = f"{BASE_URL}/{media_type}/{movie['id']}"
                        
                        detail_response = await client.get(detail_url, params={"api_key": API_KEY, "language": "zh-CN"})
                        detail_data = detail_response.json()
                        
                        movies_with_details.append({
                            **movie,
                            "genres": detail_data.get("genres", movie.get("genre_ids", []))
                        })
                    except Exception as e:
                        print(f"获取电影详情失败: {movie['id']}", str(e))
                        movies_with_details.append({
                            **movie,
                            "genres": get_genres_by_ids(movie.get("genre_ids", []))
                        })
            elif mediaType in ["live_action_movie", "live_action_tv"]:
                # 对于真人影视的发现模式，需要获取详细信息以过滤动画类型
                movies_with_details = []
                for movie in movies[:20]:
                    movie_with_details = {
                        **movie,
                        "genres": get_genres_by_ids(movie.get("genre_ids", []))
                    }
                    
                    # 过滤掉动画类型
                    if not any(g.get("id") == 16 for g in movie_with_details.get("genres", [])):
                        movies_with_details.append(movie_with_details)
            else:
                # 对于常规类型，也获取演职人员信息
                movies_with_details = []
                for movie in movies[:20]:
                    movies_with_details.append({
                        **movie,
                        "genres": get_genres_by_ids(movie.get("genre_ids", []))
                    })

            # 定义地区匹配函数
            def movie_matches_region(movie, target_region):
                # 检查origin_country字段
                origin_countries = movie.get("origin_country", [])
                if target_region in origin_countries:
                    return True
                
                # 检查production_countries字段
                production_countries = movie.get("production_countries", [])
                for country in production_countries:
                    if country.get("iso_3166_1") == target_region:
                        return True
                
                return False
            
            # 对搜索结果进行特殊类型过滤
            filtered_movies = movies_with_details
            if query and query.strip():
                if mediaType == "animation":
                    filtered_movies = [m for m in movies_with_details if any(g.get("id") == 16 for g in m.get("genres", []))]
                elif mediaType == "anime":
                    filtered_movies = [m for m in movies_with_details if any(g.get("id") == 16 for g in m.get("genres", [])) and (m.get("media_type") == "tv" or m.get("name"))]
                elif mediaType == "documentary":
                    filtered_movies = [m for m in movies_with_details if any(g.get("id") == 99 for g in m.get("genres", []))]
                elif mediaType == "variety":
                    filtered_movies = [m for m in movies_with_details if any(g.get("id") in [10767, 10764] for g in m.get("genres", []))]
                elif mediaType == "live_action_movie":
                    # 真人电影：是电影类型且不包含动画类型
                    filtered_movies = [m for m in movies_with_details if 
                                     (m.get("media_type") == "movie" or m.get("title")) and 
                                     not any(g.get("id") == 16 for g in m.get("genres", []))]
                elif mediaType == "live_action_tv":
                    # 真人电视剧：是电视剧类型且不包含动画类型
                    filtered_movies = [m for m in movies_with_details if 
                                     (m.get("media_type") == "tv" or m.get("name")) and 
                                     not any(g.get("id") == 16 for g in m.get("genres", []))]
            
            # 对于常规地区筛选，TMDB的with_origin_country参数已经足够准确
            # 不需要额外的二次过滤，因为TMDB的原生筛选已经能满足用户需求

            return {
                "results": filtered_movies,
                "total_pages": total_pages,
                "total_results": total_results,
                "page": page
            }
            
    except Exception as e:
        import traceback
        print(f"搜索电影失败: {str(e)}")
        print(f"异常详细信息: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"搜索电影失败: {str(e)}")

@router.get("/genres")
async def get_genres():
    """获取电影分类"""
    try:
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 并发获取电影和电视剧类型
            movie_response = await client.get(f"{BASE_URL}/genre/movie/list", params={"api_key": API_KEY, "language": "zh-CN"})
            tv_response = await client.get(f"{BASE_URL}/genre/tv/list", params={"api_key": API_KEY, "language": "zh-CN"})
            
            movie_data, tv_data = movie_response, tv_response
            movie_genres = movie_data.json().get("genres", [])
            tv_genres = tv_data.json().get("genres", [])
            
            # 合并并去重
            all_genres = movie_genres + tv_genres
            unique_genres = []
            seen_ids = set()
            
            for genre in all_genres:
                if genre["id"] not in seen_ids:
                    unique_genres.append(genre)
                    seen_ids.add(genre["id"])
            
            return unique_genres
            
    except Exception as e:
        print(f"获取分类失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取分类失败")

@router.get("/popular")
async def get_popular_content(page: int = 1, media_type: str = "movie"):
    """获取热门内容 - 支持电影和电视剧"""
    try:
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 根据media_type选择API端点
            if media_type == "tv":
                url = f"{BASE_URL}/tv/popular"
            else:
                url = f"{BASE_URL}/movie/popular"
                
            response = await client.get(url, params={
                "api_key": API_KEY,
                "language": "zh-CN",
                "page": page
            })
            response.raise_for_status()
            data = response.json()
            content = data.get("results", [])

            # 处理内容，添加基础信息
            content_with_details = []
            for item in content:
                content_with_details.append({
                    **item,
                    "genres": get_genres_by_ids(item.get("genre_ids", [])),
                    "media_type": media_type
                })
            
            return {
                **data,
                "results": content_with_details,
                "media_type": media_type
            }
            
    except Exception as e:
        import traceback
        print(f"获取热门{media_type}失败: {str(e)}")
        print(f"异常详细信息: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取热门{media_type}失败: {str(e)}")

@router.get("/popular/movies")
async def get_popular_movies(page: int = 1):
    """获取热门电影"""
    return await get_popular_content(page=page, media_type="movie")

@router.get("/popular/tv")
async def get_popular_tv_shows(page: int = 1):
    """获取热门电视剧"""
    return await get_popular_content(page=page, media_type="tv")

@router.get("/{movie_id}")
async def get_movie_detail(movie_id: int):
    """获取单个电影/电视剧详情"""
    try:
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 先尝试作为电影获取
            try:
                movie_url = f"{BASE_URL}/movie/{movie_id}"
                movie_response = await client.get(movie_url, params={"api_key": API_KEY, "language": "zh-CN"})
                if movie_response.status_code == 200:
                    movie_data = movie_response.json()
                    
                    return {
                        **movie_data,
                        "media_type": "movie"
                    }
            except:
                pass
            
            # 如果电影接口失败，尝试作为电视剧获取
            tv_url = f"{BASE_URL}/tv/{movie_id}"
            tv_response = await client.get(tv_url, params={"api_key": API_KEY, "language": "zh-CN"})
            if tv_response.status_code == 200:
                tv_data = tv_response.json()
                
                return {
                    **tv_data,
                    "media_type": "tv"
                }
            else:
                raise HTTPException(status_code=404, detail="电影/电视剧不存在")
                
    except Exception as e:
        print(f"获取电影详情失败: {movie_id}, {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取电影详情失败: {str(e)}")