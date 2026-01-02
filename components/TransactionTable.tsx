
import React from 'react';
import { Transaction } from '../types';
import { TrashIcon, EditIcon } from './icons';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
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

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onRowClick, onDelete, onEdit }) => {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const hasActions = !!onDelete || !!onEdit;

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
              {hasActions && <th className="py-3 px-4 font-semibold text-gray-600 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t) => (
              <tr 
                key={t.id} 
                className={`border-b border-gray-100 transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
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
                {hasActions && (
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-1">
                      {onEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(t);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all transform active:scale-90"
                          title="Edit Transaksi"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Hapus transaksi ini?')) {
                              onDelete(t.id);
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all transform active:scale-90"
                          title="Hapus Transaksi"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
             {sortedTransactions.length === 0 && (
                <tr>
                    <td colSpan={hasActions ? 6 : 5} className="text-center py-8 text-gray-500">
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
