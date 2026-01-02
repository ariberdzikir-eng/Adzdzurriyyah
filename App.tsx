
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, CategoryState } from './types';
import { INITIAL_TRANSACTIONS, INCOME_CATEGORIES, EXPENSE_CATEGORIES, TRANSFER_CATEGORIES } from './constants';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { FinancialChart } from './components/FinancialChart';
import { CategoryPieChart } from './components/CategoryPieChart';
import { TransactionTable } from './components/TransactionTable';
import { TransactionModal } from './components/TransactionModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { ReportsView } from './components/ReportsView';
import { CategorySettingsView } from './components/CategorySettingsView';
import { DataManagementView } from './components/DataManagementView';
import { BackupExcelView } from './components/BackupExcelView';
import { AISummary } from './components/AISummary';
import { Login } from './components/Login';
import { PublicDashboard } from './components/PublicDashboard';
import { IncomeIcon, ExpenseIcon, BalanceIcon, PlusIcon, TrashIcon } from './components/icons';
import { generateFinancialSummary } from './services/geminiService';
import { GoogleDriveSync } from './components/GoogleDriveSync';

type View = 'dashboard' | 'income' | 'expense' | 'transfer' | 'reports' | 'category-settings' | 'data-management' | 'backup-excel';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AdminDashboard: React.FC<{
  transactions: Transaction[];
  onAddTransaction: () => void;
  onRestore: (transactions: Transaction[]) => void;
  onViewTransaction: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}> = ({ transactions, onAddTransaction, onRestore, onViewTransaction, onEditTransaction, onDeleteTransaction }) => {

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    setLoadingSummary(true);
    generateFinancialSummary(transactions)
      .then(setSummary)
      .catch(err => {
        console.error(err);
        setSummary('Gagal memuat ringkasan keuangan saat ini.');
      })
      .finally(() => setLoadingSummary(false));
  }, [transactions]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel Pengurus</h1>
          <p className="text-gray-500 mt-1">Masjid Adz-Dzurriyyah BKKBN</p>
        </div>
        <button onClick={onAddTransaction} className="flex items-center justify-center bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all transform active:scale-95 text-sm uppercase tracking-widest font-black">
            <PlusIcon />
            Tambah Transaksi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Pemasukan" amount={formatCurrency(totalIncome)} icon={<IncomeIcon className="h-8 w-8 text-white"/>} color="bg-emerald-500" />
        <StatCard title="Total Pengeluaran" amount={formatCurrency(totalExpense)} icon={<ExpenseIcon className="h-8 w-8 text-white"/>} color="bg-rose-500" />
        <StatCard title="Saldo Kas" amount={formatCurrency(balance)} icon={<BalanceIcon />} color="bg-sky-500" />
      </div>

      <AISummary summary={summary} loading={loadingSummary} />

      <div className="grid grid-cols-1 gap-6 mt-8">
        <FinancialChart transactions={transactions} />
      </div>

      <div className="mt-8 mb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-2 h-6 bg-amber-500 rounded-full mr-3"></span>
          Transaksi Terkini
        </h2>
        <TransactionTable 
          transactions={transactions.slice(0, 10)} 
          onRowClick={onViewTransaction}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
        />
      </div>

      <div className="mt-12">
        <GoogleDriveSync transactions={transactions} setTransactions={()=>{}} onRestore={onRestore} />
      </div>
    </div>
  );
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryState>({
    income: INCOME_CATEGORIES,
    expense: EXPENSE_CATEGORIES,
    transfer: TRANSFER_CATEGORIES,
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Filters state
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedTransactions = localStorage.getItem('mosque-transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
    }

    const savedCategories = localStorage.getItem('mosque-categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mosque-transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mosque-categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transactionWithId = { ...newTransaction, id: new Date().getTime().toString() };
    setTransactions(prev => [transactionWithId, ...prev]);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleRestoreData = (restoredTransactions: Transaction[]) => {
    setTransactions(restoredTransactions);
  };

  const handleLogin = () => {
    sessionStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
    setShowLogin(false);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  // Reset filters when changing views
  useEffect(() => {
    setFilterDate('');
    setSearchQuery('');
  }, [currentView]);

  // 1. PUBLIC VIEW (Default)
  if (!isLoggedIn && !showLogin) {
    return (
      <PublicDashboard 
        transactions={transactions} 
        onAdminLoginClick={() => setShowLogin(true)} 
      />
    );
  }

  // 2. LOGIN FORM
  if (showLogin) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowLogin(false)} 
          className="absolute top-8 left-8 text-emerald-600 font-bold hover:underline z-50 flex items-center"
        >
          &larr; Kembali ke Dashboard Publik
        </button>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // 3. ADMIN PANEL (Authenticated)
  const renderAdminContent = () => {
    if (currentView === 'dashboard') {
      return <AdminDashboard 
                transactions={transactions} 
                onAddTransaction={handleOpenAddModal}
                onRestore={handleRestoreData} 
                onViewTransaction={(t) => setSelectedTransaction(t)}
                onEditTransaction={handleOpenEditModal}
                onDeleteTransaction={handleDeleteTransaction}
             />;
    }
    if (currentView === 'reports') {
      return <ReportsView transactions={transactions} />;
    }
    if (currentView === 'category-settings') {
      return <CategorySettingsView categories={categories} onUpdateCategories={setCategories} />;
    }
    if (currentView === 'data-management') {
      return <DataManagementView transactions={transactions} onImport={handleRestoreData} />;
    }
    if (currentView === 'backup-excel') {
      return <BackupExcelView transactions={transactions} onImport={handleRestoreData} />;
    }

    let title = '';
    let type: 'income' | 'expense' | 'transfer' = 'income';

    if (currentView === 'income') {
      title = 'Manajemen Pemasukan';
      type = 'income';
    } else if (currentView === 'expense') {
      title = 'Manajemen Pengeluaran';
      type = 'expense';
    } else if (currentView === 'transfer') {
      title = 'Manajemen Transfer Kas';
      type = 'transfer';
    }

    const filteredTransactions = transactions.filter(t => {
      const isType = t.type === type;
      const matchesDate = filterDate ? t.date === filterDate : true;
      const matchesSearch = searchQuery 
        ? t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return isType && matchesDate && matchesSearch;
    });

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
                <p className="text-gray-500 text-sm mt-1">Daftar rekaman {title.toLowerCase()} Masjid</p>
            </div>
            <button onClick={handleOpenAddModal} className="flex items-center justify-center bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-emerald-700 transition-all transform active:scale-95 text-sm uppercase tracking-widest font-black shrink-0">
                <PlusIcon />
                Tambah Data
            </button>
        </div>

        {/* Improved Search & Filter Toolbar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-end gap-4">
            <div className="flex-[2] min-w-[280px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Cari Transaksi</label>
                <div className="relative">
                  <input 
                      type="text" 
                      placeholder="Cari deskripsi atau kategori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
            </div>
            <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Filter Hari (Tanggal)</label>
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
            </div>
            {(filterDate || searchQuery) && (
                <button 
                    onClick={() => { setFilterDate(''); setSearchQuery(''); }}
                    className="flex items-center gap-2 px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-sm h-[42px]"
                >
                    <TrashIcon className="h-4 w-4" />
                    Bersihkan
                </button>
            )}
        </div>

        <TransactionTable 
          transactions={filteredTransactions} 
          onRowClick={(t) => setSelectedTransaction(t)} 
          onDelete={handleDeleteTransaction}
          onEdit={handleOpenEditModal}
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {renderAdminContent()}
      </main>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleUpdateTransaction}
        categories={categories}
        transactionToEdit={transactionToEdit}
      />

      <TransactionDetailModal 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}

export default App;
