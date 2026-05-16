import React, { useState } from 'react';
import ReceiptUploader from './components/ReceiptUploader.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import Charts from './components/Charts.jsx';

const TABS = [
  { id: 'upload', label: '📷 登録' },
  { id: 'list', label: '📋 一覧' },
  { id: 'charts', label: '📊 グラフ' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  // レシート保存後に一覧・グラフを強制的に再描画するためのキー
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey(k => k + 1);
    setActiveTab('list');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧾 レシート家計簿</h1>
      </header>

      <nav className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'upload' && <ReceiptUploader onSaved={handleSaved} />}
        {activeTab === 'list' && <ExpenseList refreshKey={refreshKey} />}
        {activeTab === 'charts' && <Charts refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
