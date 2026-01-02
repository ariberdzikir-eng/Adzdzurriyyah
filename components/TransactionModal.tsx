
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
    // Jika ganti tipe dan bukan sedang edit, set kategori default pertama
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
      setError('Harap lengkapi semua kolom.');
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            {transactionToEdit ? 'Edit Transaksi' : 'Catat Transaksi'}
            </h2>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {error && <p className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-xs font-bold border border-rose-100">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setType('income')} className={`py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                Pemasukan
              </button>
              <button type="button" onClick={() => setType('expense')} className={`py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                Pengeluaran
              </button>
               <button type="button" onClick={() => setType('transfer')} className={`py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all ${type === 'transfer' ? 'bg-sky-600 text-white shadow-lg shadow-sky-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                Transfer
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Deskripsi / Keperluan</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-sm font-semibold"
              placeholder="Contoh: Infaq Jumat"
              required
            />
          </div>

           <div>
            <label htmlFor="category" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Kategori</label>
            <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-sm font-semibold appearance-none"
                required
            >
                {categories[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="amount" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Jumlah (Rp)</label>
                <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-sm font-bold"
                placeholder="0"
                required
                />
            </div>
            <div>
                <label htmlFor="date" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Tanggal</label>
                <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-sm font-semibold"
                required
                />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">
              Batal
            </button>
            <button type="submit" className="flex-[2] py-4 text-white bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all transform active:scale-95">
              {transactionToEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
