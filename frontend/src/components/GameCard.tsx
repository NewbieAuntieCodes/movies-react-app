import React from 'react';
import { Game } from '../types';
import { getGameImageUrl, getGameYear } from '../services/api';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const year = getGameYear(game.released);
  
  // 处理平台信息
  const platforms = game.platforms?.slice(0, 3).map(p => p.platform.name).join(', ') || '暂无平台信息';
  
  // 处理类型信息
  const genres = game.genres?.slice(0, 3).map(g => g.name).join(', ') || '暂无分类';
  
  // 处理开发商信息
  const developers = game.developers?.slice(0, 2).map(d => d.name).join(', ') || '暂无开发商信息';
  
  // 处理简介，限制字数
  const maxChars = 100;
  const truncatedDescription = game.description_raw && game.description_raw.length > maxChars 
    ? game.description_raw.substring(0, maxChars) + '...' 
    : game.description_raw || '暂无简介';

  // 获取评级颜色
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 2) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      <div className="relative">
        <img
          src={getGameImageUrl(game.background_image)}
          alt={game.name}
          className="w-full h-48 object-cover bg-gray-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x300/cccccc/666666?text=加载失败';
          }}
        />
        {/* 评分显示在右上角 */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-bold">
          ⭐ {game.rating.toFixed(1)}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {game.name}
        </h3>
        
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          <div>发布时间: {year}</div>
          <div>平台: {platforms}</div>
          <div className="text-blue-600">类型: {genres}</div>
          {developers !== '暂无开发商信息' && <div>开发商: {developers}</div>}
        </div>

        <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-4">
          {truncatedDescription}
        </p>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(game.rating)}`}>
            评分: {game.rating.toFixed(1)}/5
          </div>
          
          {game.metacritic && (
            <div className="inline-block bg-purple-400 text-white px-2 py-1 rounded text-xs font-bold">
              Metacritic {game.metacritic}
            </div>
          )}
        </div>

        {/* 评价数量 */}
        {game.ratings_count > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            基于 {game.ratings_count.toLocaleString()} 个评价
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCard;