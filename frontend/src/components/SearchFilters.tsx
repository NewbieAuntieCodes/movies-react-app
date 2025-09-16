import React, { useState, useEffect, useRef } from 'react';
import { Genre, SearchParams } from '../types';
import { movieApi } from '../services/api';

interface SearchFiltersProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onSearch, loading }) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [autoSearch, setAutoSearch] = useState<boolean>(() => {
    const saved = localStorage.getItem('searchMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [filters, setFilters] = useState<SearchParams>({
    query: '',
    mediaType: 'movie',
    genre: '',
    year: '',
    region: '',
    sortBy: 'popularity.desc',
    excludeMarked: false
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGenres();
  }, []);

  // 监听filters变化，自动搜索模式下触发搜索
  useEffect(() => {
    if (!autoSearch) return;
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 检查是否所有字段都为空，避免完全空搜索
    if (!filters.query && !filters.genre && !filters.year && !filters.region && filters.mediaType === 'movie') {
      return;
    }
    
    // 设置新的定时器
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(filters);
    }, 2000); // 2秒延迟，避免快速连续搜索
    
    // 清理函数
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, autoSearch, onSearch]);

  const loadGenres = async () => {
    try {
      const genresList = await movieApi.getGenres();
      setGenres(genresList);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleInputChange = (key: keyof SearchParams, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAutoSearchToggle = (enabled: boolean) => {
    setAutoSearch(enabled);
    localStorage.setItem('searchMode', JSON.stringify(enabled));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 年代选项
  const getDecadeOptions = () => {
    const currentDecade = Math.floor(new Date().getFullYear() / 10) * 10;
    const decades = [];
    for (let decade = currentDecade; decade >= 1960; decade -= 10) {
      decades.push(`${decade}s`);
    }
    decades.push('1960年代之前');
    return decades;
  };

  const regions = [
    { code: '', name: '全部地区' },
    { code: 'CN', name: '中国大陆' },
    { code: 'HK', name: '香港' },
    { code: 'TW', name: '台湾' },
    { code: 'US', name: '美国' },
    { code: 'KR', name: '韩国' },
    { code: 'JP', name: '日本' },
    { code: 'FR', name: '法国' },
    { code: 'IT', name: '意大利' },
    { code: 'GB', name: '英国' },
    { code: 'DE', name: '德国' },
    { code: 'IN', name: '印度' },
    { code: 'TH', name: '泰国' },
    { code: 'OTHER', name: '其他地区' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* 搜索关键词 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          搜索关键词
        </label>
        <input
          type="text"
          value={filters.query || ''}
          onChange={(e) => handleInputChange('query', e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入电影名称..."
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* 筛选区域 - 行内布局 */}
      <div className="space-y-4">
        {/* 类型 */}
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">类型</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'movie', label: '电影' },
              { value: 'live_action_movie', label: '真人电影' },
              { value: 'animation', label: '动画电影' },
              { value: 'tv', label: '电视剧' },
              { value: 'live_action_tv', label: '真人电视剧' },
              { value: 'anime', label: '动漫剧集' },
              { value: 'documentary', label: '纪录片' },
              { value: 'variety', label: '综艺节目' },
              { value: 'all', label: '全部' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => handleInputChange('mediaType', type.value)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.mediaType === type.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 分类 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">分类</h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <button
              onClick={() => handleInputChange('genre', '')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                !filters.genre
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部分类
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleInputChange('genre', genre.id.toString())}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.genre === genre.id.toString()
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* 地区 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">地区</h3>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region.code}
                onClick={() => handleInputChange('region', region.code)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.region === region.code
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* 上映时间 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">上映时间</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleInputChange('year', '')}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                !filters.year
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部上映时间
            </button>
            {getDecadeOptions().map((decade) => (
              <button
                key={decade}
                onClick={() => {
                  if (decade === '1960年代之前') {
                    handleInputChange('year', 'before_1960');
                  } else {
                    const decadeStart = decade.replace('s', '');
                    handleInputChange('year', `${decadeStart}-${parseInt(decadeStart) + 9}`);
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  (decade === '1960年代之前' && filters.year === 'before_1960') ||
                  (decade !== '1960年代之前' && filters.year === `${decade.replace('s', '')}-${parseInt(decade.replace('s', '')) + 9}`)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {decade}
              </button>
            ))}
          </div>
        </div>

        {/* 排序方式 */}
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">排序方式</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'popularity.desc', label: '热门度降序' },
              { value: 'release_date.desc', label: '最新上映' },
              { value: 'vote_average.desc', label: '评分最高' },
              { value: 'vote_count.desc', label: '评价最多' }
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => handleInputChange('sortBy', sort.value)}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  filters.sortBy === sort.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* 排除选项 */}
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">筛选选项</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleInputChange('excludeMarked', !filters.excludeMarked)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                filters.excludeMarked
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filters.excludeMarked ? '✓ 已排除标记影片' : '排除已看过/想看'}
            </button>
          </div>
        </div>
      </div>

      {/* 搜索模式切换和搜索按钮 */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
        {/* 搜索模式切换 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">搜索模式:</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${!autoSearch ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>手动</span>
            <button
              onClick={() => handleAutoSearchToggle(!autoSearch)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoSearch ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                autoSearch ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm ${autoSearch ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>自动</span>
          </div>
        </div>

        {/* 搜索按钮 */}
        <button
          onClick={handleSearch}
          disabled={loading || autoSearch}
          className={`px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
            autoSearch 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:from-blue-600 hover:to-purple-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-top-transparent"></div>
              搜索中...
            </>
          ) : (
            <>
              🔍 {autoSearch ? '自动搜索已启用' : '搜索电影'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;