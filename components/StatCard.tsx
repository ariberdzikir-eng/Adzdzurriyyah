
import React from 'react';

interface StatCardProps {
  title: string;
  amount: string;
  icon: React.ReactNode;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{amount}</p>
      </div>
    </div>
  );
};
