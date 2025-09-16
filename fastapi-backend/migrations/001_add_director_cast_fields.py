"""
添加director和cast字段到watch_status表
"""

from sqlalchemy import text


def up(engine):
    """应用迁移"""
    with engine.connect() as conn:
        # 检查字段是否已存在
        inspector = engine.dialect.get_columns(conn, 'watch_status')
        existing_columns = [col['name'] for col in inspector]
        
        # 只添加不存在的字段
        if 'director' not in existing_columns:
            conn.execute(text("ALTER TABLE watch_status ADD COLUMN director TEXT"))
            print("添加director字段")
        else:
            print("director字段已存在")
            
        if 'cast' not in existing_columns:
            conn.execute(text("ALTER TABLE watch_status ADD COLUMN cast TEXT"))
            print("添加cast字段")
        else:
            print("cast字段已存在")
            
        conn.commit()


def down(engine):
    """回滚迁移"""
    with engine.connect() as conn:
        # SQLite不支持DROP COLUMN，所以我们重建表
        conn.execute(text("""
            CREATE TABLE watch_status_backup AS 
            SELECT id, user_id, movie_id, movie_title, poster_path, status, rating, notes, 
                   watched_date, created_at, updated_at, media_type, release_date, first_air_date, 
                   genres, production_countries, vote_average, overview
            FROM watch_status
        """))
        
        conn.execute(text("DROP TABLE watch_status"))
        
        conn.execute(text("ALTER TABLE watch_status_backup RENAME TO watch_status"))
        
        conn.commit()
        print("回滚director和cast字段")