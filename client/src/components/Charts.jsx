import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getReceipts, CATEGORIES, CATEGORY_COLORS } from '../utils/storage.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Charts({ refreshKey }) {
  const receipts = getReceipts();

  if (receipts.length === 0) {
    return <p className="empty-msg">グラフを表示するにはレシートを登録してください。</p>;
  }

  // カテゴリ別の合計金額を集計する
  const categoryTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  receipts.forEach(receipt => {
    receipt.items?.forEach(item => {
      const cat = item.category in categoryTotals ? item.category : 'その他';
      categoryTotals[cat] += Number(item.price) || 0;
    });
  });

  const nonZeroCategories = CATEGORIES.filter(c => categoryTotals[c] > 0);

  const pieData = {
    labels: nonZeroCategories,
    datasets: [{
      data: nonZeroCategories.map(c => categoryTotals[c]),
      backgroundColor: nonZeroCategories.map(c => CATEGORY_COLORS[c]),
      borderWidth: 1
    }]
  };

  // 月別の支出合計を集計する
  const monthlyTotals = {};
  receipts.forEach(receipt => {
    // 日付から "YYYY-MM" 形式で月を取得する
    const month = receipt.date?.slice(0, 7);
    if (!month) return;
    monthlyTotals[month] = (monthlyTotals[month] || 0) + (Number(receipt.total) || 0);
  });

  const sortedMonths = Object.keys(monthlyTotals).sort();

  const barData = {
    labels: sortedMonths,
    datasets: [{
      label: '月別支出 (円)',
      data: sortedMonths.map(m => monthlyTotals[m]),
      backgroundColor: '#36A2EB'
    }]
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Y軸の金額を "¥XX,XXX" 形式で表示する
          callback: (val) => `¥${val.toLocaleString()}`
        }
      }
    }
  };

  return (
    <div className="charts">
      <div className="chart-section">
        <h3>カテゴリ別支出</h3>
        <div className="pie-container">
          <Pie data={pieData} />
        </div>
      </div>

      <div className="chart-section">
        <h3>月別支出</h3>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}
