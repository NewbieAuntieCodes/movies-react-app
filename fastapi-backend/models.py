from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    watch_status = relationship("WatchStatus", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    movie_edits = relationship("MovieEdit", back_populates="user")

class WatchStatus(Base):
    __tablename__ = "watch_status"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    movie_title = Column(String, nullable=False)
    poster_path = Column(String)
    status = Column(String, nullable=False)  # 'watched' or 'want_to_watch'
    rating = Column(Integer)  # 1-10
    notes = Column(Text)
    watched_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    media_type = Column(String)
    release_date = Column(String)
    first_air_date = Column(String)
    genres = Column(Text)
    production_countries = Column(Text)
    vote_average = Column(Float)
    overview = Column(Text)
    director = Column(Text)
    cast = Column(Text)
    
    # 关系
    user = relationship("User", back_populates="watch_status")
    
    # 唯一约束
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_movie_uc'),)

class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    movie_title = Column(String, nullable=False)
    poster_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="favorites")
    
    # 唯一约束
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_favorite_uc'),)

class MovieEdit(Base):
    __tablename__ = "movie_edits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    movie_title = Column(String, nullable=False)
    custom_background_time = Column(String)
    custom_genre = Column(String)  # 新增：自定义题材
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="movie_edits")
    
    # 唯一约束
    __table_args__ = (UniqueConstraint('user_id', 'movie_id', name='_user_movie_edit_uc'),)