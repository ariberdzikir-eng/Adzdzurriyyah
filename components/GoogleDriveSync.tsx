
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const gapiLoaded = () => {
      window.gapi.load('client', initializeGapiClient);
    };

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
  };

  const handleAuthClick = () => {
    setAuthState('pending');
    if (tokenClient) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          setAuthState('error');
          throw (resp);
        }
        setAuthState('authenticated');
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
        console.error("Error finding file:", e);
        return null;
    }
  };

  const handleBackup = async () => {
    setSyncState('syncing');
    setSyncMessage('Membuat cadangan data...');
    
    const fileId = await findFileId();
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const fileMetadata = { name: BACKUP_FILE_NAME, mimeType: 'application/json' };
    const fileContent = JSON.stringify(transactions, null, 2);

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
        if (err) {
            console.error(err);
            setSyncState('error');
            setSyncMessage('Gagal melakukan backup. Silakan coba lagi.');
        } else {
            setSyncState('success');
            setSyncMessage(`Data berhasil dicadangkan pada ${new Date().toLocaleString('id-ID')}`);
        }
    });
  };

  const handleRestore = async () => {
    setSyncState('syncing');
    setSyncMessage('Mencari data cadangan...');

    const fileId = await findFileId();
    if (!fileId) {
        setSyncState('error');
        setSyncMessage('File backup tidak ditemukan di Google Drive ini.');
        return;
    }

    setSyncMessage('Mengunduh data...');
    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        
        const restoredTransactions = JSON.parse(response.body);
        onRestore(restoredTransactions);
        
        setSyncState('success');
        setSyncMessage('Data berhasil dipulihkan!');

    } catch (err) {
        console.error(err);
        setSyncState('error');
        setSyncMessage('Gagal memulihkan data.');
    }
  };


  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </div>
        
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-2">Sinkronisasi Awan</h2>
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl mb-6">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                PENTING: Gunakan akun pengurus <span className="underline decoration-2">ariberdzikir@gmail.com</span> agar sinkronisasi data tetap terjaga pada satu penyimpanan.
            </p>
        </div>
        
        {authState !== 'authenticated' && (
            <button 
                onClick={handleAuthClick}
                disabled={authState === 'pending' || !tokenClient}
                className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-black py-4 px-4 rounded-2xl shadow-xl shadow-slate-100 hover:bg-slate-900 transition-all disabled:bg-slate-300 uppercase tracking-widest text-[10px]"
            >
                {authState === 'pending' ? 'Menghubungkan...' : 'Hubungkan ke Google Drive'}
            </button>
        )}

        {authState === 'authenticated' && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="bg-emerald-500 rounded-full p-1"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>
                    <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Akun Terhubung</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleBackup} disabled={syncState === 'syncing'} className="bg-slate-800 text-white font-black py-4 px-2 rounded-2xl hover:bg-slate-900 transition-all disabled:bg-slate-200 uppercase tracking-widest text-[10px]">
                        {syncState === 'syncing' ? '...' : 'Backup'}
                    </button>
                    <button onClick={handleRestore} disabled={syncState === 'syncing'} className="bg-slate-100 text-slate-800 font-black py-4 px-2 rounded-2xl hover:bg-slate-200 transition-all disabled:bg-slate-200 uppercase tracking-widest text-[10px]">
                        {syncState === 'syncing' ? '...' : 'Restore'}
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
