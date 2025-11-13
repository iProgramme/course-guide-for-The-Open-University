'use client';

import React, { useState, useEffect } from 'react';
import { apiKeys } from '@/drizzle/schema';

interface ApiKey {
  id: number;
  key: string;
  keyType: string;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  originalParams: any;
  user: string;
  isActive: boolean;
}

const KeyManagement = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 表单状态
  const [keyType, setKeyType] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('-1'); // 默认无限制
  const [originalParams, setOriginalParams] = useState('');
  const [user, setUser] = useState('');

  // 预定义的密钥类型选项
  const predefinedKeyTypes = [
    '国开大学-pro',
    '国开大学-刷题',
    '国开大学-基础版2级',
    '国开大学-基础版3级',
    '其他系统-pro',
    '其他系统-刷题',
    '其他系统-基础版'
  ];

  // 加载密钥列表
  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/keys');
      const data = await response.json();
      
      if (data.success) {
        setKeys(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('获取密钥列表失败');
      console.error('Error fetching keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 不验证JSON格式，直接存储原始字符串
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyType,
          expiresAt: expiresAt || null,
          maxUses: parseInt(maxUses),
          originalParams: originalParams || null, // 直接使用输入的字符串
          user,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重置表单
        setKeyType('');
        setExpiresAt('');
        setMaxUses('-1');
        setOriginalParams('');
        setUser('');
        
        // 刷新密钥列表
        await fetchKeys();
        
        // 显示成功消息，包括新生成的密钥
        setSuccess(`密钥生成成功！密钥为: ${result.data.key}`);
        setTimeout(() => setSuccess(null), 10000); // 10秒后清除成功消息
      } else {
        // 如果是密钥已存在的错误，显示更详细的状态信息
        setError(result.error);
      }
    } catch (err) {
      setError('生成密钥失败');
      console.error('Error creating key:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无限制';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getUsageStatus = (key: ApiKey) => {
    if (key.maxUses === -1) {
      return `${key.usedCount} 次`;
    }
    return `${key.usedCount}/${key.maxUses}`;
  };

  // 状态用于跟踪是否正在编辑某个密钥
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editingKeyType, setEditingKeyType] = useState('');
  const [editingExpiresAt, setEditingExpiresAt] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('密钥已复制到剪贴板！');
    setTimeout(() => setSuccess(null), 3000);
  };

  // 修改密钥信息的函数
  const updateKeyInfo = async (id: number) => {
    try {
      const response = await fetch('/api/keys/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          keyType: editingKeyType,
          expiresAt: editingExpiresAt || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('密钥信息更新成功！');
        setEditingKeyId(null);
        fetchKeys(); // 刷新列表
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('更新密钥信息失败');
      console.error('Update key info error:', err);
    }
  };

  // 开始编辑密钥
  const startEditing = (key: ApiKey) => {
    setEditingKeyId(key.id);
    setEditingKeyType(key.keyType);
    setEditingExpiresAt(key.expiresAt || '');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingKeyId(null);
    setEditingKeyType('');
    setEditingExpiresAt('');
  };

  const updateKeyStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/keys/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isActive }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.data.message);
        fetchKeys(); // 刷新列表
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('更新密钥状态失败');
      console.error('Update status error:', err);
    }
  };

  const [activeTab, setActiveTab] = useState<'list' | 'generate'>('list'); // 新增选项卡状态
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all'); // 新增筛选状态
  const [searchQuery, setSearchQuery] = useState(''); // 新增搜索状态

  // 筛选密钥
  const filteredKeys = keys.filter(key => {
    // 根据状态筛选
    if (filter === 'active') {
      // 有效密钥：isActive为true，且不过期，且未达到使用次数限制
      if (!key.isActive) return false;
      if (key.expiresAt && new Date() > new Date(key.expiresAt)) return false;
      if (key.maxUses !== -1 && key.usedCount >= key.maxUses) return false;
    } else if (filter === 'inactive') {
      // 无效密钥：isActive为false，或已过期，或已达到使用次数限制
      if (key.isActive && 
          !(key.expiresAt && new Date() > new Date(key.expiresAt)) && 
          !(key.maxUses !== -1 && key.usedCount >= key.maxUses)) {
        return false;
      }
    }
    
    // 搜索查询 - 模糊匹配生成参数
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const paramValue = key.originalParams ? 
        (typeof key.originalParams === 'string' ? key.originalParams : JSON.stringify(key.originalParams)).toLowerCase() 
        : '';
      if (!paramValue.includes(query)) return false;
    }
    
    return true;
  });

  // 根据状态对密钥进行分类（用于显示状态）
  const getKeyStatus = (key: ApiKey) => {
    let status = '未知';
    let statusColor = 'bg-gray-100 text-gray-800';
    
    if (key.isActive) {
      // 检查是否过期或用完次数
      if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
        status = '已过期';
        statusColor = 'bg-red-100 text-red-800';
      } else if (key.maxUses !== -1 && key.usedCount >= key.maxUses) {
        status = '已达上限';
        statusColor = 'bg-orange-100 text-orange-800';
      } else {
        status = '有效';
        statusColor = 'bg-green-100 text-green-800';
      }
    } else {
      status = '已禁用';
      statusColor = 'bg-gray-100 text-gray-800';
    }
    
    return { status, statusColor };
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      
      {/* 选项卡按钮 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('list')}
        >
          密钥列表
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'generate'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('generate')}
        >
          生成密钥
        </button>
      </div>

      {/* 密钥列表选项卡 */}
      {activeTab === 'list' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 md:border-b-0 md:pb-0">密钥列表 (共 {filteredKeys.length} 个)</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 筛选按钮 */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'active', label: '有效密钥' },
                  { key: 'inactive', label: '无效密钥' },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`px-3 py-1.5 text-sm ${
                      filter === option.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setFilter(option.key as any)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={fetchKeys}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors whitespace-nowrap"
              >
                刷新
              </button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="通过生成参数搜索..."
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {loading && keys.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '未找到匹配的密钥' : '暂无密钥'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-32">密钥</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-amber-50 w-40">生成参数</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-28">类型</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-24">状态</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-36">生成时间</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-36">有效期</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-20">使用次数</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKeys.map((key) => {
                    const { status, statusColor } = getKeyStatus(key);
                    
                    return (
                      <tr key={key.id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td 
                          className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200 cursor-pointer"
                          onClick={() => copyToClipboard(key.key)}
                          title="点击复制密钥"
                        >
                          <div className="text-gray-900 font-mono text-xs break-all max-w-[120px] hover:text-blue-600">{key.key.substring(0, 15)}...</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200 bg-amber-50">
                          <div className="text-gray-900 text-xs break-all max-w-[100px]">
                            {key.originalParams ? (
                              typeof key.originalParams === 'string' ? key.originalParams : JSON.stringify(key.originalParams)
                            ) : '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                          {editingKeyId === key.id ? (
                            <input
                              type="text"
                              value={editingKeyType}
                              onChange={(e) => setEditingKeyType(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="密钥类型"
                            />
                          ) : (
                            <div className="text-gray-900 text-sm">{key.keyType}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                          <div className="text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColor} inline-block min-w-[60px] text-center`}>
                              {status}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                          <div className="text-gray-900 text-sm">{formatDate(key.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                          {editingKeyId === key.id ? (
                            <input
                              type="datetime-local"
                              value={editingExpiresAt ? editingExpiresAt.slice(0, 16) : ''}
                              onChange={(e) => setEditingExpiresAt(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-gray-900 text-sm">{formatDate(key.expiresAt)}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-gray-200">
                          <div className="text-gray-900 text-sm">{getUsageStatus(key)}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {editingKeyId === key.id ? (
                              <>
                                <button
                                  onClick={() => updateKeyInfo(key.id)}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors duration-200"
                                  title="保存修改"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors duration-200"
                                  title="取消"
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditing(key)}
                                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded transition-colors duration-200"
                                  title="修改密钥"
                                >
                                  修改
                                </button>
                                <button
                                  onClick={() => updateKeyStatus(key.id, !key.isActive)}
                                  className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${
                                    key.isActive 
                                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                  title={key.isActive ? "禁用密钥" : "启用密钥"}
                                >
                                  {key.isActive ? "禁用" : "启用"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 生成密钥选项卡 */}
      {activeTab === 'generate' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b pb-3">生成新密钥</h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生成参数
              </label>
              <input
                type="text"
                value={originalParams}
                onChange={(e) => setOriginalParams(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="例如: 231312+郭减"
              />
              <p className="mt-1 text-xs text-gray-500">用于生成密钥的参数（支持纯字符串或JSON格式）</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密钥类型 *
              </label>
              <select
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">请选择密钥类型</option>
                {predefinedKeyTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
                <option value="custom">自定义类型</option>
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                有效期 (可选)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用次数 (-1表示无限制)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                min="-1"
                placeholder="-1表示无限制"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                使用人 (可选)
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="使用人姓名或标识"
              />
            </div>

            

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-sm"
              >
                生成密钥
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 成功消息显示区域 */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          {success}
        </div>
      )}
      {/* 失败消息显示区域 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default KeyManagement;