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
      return `已使用 ${key.usedCount} 次`;
    }
    return `${key.usedCount}/${key.maxUses}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('密钥已复制到剪贴板！');
    setTimeout(() => setSuccess(null), 3000);
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

  // 筛选有效和无效的密钥
  const activeKeys = keys.filter(key => {
    if (!key.isActive) return false;
    
    // 检查是否过期
    if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
      return false;
    }
    
    // 检查是否达到使用次数限制
    if (key.maxUses !== -1 && key.usedCount >= key.maxUses) {
      return false;
    }
    
    return true;
  });
  
  const inactiveKeys = keys.filter(key => !activeKeys.includes(key));

  if (error) {
    return <div className="text-red-500 p-4">错误: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 成功消息显示区域 */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 密钥生成表单 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-800">生成新密钥</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密钥类型 *
              </label>
              <select
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">请选择密钥类型</option>
                {predefinedKeyTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
                <option value="custom">自定义类型</option>
              </select>
              {keyType === 'custom' && (
                <input
                  type="text"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入自定义密钥类型"
                />
              )}
              <p className="mt-1 text-xs text-gray-500">选择或输入密钥用途，如国开大学-pro、国开大学-刷题等</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                有效期 (可选)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">密钥过期时间，留空表示永不过期</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                使用次数 (-1表示无限制)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="-1"
                placeholder="-1表示无限制"
              />
              <p className="mt-1 text-xs text-gray-500">密钥可使用次数，-1表示无限制</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生成参数 (可选)
              </label>
              <input
                type="text"
                value={originalParams}
                onChange={(e) => setOriginalParams(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如: 231312+郭减"
              />
              <p className="mt-1 text-xs text-gray-500">用于生成密钥的参数（支持纯字符串或JSON格式）</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                使用人 (可选)
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="使用人姓名或标识"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              生成密钥
            </button>
          </form>
        </div>

        {/* 密钥列表 */}
        <div className="space-y-6">
          {/* 有效密钥列表 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">有效密钥 ({activeKeys.length})</h2>
              <button 
                onClick={fetchKeys}
                className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors"
              >
                刷新
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : activeKeys.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                暂无有效密钥
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">密钥</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用情况</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeKeys.map((key) => (
                      <tr key={key.id} className="text-sm hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-mono text-xs break-all max-w-[120px]">{key.key.substring(0, 15)}...</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{key.keyType}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{getUsageStatus(key)}</div>
                          <div className="text-xs text-gray-500">
                            有效期: {formatDate(key.expiresAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                              title="复制密钥"
                            >
                              复制
                            </button>
                            <button
                              onClick={() => updateKeyStatus(key.id, false)}
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                              title="禁用密钥"
                            >
                              禁用
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

          {/* 无效密钥列表 */}
          {inactiveKeys.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">无效密钥 ({inactiveKeys.length})</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">密钥</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inactiveKeys.map((key) => {
                      let status = '未知';
                      if (!key.isActive) status = '已禁用';
                      else if (key.expiresAt && new Date() > new Date(key.expiresAt)) status = '已过期';
                      else if (key.maxUses !== -1 && key.usedCount >= key.maxUses) status = '已达使用次数上限';
                      
                      return (
                        <tr key={key.id} className="text-sm hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-gray-900 font-mono text-xs break-all max-w-[120px]">{key.key.substring(0, 15)}...</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{key.keyType}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                {status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => updateKeyStatus(key.id, true)}
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                              title="启用密钥"
                            >
                              启用
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyManagement;