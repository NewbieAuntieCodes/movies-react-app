import React, { useState, useEffect } from 'react';

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

interface MultiFilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  loading?: boolean;
  onAutoFilterChange?: (filters: FilterState) => void;
}

const MultiFilterPanel: React.FC<MultiFilterPanelProps> = ({ 
  filters, 
  onFilterChange,
  loading = false,
  onAutoFilterChange
}) => {
  
  const [autoFilter, setAutoFilter] = useState<boolean>(() => {
    const saved = localStorage.getItem('myMoviesAutoFilter');
    return saved ? JSON.parse(saved) : false;
  });

  // 监听filters变化，自动筛选模式下触发筛选
  useEffect(() => {
    if (!autoFilter || !onAutoFilterChange) return;
    
    const timeoutId = setTimeout(() => {
      onAutoFilterChange(filters);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters, autoFilter, onAutoFilterChange]);

  const handleAutoFilterToggle = (enabled: boolean) => {
    setAutoFilter(enabled);
    localStorage.setItem('myMoviesAutoFilter', JSON.stringify(enabled));
  };
  
  const handleFilterClick = (key: keyof FilterState, value: string) => {
    onFilterChange({ [key]: filters[key] === value ? 'all' : value });
  };

  const handleDragStart = (e: React.DragEvent, tag: string, categoryId: string) => {
    const dragData = {
      categoryId: categoryId,
      tag: tag
    };
    console.log('=== Filter button drag start ===');
    console.log('Tag:', tag);
    console.log('Category ID:', categoryId);
    console.log('Drag data object:', dragData);
    console.log('JSON string:', JSON.stringify(dragData));
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // 标记为正在拖拽，避免点击事件触发
    (e.target as HTMLElement).setAttribute('data-dragging', 'true');
    
    console.log('Drag start completed');
  };

  const FilterButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    disabled?: boolean;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    tag?: string;
    categoryId?: string;
  }> = ({ active, onClick, children, disabled = false, draggable = false, onDragStart, tag, categoryId }) => {
    
    const handleClick = (e: React.MouseEvent) => {
      // 如果正在拖拽，不执行点击
      if ((e.target as HTMLElement).getAttribute('data-dragging') === 'true') {
        (e.target as HTMLElement).removeAttribute('data-dragging');
        return;
      }
      onClick();
    };

    const handleDragEnd = (e: React.DragEvent) => {
      // 清除拖拽标记
      (e.target as HTMLElement).removeAttribute('data-dragging');
    };

    return (
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        draggable={draggable}
        onDragStart={draggable && tag && categoryId ? (e) => handleDragStart(e, tag, categoryId) : onDragStart}
        onDragEnd={draggable ? handleDragEnd : undefined}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
          active
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${
          draggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        title={draggable ? `拖拽到电影卡片上：${children}` : undefined}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* 筛选区域 - 行内布局 */}
      <div className="space-y-4">
        {/* 观看状态筛选 */}
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">观看状态</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.status === 'all'}
              onClick={() => onFilterChange({ status: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.status === 'watched'}
              onClick={() => onFilterChange({ status: 'watched' })}
            >
              已看过
            </FilterButton>
            <FilterButton
              active={filters.status === 'want_to_watch'}
              onClick={() => onFilterChange({ status: 'want_to_watch' })}
            >
              想看
            </FilterButton>
          </div>
        </div>

        {/* 媒体类型 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">类型</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.mediaType === 'all'}
              onClick={() => onFilterChange({ mediaType: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'movie'}
              onClick={() => handleFilterClick('mediaType', 'movie')}
            >
              电影
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'tv'}
              onClick={() => handleFilterClick('mediaType', 'tv')}
            >
              电视剧
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'animation_movie'}
              onClick={() => handleFilterClick('mediaType', 'animation_movie')}
            >
              动画电影
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'live_action_movie'}
              onClick={() => handleFilterClick('mediaType', 'live_action_movie')}
            >
              真人电影
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'documentary'}
              onClick={() => handleFilterClick('mediaType', 'documentary')}
            >
              纪录片
            </FilterButton>
            <FilterButton
              active={filters.mediaType === 'animation'}
              onClick={() => handleFilterClick('mediaType', 'animation')}
            >
              动漫剧集
            </FilterButton>
          </div>
        </div>

        {/* 地区 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">地区</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.region === 'all'}
              onClick={() => onFilterChange({ region: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.region === '中国大陆'}
              onClick={() => handleFilterClick('region', '中国大陆')}
            >
              中国大陆
            </FilterButton>
            <FilterButton
              active={filters.region === '中国香港'}
              onClick={() => handleFilterClick('region', '中国香港')}
            >
              中国香港
            </FilterButton>
            <FilterButton
              active={filters.region === '中国台湾'}
              onClick={() => handleFilterClick('region', '中国台湾')}
            >
              中国台湾
            </FilterButton>
            <FilterButton
              active={filters.region === '美国'}
              onClick={() => handleFilterClick('region', '美国')}
            >
              美国
            </FilterButton>
            <FilterButton
              active={filters.region === '日本'}
              onClick={() => handleFilterClick('region', '日本')}
            >
              日本
            </FilterButton>
            <FilterButton
              active={filters.region === '韩国'}
              onClick={() => handleFilterClick('region', '韩国')}
            >
              韩国
            </FilterButton>
            <FilterButton
              active={filters.region === '法国'}
              onClick={() => handleFilterClick('region', '法国')}
            >
              法国
            </FilterButton>
            <FilterButton
              active={filters.region === '意大利'}
              onClick={() => handleFilterClick('region', '意大利')}
            >
              意大利
            </FilterButton>
            <FilterButton
              active={filters.region === '德国'}
              onClick={() => handleFilterClick('region', '德国')}
            >
              德国
            </FilterButton>
            <FilterButton
              active={filters.region === '印度'}
              onClick={() => handleFilterClick('region', '印度')}
            >
              印度
            </FilterButton>
            <FilterButton
              active={filters.region === '泰国'}
              onClick={() => handleFilterClick('region', '泰国')}
            >
              泰国
            </FilterButton>
            <FilterButton
              active={filters.region === '英国'}
              onClick={() => handleFilterClick('region', '英国')}
            >
              英国
            </FilterButton>
          </div>
        </div>

        {/* 题材 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">题材</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.genre === 'all'}
              onClick={() => onFilterChange({ genre: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.genre === 'action'}
              onClick={() => handleFilterClick('genre', 'action')}
              draggable={true}
              tag="动作"
              categoryId="genre"
            >
              动作
            </FilterButton>
            <FilterButton
              active={filters.genre === 'comedy'}
              onClick={() => handleFilterClick('genre', 'comedy')}
              draggable={true}
              tag="喜剧"
              categoryId="genre"
            >
              喜剧
            </FilterButton>
            <FilterButton
              active={filters.genre === 'drama'}
              onClick={() => handleFilterClick('genre', 'drama')}
              draggable={true}
              tag="剧情"
              categoryId="genre"
            >
              剧情
            </FilterButton>
            <FilterButton
              active={filters.genre === 'thriller'}
              onClick={() => handleFilterClick('genre', 'thriller')}
              draggable={true}
              tag="惊悚"
              categoryId="genre"
            >
              惊悚
            </FilterButton>
            <FilterButton
              active={filters.genre === 'horror'}
              onClick={() => handleFilterClick('genre', 'horror')}
              draggable={true}
              tag="恐怖"
              categoryId="genre"
            >
              恐怖
            </FilterButton>
            <FilterButton
              active={filters.genre === 'romance'}
              onClick={() => handleFilterClick('genre', 'romance')}
              draggable={true}
              tag="爱情"
              categoryId="genre"
            >
              爱情
            </FilterButton>
            <FilterButton
              active={filters.genre === 'science_fiction'}
              onClick={() => handleFilterClick('genre', 'science_fiction')}
              draggable={true}
              tag="科幻"
              categoryId="genre"
            >
              科幻
            </FilterButton>
            <FilterButton
              active={filters.genre === 'fantasy'}
              onClick={() => handleFilterClick('genre', 'fantasy')}
              draggable={true}
              tag="奇幻"
              categoryId="genre"
            >
              奇幻
            </FilterButton>
            <FilterButton
              active={filters.genre === 'crime'}
              onClick={() => handleFilterClick('genre', 'crime')}
              draggable={true}
              tag="犯罪"
              categoryId="genre"
            >
              犯罪
            </FilterButton>
            <FilterButton
              active={filters.genre === 'war'}
              onClick={() => handleFilterClick('genre', 'war')}
              draggable={true}
              tag="战争"
              categoryId="genre"
            >
              战争
            </FilterButton>
          </div>
        </div>

        {/* 上映时间 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">上映时间</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.year === 'all'}
              onClick={() => onFilterChange({ year: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.year === '2020s'}
              onClick={() => handleFilterClick('year', '2020s')}
            >
              2020年代
            </FilterButton>
            <FilterButton
              active={filters.year === '2010s'}
              onClick={() => handleFilterClick('year', '2010s')}
            >
              2010年代
            </FilterButton>
            <FilterButton
              active={filters.year === '2000s'}
              onClick={() => handleFilterClick('year', '2000s')}
            >
              2000年代
            </FilterButton>
            <FilterButton
              active={filters.year === '1990s'}
              onClick={() => handleFilterClick('year', '1990s')}
            >
              1990年代
            </FilterButton>
            <FilterButton
              active={filters.year === '1980s'}
              onClick={() => handleFilterClick('year', '1980s')}
            >
              1980年代
            </FilterButton>
            <FilterButton
              active={filters.year === '1970s'}
              onClick={() => handleFilterClick('year', '1970s')}
            >
              1970年代
            </FilterButton>
            <FilterButton
              active={filters.year === '1960s'}
              onClick={() => handleFilterClick('year', '1960s')}
            >
              1960年代
            </FilterButton>
            <FilterButton
              active={filters.year === 'other'}
              onClick={() => handleFilterClick('year', 'other')}
            >
              其他
            </FilterButton>
          </div>
        </div>

        {/* 背景时间 */}
        <div className="flex items-start gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0 pt-2">背景时间</h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.backgroundTime === 'all'}
              onClick={() => onFilterChange({ backgroundTime: 'all' })}
            >
              全部
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '唐'}
              onClick={() => handleFilterClick('backgroundTime', '唐')}
              draggable={true}
              tag="唐"
              categoryId="background_time"
            >
              唐
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '宋'}
              onClick={() => handleFilterClick('backgroundTime', '宋')}
              draggable={true}
              tag="宋"
              categoryId="background_time"
            >
              宋
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '明'}
              onClick={() => handleFilterClick('backgroundTime', '明')}
              draggable={true}
              tag="明"
              categoryId="background_time"
            >
              明
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '清'}
              onClick={() => handleFilterClick('backgroundTime', '清')}
              draggable={true}
              tag="清"
              categoryId="background_time"
            >
              清
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '18世纪'}
              onClick={() => handleFilterClick('backgroundTime', '18世纪')}
              draggable={true}
              tag="18世纪"
              categoryId="background_time"
            >
              18世纪
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1900s'}
              onClick={() => handleFilterClick('backgroundTime', '1900s')}
              draggable={true}
              tag="1900s"
              categoryId="background_time"
            >
              1900s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1920s'}
              onClick={() => handleFilterClick('backgroundTime', '1920s')}
              draggable={true}
              tag="1920s"
              categoryId="background_time"
            >
              1920s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1930s'}
              onClick={() => handleFilterClick('backgroundTime', '1930s')}
              draggable={true}
              tag="1930s"
              categoryId="background_time"
            >
              1930s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1940s'}
              onClick={() => handleFilterClick('backgroundTime', '1940s')}
              draggable={true}
              tag="1940s"
              categoryId="background_time"
            >
              1940s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1960s'}
              onClick={() => handleFilterClick('backgroundTime', '1960s')}
              draggable={true}
              tag="1960s"
              categoryId="background_time"
            >
              1960s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1970s'}
              onClick={() => handleFilterClick('backgroundTime', '1970s')}
              draggable={true}
              tag="1970s"
              categoryId="background_time"
            >
              1970s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1980s'}
              onClick={() => handleFilterClick('backgroundTime', '1980s')}
              draggable={true}
              tag="1980s"
              categoryId="background_time"
            >
              1980s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '1990s'}
              onClick={() => handleFilterClick('backgroundTime', '1990s')}
              draggable={true}
              tag="1990s"
              categoryId="background_time"
            >
              1990s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '2000s'}
              onClick={() => handleFilterClick('backgroundTime', '2000s')}
              draggable={true}
              tag="2000s"
              categoryId="background_time"
            >
              2000s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '2010s'}
              onClick={() => handleFilterClick('backgroundTime', '2010s')}
              draggable={true}
              tag="2010s"
              categoryId="background_time"
            >
              2010s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '2020s'}
              onClick={() => handleFilterClick('backgroundTime', '2020s')}
              draggable={true}
              tag="2020s"
              categoryId="background_time"
            >
              2020s
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '近未来'}
              onClick={() => handleFilterClick('backgroundTime', '近未来')}
              draggable={true}
              tag="近未来"
              categoryId="background_time"
            >
              近未来
            </FilterButton>
            <FilterButton
              active={filters.backgroundTime === '无背景时间'}
              onClick={() => handleFilterClick('backgroundTime', '无背景时间')}
              draggable={true}
              tag="无背景时间"
              categoryId="background_time"
            >
              无背景时间
            </FilterButton>
          </div>
        </div>

        {/* 关键词搜索 */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">
            关键词搜索
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
            placeholder="输入电影标题关键词..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-md"
            disabled={loading}
          />
        </div>

        {/* 排序方式 */}
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">排序方式</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'updated_at', label: '最近更新' },
              { value: 'title', label: '标题排序' },
              { value: 'rating', label: '评分排序' },
              { value: 'year', label: '年份排序' }
            ].map((sort) => (
              <FilterButton
                key={sort.value}
                active={filters.sortBy === sort.value}
                onClick={() => onFilterChange({ sortBy: sort.value })}
                disabled={loading}
              >
                {sort.label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* 筛选模式切换 */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 min-w-16 flex-shrink-0">筛选模式</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!autoFilter ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>手动</span>
              <button
                onClick={() => handleAutoFilterToggle(!autoFilter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  autoFilter ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  autoFilter ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`text-sm ${autoFilter ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>自动</span>
            </div>
            <span className="text-xs text-gray-500">
              {autoFilter ? '筛选条件变化时自动应用' : '点击筛选条件后需手动刷新'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiFilterPanel;