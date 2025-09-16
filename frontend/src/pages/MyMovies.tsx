import React, { useState, useEffect } from 'react';
import { WatchStatus, User, MovieEdit, Movie } from '../types';
import { watchStatusApi, movieEditApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import MultiFilterPanel from '../components/MultiFilterPanel';
import TagManagementPanel from '../components/TagManagementPanel';

interface MyMoviesProps {
  user: User | null;
}

interface FilterState {
  status: 'all' | 'watched' | 'want_to_watch';
  mediaType: string;
  region: string;
  genre: string;
  year: string;
  backgroundTime: string;
  keyword: string;
  sortBy: string;
}

const MyMovies: React.FC<MyMoviesProps> = ({ user }) => {
  const [movies, setMovies] = useState<WatchStatus[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<WatchStatus[]>([]);
  const [paginatedMovies, setPaginatedMovies] = useState<WatchStatus[]>([]);
  const [movieEdits, setMovieEdits] = useState<MovieEdit[]>([]);
  const [backgroundTimeOptions, setBackgroundTimeOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    mediaType: 'all',
    region: 'all',
    genre: 'all',
    year: 'all',
    backgroundTime: 'all',
    keyword: '',
    sortBy: 'updated_at'
  });

  useEffect(() => {
    if (user) {
      loadMyMovies();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [movies, filters]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredMovies.slice(startIndex, endIndex);
    setPaginatedMovies(paginated);
  }, [filteredMovies, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadMyMovies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [watchedMovies, wantToWatchMovies, allMovieEdits] = await Promise.all([
        watchStatusApi.getAll('watched', 1, 1000), // 获取最多1000条
        watchStatusApi.getAll('want_to_watch', 1, 1000), // 获取最多1000条
        movieEditApi.getAll(1, 1000) // 获取最多1000条
      ]);
      
      const allMovies = [...watchedMovies, ...wantToWatchMovies];
      setMovies(allMovies);
      setMovieEdits(allMovieEdits);
      
      // 提取所有不重复的背景时间选项
      const uniqueBackgroundTimes = [...new Set(
        allMovieEdits
          .map(edit => edit.custom_background_time)
          .filter(time => time && time.trim() !== '')
      )] as string[];
      
      setBackgroundTimeOptions(uniqueBackgroundTimes);
    } catch (error) {
      console.error('加载观看列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movies];

    // 按观看状态筛选
    if (filters.status !== 'all') {
      filtered = filtered.filter(movie => movie.status === filters.status);
    }

    // 按媒体类型筛选
    if (filters.mediaType !== 'all') {
      filtered = filtered.filter(movie => {
        const genres = movie.genres?.toLowerCase() || '';
        
        // 基础媒体类型筛选
        if (filters.mediaType === 'movie') {
          return movie.media_type === 'movie';
        }
        if (filters.mediaType === 'tv') {
          return movie.media_type === 'tv';
        }
        
        // 特殊媒体类型筛选
        if (filters.mediaType === 'documentary') {
          // 纪录片通常包含在genres中
          return genres.includes('纪录') || genres.includes('documentary');
        }
        if (filters.mediaType === 'animation') {
          // 动漫剧集：必须是电视剧且包含动画类型
          return movie.media_type === 'tv' && (genres.includes('动画') || genres.includes('animation'));
        }
        if (filters.mediaType === 'animation_movie') {
          // 动画电影：必须是电影且包含动画类型
          return movie.media_type === 'movie' && (genres.includes('动画') || genres.includes('animation'));
        }
        if (filters.mediaType === 'live_action_movie') {
          // 真人电影：必须是电影且不包含动画类型
          return movie.media_type === 'movie' && !genres.includes('动画') && !genres.includes('animation');
        }
        
        // 默认情况
        return movie.media_type === filters.mediaType;
      });
    }

    // 按地区筛选
    if (filters.region !== 'all') {
      filtered = filtered.filter(movie => {
        // 如果没有地区信息，跳过筛选（显示所有没有地区信息的电影）
        if (!movie.production_countries || movie.production_countries === '暂无出品信息') {
          return false; // 暂时不显示没有地区信息的电影
        }
        
        // 特殊处理中国大陆，同时匹配"中国"和"中国大陆"
        if (filters.region === '中国大陆') {
          return movie.production_countries.includes('中国大陆') || 
                 movie.production_countries.includes('中国') ||
                 movie.production_countries.includes('CN') ||
                 movie.production_countries.includes('China');
        }
        
        // 创建地区映射
        const regionMap: { [key: string]: string } = {
          '中国香港': '中国香港',
          '中国台湾': '中国台湾',
          '美国': '美国',
          '日本': '日本',
          '韩国': '韩国',
          '法国': '法国',
          '意大利': '意大利',
          '德国': '德国',
          '印度': '印度',
          '泰国': '泰国',
          '英国': '英国'
        };
        
        return movie.production_countries.includes(regionMap[filters.region] || filters.region);
      });
    }

    // 按题材筛选
    if (filters.genre !== 'all') {
      filtered = filtered.filter(movie => {
        if (!movie.genres) return false;
        const genres = movie.genres.toLowerCase();
        
        switch (filters.genre) {
          case 'action': return genres.includes('动作') || genres.includes('action');
          case 'comedy': return genres.includes('喜剧') || genres.includes('comedy');
          case 'drama': return genres.includes('剧情') || genres.includes('drama');
          case 'thriller': return genres.includes('惊悚') || genres.includes('thriller');
          case 'horror': return genres.includes('恐怖') || genres.includes('horror');
          case 'romance': return genres.includes('爱情') || genres.includes('romance');
          case 'science_fiction': return genres.includes('科幻') || genres.includes('science fiction');
          case 'fantasy': return genres.includes('奇幻') || genres.includes('fantasy');
          case 'crime': return genres.includes('犯罪') || genres.includes('crime');
          case 'war': return genres.includes('战争') || genres.includes('war');
          default: return true;
        }
      });
    }

    // 按年份筛选 - 更新为年代区间
    if (filters.year !== 'all') {
      filtered = filtered.filter(movie => {
        const date = movie.release_date || movie.first_air_date;
        if (!date) return false;
        
        const year = new Date(date).getFullYear();
        
        switch (filters.year) {
          case '2020s': return year >= 2020 && year <= 2029;
          case '2010s': return year >= 2010 && year <= 2019;
          case '2000s': return year >= 2000 && year <= 2009;
          case '1990s': return year >= 1990 && year <= 1999;
          case '1980s': return year >= 1980 && year <= 1989;
          case '1970s': return year >= 1970 && year <= 1979;
          case '1960s': return year >= 1960 && year <= 1969;
          case 'other': return year < 1960;
          default: return true;
        }
      });
    }

    // 按背景时间筛选
    if (filters.backgroundTime !== 'all') {
      filtered = filtered.filter(movie => {
        const movieEdit = movieEdits.find(edit => edit.movie_id === movie.movie_id);
        
        if (filters.backgroundTime === '无背景时间') {
          // 筛选没有设置背景时间的影视（没有编辑记录或背景时间为空）
          return !movieEdit || !movieEdit.custom_background_time || movieEdit.custom_background_time.trim() === '';
        } else {
          // 筛选特定背景时间的影视 - 支持部分匹配
          if (!movieEdit || !movieEdit.custom_background_time) return false;
          const backgroundTimes = movieEdit.custom_background_time.split(',').map(time => time.trim());
          return backgroundTimes.includes(filters.backgroundTime);
        }
      });
    }

    // 按关键词搜索
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(movie => 
        movie.movie_title.toLowerCase().includes(keyword) ||
        movie.overview?.toLowerCase().includes(keyword) ||
        movie.genres?.toLowerCase().includes(keyword) ||
        movie.production_countries?.toLowerCase().includes(keyword) ||
        movie.director?.toLowerCase().includes(keyword) ||
        movie.cast?.toLowerCase().includes(keyword)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.movie_title.localeCompare(b.movie_title);
        case 'updated_at':
          return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
        case 'rating':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'year':
          const yearA = a.release_date || a.first_air_date || '';
          const yearB = b.release_date || b.first_air_date || '';
          return yearB.localeCompare(yearA);
        default:
          return 0;
      }
    });

    setFilteredMovies(filtered);
  };


  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleAutoFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleWatchStatusChange = () => {
    loadMyMovies();
  };

  const handleMovieSelect = (movie: Movie | null) => {
    setSelectedMovie(movie);
  };

  const handleTagUpdate = async () => {
    await loadMyMovies();
    // 强制重新渲染以同步标签管理面板
    if (selectedMovie) {
      const updatedMovie = movies.find(m => m.movie_id === selectedMovie.id);
      if (updatedMovie) {
        const movie = {
          id: updatedMovie.movie_id,
          title: updatedMovie.media_type === 'tv' ? undefined : updatedMovie.movie_title,
          name: updatedMovie.media_type === 'tv' ? updatedMovie.movie_title : undefined,
          poster_path: updatedMovie.poster_path,
          media_type: updatedMovie.media_type,
          release_date: updatedMovie.release_date,
          first_air_date: updatedMovie.first_air_date,
          vote_average: updatedMovie.vote_average,
          overview: updatedMovie.overview,
          genres: updatedMovie.genres ? updatedMovie.genres.split(', ').map(name => ({ id: 0, name })) : undefined,
          production_countries: updatedMovie.production_countries ? 
            updatedMovie.production_countries.split(', ').map(name => ({ iso_3166_1: '', name: name })) : undefined,
          director: updatedMovie.director,
          cast: updatedMovie.cast,
        };
        setSelectedMovie(movie as any);
      }
    }
  };

  const handleUpdateProductionCountries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await watchStatusApi.updateProductionCountries();
      alert(`补充完成！\n成功更新: ${result.updated_count} 部\n失败: ${result.failed_count} 部\n总处理: ${result.total_processed} 部`);
      
      // 重新加载数据
      await loadMyMovies();
    } catch (error) {
      console.error('补充地区信息失败:', error);
      alert('补充地区信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOverview = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await watchStatusApi.updateOverview();
      alert(`补充简介完成！\n成功更新: ${result.updated_count} 部\n失败: ${result.failed_count} 部\n总处理: ${result.total_processed} 部`);
      
      // 重新加载数据
      await loadMyMovies();
    } catch (error) {
      console.error('补充简介失败:', error);
      alert('补充简介失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDirector = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await watchStatusApi.updateDirector();
      alert(`补充导演信息完成！\n成功更新: ${result.updated_count} 部\n失败: ${result.failed_count} 部\n总处理: ${result.total_processed} 部`);
      
      // 重新加载数据
      await loadMyMovies();
    } catch (error) {
      console.error('补充导演信息失败:', error);
      alert('补充导演信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCast = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await watchStatusApi.updateCast();
      alert(`补充主演信息完成！\n成功更新: ${result.updated_count} 部\n失败: ${result.failed_count} 部\n总处理: ${result.total_processed} 部`);
      
      // 重新加载数据
      await loadMyMovies();
    } catch (error) {
      console.error('补充主演信息失败:', error);
      alert('补充主演信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h2>
          <p className="text-gray-600">登录后即可查看你的观看列表</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-gray-800">我的影视</h2>
          <div className="flex gap-2">
            <button
              onClick={handleUpdateProductionCountries}
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors duration-200"
            >
              {loading ? '补充中...' : '补充地区'}
            </button>
            <button
              onClick={handleUpdateOverview}
              disabled={loading}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors duration-200"
            >
              {loading ? '补充中...' : '补充简介'}
            </button>
            <button
              onClick={handleUpdateDirector}
              disabled={loading}
              className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors duration-200"
            >
              {loading ? '补充中...' : '补充导演'}
            </button>
            <button
              onClick={handleUpdateCast}
              disabled={loading}
              className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors duration-200"
            >
              {loading ? '补充中...' : '补充主演'}
            </button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>总共 {filteredMovies.length} 部影视作品</span>
          <span>已看过 {movies.filter(m => m.status === 'watched').length} 部</span>
          <span>想看 {movies.filter(m => m.status === 'want_to_watch').length} 部</span>
          {totalPages > 1 && (
            <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
          )}
        </div>
      </div>

      {/* Left-Right Layout */}
      <div className="flex gap-6">
        {/* Left Sidebar - Tag Management */}
        <div className="flex-shrink-0">
          <TagManagementPanel
            movies={filteredMovies.map(watchStatus => ({
              id: watchStatus.movie_id,
              title: watchStatus.media_type === 'tv' ? undefined : watchStatus.movie_title,
              name: watchStatus.media_type === 'tv' ? watchStatus.movie_title : undefined,
              poster_path: watchStatus.poster_path,
              media_type: watchStatus.media_type,
              release_date: watchStatus.release_date,
              first_air_date: watchStatus.first_air_date,
              vote_average: watchStatus.vote_average,
              overview: watchStatus.overview,
              genres: watchStatus.genres ? watchStatus.genres.split(', ').map(name => ({ id: 0, name })) : undefined,
              production_countries: watchStatus.production_countries ? 
                watchStatus.production_countries.split(', ').map(name => ({ iso_3166_1: '', name: name })) : undefined,
              director: watchStatus.director,
              cast: watchStatus.cast,
            }))}
          />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Multi-line Filter Panel */}
          <MultiFilterPanel 
            filters={filters}
            onFilterChange={handleFilterChange}
            onAutoFilterChange={handleAutoFilterChange}
            loading={loading}
          />

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-top-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-700">正在加载观看列表...</h3>
            </div>
          )}

          {/* Movies Grid */}
          {!loading && paginatedMovies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {paginatedMovies.map((watchStatus) => {
                // 从 WatchStatus 构建完整的 Movie 对象
                const movie = {
                  id: watchStatus.movie_id,
                  title: watchStatus.media_type === 'tv' ? undefined : watchStatus.movie_title,
                  name: watchStatus.media_type === 'tv' ? watchStatus.movie_title : undefined,
                  poster_path: watchStatus.poster_path,
                  media_type: watchStatus.media_type,
                  release_date: watchStatus.release_date,
                  first_air_date: watchStatus.first_air_date,
                  vote_average: watchStatus.vote_average,
                  overview: watchStatus.overview,
                  genres: watchStatus.genres ? watchStatus.genres.split(', ').map(name => ({ id: 0, name })) : undefined,
                  production_countries: watchStatus.production_countries ? 
                    watchStatus.production_countries.split(', ').map(name => ({ iso_3166_1: '', name: name })) : undefined,
                  director: watchStatus.director,
                  cast: watchStatus.cast,
                };
                
                const isSelected = selectedMovie?.id === movie.id;
                
                return (
                  <div
                    key={watchStatus.movie_id}
                    className={`relative ${isSelected ? 'ring-4 ring-blue-500 rounded-lg' : ''}`}
                  >
                    <MovieCard
                      movie={movie as any}
                      onWatchStatusChange={handleWatchStatusChange}
                      showDirectorCast={true}
                      onCardClick={() => handleMovieSelect(movie as any)}
                      movieEdit={movieEdits.find(edit => edit.movie_id === movie.id) || null}
                      onTagUpdate={handleTagUpdate}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        已选中
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredMovies.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 10) {
                    pageNumber = i + 1;
                  } else {
                    if (currentPage <= 6) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 5) {
                      pageNumber = totalPages - 9 + i;
                    } else {
                      pageNumber = currentPage - 5 + i;
                    }
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNumber
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredMovies.length === 0 && movies.length > 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-700 mb-2">没有符合条件的影视作品</h3>
              <p className="text-gray-600">请尝试调整筛选条件</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && movies.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-700 mb-2">还没有添加任何影视作品</h3>
              <p className="text-gray-600 mb-4">去热门页面标记一些影视作品吧！</p>
              <a
                href="/"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                浏览热门影视
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMovies;