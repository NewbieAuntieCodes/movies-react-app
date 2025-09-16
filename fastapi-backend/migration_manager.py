from sqlalchemy import create_engine, text, MetaData, inspect
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import importlib
import sys
from pathlib import Path

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./movies.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class MigrationManager:
    def __init__(self):
        self.engine = engine
        self.session = SessionLocal()
        self.migrations_dir = Path(__file__).parent / "migrations"
        
    def ensure_migration_table(self):
        """确保迁移表存在"""
        with self.engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
    
    def get_applied_migrations(self):
        """获取已应用的迁移"""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT version FROM schema_migrations ORDER BY version"))
            return [row[0] for row in result]
    
    def get_pending_migrations(self):
        """获取待应用的迁移"""
        applied = set(self.get_applied_migrations())
        all_migrations = []
        
        # 扫描migrations目录
        if self.migrations_dir.exists():
            for file in self.migrations_dir.glob("*.py"):
                if not file.name.startswith("__"):
                    all_migrations.append(file.stem)
        
        all_migrations.sort()
        return [m for m in all_migrations if m not in applied]
    
    def apply_migration(self, migration_name):
        """应用单个迁移"""
        try:
            # 动态导入迁移模块
            sys.path.insert(0, str(self.migrations_dir))
            migration_module = importlib.import_module(migration_name)
            
            # 执行up方法
            if hasattr(migration_module, 'up'):
                print(f"应用迁移: {migration_name}")
                migration_module.up(self.engine)
                
                # 记录迁移已应用
                with self.engine.connect() as conn:
                    conn.execute(text(
                        "INSERT INTO schema_migrations (version) VALUES (:version)"
                    ), {"version": migration_name})
                    conn.commit()
                    
                print(f"迁移 {migration_name} 应用成功")
            else:
                print(f"迁移 {migration_name} 没有up方法")
                
        except Exception as e:
            print(f"应用迁移 {migration_name} 失败: {str(e)}")
            raise
        finally:
            sys.path.remove(str(self.migrations_dir))
    
    def rollback_migration(self, migration_name):
        """回滚单个迁移"""
        try:
            # 动态导入迁移模块
            sys.path.insert(0, str(self.migrations_dir))
            migration_module = importlib.import_module(migration_name)
            
            # 执行down方法
            if hasattr(migration_module, 'down'):
                print(f"回滚迁移: {migration_name}")
                migration_module.down(self.engine)
                
                # 从记录中删除
                with self.engine.connect() as conn:
                    conn.execute(text(
                        "DELETE FROM schema_migrations WHERE version = :version"
                    ), {"version": migration_name})
                    conn.commit()
                    
                print(f"迁移 {migration_name} 回滚成功")
            else:
                print(f"迁移 {migration_name} 没有down方法")
                
        except Exception as e:
            print(f"回滚迁移 {migration_name} 失败: {str(e)}")
            raise
        finally:
            sys.path.remove(str(self.migrations_dir))
    
    def migrate(self):
        """应用所有待应用的迁移"""
        self.ensure_migration_table()
        pending = self.get_pending_migrations()
        
        if not pending:
            print("没有待应用的迁移")
            return
        
        print(f"发现 {len(pending)} 个待应用的迁移")
        for migration in pending:
            self.apply_migration(migration)
        
        print("所有迁移已应用完成")
    
    def status(self):
        """显示迁移状态"""
        self.ensure_migration_table()
        applied = self.get_applied_migrations()
        pending = self.get_pending_migrations()
        
        print("迁移状态:")
        print(f"已应用: {len(applied)}")
        for m in applied:
            print(f"  [OK] {m}")
        
        print(f"待应用: {len(pending)}")
        for m in pending:
            print(f"  [PENDING] {m}")

if __name__ == "__main__":
    manager = MigrationManager()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "migrate":
            manager.migrate()
        elif command == "status":
            manager.status()
        elif command == "rollback" and len(sys.argv) > 2:
            manager.rollback_migration(sys.argv[2])
        else:
            print("用法:")
            print("  python migration_manager.py migrate    # 应用所有迁移")
            print("  python migration_manager.py status     # 查看状态")
            print("  python migration_manager.py rollback <version>  # 回滚迁移")
    else:
        manager.status()