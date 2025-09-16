import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, WatchStatus, MovieEdit } from '../types';
import { getImageUrl, getMovieTitle, getMovieYear } from '../services/api';
import { watchStatusApi, movieEditApi } from '../services/api';

interface MovieCardProps {
  movie: Movie;
  onWatchStatusChange?: () => void;
  showDirectorCast?: boolean; // 是否显示导演和主演信息
  onCardClick?: () => void; // 新增：卡片点击回调
  movieEdit?: MovieEdit | null; // 外部传递的电影编辑数据
  onTagUpdate?: () => void; // 标签更新回调
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onWatchStatusChange, showDirectorCast = true, onCardClick, movieEdit: propMovieEdit, onTagUpdate }) => {
  const navigate = useNavigate();
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [movieEdit, setMovieEdit] = useState<MovieEdit | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false); // 标记是否为本地更新


  useEffect(() => {
    loadWatchStatus();
    if (isLocalUpdate) {
      // 如果是本地更新，不要覆盖状态
      setIsLocalUpdate(false);
      return;
    }
    if (!propMovieEdit) {
      loadMovieEdit();
    } else {
      setMovieEdit(propMovieEdit);
    }
  }, [movie.id, propMovieEdit, isLocalUpdate]);

  const loadWatchStatus = async () => {
    try {
      const status = await watchStatusApi.getByMovieId(movie.id);
      setWatchStatus(status);
    } catch (error) {
      console.log('获取观看状态失败:', error);
    }
  };

  const loadMovieEdit = async () => {
    try {
      console.log(`loadMovieEdit called for movie: ${getMovieTitle(movie)}`);
      const edit = await movieEditApi.getByMovieId(movie.id);
      console.log(`loadMovieEdit result:`, edit);
      setMovieEdit(edit);
    } catch (error) {
      console.log('获取电影编辑失败:', error);
    }
  };

  const parseTagString = (tagString: string): string[] => {
    if (!tagString || !tagString.trim()) return [];
    return tagString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  };

  const stringifyTags = (tags: string[]): string => {
    return tags.join(', ');
  };

  const handleTagDrop = async (categoryId: string, tag: string) => {
    try {
      console.log('handleTagDrop called with:', { categoryId, tag });
      // 处理背景时间和题材标签
      if (categoryId !== 'background_time' && categoryId !== 'genre') {
        console.log('Invalid category, returning');
        return;
      }

      // 获取当前标签
      const currentMovieEdit = movieEdit || await movieEditApi.getByMovieId(movie.id).catch(() => null);
      let currentTags: string[] = [];
      
      // 根据标签类型获取当前标签
      if (categoryId === 'background_time') {
        currentTags = parseTagString(currentMovieEdit?.custom_background_time || '');
      } else if (categoryId === 'genre') {
        currentTags = parseTagString(currentMovieEdit?.custom_genre || '');
      }

      // 如果标签已存在，不重复添加
      if (currentTags.includes(tag)) {
        return;
      }

      // 添加新标签
      const newTags = [...currentTags, tag];
      const tagString = stringifyTags(newTags);

      const editData: Partial<MovieEdit> = {
        movie_id: movie.id,
        movie_title: getMovieTitle(movie),
        // 保留现有的其他字段
        custom_background_time: currentMovieEdit?.custom_background_time || null,
        custom_genre: currentMovieEdit?.custom_genre || null,
      };

      // 根据标签类型设置相应字段
      if (categoryId === 'background_time') {
        editData.custom_background_time = tagString;
      } else if (categoryId === 'genre') {
        editData.custom_genre = tagString;
      }

      console.log('Creating movie edit with data:', editData);
      await movieEditApi.create(editData);

      // 直接更新本地状态，不依赖后端返回
      console.log('Setting movieEdit to:', editData);
      setIsLocalUpdate(true);
      setMovieEdit(editData as MovieEdit);
      console.log('MovieEdit state updated');

      // 重新加载电影编辑数据（如果后端修复后可以移除上面的直接更新）
      // await loadMovieEdit();

      // 通知父组件更新
      onTagUpdate?.();
    } catch (error) {
      console.error('添加标签失败:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drag over detected on movie:', getMovieTitle(movie));
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('Drag leave detected on movie:', getMovieTitle(movie));
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    console.log('=== Drop event triggered on movie card ===');
    console.log('Movie title:', getMovieTitle(movie));
    console.log('Movie ID:', movie.id);
    
    try {
      const rawData = e.dataTransfer.getData('application/json');
      console.log('Raw drag data:', rawData);
      
      if (!rawData) {
        console.log('No drag data found');
        return;
      }
      
      const dragData = JSON.parse(rawData);
      console.log('Parsed drag data:', dragData);
      const { categoryId, tag } = dragData;
      
      if (categoryId && tag) {
        console.log(`Dropping tag "${tag}" with category "${categoryId}"`);
        handleTagDrop(categoryId, tag);
      } else {
        console.log('Invalid drag data - missing categoryId or tag');
        console.log('categoryId:', categoryId);
        console.log('tag:', tag);
      }
    } catch (error) {
      console.error('处理拖放数据失败:', error);
    }
  };

  const handleStatusChange = async (status: 'watched' | 'want_to_watch') => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (watchStatus?.status === status) {
        // 如果点击的是当前状态，则移除状态
        await watchStatusApi.delete(movie.id);
        setWatchStatus(null);
      } else {
        // 否则设置新状态
        // 确保数据完整性
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
      setLoading(false);
    }
  };


  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFixMetadata = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (fixLoading || !watchStatus) return;

    setFixLoading(true);
    try {
      const result = await watchStatusApi.fixSingleMovieMetadata(movie.id);
      console.log('修复结果:', result);

      if (result.changes_count > 0) {
        console.log(`成功修复 ${result.changes_count} 项信息:`, result.changes);
      }

      // 重新加载观看状态以获取更新的所有信息
      await loadWatchStatus();

      // 通知父组件更新
      onWatchStatusChange?.();

      // 显示修复结果
      if (result.changes_count > 0) {
        alert(`修复成功！已更新 ${result.changes_count} 项信息`);
      } else {
        alert('当前信息已是最新，无需修复');
      }
    } catch (error: any) {
      console.error('修复电影信息失败:', error);
      const errorMessage = error.response?.data?.detail || error.message || '未知错误';
      alert(`修复失败: ${errorMessage}`);
    } finally {
      setFixLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string, categoryId: string) => {
    try {
      // 获取当前标签
      const currentMovieEdit = movieEdit || await movieEditApi.getByMovieId(movie.id).catch(() => null);
      if (!currentMovieEdit) return;

      let currentTags: string[] = [];
      
      // 根据标签类型获取当前标签
      if (categoryId === 'background_time') {
        currentTags = parseTagString(currentMovieEdit.custom_background_time || '');
      } else if (categoryId === 'genre') {
        currentTags = parseTagString(currentMovieEdit.custom_genre || '');
      }

      // 移除指定标签
      const newTags = currentTags.filter(tag => tag !== tagToRemove);
      const tagString = stringifyTags(newTags);

      const editData: Partial<MovieEdit> = {
        movie_id: movie.id,
        movie_title: getMovieTitle(movie),
        // 保留现有的其他字段
        custom_background_time: currentMovieEdit?.custom_background_time || null,
        custom_genre: currentMovieEdit?.custom_genre || null,
      };

      // 根据标签类型设置相应字段
      if (categoryId === 'background_time') {
        editData.custom_background_time = tagString;
      } else if (categoryId === 'genre') {
        editData.custom_genre = tagString;
      }

      await movieEditApi.create(editData);

      // 直接更新本地状态，不依赖后端返回
      setIsLocalUpdate(true);
      setMovieEdit(editData as MovieEdit);

      // 重新加载电影编辑数据（如果后端修复后可以移除上面的直接更新）
      // await loadMovieEdit();

      // 通知父组件更新
      onTagUpdate?.();
    } catch (error) {
      console.error('删除标签失败:', error);
    }
  };

  const getStatusButtonClass = (status: 'watched' | 'want_to_watch') => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium transition-colors duration-200';
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

  const title = getMovieTitle(movie);
  const year = getMovieYear(movie);
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  const mediaTypeText = mediaType === 'movie' ? '电影' : '电视剧';

  
  // 显示时间：优先显示自定义背景时间，否则显示原上映时间
  const displayTime = movieEdit?.custom_background_time || year;

  // 处理类型信息 - 优先显示自定义题材
  let genreText = '';

  
  // 优先显示自定义题材
  if (movieEdit?.custom_genre) {
    genreText = movieEdit.custom_genre;
  } else if (movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0) {
    // 检查genres是否为对象数组（有name属性）或数字数组
    if (typeof movie.genres[0] === 'object' && (movie.genres[0] as any).name) {
      genreText = movie.genres.slice(0, 3).map((g: any) => g.name).join(', ');
    } else if (typeof movie.genres[0] === 'number') {
      // 如果是数字数组（genre IDs），则转换为文字
      const genreMap: { [key: number]: string } = {
        28: '动作', 12: '冒险', 16: '动画', 35: '喜剧', 80: '犯罪',
        99: '纪录片', 18: '剧情', 10751: '家庭', 14: '奇幻', 36: '历史',
        27: '恐怖', 10402: '音乐', 9648: '悬疑', 10749: '爱情', 878: '科幻',
        10770: '电视电影', 53: '惊悚', 10752: '战争', 37: '西部'
      };
      genreText = (movie.genres as unknown as number[]).slice(0, 3).map((id: number) => genreMap[id] || `类型${id}`).join(', ');
    }
  }


  // 处理制作国家信息
  let countryText = '';
  if (movie.production_countries && movie.production_countries.length > 0) {
    countryText = movie.production_countries.slice(0, 2).map(c => c.name).join(', ');
  }

  // 处理简介，限制在3行
  const maxChars = 75;
  const truncatedOverview = movie.overview && movie.overview.length > maxChars 
    ? movie.overview.substring(0, maxChars) + '...' 
    : movie.overview || '暂无简介';

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${
        isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' : ''
      }`}
      onClick={handleCardClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="relative">
        <img
          src={getImageUrl(movie.poster_path)}
          alt={title}
          className="w-full h-80 object-cover bg-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750/cccccc/666666?text=加载失败';
          }}
        />
        {/* 原上映时间和原题材小字显示在左上角 */}
        {(movieEdit?.custom_background_time || movieEdit?.custom_genre) && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs space-y-1">
            {movieEdit?.custom_background_time && (
              <div>上映: {year}</div>
            )}
            {movieEdit?.custom_genre && movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0 && (
              <div>原题材: {
                typeof movie.genres[0] === 'object' && (movie.genres[0] as any).name 
                  ? movie.genres.slice(0, 2).map((g: any) => g.name).join(', ')
                  : '剧情, Sci-Fi & Fantasy'
              }</div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          <div>类型: {mediaTypeText}</div>
          {!movieEdit?.custom_background_time && (
            <div>上映: {displayTime}</div>
          )}
          {countryText && <div>出品: {countryText}</div>}
          {showDirectorCast && movie.director && <div className="text-purple-600">导演: {movie.director}</div>}
          {showDirectorCast && movie.cast && <div className="text-green-600">主演: {movie.cast}</div>}
          
          {/* 可删除的自定义标签显示 */}
          {movieEdit?.custom_background_time && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500">背景时间:</span>
              {parseTagString(movieEdit.custom_background_time).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag, 'background_time');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs leading-none"
                    title={`删除标签: ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 题材标签显示区域 - 紧跟在背景时间后面 */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-500">题材:</span>
            {console.log(`Rendering genre for ${title}: movieEdit?.custom_genre =`, movieEdit?.custom_genre)}
            {movieEdit?.custom_genre ? (
              // 显示自定义题材标签
              parseTagString(movieEdit.custom_genre).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(tag, 'genre');
                    }}
                    className="text-purple-600 hover:text-purple-800 font-bold text-xs leading-none"
                    title={`删除标签: ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              // 显示原始题材
              genreText && (
                <span className="text-xs text-gray-600">{genreText}</span>
              )
            )}
          </div>
        </div>


        <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-3">
          {truncatedOverview}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              handleButtonClick(e);
              handleStatusChange('watched');
            }}
            disabled={loading}
            className={getStatusButtonClass('watched')}
          >
            ✓ 已看过
          </button>
          
          <button
            onClick={(e) => {
              handleButtonClick(e);
              handleStatusChange('want_to_watch');
            }}
            disabled={loading}
            className={getStatusButtonClass('want_to_watch')}
          >
            ★ 想看
          </button>
          
          {watchStatus && (
            <button
              onClick={handleFixMetadata}
              disabled={fixLoading}
              className="px-2 py-1 rounded text-xs font-medium transition-colors duration-200 bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
              title="修复电影信息（导演、主演、题材、制作国家等）"
            >
              {fixLoading ? '修复中...' : '🔧 修复'}
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default MovieCard;