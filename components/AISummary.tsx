import React from 'react';

interface AISummaryProps {
  summary: string;
  loading: boolean;
}

export const AISummary: React.FC<AISummaryProps> = ({ summary, loading }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Keuangan (AI-Generated)</h2>
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
          <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.2s'}}></div>
          <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{animationDelay: '0.4s'}}></div>
          <p className="text-gray-500">Menganalisis data...</p>
        </div>
      ) : (
        <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>
      )}
    </div>
  );
};
