
import React, { useState } from 'react';
import { Transaction } from '../types';
import { cloudSync } from '../services/syncService';

interface SimpleCloudSyncProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => void;
}

export const SimpleCloudSync: React.FC<SimpleCloudSyncProps> = ({ transactions, onRestore }) => {
  const [group, setGroup] = useState(localStorage.getItem('mosque_group') || '');
  const [loading, setLoading] = useState(false);

  // METODE 1: LINK AJAIB (TANPA SERVER, PASTI TEMBUS BLOKIR)
  const sendMagicLink = () => {
    const dataStr = JSON.stringify(transactions);
    const encoded = btoa(unescape(encodeURIComponent(dataStr)));
    const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent('Assalamu’alaikum, ini update Laporan Keuangan Masjid terbaru. Silakan klik link ini untuk sinkronisasi data: ' + url)}`;
    window.open(waUrl, '_blank');
  };

  // METODE 2: CLOUD GRUP (OTOMATIS)
  const handleCloud = async (type: 'save' | 'load') => {
    if (!group) return alert("Masukkan Nama Grup!");
    setLoading(true);
    localStorage.setItem('mosque_group', group);
    
    if (type === 'save') {
      const ok = await cloudSync.push(group, transactions);
      alert(ok ? "Tersimpan di Cloud!" : "Gagal! WiFi kantor memblokir Cloud. Gunakan 'Kirim Link WA' saja.");
    } else {
      const { data } = await cloudSync.pull(group);
      if (data) { onRestore(data); alert("Data Cloud Berhasil Dimuat!"); }
      else alert("Data tidak ditemukan atau koneksi diblokir.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mt-10">
      <h2 className="text-lg font-black text-slate-800 uppercase italic mb-4">Sinkronisasi Pengurus</h2>
      
      <div className="space-y-4">
        {/* CARA PALING GAMPANG */}
        <button 
          onClick={sendMagicLink}
          className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.961 1.694 5.854l-.993 3.629 3.861-.982z"/></svg>
          Kirim Link Update ke WA
        </button>

        <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-300 uppercase">Atau Pakai Cloud</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* CARA OTOMATIS (CLOUD) */}
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Nama Grup (cth: masjid123)" 
            value={group}
            onChange={(e) => setGroup(e.target.value.toLowerCase())}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            disabled={loading}
            onClick={() => handleCloud('load')}
            className="px-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-[10px] uppercase border hover:bg-slate-200"
          >
            Tarik
          </button>
          <button 
            disabled={loading}
            onClick={() => handleCloud('save')}
            className="px-4 bg-slate-800 text-white font-bold rounded-xl text-[10px] uppercase hover:bg-slate-900"
          >
            Simpan
          </button>
        </div>
      </div>
      
      <p className="text-[8px] text-slate-400 mt-4 text-center leading-relaxed uppercase font-bold tracking-tighter">
        Tips: Gunakan "Link WA" jika Cloud gagal karena diblokir WiFi kantor.
      </p>
    </div>
  );
};
