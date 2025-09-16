import React, { useState, useEffect } from 'react';

interface TagCategory {
  id: string;
  name: string;
  tags: string[];
  color: string;
}

interface TagManagementPanelProps {
  movies: any[];
}

const TagManagementPanel: React.FC<TagManagementPanelProps> = ({ movies }) => {
  const [customTagInputs, setCustomTagInputs] = useState<{[key: string]: string}>({});

  const getInitialTags = (): TagCategory[] => {
    const defaultTags = [
      {
        id: 'background_time',
        name: '背景时间',
        color: 'bg-blue-100 text-blue-800',
        tags: [
          '唐', '宋', '明', '清', '18世纪', '1900s', '1920s', '1930s',
          '1940s', '1960s', '1970s', '1980s', '1990s', '2000s',
          '2010s', '2020s', '近未来'
        ]
      },
      {
        id: 'genre',
        name: '题材',
        color: 'bg-purple-100 text-purple-800',
        tags: [
          '古装', '仙侠', '武侠', '现代都市', '历史', '战争', '悬疑',
          '爱情', '喜剧', '家庭', '校园', '职场', '医疗', '律政',
          '犯罪', '科幻', '奇幻', '恐怖', '动作', '冒险'
        ]
      }
    ];

    const saved = localStorage.getItem('availableTags');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved tags:', e);
      }
    }
    return defaultTags;
  };

  const [availableTags, setAvailableTags] = useState<TagCategory[]>(getInitialTags);

  useEffect(() => {
    localStorage.setItem('availableTags', JSON.stringify(availableTags));
  }, [availableTags]);

  const handleAddTag = (newTag: string, targetCategoryId?: string) => {
    if (!newTag.trim()) return;

    setAvailableTags(prev =>
      prev.map(category => {
        // 如果指定了目标分类，只添加到该分类
        if (targetCategoryId && category.id !== targetCategoryId) {
          return category;
        }

        const updatedTags = [...category.tags];
        if (!updatedTags.includes(newTag.trim())) {
          updatedTags.push(newTag.trim());
        }
        return { ...category, tags: updatedTags };
      })
    );
  };

  const handleQuickTagAdd = (tag: string) => {
    // 快速添加功能已移除，直接拖拽到电影卡片即可
  };

  const handleDragStart = (e: React.DragEvent, tag: string, categoryId: string) => {
    const dragData = {
      categoryId: categoryId,
      tag: tag
    };
    console.log('Drag start - setting data:', dragData);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-72 bg-white rounded-lg shadow-md p-4 h-fit sticky top-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">标签管理</h3>

      {/* 标签分类显示 */}
      <div className="space-y-4">
        {availableTags.map(category => (
          <div key={category.id} className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${category.color}`}>
                {category.name}
              </span>
            </h4>
            <div className="flex gap-1 flex-wrap">
              {category.tags.map(tag => (
                <button
                  key={tag}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tag, category.id)}
                  className={`px-2 py-1 rounded text-xs hover:opacity-80 transition-all cursor-move ${category.color.replace('100', '200')} hover:scale-105`}
                  title={`拖拽到电影卡片上：${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* 自定义标签输入 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            添加自定义标签
          </h4>
          {availableTags.map(category => (
            <div key={category.id} className="mb-3">
              <label className="text-xs text-gray-600 mb-1 block">
                添加到 {category.name}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInputs[category.id] || ''}
                  onChange={(e) => setCustomTagInputs(prev => ({
                    ...prev,
                    [category.id]: e.target.value
                  }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const inputValue = customTagInputs[category.id]?.trim();
                      if (inputValue) {
                        handleAddTag(inputValue, category.id);
                        setCustomTagInputs(prev => ({
                          ...prev,
                          [category.id]: ''
                        }));
                      }
                    }
                  }}
                  placeholder={`输入${category.name}标签`}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const inputValue = customTagInputs[category.id]?.trim();
                    if (inputValue) {
                      handleAddTag(inputValue, category.id);
                      setCustomTagInputs(prev => ({
                        ...prev,
                        [category.id]: ''
                      }));
                    }
                  }}
                  className={`px-3 py-1 text-white rounded text-xs hover:opacity-80 transition-colors ${category.color.replace('100', '500').replace('text-', 'bg-').split(' ')[0]}`}
                >
                  添加
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <span>总计: {movies.length} 部电影</span>
        </div>
      </div>
    </div>
  );
};

export default TagManagementPanel;