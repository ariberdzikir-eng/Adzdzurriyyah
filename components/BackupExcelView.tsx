
import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { ExcelIcon, DownloadIcon, UploadIcon } from './icons';

interface BackupExcelViewProps {
  transactions: Transaction[];
  onImport: (restoredTransactions: Transaction[]) => void;
}

declare const window: any;

export const BackupExcelView: React.FC<BackupExcelViewProps> = ({ transactions, onImport }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit'
    });
  };

  const getMonthName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { month: 'long' });
  };

  const generateExcelTemplate = (dataToExport: Transaction[], title: string, subtitle: string, periodText: string) => {
    const sortedData = [...dataToExport].sort((a, b) => a.date.localeCompare(b.date));
    let runningBalance = 0;
    let currentMonth = "";
    let tableRows = "";
    
    sortedData.forEach((t) => {
      const monthLabel = getMonthName(t.date);
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        tableRows += `
          <tr style="background-color: #d1d5db; font-weight: bold;">
            <td style="border: 1px solid black; text-align: left;">Bulan :</td>
            <td colspan="4" style="border: 1px solid black; text-align: left;">${currentMonth}</td>
          </tr>
        `;
      }
      const pemasukan = t.type === 'income' ? t.amount : 0;
      const pengeluaran = t.type === 'expense' ? t.amount : 0;
      runningBalance += (pemasukan - pengeluaran);

      tableRows += `
        <tr>
          <td style="border: 1px solid black; text-align: center;">${formatDate(t.date)}</td>
          <td style="border: 1px solid black;">${t.description}</td>
          <td style="border: 1px solid black; text-align: right; mso-number-format:'\\#\\,\\#\\#0';">${pemasukan || 0}</td>
          <td style="border: 1px solid black; text-align: right; mso-number-format:'\\#\\,\\#\\#0';">${pengeluaran || 0}</td>
          <td style="border: 1px solid black; text-align: right; mso-number-format:'\\#\\,\\#\\#0'; font-weight: bold;">${runningBalance}</td>
        </tr>
      `;
    });

    tableRows += `
      <tr style="background-color: #d1d5db; font-weight: bold;">
        <td colspan="2" style="border: 1px solid black; text-align: left; padding: 10px;">SALDO AKHIR</td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black;"></td>
        <td style="border: 1px solid black; text-align: right; mso-number-format:'\\#\\,\\#\\#0';">${runningBalance}</td>
      </tr>
    `;

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td colspan="5" style="text-align: center; font-size: 16pt; font-weight: bold;">${title}</td></tr>
          <tr><td colspan="5" style="text-align: center; font-size: 14pt; font-weight: bold;">${subtitle}</td></tr>
          <tr><td colspan="5" style="text-align: center; font-size: 11pt; padding-bottom: 20px;">Periode : ${periodText}</td></tr>
          <tr style="background-color: #f3f4f6; font-weight: bold; text-align: center;">
            <td style="border: 1px solid black; width: 100px;">Tanggal</td>
            <td style="border: 1px solid black; width: 300px;">Transaksi</td>
            <td style="border: 1px solid black; width: 150px;">Pemasukan</td>
            <td style="border: 1px solid black; width: 150px;">Pengeluaran</td>
            <td style="border: 1px solid black; width: 150px;">Saldo Akhir</td>
          </tr>
          ${tableRows}
        </table>
      </body>
      </html>
    `;
  };

  const handleExport = (dataToExport: Transaction[], filename: string, periodText: string) => {
    const excelHtml = generateExcelTemplate(
      dataToExport,
      "LAPORAN KAS MASUK KAS KELUAR",
      "Masjid Adzdzurriyyah - Kemendukbangga/BKKBN",
      periodText
    );
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    if (transactions.length === 0) return;
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const start = new Date(sorted[0].date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const end = new Date(sorted[sorted.length-1].date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    handleExport(transactions, `Laporan_Kas_Lengkap_${new Date().toISOString().split('T')[0]}`, `${start} s/d ${end}`);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const importedTransactions: Transaction[] = [];
        let currentYear = new Date().getFullYear();
        let currentMonthNum = new Date().getMonth();

        // Cari baris header untuk menentukan indeks kolom
        let headerRowIndex = -1;
        for (let i = 0; i < json.length; i++) {
          const row = json[i] as any[];
          if (row.includes('Tanggal') && row.includes('Transaksi')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Format file Excel tidak dikenali. Pastikan kolom 'Tanggal' dan 'Transaksi' tersedia.");
        }

        const headers = json[headerRowIndex] as any[];
        const colIdx = {
          date: headers.indexOf('Tanggal'),
          desc: headers.indexOf('Transaksi'),
          income: headers.indexOf('Pemasukan'),
          expense: headers.indexOf('Pengeluaran')
        };

        // Iterasi baris data setelah header
        for (let i = headerRowIndex + 1; i < json.length; i++) {
          const row = json[i] as any[];
          if (!row || row.length === 0) continue;

          // Cek apakah ini baris pemisah "Bulan :"
          if (row[0] && typeof row[0] === 'string' && row[0].includes('Bulan :')) {
            const monthStr = row[1] || row[0].split(':')[1]?.trim();
            // Upayakan deteksi bulan untuk melengkapi tahun jika perlu
            continue;
          }

          // Cek baris "SALDO AKHIR"
          if (row[0] === 'SALDO AKHIR' || (row[1] === 'SALDO AKHIR')) break;

          const dateVal = row[colIdx.date];
          const desc = row[colIdx.desc];
          const income = parseFloat(row[colIdx.income]) || 0;
          const expense = parseFloat(row[colIdx.expense]) || 0;

          if (!desc && income === 0 && expense === 0) continue;

          // Normalisasi Tanggal (Sangat dasar, mengasumsikan format hari atau full date)
          let finalDate = new Date().toISOString().split('T')[0];
          if (dateVal) {
             // Jika hanya angka (tanggal 1-31), kita gunakan bulan/tahun saat ini sebagai fallback
             if (!isNaN(parseInt(dateVal)) && dateVal.toString().length <= 2) {
                const day = parseInt(dateVal).toString().padStart(2, '0');
                finalDate = `${currentYear}-${String(currentMonthNum + 1).padStart(2, '0')}-${day}`;
             } else {
                // Coba parse sebagai tanggal penuh
                const parsedDate = new Date(dateVal);
                if (!isNaN(parsedDate.getTime())) {
                   finalDate = parsedDate.toISOString().split('T')[0];
                }
             }
          }

          importedTransactions.push({
            id: Math.random().toString(36).substr(2, 9),
            date: finalDate,
            description: desc || 'Tanpa Keterangan',
            amount: income > 0 ? income : expense,
            type: income > 0 ? 'income' : 'expense',
            category: income > 0 ? 'Lain-lain' : 'Operasional'
          });
        }

        if (importedTransactions.length === 0) {
          throw new Error("Tidak ada data transaksi yang ditemukan.");
        }

        if (window.confirm(`Berhasil memproses ${importedTransactions.length} transaksi. Ingin mengganti data saat ini?`)) {
          onImport(importedTransactions);
          setMessage({ text: 'Data Excel berhasil diimpor!', type: 'success' });
        }
      } catch (err: any) {
        setMessage({ text: err.message || 'Gagal memproses file Excel.', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Ekspor & Impor Excel</h1>
        <p className="text-gray-500 mt-1">Kelola data keuangan Masjid dengan format tabel Microsoft Excel.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl font-bold text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
           <div className={`p-1 rounded-full text-white ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={message.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}/></svg>
           </div>
           {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
          <div className="p-5 bg-emerald-50 rounded-2xl text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <ExcelIcon className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Rekap Seluruh Data</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Unduh riwayat transaksi lengkap dengan template resmi DKM.</p>
          <button onClick={exportAll} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:bg-emerald-700 transition-all">
            <DownloadIcon className="h-4 w-4" /> Ekspor Excel (.xls)
          </button>
        </div>

        <div 
          onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
          className={`bg-white p-8 rounded-3xl shadow-xl border-2 border-dashed flex flex-col items-center text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <div className="p-5 bg-blue-50 rounded-2xl text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <UploadIcon className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Unggah Data Excel</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Seret file Excel ke sini atau klik tombol untuk mengimpor data.</p>
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg hover:bg-blue-700 transition-all">
            <UploadIcon className="h-4 w-4" /> Pilih File Excel
          </button>
        </div>
      </div>

      <div className="mt-12 bg-slate-800 p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10"><ExcelIcon className="h-48 w-48" /></div>
        <div className="relative z-10">
          <h4 className="text-lg font-black uppercase tracking-widest mb-4">Informasi Penting</h4>
          <ul className="text-slate-300 text-sm space-y-3 list-disc ml-5">
            <li>Fitur <strong>Impor</strong> akan mengganti seluruh data yang ada saat ini.</li>
            <li>Pastikan struktur kolom Excel adalah: <strong>Tanggal, Transaksi, Pemasukan, Pengeluaran, Saldo Akhir</strong>.</li>
            <li>Aplikasi dapat mengenali file (.xls) HTML-Table hasil ekspor sistem ini maupun file (.xlsx) standar.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
