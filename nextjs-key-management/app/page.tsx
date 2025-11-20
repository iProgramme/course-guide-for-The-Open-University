'use client';

import { useState, useEffect } from 'react';
import KeyManagement from '@/components/KeyManagement';
import BulkKeyGenerator from '@/components/BulkKeyGenerator';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'bulk'>('manage');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">密钥管理系统</h1>
            <button
              onClick={() => {
                // 清除会话并重定向到登录页
                document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                window.location.href = '/login';
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Tab 切换 */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-0">
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-6 text-center font-medium text-sm ${
                    activeTab === 'manage'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  密钥管理
                </button>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className={`py-4 px-6 text-center font-medium text-sm ${
                    activeTab === 'bulk'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  批量生成
                </button>
              </nav>
            </div>

            {/* Tab 内容 */}
            <div className="p-6">
              {activeTab === 'manage' ? (
                <KeyManagement />
              ) : (
                <BulkKeyGenerator />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}