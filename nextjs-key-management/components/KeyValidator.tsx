'use client';

import React, { useState } from 'react';

const KeyValidator = () => {
  const [key, setKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateKey = async () => {
    if (!key.trim()) {
      setError('请输入密钥');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/keys/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: key.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('验证失败，请重试');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setKey('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">密钥验证</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            密钥
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入要验证的密钥"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={validateKey}
            disabled={loading}
            className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                验证中...
              </span>
            ) : '验证密钥'}
          </button>
          
          <button
            onClick={resetForm}
            className="flex-1 min-w-[100px] bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            重置
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          错误: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <h3 className="font-bold text-green-800">验证成功!</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <p><span className="font-medium text-gray-700">密钥类型:</span> <span className="ml-1">{result.keyType}</span></p>
            <p><span className="font-medium text-gray-700">创建时间:</span> <span className="ml-1">{new Date(result.createdAt).toLocaleString('zh-CN')}</span></p>
            <p><span className="font-medium text-gray-700">有效期:</span> <span className="ml-1">{result.expiresAt ? new Date(result.expiresAt).toLocaleString('zh-CN') : '无限制'}</span></p>
            <p><span className="font-medium text-gray-700">使用情况:</span> <span className="ml-1">{result.usedCount} / {result.maxUses === -1 ? '无限制' : result.maxUses}</span></p>
            <p><span className="font-medium text-gray-700">使用人:</span> <span className="ml-1">{result.user || '未指定'}</span></p>
            <p><span className="font-medium text-gray-700">生成参数:</span> <span className="ml-1 font-mono text-xs break-all">{JSON.stringify(result.originalParams)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyValidator;