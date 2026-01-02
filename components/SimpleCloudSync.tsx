
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
    } else {
      setStatus('error');
    }
  };

  // Fungsi Ambil (Pull)
  const handlePull = async (silent = false) => {
    if (!syncId) return;
    if (!silent) setStatus('syncing');
    
    const data = await cloudSync.pull(syncId);
    if (data) {
      onRestore(data);
      setLastSync(new Date().toLocaleTimeString('id-ID'));
      setStatus('online');
      window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
    } else if (!silent) {
        setStatus('error');
    }
  };

  // Efek: Auto-Sync saat data berubah
  useEffect(() => {
    const triggerPush = () => {
        if (syncId) handlePush(true);
    };
    window.addEventListener('mosque-data-changed', triggerPush);
    return () => window.removeEventListener('mosque-data-changed', triggerPush);
  }, [syncId]);

  // Efek: Auto-Pull setiap 20 detik (Real-time)
  useEffect(() => {
    if (!syncId) return;
    const interval = setInterval(() => handlePull(true), 20000);
    return () => clearInterval(interval);
  }, [syncId]);

  const saveConfig = () => {
    if (!tempId) return;
    localStorage.setItem('mosque_sync_id', tempId);
    setSyncId(tempId);
    setIsEditing(false);
    handlePull(); // Ambil data awal dari ID baru
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 mt-6 overflow-hidden relative">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cloud Live Sync</h2>
            {status === 'online' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-nowrap">Live - Aktif</span>
                </div>
            )}
        </div>

        {isEditing ? (
            <div className="space-y-4">
                <p className="text-xs text-slate-500">Buat Kode ID unik untuk masjid Anda agar semua pengurus bisa sinkron otomatis.</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Contoh: adzdzurriyyah-2024"
                        value={tempId}
                        onChange={(e) => setTempId(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                    />
                    <button onClick={saveConfig} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest">Set</button>
                </div>
                <p className="text-[10px] text-amber-600 font-bold italic">* Ingat kode ini, masukkan di HP lain untuk sinkronisasi.</p>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase mb-1">ID Sinkronisasi Anda</p>
                        <p className="font-bold text-emerald-700">{syncId}</p>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600 uppercase hover:underline tracking-widest">Ubah ID</button>
                </div>
                
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update: {lastSync || 'Menunggu...'}</p>
                    <div className="flex gap-2">
                        <button onClick={() => handlePush()} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Paksa Simpan"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
                        <button onClick={() => handlePull()} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Muat Data Baru"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    </div>
                </div>
            </div>
        )}

        {status === 'error' && <p className="mt-4 text-[10px] font-bold text-rose-600 uppercase text-center">Gagal menghubungkan ke awan.</p>}
        {status === 'syncing' && <p className="mt-4 text-[10px] font-bold text-blue-600 uppercase text-center animate-pulse">Menyelaraskan data...</p>}
    </div>
  );
};
