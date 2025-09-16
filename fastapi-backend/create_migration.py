"""
创建新的迁移文件的工具脚本
"""

import sys
import os
from datetime import datetime
from pathlib import Path


def create_migration(name: str):
    """创建新的迁移文件"""
    # 生成时间戳和文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{name}.py"
    
    migrations_dir = Path(__file__).parent / "migrations"
    migrations_dir.mkdir(exist_ok=True)
    
    filepath = migrations_dir / filename
    
    # 迁移模板
    template = f'''"""
{name.replace('_', ' ').title()}
"""

from sqlalchemy import text


def up(engine):
    """应用迁移"""
    with engine.connect() as conn:
        # TODO: 在这里添加你的迁移逻辑
        # 例如:
        # conn.execute(text("ALTER TABLE table_name ADD COLUMN new_column TYPE"))
        
        conn.commit()
        print(f"应用迁移: {name}")


def down(engine):
    """回滚迁移"""
    with engine.connect() as conn:
        # TODO: 在这里添加回滚逻辑
        # 例如:
        # conn.execute(text("ALTER TABLE table_name DROP COLUMN new_column"))
        
        conn.commit()
        print(f"回滚迁移: {name}")
'''
    
    # 写入文件
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(template)
    
    print(f"创建迁移文件: {filepath}")
    print("请编辑文件以添加你的迁移逻辑")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python create_migration.py <migration_name>")
        print("例如: python create_migration.py add_user_avatar")
        sys.exit(1)
    
    migration_name = sys.argv[1]
    create_migration(migration_name)