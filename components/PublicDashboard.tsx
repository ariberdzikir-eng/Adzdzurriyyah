
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { StatCard } from './StatCard';
import { FinancialChart } from './FinancialChart';
import { TransactionTable } from './TransactionTable';
import { CategoryPieChart } from './CategoryPieChart';
import { IncomeIcon, ExpenseIcon, BalanceIcon, PdfIcon } from './icons';

interface PublicDashboardProps {
  transactions: Transaction[];
  onAdminLoginClick: () => void;
}

declare const window: any;

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

export const PublicDashboard: React.FC<PublicDashboardProps> = ({ transactions, onAdminLoginClick }) => {
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const handleDownloadPDF = () => {
    if (!window.jspdf) {
      alert("Library PDF sedang dimuat, silakan coba lagi dalam beberapa detik.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN MASJID ADZDZURRIYYAH", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.text("KEMENDUKBANGGA/BKKBN", 105, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Jl. Permata No. 1 Halim Perdanakusuma - Jakarta Timur", 105, 34, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);

    // Report Info
    doc.setFontSize(11);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 20, 48);

    // Summary Section
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN KEUANGAN", 20, 58);
    
    doc.autoTable({
      startY: 62,
      head: [['Keterangan', 'Jumlah']],
      body: [
        ['Total Pemasukan', formatCurrency(totalIncome)],
        ['Total Pengeluaran', formatCurrency(totalExpense)],
        ['Saldo Kas Saat Ini', formatCurrency(balance)]
      ],
      theme: 'grid',
      headStyles: { fillStyle: 'emerald', fillColor: [5, 150, 105] },
      styles: { fontSize: 11 }
    });

    // Transaction History Section
    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("RIWAYAT TRANSAKSI TERAKHIR", 20, nextY);

    const tableData = transactions.slice(0, 30).map(t => [
      formatDate(t.date),
      t.description,
      t.category,
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      formatCurrency(t.amount)
    ]);

    doc.autoTable({
      startY: nextY + 4,
      head: [['Tanggal', 'Deskripsi', 'Kategori', 'Jenis', 'Jumlah']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillStyle: 'emerald', fillColor: [5, 150, 105] },
      styles: { fontSize: 9 }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Laporan ini dihasilkan secara otomatis oleh Sistem Manajemen Kas Masjid Adz-Dzurriyyah.", 105, finalY, { align: "center" });

    doc.save(`Laporan_Keuangan_AdzDzurriyyah_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Public Header */}
      <header className="bg-emerald-800 text-white py-12 px-6 shadow-lg mb-8 border-b-4 border-emerald-600">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
              LAPORAN KEUANGAN MASJID ADZDZURRIYYAH
            </h1>
            <div className="mt-3 space-y-1">
              <p className="text-emerald-100 text-xl font-bold">KEMENDUKBANGGA/BKKBN</p>
              <p className="text-emerald-200 text-sm font-medium flex items-center justify-center md:justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Jl. Permata No. 1 Halim Perdanakusuma - Jakarta Timur
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center min-w-[180px]">
              <p className="text-emerald-50 text-xs font-bold uppercase tracking-widest mb-1">Status Laporan</p>
              <p className="text-xl font-bold">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-400 text-emerald-900">
                Live Data
              </div>
            </div>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-white text-emerald-800 font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-emerald-50 transition-all transform active:scale-95"
            >
              <PdfIcon />
              Download Laporan (PDF)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Pemasukan" 
            amount={formatCurrency(totalIncome)} 
            icon={<IncomeIcon className="h-8 w-8 text-white"/>} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="Total Pengeluaran" 
            amount={formatCurrency(totalExpense)} 
            icon={<ExpenseIcon className="h-8 w-8 text-white"/>} 
            color="bg-rose-500" 
          />
          <StatCard 
            title="Saldo Kas Saat Ini" 
            amount={formatCurrency(balance)} 
            icon={<BalanceIcon />} 
            color="bg-sky-600" 
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-8 mb-10">
           <FinancialChart transactions={transactions} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <CategoryPieChart 
            transactions={transactions} 
            type="income" 
            title="Sumber Dana (Donasi/Infaq)" 
          />
          <CategoryPieChart 
            transactions={transactions} 
            type="expense" 
            title="Alokasi Penggunaan Dana" 
          />
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-2xl font-bold text-slate-800">Riwayat Transaksi Terkini</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Transparansi Publik</span>
          </div>
          <div className="p-2">
            <TransactionTable transactions={transactions.slice(0, 15)} />
          </div>
        </div>

        {/* Footer for Donors */}
        <footer className="mt-16 text-center border-t border-slate-200 pt-10">
          <p className="text-slate-500 italic mb-6">"Sedekah tidak akan mengurangi harta..." (HR. Muslim)</p>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-400">© 2024 DKM Masjid Adz-Dzurriyyah</p>
            <button 
                onClick={onAdminLoginClick}
                className="text-slate-400 hover:text-emerald-600 text-sm font-semibold transition-colors"
            >
                Akses Pengurus (Login)
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};
