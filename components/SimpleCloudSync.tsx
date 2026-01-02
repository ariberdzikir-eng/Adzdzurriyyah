
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { cloudSync } from '../services/syncService';

interface SimpleCloudSyncProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => void;
}

export const SimpleCloudSync: React.FC<SimpleCloudSyncProps> = ({ transactions, onRestore }) => {
  const [syncId, setSyncId] = useState(localStorage.getItem('mosque_sync_id') || '');
  const [status, setStatus] = useState<'offline' | 'online' | 'syncing' | 'error'>(syncId ? 'online' : 'offline');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!syncId);
  const [tempId, setTempId] = useState(syncId);
  const [errorMsg, setErrorMsg] = useState('');

  const transactionsRef = useRef(transactions);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // Fungsi Simpan (Push)
  const handlePush = async (silent = false) => {
    if (!syncId) return;
    if (!silent) setStatus('syncing');
    
    const success = await cloudSync.push(syncId, transactionsRef.current);
    if (success) {
      setLastSync(new Date().toLocaleTimeString('id-ID'));
      setStatus('online');
      window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
    } else if (!silent) {
      setStatus('error');
      setErrorMsg('Gagal mengirim data. Jaringan mungkin memblokir koneksi.');
    }
  };

  // Fungsi Ambil (Pull)
  const handlePull = async (silent = false) => {
    if (!syncId) return;
    if (!silent) setStatus('syncing');
    
    const { data, status: httpStatus } = await cloudSync.pull(syncId);
    if (httpStatus === 200 && data) {
      onRestore(data);
      setLastSync(new Date().toLocaleTimeString('id-ID'));
      setStatus('online');
      window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
    } else if (httpStatus === 404) {
      // ID Baru: Langsung push data lokal yang ada
      handlePush(silent);
    } else if (!silent) {
      setStatus('error');
      setErrorMsg('Gagal mengambil data dari cloud.');
    }
  };

  // Auto-Sync saat data lokal berubah
  useEffect(() => {
    const handleDataChanged = () => {
        if (syncId && status === 'online') {
            const timer = setTimeout(() => handlePush(true), 1500);
            return () => clearTimeout(timer);
        }
    };
    window.addEventListener('mosque-data-changed', handleDataChanged);
    return () => window.removeEventListener('mosque-data-changed', handleDataChanged);
  }, [syncId, status]);

  // Cek update dari cloud setiap 30 detik
  useEffect(() => {
    if (!syncId) return;
    const interval = setInterval(() => handlePull(true), 30000);
    return () => clearInterval(interval);
  }, [syncId]);

  const handleConnect = async () => {
    const cleanId = tempId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
        alert("Masukkan ID minimal 5 karakter.");
        return;
    }
    
    setStatus('syncing');
    setErrorMsg('');
    
    // Simpan ID
    localStorage.setItem('mosque_sync_id', cleanId);
    setSyncId(cleanId);
    setIsEditing(false);
    
    // Coba tarik data atau buat data baru di cloud
    await handlePull();
  };

  const generateRandomId = () => {
    const random = Math.random().toString(36).substring(2, 8);
    setTempId(`masjid-${random}`);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 relative overflow-hidden transition-all">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Cloud Live Sync v3</h2>
            {status === 'online' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tersambung</span>
                </div>
            )}
        </div>

        {isEditing ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[11px] text-blue-700 font-bold uppercase tracking-wide">PENGATURAN KONEKSI</p>
                    <p className="text-[10px] text-blue-600 mt-1">Ketikkan ID unik (bebas) atau klik tombol acak. Bagikan ID ini ke pengurus lain.</p>
                </div>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Contoh: adz-dzurriyyah-2024"
                        value={tempId}
                        onChange={(e) => setTempId(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                    />
                    <button onClick={handleConnect} className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-50 transform active:scale-95 transition-all">Hubungkan</button>
                </div>
                <button onClick={generateRandomId} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Gunakan ID Acak</button>
            </div>
        ) : (
            <div className="space-y-5 animate-in fade-in duration-500">
                <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID AKTIF SINKRONISASI</p>
                        <p className="font-black text-slate-800 text-2xl tracking-tight">{syncId}</p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-800 tracking-widest bg-blue-50 px-4 py-2 rounded-xl">Ganti ID</button>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Update Terakhir</p>
                        <p className="text-sm font-bold text-slate-600">{lastSync || 'Baru Saja'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handlePush()} className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Simpan Manual
                        </button>
                    </div>
                </div>
            </div>
        )}

        {status === 'error' && (
            <div className="mt-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center">{errorMsg}</p>
                <div className="flex justify-center gap-2">
                    <button onClick={() => handlePull()} className="text-[10px] font-black bg-rose-600 text-white px-4 py-2 rounded-lg uppercase tracking-widest">Coba Lagi</button>
                    <button onClick={() => window.location.reload()} className="text-[10px] font-black bg-slate-200 text-slate-600 px-4 py-2 rounded-lg uppercase tracking-widest">Refresh App</button>
                </div>
            </div>
        )}

        {status === 'syncing' && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 animate-in fade-in">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Sinkronisasi Ke Awan...</p>
            </div>
        )}
    </div>
  );
};
