import React, { useState, useEffect, useCallback } from 'react';
import SearchFilters from '../components/SearchFilters';
import MovieCard from '../components/MovieCard';
import { Movie, User, SearchParams, WatchStatus } from '../types';
import { movieApi, watchStatusApi } from '../services/api';

interface HomeProps {
  user: User | null;
  onWatchStatusChange: () => void;
}

const Home: React.FC<HomeProps> = ({ user, onWatchStatusChange }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchParams | null>(null);
  const [userWatchStatus, setUserWatchStatus] = useState<WatchStatus[]>([]);

  useEffect(() => {
    // 加载初始电影数据
    loadPopularMovies();
    // 加载用户观看状态
    if (user) {
      loadUserWatchStatus();
    }
  }, [user]);

  const loadPopularMovies = async (page = 1) => {
    setLoading(true);
    setIsSearchMode(false);
    setCurrentSearchParams(null);
    try {
      const data = await movieApi.getPopular(page);
      setMovies(data.results || []);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('加载热门电影失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserWatchStatus = async () => {
    if (!user) return;
    
    try {
      const watchStatusList = await watchStatusApi.getAll(undefined, 1, 1000); // 获取所有记录
      setUserWatchStatus(watchStatusList);
    } catch (error) {
      console.error('加载用户观看状态失败:', error);
    }
  };

  const handleSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setIsSearchMode(true);
    setCurrentSearchParams(params);
    try {
      const data = await movieApi.search(params);
      
      // 后端已处理excludeMarked过滤，直接使用结果
      setMovies(data.results || []);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('搜索电影失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理观看状态变化
  const handleWatchStatusChange = useCallback(async (movieId: number) => {
    // 更新用户观看状态
    await loadUserWatchStatus();
    
    // 如果当前启用了"排除已标记"选项，使用智能刷新策略
    if (currentSearchParams?.excludeMarked) {
      setMovies(prev => {
        const newMovies = prev.filter(movie => movie.id !== movieId);
        
        // 当剩余电影少于等于2个时，自动加载更多内容（确保加载20个新电影）
        if (newMovies.length <= 2 && newMovies.length > 0) {
          // 延迟执行，避免影响当前UI更新
          setTimeout(() => {
            handleSearch(currentSearchParams);
          }, 300);
        }
        
        return newMovies;
      });
    }
    
    // 通知父组件
    onWatchStatusChange();
  }, [currentSearchParams, onWatchStatusChange, handleSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      if (isSearchMode && currentSearchParams) {
        // 如果在搜索模式，使用搜索参数翻页
        handleSearch({ ...currentSearchParams, page: newPage });
      } else {
        // 否则使用热门电影翻页
        loadPopularMovies(newPage);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div>

      {/* Search Filters */}
      <SearchFilters onSearch={handleSearch} loading={loading} />

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-top-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700">正在加载电影数据...</h3>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && movies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatchStatusChange={() => handleWatchStatusChange(movie.id)}
                showDirectorCast={isSearchMode}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                ‹ 上一页
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {/* Show first page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {currentPage > 4 && <span className="px-2 py-2 text-gray-500">...</span>}
                  </>
                )}

                {/* Show pages around current page */}
                {Array.from({ length: 5 }, (_, i) => {
                  const pageNum = currentPage - 2 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Show last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="px-2 py-2 text-gray-500">...</span>}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                下一页 ›
              </button>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && movies.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 mb-2">没有找到相关电影</h3>
          <p className="text-gray-600">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
};

export default Home;