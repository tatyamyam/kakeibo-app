import React, { useState, useRef } from 'react';
import { saveReceipt, validateReceipt } from '../utils/storage.js';

export default function ReceiptUploader({ onSaved }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const handleChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // レシート画像をバックエンドに送信して Claude API で解析する
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/receipt', { method: 'POST', body: formData });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      setWarnings(validateReceipt(json.data));
    } catch (e) {
      setError(e.message || '解析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 解析結果をローカルストレージに保存する
  const handleSave = () => {
    if (!result) return;
    const receipt = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...result
    };
    saveReceipt(receipt);
    setResult(null);
    setPreview(null);
    setFile(null);
    setWarnings([]);
    onSaved();
  };

  return (
    <div className="uploader">
      {/* ドラッグ&ドロップ または クリックでファイル選択 */}
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview
          ? <img src={preview} alt="レシートプレビュー" className="preview-img" />
          : <p>📷 クリックまたはドラッグ&ドロップでレシート画像を選択</p>
        }
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {file && !result && (
        <button className="btn-primary" onClick={handleAnalyze} disabled={loading}>
          {loading ? '解析中...' : '📖 レシートを読み取る'}
        </button>
      )}

      {error && <p className="error-msg">{error}</p>}

      {/* 解析結果のプレビューと保存ボタン */}
      {result && (
        <div className="result-card">
          <h3>{result.storeName} ({result.date})</h3>

          {/* 検証警告（保存は可能） */}
          {warnings.length > 0 && (
            <ul className="warning-list">
              {warnings.map((msg, i) => (
                <li key={i}>⚠️ {msg}</li>
              ))}
            </ul>
          )}

          <table className="items-table">
            <thead>
              <tr><th>商品名</th><th>カテゴリ</th><th>金額</th></tr>
            </thead>
            <tbody>
              {result.items?.map((item, i) => (
                // 負の金額の行を強調表示する
                <tr key={i} className={Number(item.price) < 0 ? 'row-negative' : ''}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td className="text-right">¥{Number(item.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>合計</strong></td>
                <td className="text-right"><strong>¥{Number(result.total).toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
          <div className="result-actions">
            <button className="btn-primary" onClick={handleSave}>💾 保存する</button>
            <button className="btn-secondary" onClick={() => { setResult(null); setPreview(null); setFile(null); setWarnings([]); }}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
