
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { cloudSync } from '../services/syncService';

interface SimpleCloudSyncProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => void;
}

export const SimpleCloudSync: React.FC<SimpleCloudSyncProps> = ({ transactions, onRestore }) => {
  const [syncId, setSyncId] = useState(localStorage.getItem('mosque_sync_id') || '');
  const [status, setStatus] = useState<'offline' | 'online' | 'syncing' | 'error' | 'new_id'>(syncId ? 'online' : 'offline');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!syncId);
  const [tempId, setTempId] = useState(syncId);

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
      // ID baru, belum ada data di cloud
      setStatus('new_id');
      if (!silent) console.log("ID baru terdeteksi. Silakan simpan data untuk pertama kali.");
    } else if (!silent) {
      setStatus('error');
    }
  };

  // Efek: Auto-Push saat ada perubahan lokal (Hanya jika ID sudah online)
  useEffect(() => {
    const triggerPush = () => {
        if (syncId && (status === 'online' || status === 'new_id')) {
            handlePush(true);
        }
    };
    window.addEventListener('mosque-data-changed', triggerPush);
    return () => window.removeEventListener('mosque-data-changed', triggerPush);
  }, [syncId, status]);

  // Efek: Auto-Pull setiap 30 detik (Real-time)
  useEffect(() => {
    if (!syncId || status === 'new_id') return;
    const interval = setInterval(() => handlePull(true), 30000);
    return () => clearInterval(interval);
  }, [syncId, status]);

  const saveConfig = () => {
    const cleanId = tempId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) return;
    localStorage.setItem('mosque_sync_id', cleanId);
    setSyncId(cleanId);
    setIsEditing(false);
    handlePull(); // Coba tarik data saat ID baru diset
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden relative">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Cloud Live Sync v2</h2>
            {status === 'online' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Terkoneksi</span>
                </div>
            )}
            {status === 'new_id' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-nowrap">ID Baru Tersedia</span>
                </div>
            )}
        </div>

        {isEditing ? (
            <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">Buat/Masukkan Kode ID unik (Hanya huruf & angka). Pengurus lain cukup masukkan kode yang sama.</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Contoh: masjid-adz-dzurriyyah"
                        value={tempId}
                        onChange={(e) => setTempId(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                    />
                    <button onClick={saveConfig} className="px-6 py-3 bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-slate-100 transform active:scale-95 transition-all">SET ID</button>
                </div>
            </div>
        ) : (
            <div className="space-y-5">
                <div className="bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-100 group">
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID AKTIF</p>
                        <p className="font-black text-slate-800 text-lg tracking-tight">{syncId}</p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-800 tracking-widest bg-blue-50 px-3 py-2 rounded-lg transition-colors">Ubah ID</button>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Terakhir</p>
                        <p className="text-sm font-bold text-slate-600">{lastSync || 'Menunggu Sinkron...'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handlePush()} className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" title="Simpan ke Cloud">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Simpan
                        </button>
                        <button onClick={() => handlePull()} className="p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" title="Ambil dari Cloud">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Muat
                        </button>
                    </div>
                </div>
            </div>
        )}

        {status === 'error' && (
            <div className="mt-6 bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col items-center gap-2">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center">Gagal menghubungkan ke awan.</p>
                <button onClick={() => handlePull()} className="text-[10px] font-black bg-rose-600 text-white px-4 py-2 rounded-lg uppercase tracking-widest">Coba Lagi</button>
            </div>
        )}
        
        {status === 'new_id' && (
            <div className="mt-6 bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center leading-relaxed">
                    ID "{syncId}" Masih Kosong. <br/>
                    Klik <span className="text-emerald-600">Simpan</span> untuk mengunggah data pertama kali.
                </p>
            </div>
        )}

        {status === 'syncing' && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sinkronisasi...</p>
                </div>
            </div>
        )}
    </div>
  );
};
