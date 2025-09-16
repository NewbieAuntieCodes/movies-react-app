from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_admin: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    message: str
    user: User
    token: Optional[str] = None

class AdminCreateUser(BaseModel):
    username: str
    email: str
    password: str
    is_admin: Optional[bool] = False

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# WatchStatus schemas
class WatchStatusBase(BaseModel):
    movie_id: int
    movie_title: str
    poster_path: Optional[str] = None
    status: str
    rating: Optional[int] = None
    notes: Optional[str] = None
    watched_date: Optional[datetime] = None
    media_type: Optional[str] = None
    release_date: Optional[str] = None
    first_air_date: Optional[str] = None
    genres: Optional[str] = None
    production_countries: Optional[str] = None
    vote_average: Optional[float] = None
    overview: Optional[str] = None
    director: Optional[str] = None
    cast: Optional[str] = None

class WatchStatusCreate(WatchStatusBase):
    pass

class WatchStatusUpdate(BaseModel):
    status: Optional[str] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    watched_date: Optional[datetime] = None

class WatchStatus(WatchStatusBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Favorite schemas
class FavoriteBase(BaseModel):
    movie_id: int
    movie_title: str
    poster_path: Optional[str] = None

class FavoriteCreate(FavoriteBase):
    pass

class Favorite(FavoriteBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# MovieEdit schemas
class MovieEditBase(BaseModel):
    movie_id: int
    movie_title: str
    custom_background_time: Optional[str] = None
    custom_genre: Optional[str] = None
    notes: Optional[str] = None

class MovieEditCreate(MovieEditBase):
    pass

class MovieEditUpdate(BaseModel):
    custom_background_time: Optional[str] = None
    custom_genre: Optional[str] = None
    notes: Optional[str] = None

class MovieEdit(MovieEditBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Movie API response schemas
class MovieSearchResponse(BaseModel):
    results: List[dict]
    total_pages: int
    total_results: int
    page: int