'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface KeyTypeConfig {
  id: number;
  keyType: string;
  maxAccounts: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface UsageInfo {
  activeAccounts: number;
  totalAccounts: number;
  maxAccounts: number;
  remainingAccounts: number;
  isExpired: boolean;
  daysUntilExpiry: number;
}

interface KeyTypeWithUsage {
  config: KeyTypeConfig;
  usage: UsageInfo;
}

const KeyTypeConfigManager = () => {
  const [configs, setConfigs] = useState<KeyTypeWithUsage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState({
    keyType: '',
    maxAccounts: 0,
    expiresAt: ''
  });
  const [editingConfig, setEditingConfig] = useState<KeyTypeConfig | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // 获取所有配置和使用情况
  const fetchConfigs = async (searchKey?: string) => {
    try {
      if (searchKey) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      let url = '/api/key-type-configs/usage';
      if (searchKey) {
        url = `/api/key-type-configs/usage?keyType=${encodeURIComponent(searchKey)}`;
      }

      const response = await fetch(url, {
        method: searchKey ? 'GET' : 'POST',
      });
      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        // 添加 isActive 默认值（如果服务器未返回）
        const configsWithActiveStatus = Array.isArray(data.data)
          ? data.data.map((item: any) => ({
              ...item,
              config: {
                ...item.config,
                isActive: item.config.isActive !== undefined ? item.config.isActive : true
              }
            }))
          : [{
              ...data.data,
              config: {
                ...data.data.config,
                isActive: data.data.config.isActive !== undefined ? data.data.config.isActive : true
              }
            }];
        setConfigs(configsWithActiveStatus);
      } else {
        setError(data.error || '获取配置失败');
      }
    } catch (err) {
      setError('网络错误，获取配置失败');
      console.error(err);
    } finally {
      if (searchKey) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewConfig(prev => ({
      ...prev,
      [name]: name === 'maxAccounts' ? parseInt(value) || 0 : value
    }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingConfig) {
      const { name, value } = e.target;
      setEditingConfig(prev => ({
        ...prev!,
        [name]: name === 'maxAccounts' ? parseInt(value) || prev!.maxAccounts : value
      }));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchConfigs(searchTerm.trim());
    } else {
      fetchConfigs();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newConfig.keyType || !newConfig.expiresAt) {
      setError('请填写所有字段');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/key-type-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      const data = await response.json();

      if (data.success) {
        setNewConfig({ keyType: '', maxAccounts: 0, expiresAt: '' });
        if (!searchTerm) {
          fetchConfigs(); // 重新获取配置
        } else {
          // 如果当前有搜索词，重新执行搜索
          fetchConfigs(searchTerm);
        }
      } else {
        setError(data.error || '添加配置失败');
      }
    } catch (err) {
      setError('网络错误，添加配置失败');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingConfig) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/key-type-configs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyType: editingConfig.keyType,
          maxAccounts: editingConfig.maxAccounts,
          expiresAt: editingConfig.expiresAt
        }),
      });
      const data = await response.json();

      if (data.success) {
        setEditingConfig(null);
        if (!searchTerm) {
          fetchConfigs(); // 重新获取配置
        } else {
          // 如果当前有搜索词，重新执行搜索
          fetchConfigs(searchTerm);
        }
      } else {
        setError(data.error || '更新配置失败');
      }
    } catch (err) {
      setError('网络错误，更新配置失败');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (keyType: string) => {
    if (!confirm(`确定要删除 ${keyType} 的配置吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await fetch('/api/key-type-configs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyType }),
      });
      const data = await response.json();

      if (data.success) {
        if (!searchTerm) {
          fetchConfigs(); // 重新获取配置
        } else {
          // 如果当前有搜索词，重新执行搜索
          fetchConfigs(searchTerm);
        }
      } else {
        setError(data.error || '删除配置失败');
      }
    } catch (err) {
      setError('网络错误，删除配置失败');
      console.error(err);
    }
  };

  const toggleStatus = async (config: KeyTypeConfig) => {
    if (!config.id) {
      setError('该配置不支持激活/禁用功能，请先更新数据库');
      return;
    }

    try {
      // 切换激活状态
      const response = await fetch(`/api/key-type-configs/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyType: config.keyType,
          isActive: !config.isActive
        }),
      });
      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setConfigs(prev => prev.map(item =>
          item.config.keyType === config.keyType
            ? { ...item, config: { ...item.config, isActive: !config.isActive } }
            : item
        ));
      } else {
        setError(data.error || '更新状态失败');
      }
    } catch (err) {
      setError('网络错误，更新状态失败');
      console.error(err);
    }
  };

  const startEditing = (config: KeyTypeConfig) => {
    setEditingConfig({...config});
  };

  const cancelEditing = () => {
    setEditingConfig(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">KeyType 配置管理</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('list')}
        >
          配置列表
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'add'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('add')}
        >
          添加配置
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'list' ? (
        <div>
          {/* 搜索栏 */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">搜索 KeyType</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="输入 keyType 进行搜索"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center disabled:opacity-50"
                >
                  {searchLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      搜索中...
                    </>
                  ) : '搜索'}
                </button>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    fetchConfigs();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  重置
                </button>
              </div>
            </form>
          </div>

          {/* 配置列表 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">配置列表</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : configs.length === 0 && !searchTerm ? (
                <p className="text-center text-gray-500 py-4">暂无配置</p>
              ) : configs.length === 0 && searchTerm ? (
                <p className="text-center text-gray-500 py-4">未找到匹配的配置</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KeyType</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账号上限</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活跃账号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总账号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩余账号</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {configs.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.config.keyType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.config.maxAccounts}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.usage.activeAccounts}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.usage.totalAccounts}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.usage.remainingAccounts}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.config.expiresAt), 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div>
                              <span className={item.config.isActive !== false ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                {item.config.isActive !== false ? '激活' : '禁用'}
                              </span>
                              <br />
                              <span className={item.usage.isExpired ? 'text-red-600 text-xs' : 'text-green-600 text-xs'}>
                                {item.usage.isExpired
                                  ? '已过期'
                                  : item.usage.daysUntilExpiry > 0
                                    ? `${item.usage.daysUntilExpiry}天后到期`
                                    : '即将到期'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="space-x-4">
                              <button
                                onClick={() => startEditing(item.config)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                修改
                              </button>
                              <button
                                onClick={() => toggleStatus(item.config)}
                                className={`${item.config.isActive !== false ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                disabled={!item.config.id} // 如果没有ID，说明可能还未完全支持isActive字段，禁用按钮
                              >
                                {item.config.isActive !== false ? '禁用' : '启用'}
                              </button>
                              <button
                                onClick={() => handleDelete(item.config.keyType)}
                                className="text-red-600 hover:text-red-900"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 添加配置 Tab */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">添加新配置</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KeyType</label>
                  <input
                    type="text"
                    name="keyType"
                    value={newConfig.keyType}
                    onChange={handleAddChange}
                    placeholder="输入 keyType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">账号上限</label>
                  <input
                    type="number"
                    name="maxAccounts"
                    value={newConfig.maxAccounts}
                    onChange={handleAddChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    value={newConfig.expiresAt}
                    onChange={handleAddChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {isAdding ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      添加中...
                    </>
                  ) : '添加配置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑配置表单（当有配置被选中编辑时显示） */}
      {editingConfig && (
        <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑配置</h3>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KeyType</label>
              <input
                type="text"
                name="keyType"
                value={editingConfig.keyType}
                onChange={handleEditChange}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号上限</label>
              <input
                type="number"
                name="maxAccounts"
                value={editingConfig.maxAccounts}
                onChange={handleEditChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={editingConfig.expiresAt.substring(0, 16)} // 格式化为本地时间格式
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-2 col-span-3 justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    更新中...
                  </>
                ) : '更新'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default KeyTypeConfigManager;