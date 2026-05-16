import React, { useState } from 'react';
import { getReceipts, deleteReceipt, CATEGORIES } from '../utils/storage.js';

export default function ExpenseList({ refreshKey }) {
  const [filterCategory, setFilterCategory] = useState('すべて');
  const receipts = getReceipts();

  // カテゴリフィルター適用後のレシート一覧
  const filtered = filterCategory === 'すべて'
    ? receipts
    : receipts.filter(r => r.items?.some(item => item.category === filterCategory));

  const handleDelete = (id) => {
    if (!window.confirm('このレシートを削除しますか？')) return;
    deleteReceipt(id);
    // 再描画のために親の refreshKey を更新するよう親コンポーネントに通知する代わりに、
    // ページリロードで最新データを表示する
    window.location.reload();
  };

  if (receipts.length === 0) {
    return <p className="empty-msg">まだレシートが登録されていません。</p>;
  }

  return (
    <div className="expense-list">
      {/* カテゴリフィルター */}
      <div className="filter-bar">
        <label>カテゴリ：</label>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option>すべて</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <p className="empty-msg">該当するレシートがありません。</p>}

      {filtered.map(receipt => (
        <div key={receipt.id} className="receipt-card">
          <div className="receipt-header">
            <span className="store-name">{receipt.storeName}</span>
            <span className="receipt-date">{receipt.date}</span>
            <button className="btn-delete" onClick={() => handleDelete(receipt.id)}>削除</button>
          </div>
          <table className="items-table">
            <thead>
              <tr><th>商品名</th><th>カテゴリ</th><th>金額</th></tr>
            </thead>
            <tbody>
              {receipt.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td><span className="badge">{item.category}</span></td>
                  <td className="text-right">¥{Number(item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>合計</strong></td>
                <td className="text-right"><strong>¥{Number(receipt.total).toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  );
}
