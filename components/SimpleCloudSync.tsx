
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

  // 1. BAGIKAN LINK GRUP (SANGAT PENDEK)
  const shareGroupLink = () => {
    if (!group) return alert("Beri nama grup dulu (misal: adz-dzurriyyah)");
    localStorage.setItem('mosque_group', group);
    const shortLink = `${window.location.origin}${window.location.pathname}#g=${group}`;
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent('Assalamu’alaikum, klik link ini untuk masuk ke Grup Laporan Keuangan Masjid: ' + shortLink)}`;
    window.open(waUrl, '_blank');
  };

  // 2. KIRIM FILE VIA WA (SOLUSI ANTI-BLOKIR 100%)
  const shareAsFile = async () => {
    const dataStr = JSON.stringify(transactions);
    const file = new File([dataStr], `Data_Masjid_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.json`, { type: 'application/json' });
    
    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Data Keuangan Masjid',
          text: 'Berikut lampiran file data keuangan terbaru.'
        });
      } catch (e) { console.log('Share canceled'); }
    } else {
      // Fallback: Download file
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      alert("File telah diunduh. Silakan kirim file tersebut ke grup WhatsApp pengurus.");
    }
  };

  const handleCloud = async (type: 'save' | 'load') => {
    if (!group) return alert("Masukkan Nama Grup!");
    setLoading(true);
    localStorage.setItem('mosque_group', group);
    
    if (type === 'save') {
      const ok = await cloudSync.push(group, transactions);
      if (ok) alert("Data tersimpan di Cloud!");
      else alert("WiFi kantor memblokir Cloud. Gunakan tombol 'Kirim File via WA' saja.");
    } else {
      const { data } = await cloudSync.pull(group);
      if (data) { onRestore(data); alert("Data berhasil dimuat!"); }
      else alert("Data tidak ditemukan atau koneksi diblokir.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mt-10">
      <h2 className="text-xl font-black text-slate-800 uppercase italic mb-6">Sinkronisasi Antar Pengurus</h2>
      
      <div className="space-y-6">
        {/* INPUT GRUP */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Grup Pengurus</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Contoh: masjid-kita" 
              value={group}
              onChange={(e) => setGroup(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => { localStorage.setItem('mosque_group', group); alert('Nama Grup Disimpan!'); }} className="bg-slate-800 text-white px-5 rounded-xl font-black text-[10px] uppercase">Set</button>
          </div>
        </div>

        {/* PILIHAN UTAMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={shareGroupLink}
            className="flex items-center justify-center gap-3 p-5 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Bagikan Link Grup
          </button>

          <button 
            onClick={shareAsFile}
            className="flex items-center justify-center gap-3 p-5 bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.15-.669.15-.198.3-.77.97-.943 1.171-.173.201-.347.225-.648.075-.3-.15-1.265-.467-2.41-1.487-.893-.797-1.495-1.782-1.67-2.081-.173-.299-.018-.462.13-.61.137-.133.301-.351.451-.527.15-.176.198-.299.299-.499.102-.199.05-.374-.025-.525-.075-.15-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.299-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.767-.721 2.016-1.42.247-.699.247-1.296.174-1.42-.072-.124-.267-.199-.57-.348zM12.067 0C5.412 0 0 5.412 0 12.067c0 2.128.55 4.125 1.513 5.867L.03 24l6.233-1.636a12.003 12.003 0 005.804 1.503c6.656 0 12.068-5.412 12.068-12.067C24.067 5.412 18.724 0 12.067 0z"/></svg>
            Kirim File via WA
          </button>
        </div>

        {/* TOMBOL SYNC MANUAL (CLOUD) */}
        <div className="flex gap-2 pt-2">
          <button onClick={() => handleCloud('load')} disabled={loading} className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-[9px] uppercase tracking-tighter border border-slate-200">Ambil Data Cloud</button>
          <button onClick={() => handleCloud('save')} disabled={loading} className="flex-1 py-3 bg-slate-800 text-white font-black rounded-xl text-[9px] uppercase tracking-tighter">Simpan ke Cloud</button>
        </div>
      </div>
    </div>
  );
};
