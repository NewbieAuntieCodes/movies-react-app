import React, { useState, useEffect } from 'react';
import { GameSearchParams, GameGenre } from '../types';
import { rawgApi } from '../services/api';

interface GameFiltersProps {
  onSearch: (params: GameSearchParams) => void;
  loading: boolean;
}

const GameFilters: React.FC<GameFiltersProps> = ({ onSearch, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedOrdering, setSelectedOrdering] = useState('-rating');
  const [selectedYear, setSelectedYear] = useState('');
  const [genres, setGenres] = useState<GameGenre[]>([]);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await rawgApi.getGenres();
      setGenres(data.results);
    } catch (error) {
      console.error('加载游戏类型失败:', error);
    }
  };

  const handleSearch = () => {
    const params: GameSearchParams = {
      page: 1,
      page_size: 20,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (selectedGenre) {
      params.genres = selectedGenre;
    }

    if (selectedPlatform) {
      params.platforms = selectedPlatform;
    }

    if (selectedOrdering) {
      params.ordering = selectedOrdering;
    }

    if (selectedYear) {
      // RAWG API 使用日期范围格式
      params.dates = `${selectedYear}-01-01,${selectedYear}-12-31`;
    }

    onSearch(params);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedPlatform('');
    setSelectedOrdering('-rating');
    setSelectedYear('');
    
    // 搜索热门游戏
    onSearch({
      page: 1,
      page_size: 20,
      ordering: '-rating'
    });
  };

  // 平台选项 (扩展版)
  const platformOptions = [
    { id: 'pc', name: 'PC' },
    { id: 'playstation-5', name: 'PlayStation 5' },
    { id: 'playstation-4', name: 'PlayStation 4' },
    { id: 'xbox-series-x-s', name: 'Xbox Series X/S' },
    { id: 'xbox-one', name: 'Xbox One' },
    { id: 'nintendo-switch', name: 'Nintendo Switch' },
    { id: 'web-browser', name: 'Web Browser' },
  ];

  // 排序选项 (简化版，因为FreeToGame API限制)
  const orderingOptions = [
    { value: 'default', label: '默认排序' },
    { value: 'alphabetical', label: '按名称排序' },
  ];

  // 年份选项
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 游戏筛选</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        {/* 搜索框 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            游戏名称
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索游戏..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
          />
        </div>

        {/* 类型筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            游戏类型
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有类型</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        {/* 平台筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            游戏平台
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有平台</option>
            {platformOptions.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {/* 发布年份 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            发布年份
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有年份</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* 排序方式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            排序方式
          </label>
          <select
            value={selectedOrdering}
            onChange={(e) => setSelectedOrdering(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {orderingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {loading ? '搜索中...' : '搜索游戏'}
        </button>
        
        <button
          onClick={handleClear}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors duration-200"
        >
          清除筛选
        </button>
      </div>
    </div>
  );
};

export default GameFilters;