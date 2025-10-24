'use client';

import React, { useState } from 'react';

const BulkKeyGenerator = () => {
  const [keyType, setKeyType] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState('-1');
  const [originalParams, setOriginalParams] = useState('');
  const [userList, setUserList] = useState(''); // 用逗号分隔的用户列表
  const [quantity, setQuantity] = useState('1'); // 生成数量
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const generateBulkKeys = async () => {
    if (!keyType.trim()) {
      setError('请输入密钥类型');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('请输入有效的生成数量');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults([]);
      
      // 解析用户列表
      const users = userList ? userList.split(',').map(user => user.trim()).filter(user => user) : [];
      
      // 如果用户列表为空且数量大于1，生成虚拟用户名
      if (users.length === 0 && quantityNum > 1) {
        for (let i = 0; i < quantityNum; i++) {
          users.push(`用户${i + 1}`);
        }
      } else if (users.length === 0 && quantityNum === 1) {
        users.push(''); // 单个密钥可以没有用户
      }
      
      // 为每个用户生成一个密钥
      const generatedKeys = [];
      for (const user of users) {
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
            user: user || undefined,
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          generatedKeys.push(result.data);
        } else {
          setError(result.error);
          break;
        }
      }
      
      if (generatedKeys.length > 0) {
        setResults(generatedKeys);
      }
    } catch (err) {
      setError('批量生成密钥失败');
      console.error('Bulk generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('密钥已复制到剪贴板！');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">批量密钥生成</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生成数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              placeholder="要生成的密钥数量"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
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
          <p className="mt-1 text-xs text-gray-500">
            用于生成密钥的参数（支持纯字符串或JSON格式）
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            使用人列表 (用逗号分隔，可选)
          </label>
          <input
            type="text"
            value={userList}
            onChange={(e) => setUserList(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="例如: 张三,李四,王五"
          />
          <p className="mt-1 text-xs text-gray-500">
            如果不提供用户列表，将根据生成数量创建虚拟用户名
          </p>
        </div>
        
        <button
          onClick={generateBulkKeys}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              生成中...
            </span>
          ) : '批量生成密钥'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          错误: {error}
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">生成结果 ({results.length} 个密钥)</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {results.map((key, index) => (
              <div key={key.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">密钥 {index + 1}:</p>
                    <p className="text-sm font-mono break-all bg-white p-2 rounded my-2 border">{key.key}</p>
                    <div className="text-xs text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <p>类型: <span className="font-medium">{key.keyType}</span></p>
                      <p>用户: <span className="font-medium">{key.user || '未指定'}</span></p>
                      <p>有效期: <span className="font-medium">{key.expiresAt ? new Date(key.expiresAt).toLocaleString('zh-CN') : '无限制'}</span></p>
                      <p>使用次数: <span className="font-medium">{key.maxUses === -1 ? '无限制' : `${key.usedCount}/${key.maxUses}`}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(key.key)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkKeyGenerator;