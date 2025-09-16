import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie, User, WatchStatus, MovieEdit } from '../types';
import { movieApi, getImageUrl, getMovieTitle, getMovieYear, watchStatusApi, movieEditApi } from '../services/api';

interface MovieDetailProps {
  user: User | null;
  onWatchStatusChange?: () => void;
  onTagUpdate?: () => void;
}

const MovieDetail: React.FC<MovieDetailProps> = ({ user, onWatchStatusChange, onTagUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [movieEdit, setMovieEdit] = useState<MovieEdit | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMovieDetail();
    }
  }, [id]);

  useEffect(() => {
    if (movie && user) {
      loadWatchStatus();
      loadMovieEdit();
    }
  }, [movie, user]);

  const loadMovieDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const movieData = await movieApi.getDetail(parseInt(id));
      setMovie(movieData);
    } catch (error) {
      console.error('加载电影详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchStatus = async () => {
    if (!movie || !user) return;
    
    try {
      const status = await watchStatusApi.getByMovieId(movie.id);
      setWatchStatus(status);
    } catch (error) {
      console.log('获取观看状态失败:', error);
    }
  };

  const loadMovieEdit = async () => {
    if (!movie || !user) return;
    
    try {
      const edit = await movieEditApi.getByMovieId(movie.id);
      setMovieEdit(edit);
      if (edit?.custom_background_time) {
        setCustomTime(edit.custom_background_time);
      }
    } catch (error) {
      console.log('获取电影编辑失败:', error);
    }
  };

  const handleStatusChange = async (status: 'watched' | 'want_to_watch') => {
    if (!movie || !user || statusLoading) return;
    
    setStatusLoading(true);
    try {
      if (watchStatus?.status === status) {
        await watchStatusApi.delete(movie.id);
        setWatchStatus(null);
      } else {
        const genresString = movie.genres && movie.genres.length > 0 
          ? movie.genres.map(g => g.name).join(', ') 
          : '暂无分类';
          
        const countriesString = movie.production_countries && movie.production_countries.length > 0 
          ? movie.production_countries.map(c => c.name).join(', ') 
          : '暂无出品信息';
          
        const voteAverage = movie.vote_average || 0;
        const overview = movie.overview || '暂无简介';

        const newWatchStatus: Partial<WatchStatus> = {
          movie_id: movie.id,
          movie_title: getMovieTitle(movie),
          poster_path: movie.poster_path,
          status: status,
          media_type: movie.media_type || (movie.title ? 'movie' : 'tv'),
          release_date: movie.release_date,
          first_air_date: movie.first_air_date,
          genres: genresString,
          production_countries: countriesString,
          vote_average: voteAverage,
          overview: overview,
        };
        
        await watchStatusApi.create(newWatchStatus);
        setWatchStatus({ ...newWatchStatus, status } as WatchStatus);
      }
      
      onWatchStatusChange?.();
    } catch (error) {
      console.error('更新观看状态失败:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaveCustomTime = async () => {
    if (!movie || !user || statusLoading) return;
    
    setStatusLoading(true);
    try {
      if (!customTime.trim()) {
        if (movieEdit) {
          await movieEditApi.delete(movie.id);
          setMovieEdit(null);
        }
      } else {
        const editData: Partial<MovieEdit> = {
          movie_id: movie.id,
          movie_title: getMovieTitle(movie),
          custom_background_time: customTime.trim(),
        };
        
        await movieEditApi.create(editData);
        await loadMovieEdit();
      }
      
      setEditMode(false);
      onTagUpdate?.(); // 通知MyMovies页面更新标签管理
    } catch (error) {
      console.error('保存自定义时间失败:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setCustomTime(movieEdit?.custom_background_time || '');
    setEditMode(false);
  };

  const getStatusButtonClass = (status: 'watched' | 'want_to_watch') => {
    const baseClass = 'px-6 py-3 rounded-lg text-base font-medium transition-colors duration-200';
    const isActive = watchStatus?.status === status;
    
    switch (status) {
      case 'watched':
        return `${baseClass} ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}`;
      case 'want_to_watch':
        return `${baseClass} ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`;
      default:
        return baseClass;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-top-transparent"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">电影不存在</h2>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          返回首页
        </button>
      </div>
    );
  }

  const title = getMovieTitle(movie);
  const year = getMovieYear(movie);
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const mediaTypeText = mediaType === 'movie' ? '电影' : '电视剧';
  const displayTime = movieEdit?.custom_background_time || year;
  
  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` 
    : getImageUrl(movie.poster_path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 返回按钮 */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← 返回
          </button>
        </div>
      </div>

      {/* 电影详情 */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 背景图片 */}
          <div 
            className="h-80 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              <p className="text-xl text-gray-200">{mediaTypeText} • {displayTime}</p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 海报 */}
              <div className="lg:col-span-1">
                <img
                  src={getImageUrl(movie.poster_path)}
                  alt={title}
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750/cccccc/666666?text=加载失败';
                  }}
                />
              </div>

              {/* 详细信息 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">类型</h3>
                    <p className="mt-1 text-lg text-gray-900">{mediaTypeText}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {movieEdit?.custom_background_time ? '背景时间' : '上映时间'}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-lg text-gray-900">{displayTime}</p>
                      {user && !editMode && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          title="编辑背景时间"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                    {movieEdit?.custom_background_time && (
                      <p className="text-sm text-gray-500">原上映时间: {year}</p>
                    )}
                  </div>

                  {movie.production_countries && movie.production_countries.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">出品地区</h3>
                      <p className="mt-1 text-lg text-gray-900">
                        {movie.production_countries.map(c => c.name).join(', ')}
                      </p>
                    </div>
                  )}

                  {movie.genres && movie.genres.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">题材</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {movie.genres.map((genre) => (
                          <span
                            key={genre.id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {movie.director && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">导演</h3>
                      <p className="mt-1 text-lg text-gray-900">{movie.director}</p>
                    </div>
                  )}

                  {movie.cast && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">主演</h3>
                      <p className="mt-1 text-lg text-gray-900">{movie.cast}</p>
                    </div>
                  )}
                </div>

                {/* 编辑模式 */}
                {user && editMode && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">编辑背景时间:</h3>
                    <input
                      type="text"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="例如: 2023年、近未来、现代等"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={statusLoading}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveCustomTime}
                        disabled={statusLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                      >
                        {statusLoading ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={statusLoading}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {/* 简介 */}
                {movie.overview && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">剧情简介</h3>
                    <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
                  </div>
                )}

                {/* 观看状态按钮 */}
                {user && (
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleStatusChange('watched')}
                      disabled={statusLoading}
                      className={getStatusButtonClass('watched')}
                    >
                      ✓ 已看过
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange('want_to_watch')}
                      disabled={statusLoading}
                      className={getStatusButtonClass('want_to_watch')}
                    >
                      ★ 想看
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;