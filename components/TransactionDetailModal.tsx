
import React from 'react';
import { Transaction } from '../types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const typeLabels: Record<string, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  transfer: 'Transfer Kas',
};

const typeColors: Record<string, string> = {
  income: 'text-green-600 bg-green-50',
  expense: 'text-red-600 bg-red-50',
  transfer: 'text-blue-600 bg-blue-50',
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Detail Transaksi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center justify-center pb-6 border-b border-gray-100">
            <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2 ${typeColors[transaction.type]}`}>
              {typeLabels[transaction.type]}
            </span>
            <h3 className={`text-4xl font-extrabold ${transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tanggal</p>
              <p className="text-gray-800 font-medium">{formatDate(transaction.date)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Kategori</p>
              <p className="text-gray-800 font-medium">{transaction.category}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Deskripsi</p>
              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                "{transaction.description}"
              </p>
            </div>
          </div>
          
          <div className="pt-4">
             <p className="text-xs text-gray-400 italic">ID Transaksi: {transaction.id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
