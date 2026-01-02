
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { API_KEY, CLIENT_ID, SCOPES, BACKUP_FILE_NAME } from '../googleConfig';

declare const window: any;

interface GoogleDriveSyncProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  onRestore: (transactions: Transaction[]) => void;
}

type AuthState = 'idle' | 'pending' | 'authenticated' | 'error';
type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ transactions, onRestore }) => {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  const transactionsRef = useRef(transactions);
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

  useEffect(() => {
    const gapiLoaded = () => { window.gapi.load('client', initializeGapiClient); };
    const gisLoaded = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', 
      });
      setTokenClient(client);
    };

    const checkScripts = setInterval(() => {
        if (window.gapi && window.google) {
            clearInterval(checkScripts);
            gapiLoaded();
            gisLoaded();
        }
    }, 100);
    return () => clearInterval(checkScripts);
  }, []);

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    
    // Cek apakah token masih valid di session
    const token = sessionStorage.getItem('gdrive_token');
    if (token) {
        window.gapi.client.setToken({ access_token: token });
        setAuthState('authenticated');
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        // Auto-fetch data terbaru saat startup
        handleRestore(true);
    }
  };

  const handleAuthClick = () => {
    setAuthState('pending');
    if (tokenClient) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          setAuthState('error');
          throw (resp);
        }
        sessionStorage.setItem('gdrive_token', resp.access_token);
        setAuthState('authenticated');
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        handleRestore(true);
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const findFileId = async (): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        if (response.result.files && response.result.files.length > 0) {
            return response.result.files[0].id;
        }
        return null;
    } catch (e) {
        return null;
    }
  };

  const handleBackup = async (silent = false) => {
    if (authState !== 'authenticated') return;
    
    if (!silent) {
        setSyncState('syncing');
        setSyncMessage('Sinkronisasi data ke awan...');
    }
    window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'syncing' }));
    
    const fileId = await findFileId();
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const fileMetadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json' };
    const fileContent = JSON.stringify(transactionsRef.current, null, 2);

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;
    
    const request = window.gapi.client.request({
        path: `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
        method: fileId ? 'PATCH' : 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody,
    });

    request.execute((file: any, err: any) => {
        window.dispatchEvent(new CustomEvent('mosque-cloud-status', { detail: 'online' }));
        if (err) {
            if (!silent) {
                setSyncState('error');
                setSyncMessage('Gagal sinkronisasi otomatis.');
            }
        } else {
            if (!silent) {
                setSyncState('success');
                setSyncMessage(`Data sinkron pada ${new Date().toLocaleTimeString()}`);
            }
        }
    });
  };

  const handleRestore = async (silent = false) => {
    if (authState !== 'authenticated') return;
    
    if (!silent) {
        setSyncState('syncing');
        setSyncMessage('Mengambil data terbaru dari awan...');
    }
    
    const fileId = await findFileId();
    if (!fileId) {
        if (!silent) {
            setSyncState('error');
            setSyncMessage('Belum ada data di awan.');
        }
        return;
    }

    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const restoredTransactions = JSON.parse(response.body);
        onRestore(restoredTransactions);
        
        if (!silent) {
            setSyncState('success');
            setSyncMessage('Data terbaru berhasil dimuat!');
        }
    } catch (err) {
        if (!silent) {
            setSyncState('error');
            setSyncMessage('Gagal memuat data dari awan.');
        }
    }
  };

  // Listen for local changes to trigger auto-backup
  useEffect(() => {
    const triggerAutoBackup = () => handleBackup(true);
    window.addEventListener('mosque-data-changed', triggerAutoBackup);
    return () => window.removeEventListener('mosque-data-changed', triggerAutoBackup);
  }, [authState]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-2">Cloud Auto-Sync</h2>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl mb-6">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-relaxed">
                STATUS: {authState === 'authenticated' ? 'AKTIF - DATA ANDA DISIMPAN KE CLOUD SETIAP KALI DIINPUT' : 'TIDAK AKTIF - DATA HANYA TERSIMPAN DI BROWSER INI'}
            </p>
        </div>
        
        {authState !== 'authenticated' && (
            <button 
                onClick={handleAuthClick}
                disabled={authState === 'pending' || !tokenClient}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:bg-slate-300 uppercase tracking-widest text-[10px]"
            >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545 11.033v3.199h4.488c-.176 1.137-1.282 3.315-4.488 3.315-2.767 0-5.023-2.292-5.023-5.114s2.256-5.114 5.023-5.114c1.572 0 2.624.662 3.226 1.242l2.536-2.446C16.669 4.604 14.809 3.867 12.545 3.867 7.742 3.867 3.867 7.742 3.867 12.545s3.875 8.678 8.678 8.678c4.987 0 8.329-3.51 8.329-8.475 0-.569-.062-1.003-.138-1.437h-8.191z"/></svg>
                Aktifkan Sistem Online (Login Google)
            </button>
        )}

        {authState === 'authenticated' && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="bg-emerald-500 rounded-full p-1"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>
                    <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Sistem Online & Terkoneksi</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleBackup()} disabled={syncState === 'syncing'} className="bg-slate-800 text-white font-black py-4 px-2 rounded-2xl hover:bg-slate-900 transition-all disabled:bg-slate-200 uppercase tracking-widest text-[10px]">
                        Paksa Simpan (Cloud)
                    </button>
                    <button onClick={() => handleRestore()} disabled={syncState === 'syncing'} className="bg-slate-100 text-slate-800 font-black py-4 px-2 rounded-2xl hover:bg-slate-200 transition-all disabled:bg-slate-200 uppercase tracking-widest text-[10px]">
                        Ambil Data Terbaru
                    </button>
                </div>
            </div>
        )}

        {syncMessage && (
            <p className={`mt-6 text-center text-[10px] font-black uppercase tracking-widest p-3 rounded-xl ${
                syncState === 'success' ? 'bg-emerald-50 text-emerald-700' : 
                syncState === 'error' ? 'bg-rose-50 text-rose-700' :
                'bg-sky-50 text-sky-700'
            }`}>
                {syncMessage}
            </p>
        )}
    </div>
  );
};
