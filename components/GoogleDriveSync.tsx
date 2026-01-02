
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { API_KEY, CLIENT_ID, SCOPES, BACKUP_FILE_NAME } from '../googleConfig';

declare const window: any;

interface GoogleDriveSyncProps {
  transactions: Transaction[];
  onRestore: (transactions: Transaction[]) => void;
}

type AuthState = 'idle' | 'pending' | 'authenticated' | 'error' | 'unconfigured';
type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ transactions, onRestore }) => {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const isConfigured = CLIENT_ID && !CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');
  const transactionsRef = useRef(transactions);
  const lastCloudModifiedRef = useRef<string | null>(null);
  
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  // Load Scripts & GAPI
  useEffect(() => {
    if (!isConfigured) {
        setAuthState('unconfigured');
        return;
    }

    const gapiLoaded = () => { window.gapi.load('client', initializeGapiClient); };
    const gisLoaded = () => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', 
        });
        setTokenClient(client);
      } catch (err) { setAuthState('error'); }
    };

    const checkScripts = setInterval(() => {
        if (window.gapi && window.google) {
            clearInterval(checkScripts);
            gapiLoaded();
            gisLoaded();
        }
    }, 100);
    return () => clearInterval(checkScripts);
  }, [isConfigured]);

  const initializeGapiClient = async () => {
    try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        
        const token = sessionStorage.getItem('gdrive_token');
        if (token) {
            window.gapi.client.setToken({ access_token: token });
            setAuthState('authenticated');
            window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
            handleRestore(true);
        }
    } catch (err) { console.error(err); }
  };

  const handleAuthClick = () => {
    if (!isConfigured) { setShowHelp(true); return; }
    setAuthState('pending');
    if (tokenClient) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) { setAuthState('error'); return; }
        sessionStorage.setItem('gdrive_token', resp.access_token);
        setAuthState('authenticated');
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        handleRestore(true);
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const findFileMetadata = async (): Promise<{id: string, modifiedTime: string} | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
            fields: 'files(id, modifiedTime)',
            spaces: 'drive'
        });
        const file = response.result.files?.[0];
        return file ? { id: file.id, modifiedTime: file.modifiedTime } : null;
    } catch (e) { return null; }
  };

  const handleBackup = async (silent = false) => {
    if (authState !== 'authenticated') return;
    if (!silent) { setSyncState('syncing'); setSyncMessage('Mengunggah data...'); }
    window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'syncing' }));
    
    const meta = await findFileMetadata();
    const fileId = meta?.id;
    
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    const fileMetadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json' };
    const fileContent = JSON.stringify(transactionsRef.current, null, 2);

    const multipartRequestBody =
        delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata) + delimiter +
        'Content-Type: application/json\r\n\r\n' + fileContent + close_delim;
    
    const request = window.gapi.client.request({
        path: `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
        method: fileId ? 'PATCH' : 'POST',
        params: { uploadType: 'multipart', fields: 'id, modifiedTime' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody,
    });

    request.execute((file: any) => {
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        if (file && file.modifiedTime) {
            lastCloudModifiedRef.current = file.modifiedTime;
            setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
            if (!silent) { setSyncState('success'); setSyncMessage('Data aman di Cloud.'); }
        } else {
            if (!silent) { setSyncState('error'); setSyncMessage('Sinkronisasi gagal.'); }
        }
    });
  };

  const handleRestore = async (silent = false) => {
    if (authState !== 'authenticated') return;
    const meta = await findFileMetadata();
    if (!meta) return;

    // Hanya unduh jika data di Cloud lebih baru dari yang kita punya
    if (silent && meta.modifiedTime === lastCloudModifiedRef.current) {
        return; 
    }

    if (!silent) { setSyncState('syncing'); setSyncMessage('Mengunduh data terbaru...'); }
    window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'syncing' }));

    try {
        const response = await window.gapi.client.drive.files.get({ fileId: meta.id, alt: 'media' });
        const restoredData = JSON.parse(response.body);
        onRestore(restoredData);
        lastCloudModifiedRef.current = meta.modifiedTime;
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        if (!silent) { setSyncState('success'); setSyncMessage('Data Cloud berhasil dimuat.'); }
    } catch (err) {
        if (!silent) { setSyncState('error'); setSyncMessage('Gagal memuat data Cloud.'); }
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
    }
  };

  // 1. AUTO-SAVE: Jalankan setiap ada perubahan lokal
  useEffect(() => {
    const triggerAutoBackup = () => {
        // Debounce kecil agar tidak terlalu sering hit API jika input cepat
        const timer = setTimeout(() => handleBackup(true), 1500);
        return () => clearTimeout(timer);
    };
    window.addEventListener('mosque-data-changed', triggerAutoBackup);
    return () => window.removeEventListener('mosque-data-changed', triggerAutoBackup);
  }, [authState]);

  // 2. AUTO-POLLING: Cek data baru dari browser lain setiap 30 detik
  useEffect(() => {
    if (authState !== 'authenticated') return;
    const pollInterval = setInterval(() => handleRestore(true), 30000);
    return () => clearInterval(pollInterval);
  }, [authState]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden relative">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Status Koneksi Online</h2>
                {lastSyncTime && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Update Terakhir: {lastSyncTime}</p>
                )}
            </div>
            {authState === 'authenticated' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sinkron Aktif</span>
                </div>
            )}
        </div>
        
        {authState === 'unconfigured' ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                <p className="text-rose-700 font-bold text-sm mb-4">Fitur Sinkron Otomatis Belum Siap!</p>
                <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-rose-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px]">Siapkan Sekarang (GRATIS)</button>
            </div>
        ) : authState !== 'authenticated' ? (
            <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">Aktifkan untuk sinkronisasi data antar HP/Laptop pengurus secara otomatis melalui Google Drive.</p>
                <button onClick={handleAuthClick} disabled={authState === 'pending'} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px]">
                    {authState === 'pending' ? 'Menghubungkan...' : 'Mulai Sinkronisasi (Login Google)'}
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBackup()} disabled={syncState === 'syncing'} className="bg-slate-800 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-900">Simpan Paksa</button>
                <button onClick={() => handleRestore()} disabled={syncState === 'syncing'} className="bg-slate-100 text-slate-800 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Muat Ulang</button>
            </div>
        )}

        {syncMessage && (
            <p className={`mt-6 text-center text-[10px] font-black uppercase tracking-widest p-3 rounded-xl ${syncState === 'success' ? 'bg-emerald-50 text-emerald-700' : syncState === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                {syncMessage}
            </p>
        )}

        {/* Modal Help Setup (Sama seperti sebelumnya) */}
        {showHelp && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-6">Cara Aktifkan Online Mode</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                        <ol className="list-decimal ml-5 space-y-3">
                            <li>Buka <b>Google Cloud Console</b>.</li>
                            <li>Buat Project dan aktifkan <b>Google Drive API</b>.</li>
                            <li>Buat <b>OAuth Client ID</b> (Web App).</li>
                            <li>Masukkan URL aplikasi ini di <b>Authorized JavaScript origins</b>.</li>
                            <li>Salin Client ID ke <code>googleConfig.ts</code>.</li>
                        </ol>
                        <p className="bg-amber-50 p-4 rounded-xl text-amber-800 text-xs italic font-medium">Jika ini sudah dilakukan, data Anda akan tersinkron otomatis setiap kali ada yang menginput di browser manapun.</p>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Tutup</button>
                </div>
            </div>
        )}
    </div>
  );
};
