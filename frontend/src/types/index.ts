export interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Genre[];
  media_type?: 'movie' | 'tv';
  production_countries?: ProductionCountry[];
  origin_country?: string[];
  director?: string; // 导演
  cast?: string; // 主演
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface WatchStatus {
  id?: number;
  user_id?: number;
  movie_id: number;
  movie_title: string;
  poster_path?: string;
  status: 'watched' | 'want_to_watch';
  rating?: number;
  notes?: string;
  watched_date?: string;
  created_at?: string;
  updated_at?: string;
  // 新增字段用于筛选
  media_type?: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  genres?: string; // JSON string of genre names
  production_countries?: string; // JSON string of country codes
  vote_average?: number;
  overview?: string;
  director?: string; // 导演
  cast?: string; // 主演
}

export interface MovieEdit {
  id?: number;
  user_id?: number;
  movie_id: number;
  movie_title: string;
  custom_background_time?: string;
  custom_genre?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
}

export interface SearchParams {
  query?: string;
  mediaType?: 'movie' | 'tv' | 'all';
  genre?: string;
  year?: string;
  region?: string;
  sortBy?: string;
  page?: number;
  excludeMarked?: boolean; // 是否排除已标记的电影
}

export interface ApiResponse<T> {
  results: T[];
  total_pages: number;
  total_results: number;
  page: number;
}

// 游戏相关类型定义
export interface Game {
  id: number;
  name: string;
  background_image?: string;
  rating: number;
  rating_top: number;
  ratings_count: number;
  released?: string;
  genres?: GameGenre[];
  platforms?: Platform[];
  developers?: Developer[];
  publishers?: Publisher[];
  description_raw?: string;
  description?: string;
  metacritic?: number;
  parent_platforms?: ParentPlatform[];
  esrb_rating?: ESRBRating;
}

export interface GameGenre {
  id: number;
  name: string;
  slug: string;
}

export interface Platform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface ParentPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
}

export interface Publisher {
  id: number;
  name: string;
  slug: string;
}

export interface ESRBRating {
  id: number;
  name: string;
  slug: string;
}

export interface GameSearchParams {
  search?: string;
  genres?: string;
  platforms?: string;
  ordering?: string;
  dates?: string;
  metacritic?: string;
  page?: number;
  page_size?: number;
}

export interface GameApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}