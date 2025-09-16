#!/usr/bin/env python3
"""
清理数据库中的"仿明"标签
"""

import sys
import os

# 添加当前目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import SessionLocal
from models import MovieEdit

def clean_fake_ming_tag():
    """清理数据库中的仿明标签"""
    db = SessionLocal()
    
    try:
        # 查找包含"仿明"标签的记录
        records = db.query(MovieEdit).filter(
            MovieEdit.custom_background_time.like('%仿明%')
        ).all()
        
        if not records:
            print("未找到包含'仿明'标签的记录")
            return
        
        print(f"找到 {len(records)} 条包含'仿明'标签的记录:")
        
        # 处理每条记录
        for record in records:
            print(f"- 电影: {record.movie_title} (ID: {record.movie_id})")
            print(f"  当前标签: {record.custom_background_time}")
            
            # 移除"仿明"标签
            if record.custom_background_time:
                # 分割标签，移除"仿明"，重新组合
                tags = [tag.strip() for tag in record.custom_background_time.split(',') if tag.strip()]
                filtered_tags = [tag for tag in tags if tag != '仿明']
                new_tags = ', '.join(filtered_tags) if filtered_tags else None
                
                print(f"  新标签: {new_tags or '(无标签)'}")
                
                # 更新数据库
                if new_tags:
                    record.custom_background_time = new_tags
                else:
                    # 如果没有其他标签了，删除整条记录
                    db.delete(record)
                    print(f"  已删除记录（无其他标签）")
        
        # 提交更改
        db.commit()
        print(f"\n成功清理了 {len(records)} 条记录中的'仿明'标签")
        
    except Exception as e:
        print(f"清理过程中出错: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("开始清理数据库中的'仿明'标签...")
    clean_fake_ming_tag()
    print("清理完成!")