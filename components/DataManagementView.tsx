
import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { DownloadIcon, UploadIcon, JsonIcon } from './icons';

interface DataManagementViewProps {
  transactions: Transaction[];
  onImport: (restoredTransactions: Transaction[]) => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ transactions, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `Data_Masjid_AdzDzurriyyah_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setMessage({ text: 'Data berhasil diekspor ke file JSON.', type: 'success' });
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setMessage({ text: 'Mohon unggah file dengan format .json', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Basic validation: must be an array
        if (!Array.isArray(json)) {
           throw new Error('Format JSON tidak valid (bukan array transaksi).');
        }

        if (window.confirm(`Berhasil membaca ${json.length} transaksi. Apakah Anda yakin ingin mengganti data saat ini dengan data dari file ini?`)) {
          onImport(json);
          setMessage({ text: 'Data berhasil diimpor!', type: 'success' });
        }
      } catch (err) {
        setMessage({ text: 'Gagal menguraikan file JSON. Pastikan formatnya benar.', type: 'error' });
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Manajemen Data JSON</h1>
        <p className="text-gray-500 mt-1">Ekspor dan impor data cadangan dalam format standar JSON.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
          message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
          'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          <div className={`p-1 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : message.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'} text-white`}>
            {message.type === 'success' ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          </div>
          <span className="font-bold text-sm uppercase tracking-wide">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
          <div className="p-5 bg-blue-50 rounded-2xl text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <DownloadIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Ekspor ke JSON</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Unduh semua data transaksi saat ini ke dalam satu file JSON untuk disimpan secara lokal di perangkat Anda.</p>
          <button 
            onClick={handleExportJSON}
            className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transform active:scale-95 transition-all"
          >
            Download File JSON
          </button>
        </div>

        {/* Import Card */}
        <div 
          className={`bg-white p-8 rounded-3xl shadow-xl border-2 border-dashed flex flex-col items-center text-center transition-all ${
            dragActive ? 'border-emerald-500 bg-emerald-50 shadow-2xl scale-[1.02]' : 'border-gray-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className={`p-5 rounded-2xl mb-6 transition-all ${dragActive ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-50 text-emerald-600'}`}>
            <UploadIcon className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Impor dari JSON</h3>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Tarik file JSON cadangan ke sini atau klik tombol di bawah untuk memulihkan data transaksi.</p>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".json,application/json" 
            onChange={handleChange} 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transform active:scale-95 transition-all"
          >
            Pilih File & Upload
          </button>
        </div>
      </div>

      <div className="mt-12 bg-amber-50 p-6 rounded-3xl border border-amber-100">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-200 text-amber-700 rounded-lg">
             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <h4 className="font-black text-amber-800 uppercase tracking-widest text-xs mb-1">Panduan Penggunaan</h4>
            <ul className="text-amber-700 text-sm space-y-2 list-disc ml-4 font-medium">
              <li>Ekspor data secara rutin sebagai cadangan di luar penyimpanan cloud.</li>
              <li>Pastikan file yang diimpor adalah file JSON murni hasil ekspor dari aplikasi ini.</li>
              <li>Aksi Impor akan <strong>mengganti seluruh data transaksi</strong> yang ada saat ini di perangkat ini.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
