import React, { useState, useEffect } from 'react';
import GameFilters from '../components/GameFilters';
import GameCard from '../components/GameCard';
import { Game, User, GameSearchParams } from '../types';
import { rawgApi } from '../services/api';

interface GamesProps {
  user: User | null;
}

const Games: React.FC<GamesProps> = ({ user }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<GameSearchParams | null>(null);

  useEffect(() => {
    // 加载初始游戏数据
    loadPopularGames();
  }, []);

  const loadPopularGames = async (page = 1) => {
    setLoading(true);
    setIsSearchMode(false);
    setCurrentSearchParams(null);
    try {
      const data = await rawgApi.getPopular(page);
      setGames(data.results || []);
      setCurrentPage(page);
      setTotalResults(data.count);
      setTotalPages(Math.ceil(data.count / 20));
    } catch (error) {
      console.error('加载热门游戏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params: GameSearchParams) => {
    setLoading(true);
    setIsSearchMode(true);
    setCurrentSearchParams(params);
    try {
      const data = await rawgApi.search(params);
      setGames(data.results || []);
      setCurrentPage(params.page || 1);
      setTotalResults(data.count);
      setTotalPages(Math.ceil(data.count / (params.page_size || 20)));
    } catch (error) {
      console.error('搜索游戏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      if (isSearchMode && currentSearchParams) {
        // 如果在搜索模式，使用搜索参数翻页
        handleSearch({ ...currentSearchParams, page: newPage });
      } else {
        // 否则使用热门游戏翻页
        loadPopularGames(newPage);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* API Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          <strong>数据说明：</strong> 包含热门游戏和免费游戏数据。
          涵盖《赛博朋克2077》、《艾尔登法环》、《黑神话：悟空》等热门游戏。
        </p>
      </div>

      {/* Game Filters */}
      <GameFilters onSearch={handleSearch} loading={loading} />

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-top-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700">正在加载游戏数据...</h3>
        </div>
      )}

      {/* Results Info */}
      {!loading && games.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          共找到 {totalResults.toLocaleString()} 个游戏，显示第 {currentPage} 页，共 {totalPages} 页
        </div>
      )}

      {/* Games Grid */}
      {!loading && games.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
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
      {!loading && games.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 mb-2">没有找到相关游戏</h3>
          <p className="text-gray-600">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
};

export default Games;