from fastapi import APIRouter, HTTPException, Query
import httpx
from typing import Optional, List, Dict, Any

router = APIRouter()

FREETOGAME_BASE_URL = "https://www.freetogame.com/api"

# 模拟热门游戏数据
mock_popular_games = [
    {
        "id": 1001,
        "name": "赛博朋克2077",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co2lbd.webp",
        "rating": 4.1,
        "rating_top": 5,
        "ratings_count": 125000,
        "released": "2020-12-10",
        "genres": [{"id": 1, "name": "Action RPG", "slug": "action-rpg"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 5", "slug": "playstation-5"}},
            {"platform": {"id": 3, "name": "Xbox Series X/S", "slug": "xbox-series-x-s"}}
        ],
        "developers": [{"id": 1, "name": "CD Projekt Red", "slug": "cd-projekt-red"}],
        "publishers": [{"id": 1, "name": "CD Projekt", "slug": "cd-projekt"}],
        "description_raw": "赛博朋克2077是一款开放世界动作冒险RPG，故事发生在夜之城，这是一个科技和身体改造痴迷的大都市。",
        "description": "赛博朋克2077是一款开放世界动作冒险RPG，故事发生在夜之城，这是一个科技和身体改造痴迷的大都市。",
        "metacritic": 86
    },
    {
        "id": 1002,
        "name": "艾尔登法环",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co4jni.webp",
        "rating": 4.6,
        "rating_top": 5,
        "ratings_count": 200000,
        "released": "2022-02-25",
        "genres": [{"id": 1, "name": "Action RPG", "slug": "action-rpg"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 5", "slug": "playstation-5"}},
            {"platform": {"id": 3, "name": "Xbox Series X/S", "slug": "xbox-series-x-s"}}
        ],
        "developers": [{"id": 2, "name": "FromSoftware", "slug": "fromsoftware"}],
        "publishers": [{"id": 2, "name": "Bandai Namco", "slug": "bandai-namco"}],
        "description_raw": "艾尔登法环是FromSoftware开发的奇幻动作RPG游戏，由乔治·R·R·马丁协助创作世界观。",
        "description": "艾尔登法环是FromSoftware开发的奇幻动作RPG游戏，由乔治·R·R·马丁协助创作世界观。",
        "metacritic": 96
    },
    {
        "id": 1003,
        "name": "黑神话：悟空",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co87c5.webp",
        "rating": 4.4,
        "rating_top": 5,
        "ratings_count": 89000,
        "released": "2024-08-20",
        "genres": [{"id": 1, "name": "Action RPG", "slug": "action-rpg"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 5", "slug": "playstation-5"}}
        ],
        "developers": [{"id": 3, "name": "游戏科学", "slug": "game-science"}],
        "publishers": [{"id": 3, "name": "游戏科学", "slug": "game-science"}],
        "description_raw": "基于中国古典名著《西游记》的单人动作RPG游戏，玩家将扮演天命人踏上充满奇遇和挑战的西游取经路。",
        "description": "基于中国古典名著《西游记》的单人动作RPG游戏，玩家将扮演天命人踏上充满奇遇和挑战的西游取经路。",
        "metacritic": 81
    },
    {
        "id": 1004,
        "name": "巫师3：狂猎",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co1wyy.webp",
        "rating": 4.7,
        "rating_top": 5,
        "ratings_count": 300000,
        "released": "2015-05-19",
        "genres": [{"id": 1, "name": "Action RPG", "slug": "action-rpg"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 4", "slug": "playstation-4"}},
            {"platform": {"id": 3, "name": "Xbox One", "slug": "xbox-one"}},
            {"platform": {"id": 4, "name": "Nintendo Switch", "slug": "nintendo-switch"}}
        ],
        "developers": [{"id": 1, "name": "CD Projekt Red", "slug": "cd-projekt-red"}],
        "publishers": [{"id": 1, "name": "CD Projekt", "slug": "cd-projekt"}],
        "description_raw": "巫师3：狂猎是一款开放世界RPG，讲述了巫师杰洛特寻找他的养女希里的史诗故事。",
        "description": "巫师3：狂猎是一款开放世界RPG，讲述了巫师杰洛特寻找他的养女希里的史诗故事。",
        "metacritic": 93
    },
    {
        "id": 1005,
        "name": "Grand Theft Auto V",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co2lbw.webp",
        "rating": 4.5,
        "rating_top": 5,
        "ratings_count": 400000,
        "released": "2013-09-17",
        "genres": [{"id": 2, "name": "Action Adventure", "slug": "action-adventure"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 5", "slug": "playstation-5"}},
            {"platform": {"id": 3, "name": "Xbox Series X/S", "slug": "xbox-series-x-s"}}
        ],
        "developers": [{"id": 4, "name": "Rockstar North", "slug": "rockstar-north"}],
        "publishers": [{"id": 4, "name": "Rockstar Games", "slug": "rockstar-games"}],
        "description_raw": "洛圣都和布雷恩县的世界提供了前所未有的自由度，让玩家随心所欲地探索。",
        "description": "洛圣都和布雷恩县的世界提供了前所未有的自由度，让玩家随心所欲地探索。",
        "metacritic": 96
    },
    {
        "id": 1006,
        "name": "荒野大镖客：救赎2",
        "background_image": "https://images.igdb.com/igdb/image/upload/t_1080p/co1q1f.webp",
        "rating": 4.6,
        "rating_top": 5,
        "ratings_count": 250000,
        "released": "2018-10-26",
        "genres": [{"id": 2, "name": "Action Adventure", "slug": "action-adventure"}],
        "platforms": [
            {"platform": {"id": 1, "name": "PC", "slug": "pc"}},
            {"platform": {"id": 2, "name": "PlayStation 4", "slug": "playstation-4"}},
            {"platform": {"id": 3, "name": "Xbox One", "slug": "xbox-one"}}
        ],
        "developers": [{"id": 4, "name": "Rockstar Studios", "slug": "rockstar-studios"}],
        "publishers": [{"id": 4, "name": "Rockstar Games", "slug": "rockstar-games"}],
        "description_raw": "美国，1899年。法外之徒的时代即将落下帷幕。执法者正在追捕剩余的亡命之徒团伙。",
        "description": "美国，1899年。法外之徒的时代即将落下帷幕。执法者正在追捕剩余的亡命之徒团伙。",
        "metacritic": 97
    }
]

@router.get("/popular")
async def get_popular_games(page: int = Query(1, ge=1)):
    """获取热门游戏"""
    try:
        all_games = mock_popular_games.copy()
        
        # 尝试获取FreeToGame的免费游戏数据
        try:
            timeout = httpx.Timeout(30.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{FREETOGAME_BASE_URL}/games")
                response.raise_for_status()
                free_games_data = response.json()
                
                free_games = [
                    {
                        "id": game["id"] + 2000,  # 避免ID冲突
                        "name": game["title"],
                        "background_image": game["thumbnail"],
                        "rating": 4.0,
                        "rating_top": 5,
                        "ratings_count": 1000,
                        "released": game["release_date"],
                        "genres": [{"id": 1, "name": game["genre"], "slug": game["genre"].lower()}],
                        "platforms": [{"platform": {"id": 1, "name": game["platform"], "slug": game["platform"].lower()}}],
                        "developers": [{"id": 1, "name": game["developer"], "slug": game["developer"].lower()}],
                        "publishers": [{"id": 1, "name": game["publisher"], "slug": game["publisher"].lower()}],
                        "description_raw": game["short_description"],
                        "description": game["short_description"],
                        "metacritic": None,
                        "game_url": game["game_url"],
                        "freetogame_profile_url": game["freetogame_profile_url"],
                        "is_free": True
                    }
                    for game in free_games_data
                ]
                
                all_games.extend(free_games)
        except Exception as e:
            print(f"FreeToGame API暂时不可用，使用模拟数据: {str(e)}")
        
        # 手动分页
        page_size = 20
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        games = all_games[start_index:end_index]
        
        return {
            "count": len(all_games),
            "results": games
        }
        
    except Exception as e:
        print(f"获取热门游戏失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取热门游戏失败")

@router.get("/search")
async def search_games(
    search: Optional[str] = None,
    genres: Optional[str] = None,
    platforms: Optional[str] = None,
    page: int = Query(1, ge=1)
):
    """搜索游戏"""
    try:
        all_games = mock_popular_games.copy()
        
        # 添加FreeToGame数据
        try:
            timeout = httpx.Timeout(30.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                url = f"{FREETOGAME_BASE_URL}/games"
                
                # 如果有特定的类型或平台筛选，使用对应的API
                if genres and genres not in ['action-rpg', 'action-adventure']:
                    url = f"{FREETOGAME_BASE_URL}/games?category={genres}"
                elif platforms and platforms in ['pc', 'web-browser']:
                    url = f"{FREETOGAME_BASE_URL}/games?platform={platforms}"
                
                response = await client.get(url)
                response.raise_for_status()
                free_games_data = response.json()
                
                free_games = [
                    {
                        "id": game["id"] + 2000,
                        "name": game["title"],
                        "background_image": game["thumbnail"],
                        "rating": 4.0,
                        "rating_top": 5,
                        "ratings_count": 1000,
                        "released": game["release_date"],
                        "genres": [{"id": 1, "name": game["genre"], "slug": game["genre"].lower()}],
                        "platforms": [{"platform": {"id": 1, "name": game["platform"], "slug": game["platform"].lower()}}],
                        "developers": [{"id": 1, "name": game["developer"], "slug": game["developer"].lower()}],
                        "publishers": [{"id": 1, "name": game["publisher"], "slug": game["publisher"].lower()}],
                        "description_raw": game["short_description"],
                        "description": game["short_description"],
                        "metacritic": None,
                        "is_free": True
                    }
                    for game in free_games_data
                ]
                
                all_games.extend(free_games)
        except Exception as e:
            print(f"FreeToGame搜索失败，仅使用模拟数据: {str(e)}")
        
        # 应用搜索过滤器
        filtered_games = all_games
        
        if search:
            search_term = search.lower()
            filtered_games = [
                game for game in filtered_games
                if search_term in game["name"].lower() or search_term in game["description_raw"].lower()
            ]
        
        if genres:
            filtered_games = [
                game for game in filtered_games
                if any(
                    g["slug"] == genres or genres.lower() in g["name"].lower()
                    for g in game["genres"]
                )
            ]
        
        if platforms:
            platform_term = platforms.lower()
            filtered_games = [
                game for game in filtered_games
                if any(
                    platform_term in p["platform"]["slug"]
                    for p in game["platforms"]
                )
            ]
        
        # 手动分页
        page_size = 20
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_games = filtered_games[start_index:end_index]
        
        return {
            "count": len(filtered_games),
            "results": paginated_games
        }
        
    except Exception as e:
        print(f"搜索游戏失败: {str(e)}")
        raise HTTPException(status_code=500, detail="搜索游戏失败")

@router.get("/genres")
async def get_game_genres():
    """获取游戏类型"""
    try:
        genres = [
            {"id": "action-rpg", "name": "Action RPG", "slug": "action-rpg"},
            {"id": "action-adventure", "name": "Action Adventure", "slug": "action-adventure"},
            {"id": "mmorpg", "name": "MMORPG", "slug": "mmorpg"},
            {"id": "shooter", "name": "Shooter", "slug": "shooter"},
            {"id": "strategy", "name": "Strategy", "slug": "strategy"},
            {"id": "moba", "name": "MOBA", "slug": "moba"},
            {"id": "racing", "name": "Racing", "slug": "racing"},
            {"id": "sports", "name": "Sports", "slug": "sports"},
            {"id": "simulation", "name": "Simulation", "slug": "simulation"},
            {"id": "puzzle", "name": "Puzzle", "slug": "puzzle"},
            {"id": "platform", "name": "Platform", "slug": "platform"},
            {"id": "fighting", "name": "Fighting", "slug": "fighting"},
            {"id": "horror", "name": "Horror", "slug": "horror"},
            {"id": "survival", "name": "Survival", "slug": "survival"},
            {"id": "battle-royale", "name": "Battle Royale", "slug": "battle-royale"},
            {"id": "card", "name": "Card Game", "slug": "card"},
            {"id": "sandbox", "name": "Sandbox", "slug": "sandbox"},
            {"id": "open-world", "name": "Open World", "slug": "open-world"}
        ]
        
        return {"results": genres}
        
    except Exception as e:
        print(f"获取游戏类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取游戏类型失败")

@router.get("/{game_id}")
async def get_game_detail(game_id: int):
    """获取单个游戏详情"""
    try:
        # 先从模拟数据中查找
        mock_game = next((game for game in mock_popular_games if game["id"] == game_id), None)
        if mock_game:
            return mock_game
        
        # 如果是FreeToGame的游戏ID，从API获取
        if game_id > 2000:
            original_id = game_id - 2000
            timeout = httpx.Timeout(30.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{FREETOGAME_BASE_URL}/game?id={original_id}")
                response.raise_for_status()
                game = response.json()
                
                result = {
                    "id": game_id,
                    "name": game["title"],
                    "background_image": game["thumbnail"],
                    "rating": 4.0,
                    "rating_top": 5,
                    "ratings_count": 1000,
                    "released": game["release_date"],
                    "genres": [{"id": 1, "name": game["genre"], "slug": game["genre"].lower()}],
                    "platforms": [{"platform": {"id": 1, "name": game["platform"], "slug": game["platform"].lower()}}],
                    "developers": [{"id": 1, "name": game["developer"], "slug": game["developer"].lower()}],
                    "publishers": [{"id": 1, "name": game["publisher"], "slug": game["publisher"].lower()}],
                    "description_raw": game.get("description") or game["short_description"],
                    "description": game.get("description") or game["short_description"],
                    "metacritic": None,
                    "screenshots": game.get("screenshots", []),
                    "is_free": True
                }
                
                return result
        
        raise HTTPException(status_code=404, detail="游戏未找到")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"获取游戏详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取游戏详情失败")