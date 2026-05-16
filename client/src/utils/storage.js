const STORAGE_KEY = 'kakeibo_receipts';

export const CATEGORIES = ['食費', '外食', '日用品', '衣類', '交通費', '医療費', '娯楽', 'その他'];

// カテゴリごとの表示色
export const CATEGORY_COLORS = {
  '食費': '#FF6384',
  '外食': '#FF9F40',
  '日用品': '#FFCD56',
  '衣類': '#4BC0C0',
  '交通費': '#36A2EB',
  '医療費': '#9966FF',
  '娯楽': '#FF6699',
  'その他': '#C9CBCF'
};

export const getReceipts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveReceipt = (receipt) => {
  const receipts = getReceipts();
  receipts.unshift(receipt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
};

export const deleteReceipt = (id) => {
  const receipts = getReceipts().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
};
