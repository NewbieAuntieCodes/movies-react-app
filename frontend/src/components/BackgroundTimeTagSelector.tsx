import React, { useState } from 'react';

interface BackgroundTimeTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onClose: () => void;
}

const BackgroundTimeTagSelector: React.FC<BackgroundTimeTagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  onClose
}) => {
  const [customTag, setCustomTag] = useState('');

  // 预设标签分类
  const tagCategories = {
    '朝代': [
      '春秋战国', '秦汉', '魏晋南北朝', '唐', '宋', 
      '元', '明', '清', '民国', '新中国'
    ],
    '世纪': [
      '18世纪', '19世纪', '20世纪', '21世纪'
    ],
    '年代': [
      '1900s', '1910s', '1920s', '1930s', '1940s', '1950s',
      '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'
    ],
    '时期': [
      '古代', '近代', '现代', '当代', '未来', '近未来',
      '史前', '中世纪', '文艺复兴', '工业革命'
    ],
    '人生阶段': [
      '童年', '少年', '青年', '中年', '老年',
      '从小到大', '成长期', '学生时代'
    ],
    '特殊背景': [
      '战争时期', '和平年代', '经济危机', '繁荣时期',
      '革命时代', '改革开放', '新时代'
    ]
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onTagsChange([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">选择背景时间标签</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* 已选标签 */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">已选择：</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 标签分类 */}
        {Object.entries(tagCategories).map(([category, tags]) => (
          <div key={category} className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{category}：</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 自定义标签 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">自定义标签：</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="输入自定义时间标签"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomTag();
                }
              }}
            />
            <button
              onClick={handleAddCustomTag}
              className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            >
              添加
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={() => onTagsChange([])}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
          >
            清空所有
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTimeTagSelector;