
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface FinancialChartProps {
  transactions: Transaction[];
}

const processMonthlyData = (transactions: Transaction[]) => {
  const dataMap = new Map<string, { month: string; monthLabel: string; pemasukan: number; pengeluaran: number }>();
  
  // Filter out transfers for the main cashflow chart
  const filteredTransactions = transactions.filter(t => t.type !== 'transfer');

  filteredTransactions.forEach(t => {
    // Extract YYYY-MM from date YYYY-MM-DD
    const monthKey = t.date.substring(0, 7); 
    
    if (!dataMap.has(monthKey)) {
      const [year, month] = monthKey.split('-');
      const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      dataMap.set(monthKey, { 
        month: monthKey, 
        monthLabel, 
        pemasukan: 0, 
        pengeluaran: 0 
      });
    }
    
    const entry = dataMap.get(monthKey)!;
    if (t.type === 'income') {
      entry.pemasukan += t.amount;
    } else {
      entry.pengeluaran += t.amount;
    }
  });

  // Sort by month key (YYYY-MM)
  return Array.from(dataMap.values()).sort((a, b) => a.month.localeCompare(b.month));
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export const FinancialChart: React.FC<FinancialChartProps> = ({ transactions }) => {
  const chartData = processMonthlyData(transactions);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mt-6 h-96">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Grafik Arus Kas Bulanan</h2>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Total {chartData.length} Bulan
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 60,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthLabel" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `Rp${value / 1000}k`} 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
          />
          <Bar 
            dataKey="pemasukan" 
            fill="#16a34a" 
            name="Pemasukan" 
            radius={[4, 4, 0, 0]} 
            barSize={32}
          />
          <Bar 
            dataKey="pengeluaran" 
            fill="#dc2626" 
            name="Pengeluaran" 
            radius={[4, 4, 0, 0]} 
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
