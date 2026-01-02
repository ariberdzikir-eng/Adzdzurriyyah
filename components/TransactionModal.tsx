
import React, { useState, useEffect } from 'react';
import { Transaction, CategoryState } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  categories: CategoryState;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddTransaction, 
  onEditTransaction,
  categories,
  transactionToEdit
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('income');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDescription(transactionToEdit.description);
        setAmount(transactionToEdit.amount.toString());
        setType(transactionToEdit.type);
        setDate(transactionToEdit.date);
        setCategory(transactionToEdit.category);
      } else {
        resetForm();
      }
    }
  }, [isOpen, transactionToEdit]);

  useEffect(() => {
    // Ensure category is valid for selected type if not editing
    if (isOpen && !transactionToEdit) {
      setCategory(categories[type][0] || '');
    }
  }, [type, isOpen, categories, transactionToEdit]);

  if (!isOpen) return null;

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('income');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(categories['income'][0] || '');
    setError('');
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !category) {
      setError('Semua kolom harus diisi.');
      return;
    }
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError('Jumlah harus berupa angka positif.');
      return;
    }

    if (transactionToEdit && onEditTransaction) {
      onEditTransaction({
        ...transactionToEdit,
        description,
        amount: amountNumber,
        type,
        date,
        category,
      });
    } else {
      onAddTransaction({
        description,
        amount: amountNumber,
        type,
        date,
        category,
      });
    }
    
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md m-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {transactionToEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
        </h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label className="block text-gray-700 font-medium mb-2">Jenis Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setType('income')} className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Pemasukan
              </button>
              <button type="button" onClick={() => setType('expense')} className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Pengeluaran
              </button>
               <button type="button" onClick={() => setType('transfer')} className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${type === 'transfer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Transfer Kas
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Deskripsi</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
           <div>
            <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Kategori</label>
            <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
            >
                {categories[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">Jumlah (IDR)</label>
                <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
            <div>
                <label htmlFor="date" className="block text-gray-700 font-medium mb-2">Tanggal</label>
                <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={handleClose} className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">
              Batal
            </button>
            <button type="submit" className="px-6 py-2 text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">
              {transactionToEdit ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
