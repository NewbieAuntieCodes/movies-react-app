#!/usr/bin/env python3
"""
批量修复数据库中的导演和主演信息
"""

import sys
import os
import requests
import time
from typing import Optional, Dict, Any

# 添加当前目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import SessionLocal
from models import WatchStatus
from dotenv import load_dotenv

load_dotenv()

# TMDB API配置
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

class DirectorCastFixer:
    def __init__(self):
        self.db = SessionLocal()
        self.session = requests.Session()
        self.rate_limit_delay = 0.25  # TMDB API限制
        
    def close(self):
        self.db.close()
        
    def get_movie_details(self, movie_id: int, media_type: str = "movie") -> Optional[Dict[str, Any]]:
        """从TMDB获取电影详细信息"""
        try:
            endpoint = f"{TMDB_BASE_URL}/{media_type}/{movie_id}"
            params = {
                'api_key': TMDB_API_KEY,
                'language': 'zh-CN'  # 获取中文信息
            }
            
            response = self.session.get(endpoint, params=params)
            time.sleep(self.rate_limit_delay)  # 遵守API限制
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"  API请求失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  获取电影详情失败: {e}")
            return None
    
    def get_movie_credits(self, movie_id: int, media_type: str = "movie") -> Optional[Dict[str, Any]]:
        """获取电影演职员信息"""
        try:
            endpoint = f"{TMDB_BASE_URL}/{media_type}/{movie_id}/credits"
            params = {
                'api_key': TMDB_API_KEY,
                'language': 'zh-CN'
            }
            
            response = self.session.get(endpoint, params=params)
            time.sleep(self.rate_limit_delay)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"  获取演职员信息失败: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"  获取演职员信息失败: {e}")
            return None
    
    def extract_director_cast(self, credits: Dict[str, Any], media_type: str = "movie") -> tuple[Optional[str], Optional[str]]:
        """从演职员信息中提取导演和主演"""
        director = None
        cast_list = []
        
        # 提取导演
        if 'crew' in credits:
            if media_type == 'tv':
                # 电视剧中查找制作人、导演、创作者等
                priority_jobs = ['Creator', 'Showrunner', 'Executive Producer', 'Director']
                directors = []
                
                for job in priority_jobs:
                    job_people = [person for person in credits['crew'] if person.get('job') == job]
                    if job_people:
                        # 取前2个该职位的人
                        directors.extend(job_people[:2])
                        if len(directors) >= 2:  # 最多取2个
                            break
                
                if directors:
                    director_names = [person.get('name', '') for person in directors if person.get('name')]
                    director = ', '.join(director_names[:2])  # 最多2个导演/制作人
            else:
                # 电影中只查找导演
                directors = [person for person in credits['crew'] if person.get('job') == 'Director']
                if directors:
                    director_names = [person.get('name', '') for person in directors if person.get('name')]
                    director = ', '.join(director_names[:2])  # 最多2个导演
        
        # 提取主演（前5位）
        if 'cast' in credits and credits['cast']:
            main_cast = credits['cast'][:5]  # 取前5个主要演员
            cast_list = [person.get('name', '') for person in main_cast if person.get('name')]
            
        cast = ', '.join(cast_list) if cast_list else None
        
        return director, cast
    
    def fix_record(self, record: WatchStatus, dry_run: bool = True) -> bool:
        """修复单个记录"""
        try:
            # 确定媒体类型
            media_type = record.media_type if record.media_type else 'movie'
            
            print(f"处理: {record.movie_title} (ID: {record.movie_id}, 类型: {media_type})")
            
            # 获取演职员信息
            credits = self.get_movie_credits(record.movie_id, media_type)
            if not credits:
                print(f"  无法获取演职员信息")
                return False
            
            # 提取导演和主演
            new_director, new_cast = self.extract_director_cast(credits, media_type)
            
            # 显示变更信息
            changes_made = False
            
            if new_director and new_director != record.director:
                print(f"  导演: '{record.director}' -> '{new_director}'")
                if not dry_run:
                    record.director = new_director
                changes_made = True
            
            if new_cast and new_cast != record.cast:
                print(f"  主演: '{record.cast}' -> '{new_cast}'")
                if not dry_run:
                    record.cast = new_cast
                changes_made = True
            
            if not changes_made:
                print(f"  无需更新")
            
            return changes_made
            
        except Exception as e:
            print(f"  处理失败: {e}")
            return False
    
    def fix_all_records(self, dry_run: bool = True, limit: int = None):
        """批量修复所有记录"""
        try:
            # 查询所有有导演或主演信息的记录
            query = self.db.query(WatchStatus).filter(
                (WatchStatus.director.isnot(None)) | (WatchStatus.cast.isnot(None))
            )
            
            if limit:
                query = query.limit(limit)
                
            records = query.all()
            
            print(f"找到 {len(records)} 条记录需要处理")
            print(f"模式: {'预览模式（不会实际修改）' if dry_run else '实际修改模式'}")
            print("=" * 50)
            
            updated_count = 0
            
            for i, record in enumerate(records, 1):
                print(f"\n[{i}/{len(records)}]", end=" ")
                
                if self.fix_record(record, dry_run):
                    updated_count += 1
                
                # 每处理10个记录暂停一下
                if i % 10 == 0:
                    print(f"\n--- 已处理 {i} 条记录，暂停2秒 ---")
                    time.sleep(2)
            
            # 提交更改
            if not dry_run and updated_count > 0:
                self.db.commit()
                print(f"\n成功更新了 {updated_count} 条记录")
            else:
                print(f"\n预览完成，共 {updated_count} 条记录需要更新")
                
        except Exception as e:
            print(f"批量处理失败: {e}")
            if not dry_run:
                self.db.rollback()

def main():
    if not TMDB_API_KEY:
        print("错误: 未找到 TMDB_API_KEY 环境变量")
        print("请在 .env 文件中设置 TMDB_API_KEY")
        return
    
    import argparse
    parser = argparse.ArgumentParser(description='批量修复导演和主演信息')
    parser.add_argument('--dry-run', action='store_true', default=True, 
                       help='预览模式，不实际修改数据（默认）')
    parser.add_argument('--apply', action='store_true', 
                       help='实际执行修改')
    parser.add_argument('--limit', type=int, 
                       help='限制处理记录数量（用于测试）')
    
    args = parser.parse_args()
    
    # 如果指定了 --apply，则关闭 dry_run
    dry_run = not args.apply
    
    fixer = DirectorCastFixer()
    
    try:
        fixer.fix_all_records(dry_run=dry_run, limit=args.limit)
    finally:
        fixer.close()

if __name__ == "__main__":
    main()