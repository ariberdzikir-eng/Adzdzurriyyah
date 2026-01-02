
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PdfIcon, ExcelIcon, CsvIcon } from './icons';
import { TransactionTable } from './TransactionTable';
import { TransactionDetailModal } from './TransactionDetailModal';

interface ReportsViewProps {
  transactions: Transaction[];
}

// Ensure jsPDF is available on the window object
declare const window: any;

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
const formatMonthLabel = (monthString: string) => {
    const [year, month] = monthString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const CategorySummaryList: React.FC<{ 
  title: string; 
  data: [string, number][]; 
  total: number;
  type: 'income' | 'expense' 
}> = ({ title, data, total, type }) => {
  const bgColor = type === 'income' ? 'bg-green-600' : 'bg-red-600';
  const textColor = type === 'income' ? 'text-green-700' : 'text-red-700';
  const barBg = type === 'income' ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="flex-1">
      <h4 className={`text-sm font-bold ${textColor} uppercase tracking-wider mb-3`}>{title}</h4>
      <div className="space-y-3">
        {data.length > 0 ? data.map(([category, amount]) => {
          const percentage = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div key={category} className="group">
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>{category}</span>
                <span className="font-bold">{formatCurrency(amount)}</span>
              </div>
              <div className={`w-full h-1.5 ${barBg} rounded-full overflow-hidden`}>
                <div 
                  className={`h-full ${bgColor} transition-all duration-500 ease-out`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-gray-400 italic">Tidak ada data {title.toLowerCase()}</p>
        )}
      </div>
    </div>
  );
};

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // State for Monthly Summary (Month & Year)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  
  // State for Period Summary (Custom Range)
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getCategoryBreakdown = (data: Transaction[]) => {
    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();

    data.forEach(t => {
      if (t.type === 'income') {
        incomeMap.set(t.category, (incomeMap.get(t.category) || 0) + t.amount);
      } else if (t.type === 'expense') {
        expenseMap.set(t.category, (expenseMap.get(t.category) || 0) + t.amount);
      }
    });

    return {
      income: Array.from(incomeMap.entries()).sort((a, b) => b[1] - a[1]),
      expense: Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1])
    };
  };

  // Logic for Monthly Summary and Table
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    filtered.filter(t => t.type !== 'transfer').forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const categoryBreakdown = getCategoryBreakdown(filtered);

    return { 
      transactions: filtered, 
      totalIncome, 
      totalExpense, 
      balance: totalIncome - totalExpense,
      categoryBreakdown
    };
  }, [transactions, selectedMonth]);

  // Logic for Period Summary
  const periodData = useMemo(() => {
    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
    });

    let totalIncome = 0;
    let totalExpense = 0;
    filtered.filter(t => t.type !== 'transfer').forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    const categoryBreakdown = getCategoryBreakdown(filtered);

    return { 
      transactions: filtered, 
      totalIncome, 
      totalExpense, 
      balance: totalIncome - totalExpense,
      categoryBreakdown
    };
  }, [transactions, startDate, endDate]);

  const handleExport = (type: 'pdf' | 'excel' | 'csv', data: Transaction[], title: string, subtitle: string) => {
    if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Laporan Keuangan Masjid', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`${title}: ${subtitle}`, 14, 30);

        const summaryData = calculateSummary(data);
        doc.autoTable({
            startY: 35,
            head: [['Deskripsi', 'Jumlah']],
            body: [
                ['Total Pemasukan', formatCurrency(summaryData.income)],
                ['Total Pengeluaran', formatCurrency(summaryData.expense)],
                ['Saldo Akhir', formatCurrency(summaryData.balance)]
            ],
            theme: 'grid'
        });

        const tableData = data.filter(t => t.type !== 'transfer');
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY + 15,
            head: [['Tanggal', 'Deskripsi', 'Kategori', 'Jenis', 'Jumlah']],
            body: tableData.map(t => [
                formatDate(t.date),
                t.description,
                t.category,
                t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount)
            ]),
            theme: 'striped'
        });
        doc.save(`${title}_${subtitle.replace(/ /g, '_')}.pdf`);
    } else {
        const delimiter = type === 'excel' ? ';' : ',';
        const headers = ['ID', 'Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah'];
        // Use BOM for UTF-8 compatibility in Excel
        const csvContent = '\ufeff' + [
            headers.join(delimiter),
            ...data.map(t => [
                t.id,
                t.date,
                `"${t.description.replace(/"/g, '""')}"`,
                t.category,
                t.type,
                t.amount
            ].join(delimiter))
        ].join('\n');

        const blob = new Blob([csvContent], { type: type === 'excel' ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${title}_${subtitle.replace(/ /g, '_')}.${type === 'excel' ? 'xls' : 'csv'}`);
        link.click();
        URL.revokeObjectURL(url);
    }
  };

  const calculateSummary = (data: Transaction[]) => {
    let income = 0;
    let expense = 0;
    data.filter(t => t.type !== 'transfer').forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  };

  return (
    <div className="space-y-8">
      {/* Monthly Report Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Laporan Bulanan</h2>
                <p className="text-gray-500 text-sm">Analisis keuangan mendalam untuk bulan {formatMonthLabel(selectedMonth)}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center space-x-2">
                    <label htmlFor="monthPicker" className="text-sm font-bold text-gray-700 uppercase tracking-tight text-nowrap">Periode:</label>
                    <input 
                        type="month" 
                        id="monthPicker" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)} 
                        className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-700"
                    />
                </div>
                <div className="flex space-x-1 sm:space-x-2">
                    <button 
                        onClick={() => handleExport('pdf', monthlyData.transactions, 'Laporan_Bulanan', formatMonthLabel(selectedMonth))}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Ekspor PDF"
                    >
                        <PdfIcon />
                    </button>
                    <button 
                        onClick={() => handleExport('excel', monthlyData.transactions, 'Laporan_Bulanan', formatMonthLabel(selectedMonth))}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        title="Ekspor Excel"
                    >
                        <ExcelIcon />
                    </button>
                    <button 
                        onClick={() => handleExport('csv', monthlyData.transactions, 'Laporan_Bulanan', formatMonthLabel(selectedMonth))}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Ekspor CSV"
                    >
                        <CsvIcon />
                    </button>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 p-6 rounded-2xl shadow-sm">
                <p className="text-xs text-green-600 font-bold uppercase tracking-widest mb-1">Total Pemasukan</p>
                <p className="text-3xl font-extrabold text-green-800">{formatCurrency(monthlyData.totalIncome)}</p>
                <div className="mt-2 h-1 w-full bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 p-6 rounded-2xl shadow-sm">
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">Total Pengeluaran</p>
                <p className="text-3xl font-extrabold text-red-800">{formatCurrency(monthlyData.totalExpense)}</p>
                <div className="mt-2 h-1 w-full bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 rounded-2xl shadow-sm">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Saldo Akhir Bulan</p>
                <p className="text-3xl font-extrabold text-blue-800">{formatCurrency(monthlyData.balance)}</p>
                <div className="mt-2 h-1 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                </div>
            </div>
        </div>

        {/* Category Breakdown - Monthly */}
        <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
            <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-indigo-600 w-2 h-5 rounded-full mr-3"></span>
                Ringkasan per Kategori ({formatMonthLabel(selectedMonth)})
            </h3>
            <div className="flex flex-col lg:flex-row gap-12">
                <CategorySummaryList 
                    title="Distribusi Pemasukan" 
                    data={monthlyData.categoryBreakdown.income} 
                    total={monthlyData.totalIncome}
                    type="income"
                />
                <div className="hidden lg:block w-px bg-gray-200"></div>
                <CategorySummaryList 
                    title="Distribusi Pengeluaran" 
                    data={monthlyData.categoryBreakdown.expense} 
                    total={monthlyData.totalExpense}
                    type="expense"
                />
            </div>
        </div>

        <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-600 w-2 h-6 rounded-full mr-3"></span>
                Daftar Transaksi: {formatMonthLabel(selectedMonth)}
            </h3>
            <TransactionTable 
              transactions={monthlyData.transactions} 
              onRowClick={(t) => setSelectedTransaction(t)}
            />
        </div>
      </div>

      {/* Custom Period Section */}
      <details className="bg-white rounded-2xl shadow-md overflow-hidden group" open>
        <summary className="p-6 cursor-pointer flex justify-between items-center bg-gray-50 group-open:bg-white border-b border-transparent group-open:border-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <ReportsIcon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Laporan Periode Kustom</h2>
            </div>
            <span className="text-gray-400 group-open:rotate-180 transition-transform">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </summary>
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
                <div className="md:col-span-1">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-tight text-xs font-bold">Tanggal Mulai</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-tight text-xs font-bold">Tanggal Akhir</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                </div>
                <div className="md:col-span-2 flex space-x-2">
                    <button onClick={() => handleExport('pdf', periodData.transactions, 'Laporan_Kustom', `${startDate}_ke_${endDate}`)} className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors uppercase">
                        <PdfIcon /> PDF
                    </button>
                    <button onClick={() => handleExport('excel', periodData.transactions, 'Laporan_Kustom', `${startDate}_ke_${endDate}`)} className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors uppercase">
                        <ExcelIcon /> EXCEL
                    </button>
                    <button onClick={() => handleExport('csv', periodData.transactions, 'Laporan_Kustom', `${startDate}_ke_${endDate}`)} className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors uppercase">
                        <CsvIcon /> CSV
                    </button>
                </div>
            </div>
            
            <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Ringkasan Periode</h3>
                <p className="text-gray-500 text-sm mb-6">Menganalisis periode <span className="font-semibold text-indigo-600">{formatDate(startDate)}</span> — <span className="font-semibold text-indigo-600">{formatDate(endDate)}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Pemasukan</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(periodData.totalIncome)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Pengeluaran</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(periodData.totalExpense)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Saldo Akhir</p>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(periodData.balance)}</p>
                    </div>
                </div>

                {/* Category Breakdown - Custom Period */}
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                    <h3 className="text-md font-bold text-gray-800 mb-6 flex items-center">
                        <span className="bg-indigo-600 w-2 h-5 rounded-full mr-3"></span>
                        Breakdown Kategori Periode Kustom
                    </h3>
                    <div className="flex flex-col lg:flex-row gap-12">
                        <CategorySummaryList 
                            title="Distribusi Pemasukan" 
                            data={periodData.categoryBreakdown.income} 
                            total={periodData.totalIncome}
                            type="income"
                        />
                        <div className="hidden lg:block w-px bg-gray-200"></div>
                        <CategorySummaryList 
                            title="Distribusi Pengeluaran" 
                            data={periodData.categoryBreakdown.expense} 
                            total={periodData.totalExpense}
                            type="expense"
                        />
                    </div>
                </div>

                <TransactionTable 
                    transactions={periodData.transactions} 
                    onRowClick={(t) => setSelectedTransaction(t)}
                />
            </div>
        </div>
      </details>
      
      <TransactionDetailModal 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};

// Re-importing Icons used locally to ensure availability if detail view moves
import { ReportsIcon } from './icons';
