
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { cloudSync } from '../services/syncService';

interface SimpleCloudSyncProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => void;
}

export const SimpleCloudSync: React.FC<SimpleCloudSyncProps> = ({ transactions, onRestore }) => {
  const [groupName, setGroupName] = useState(localStorage.getItem('mosque_group_name') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkOk, setNetworkOk] = useState<boolean | null>(null);
  
  const transactionsRef = useRef(transactions);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // 1. CEK JARINGAN & AUTO-PULL
  useEffect(() => {
    cloudSync.checkNetwork().then(setNetworkOk);
    
    // Jika ada nama grup, otomatis tarik data terbaru setiap 30 detik
    if (groupName) {
      const interval = setInterval(autoPull, 30000);
      return () => clearInterval(interval);
    }
  }, [groupName]);

  const autoPull = async () => {
    const { data } = await cloudSync.pull(groupName);
    if (data && JSON.stringify(data) !== JSON.stringify(transactionsRef.current)) {
      onRestore(data);
    }
  };

  const handleSaveGroup = () => {
    if (!groupName) return;
    localStorage.setItem('mosque_group_name', groupName);
    handlePush();
    alert(`Grup "${groupName}" Aktif! Gunakan nama yang sama di HP pengurus lain.`);
  };

  const handlePush = async () => {
    setIsSyncing(true);
    const ok = await cloudSync.push(groupName, transactionsRef.current);
    setIsSyncing(false);
    if (ok) alert("Data berhasil disimpan ke Cloud!");
    else alert("Gagal! Sepertinya WiFi kantor memblokir akses Cloud. Gunakan tombol 'Kirim via WA'.");
  };

  // 2. FITUR KIRIM WA (Paling Simpel - Seperti Kirim Foto)
  const shareToWA = async () => {
    const dataStr = JSON.stringify(transactions);
    const file = new File([dataStr], `Data_Masjid_${new Date().toLocaleDateString('id-ID')}.json`, { type: 'application/json' });

    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: 'Data Keuangan Masjid',
        });
      } catch (e) { console.log('Share cancelled'); }
    } else {
      // Fallback download jika di laptop
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          onRestore(data);
          alert("Berhasil! Data dari WA telah dimuat.");
        }
      } catch (err) { alert("File tidak valid."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800 uppercase italic">Sinkronisasi Grup</h2>
        <div className={`w-3 h-3 rounded-full ${networkOk ? 'bg-emerald-500' : 'bg-rose-500'}`} title={networkOk ? 'Cloud Ready' : 'WiFi Kantor Memblokir'}></div>
      </div>

      <div className="space-y-6">
        {/* Input Nama Grup */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Grup Pengurus</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Contoh: masjid-dzurriyyah" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              className="flex-1 bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleSaveGroup} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Set</button>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Data akan tersinkron otomatis bagi siapa pun yang menggunakan nama grup ini.</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handlePush} 
            disabled={!groupName || isSyncing}
            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-100'}`}
          >
            {isSyncing ? 'Menyimpan...' : 'Simpan ke Cloud'}
          </button>

          <button 
            onClick={shareToWA} 
            className="bg-emerald-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884 0 2.225.569 3.961 1.694 5.854l-.993 3.629 3.861-.982zM16.598 14.37c-.312-.156-1.85-.912-2.134-1.017-.286-.105-.494-.156-.701.156-.207.312-.803 1.017-.984 1.223-.18.207-.362.233-.674.078-.312-.156-1.316-.484-2.508-1.548-.928-.827-1.554-1.849-1.735-2.162-.18-.312-.019-.481.137-.636.141-.141.312-.365.468-.546.156-.182.208-.312.312-.52.105-.207.052-.39-.026-.546-.078-.156-.701-1.693-.961-2.317-.253-.608-.51-.524-.701-.534-.18-.01-.39-.01-.598-.01-.207 0-.546.078-.831.39-.286.312-1.091 1.067-1.091 2.6 0 1.533 1.117 3.016 1.273 3.223.156.207 2.197 3.355 5.323 4.706.743.322 1.325.515 1.777.659.748.237 1.428.204 1.967.123.6-.091 1.85-.756 2.108-1.485.257-.728.257-1.352.181-1.485-.077-.13-.284-.208-.596-.364z"/></svg>
            Kirim ke WA
          </button>
        </div>

        {/* Tombol Terima Data dari WA */}
        <label className="block w-full text-center py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer border border-dashed border-slate-300">
          Muat Data dari File WA
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>
      </div>
    </div>
  );
};
