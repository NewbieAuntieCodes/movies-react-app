import axios from 'axios';
import { Movie, Genre, WatchStatus, MovieEdit, User, SearchParams, ApiResponse, Game, GameGenre, GameSearchParams, GameApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 添加请求拦截器以自动添加认证头
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 电影API
export const movieApi = {
  search: (params: SearchParams): Promise<ApiResponse<Movie>> => 
    api.get('/api/movies/search', { params }).then(res => res.data),
  
  getGenres: (): Promise<Genre[]> => 
    api.get('/api/movies/genres').then(res => res.data),
  
  getPopular: (page = 1): Promise<ApiResponse<Movie>> => 
    api.get('/api/movies/popular', { params: { page } }).then(res => res.data),
  
  getDetail: (movieId: number): Promise<Movie> => 
    api.get(`/api/movies/${movieId}`).then(res => res.data),
};

// 用户API
export const userApi = {
  login: (username: string, password: string): Promise<{ user: User; token: string }> =>
    api.post('/api/users/login', { username, password }).then(res => res.data),
  
  register: (username: string, email: string, password: string): Promise<{ user: User; token: string }> =>
    api.post('/api/users/register', { username, email, password }).then(res => res.data),
};

// 观看状态API
export const watchStatusApi = {
  getByMovieId: (movieId: number): Promise<WatchStatus | null> =>
    api.get(`/api/watch-status/${movieId}`).then(res => res.data),
  
  getAll: (status?: string, page = 1, limit = 20): Promise<WatchStatus[]> =>
    api.get('/api/watch-status', { params: { status, page, limit } }).then(res => res.data),
  
  create: (watchStatus: Partial<WatchStatus>): Promise<{ message: string; id: number; status: string }> =>
    api.post('/api/watch-status', watchStatus).then(res => res.data),
  
  delete: (movieId: number): Promise<{ message: string }> =>
    api.delete(`/api/watch-status/${movieId}`).then(res => res.data),
  
  updateProductionCountries: (): Promise<{ message: string; updated_count: number; failed_count: number; total_processed: number }> =>
    api.post('/api/watch-status/update-production-countries').then(res => res.data),
  
  updateOverview: (): Promise<{ message: string; updated_count: number; failed_count: number; total_processed: number }> =>
    api.post('/api/watch-status/update-overview').then(res => res.data),
  
  updateDirector: (): Promise<{ message: string; updated_count: number; failed_count: number; total_processed: number }> =>
    api.post('/api/watch-status/update-director').then(res => res.data),
  
  updateCast: (): Promise<{ message: string; updated_count: number; failed_count: number; total_processed: number }> =>
    api.post('/api/watch-status/update-cast').then(res => res.data),

  fixSingleMovieMetadata: (movieId: number): Promise<{ message: string; movie_title: string; media_type: string; changes_count: number; changes: any }> =>
    api.post(`/api/watch-status/${movieId}/fix-metadata`).then(res => res.data),
};

// 电影编辑API
export const movieEditApi = {
  getByMovieId: (movieId: number): Promise<MovieEdit | null> =>
    api.get(`/api/movie-edits/${movieId}`).then(res => res.data),
  
  getAll: (page = 1, limit = 20): Promise<MovieEdit[]> =>
    api.get('/api/movie-edits', { params: { page, limit } }).then(res => res.data),
  
  create: (movieEdit: Partial<MovieEdit>): Promise<{ message: string; id: number }> =>
    api.post('/api/movie-edits', movieEdit).then(res => res.data),
  
  delete: (movieId: number): Promise<{ message: string }> =>
    api.delete(`/api/movie-edits/${movieId}`).then(res => res.data),
};

// 工具函数
export const getImageUrl = (posterPath?: string): string => {
  if (!posterPath) return 'https://via.placeholder.com/500x750/cccccc/666666?text=暂无海报';
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
};

export const getMovieTitle = (movie: Movie): string => {
  return movie.title || movie.name || '未知标题';
};

export const getMovieYear = (movie: Movie): string => {
  const date = movie.release_date || movie.first_air_date;
  if (!date) return '未知';
  return new Date(date).getFullYear().toString();
};

// 游戏API (通过后端代理)
export const rawgApi = {
  search: async (params: GameSearchParams): Promise<GameApiResponse<Game>> => {
    const response = await api.get('/api/games/search', { params });
    return response.data;
  },

  getPopular: async (page = 1): Promise<GameApiResponse<Game>> => {
    const response = await api.get('/api/games/popular', {
      params: { page }
    });
    return response.data;
  },

  getGenres: async (): Promise<{ results: GameGenre[] }> => {
    const response = await api.get('/api/games/genres');
    return response.data;
  },

  getGameById: async (id: number): Promise<Game> => {
    const response = await api.get(`/api/games/${id}`);
    return response.data;
  },
};

// 游戏工具函数
export const getGameImageUrl = (imagePath?: string): string => {
  if (!imagePath) return 'https://via.placeholder.com/500x300/cccccc/666666?text=暂无截图';
  return imagePath;
};

export const getGameYear = (releaseDate?: string): string => {
  if (!releaseDate) return '未知';
  return new Date(releaseDate).getFullYear().toString();
};