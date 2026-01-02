
import React from 'react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
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
}

const typeStyles = {
    income: {
        badge: 'bg-green-100 text-green-800',
        text: 'text-green-600',
        label: 'Pemasukan'
    },
    expense: {
        badge: 'bg-red-100 text-red-800',
        text: 'text-red-600',
        label: 'Pengeluaran'
    },
    transfer: {
        badge: 'bg-blue-100 text-blue-800',
        text: 'text-blue-600',
        label: 'Transfer Kas'
    }
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onRowClick }) => {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Transaksi</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-2 border-gray-200">
            <tr>
              <th className="py-3 px-4 font-semibold text-gray-600">Tanggal</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Deskripsi</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Kategori</th>
              <th className="py-3 px-4 font-semibold text-gray-600">Jenis</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t) => (
              <tr 
                key={t.id} 
                className={`border-b border-gray-100 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => onRowClick && onRowClick(t)}
              >
                <td className="py-3 px-4 text-gray-700">{formatDate(t.date)}</td>
                <td className="py-3 px-4 text-gray-700 font-medium">{t.description}</td>
                <td className="py-3 px-4 text-gray-500">{t.category}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeStyles[t.type].badge}`}>
                    {typeStyles[t.type].label}
                  </span>
                </td>
                <td className={`py-3 px-4 font-medium text-right ${typeStyles[t.type].text}`}>
                  {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
             {sortedTransactions.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                        Tidak ada transaksi untuk ditampilkan.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
