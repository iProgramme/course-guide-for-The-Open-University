'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import KeyManagement from '@/components/KeyManagement';
import KeyValidator from '@/components/KeyValidator';
import BulkKeyGenerator from '@/components/BulkKeyGenerator';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'validate' | 'bulk'>('manage');

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
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">密钥管理系统</h1>
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
                  onClick={() => setActiveTab('validate')}
                  className={`py-4 px-6 text-center font-medium text-sm ${
                    activeTab === 'validate'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  密钥验证
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
              ) : activeTab === 'validate' ? (
                <KeyValidator />
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