
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface CategoryFinancialChartProps {
  transactions: Transaction[];
  type: 'income' | 'expense';
  title: string;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#64748b', '#f97316'
];

export const CategoryFinancialChart: React.FC<CategoryFinancialChartProps> = ({ transactions, type, title }) => {
  const chartData = useMemo(() => {
    const dataMap = new Map<string, any>();
    const filtered = transactions.filter(t => t.type === type);
    const categoriesSet = new Set<string>();

    filtered.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      categoriesSet.add(t.category);

      if (!dataMap.has(monthKey)) {
        const [year, month] = monthKey.split('-');
        const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { 
          month: 'short', 
          year: 'numeric' 
        });
        dataMap.set(monthKey, { month: monthKey, monthLabel });
      }

      const entry = dataMap.get(monthKey);
      entry[t.category] = (entry[t.category] || 0) + t.amount;
    });

    const categories = Array.from(categoriesSet);
    const sortedData = Array.from(dataMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return { data: sortedData, categories };
  }, [transactions, type]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md h-96">
      <h3 className="text-lg font-bold text-gray-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData.data}
          margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="monthLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(val) => `Rp${val / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [formatCurrency(value), '']}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {chartData.categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={index === chartData.categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              barSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
