
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { API_KEY, CLIENT_ID, SCOPES, BACKUP_FILE_NAME } from '../googleConfig';

declare const window: any;

interface GoogleDriveSyncProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
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
  
  const isConfigured = CLIENT_ID && !CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');
  const transactionsRef = useRef(transactions);
  
  useEffect(() => { transactionsRef.current = transactions; }, [transactions]);

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
      } catch (err) {
        console.error("GIS Initialization failed", err);
        setAuthState('error');
      }
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
    } catch (err) {
        console.error("GAPI Init Error", err);
    }
  };

  const handleAuthClick = () => {
    if (!isConfigured) {
        setShowHelp(true);
        return;
    }
    
    setAuthState('pending');
    if (tokenClient) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          setAuthState('error');
          setSyncMessage(`Gagal Otorisasi: ${resp.error_description || resp.error}`);
          return;
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
        return response.result.files?.[0]?.id || null;
    } catch (e) { return null; }
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
        delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fileMetadata) + delimiter +
        'Content-Type: application/json\r\n\r\n' + fileContent + close_delim;
    
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
            if (!silent) { setSyncState('error'); setSyncMessage('Gagal sinkronisasi otomatis.'); }
        } else {
            if (!silent) { setSyncState('success'); setSyncMessage(`Sinkron pada ${new Date().toLocaleTimeString()}`); }
        }
    });
  };

  const handleRestore = async (silent = false) => {
    if (authState !== 'authenticated') return;
    if (!silent) { setSyncState('syncing'); setSyncMessage('Mengambil data terbaru...'); }
    const fileId = await findFileId();
    if (!fileId) {
        if (!silent) { setSyncState('error'); setSyncMessage('Belum ada data di awan.'); }
        return;
    }
    try {
        const response = await window.gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        const restoredTransactions = JSON.parse(response.body);
        onRestore(restoredTransactions);
        if (!silent) { setSyncState('success'); setSyncMessage('Data terbaru dimuat!'); }
    } catch (err) {
        if (!silent) { setSyncState('error'); setSyncMessage('Gagal memuat data awan.'); }
    }
  };

  useEffect(() => {
    const triggerAutoBackup = () => handleBackup(true);
    window.addEventListener('mosque-data-changed', triggerAutoBackup);
    return () => window.removeEventListener('mosque-data-changed', triggerAutoBackup);
  }, [authState]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mt-6 overflow-hidden relative">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-2">Penyimpanan Online (Cloud)</h2>
        
        {authState === 'unconfigured' ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl">
                <p className="text-rose-700 font-bold text-sm mb-4">Fitur Online belum dikonfigurasi!</p>
                <p className="text-rose-600 text-xs leading-relaxed mb-6">Error "invalid_client" yang Anda lihat terjadi karena Anda perlu memasukkan <b>Google Client ID</b> milik Anda sendiri di file <code>googleConfig.ts</code>.</p>
                <button 
                    onClick={() => setShowHelp(true)}
                    className="w-full py-3 bg-rose-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100"
                >
                    Lihat Cara Pasang (GRATIS)
                </button>
            </div>
        ) : authState !== 'authenticated' ? (
            <div className="space-y-4">
                <p className="text-xs text-slate-500 mb-4">Gunakan Google Drive Anda untuk sinkronisasi data antar perangkat secara otomatis.</p>
                <button 
                    onClick={handleAuthClick}
                    disabled={authState === 'pending'}
                    className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px]"
                >
                    {authState === 'pending' ? 'Menghubungkan...' : 'Aktifkan Cloud Sync (Login Google)'}
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <div className="bg-emerald-500 rounded-full p-1 animate-pulse"><svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>
                    <p className="text-[10px] text-emerald-700 font-black uppercase tracking-widest">Sistem Sinkron Aktif</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleBackup()} className="bg-slate-800 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Simpan ke Cloud</button>
                    <button onClick={() => handleRestore()} className="bg-slate-100 text-slate-800 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Ambil Data Terbaru</button>
                </div>
            </div>
        )}

        {syncMessage && (
            <p className={`mt-6 text-center text-[10px] font-black uppercase tracking-widest p-3 rounded-xl ${syncState === 'success' ? 'bg-emerald-50 text-emerald-700' : syncState === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>
                {syncMessage}
            </p>
        )}

        {/* Modal Bantuan Setup */}
        {showHelp && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex justify-center items-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-black text-slate-800 uppercase italic">Cara Mengaktifkan Online Sync</h3>
                        <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600 font-black text-2xl">&times;</button>
                    </div>
                    
                    <div className="space-y-6 text-sm text-slate-600">
                        <p>Untuk menghilangkan error <b>invalid_client</b>, Anda harus mendaftarkan aplikasi ini di Google Cloud (Gratis):</p>
                        
                        <ol className="list-decimal ml-5 space-y-4 font-medium">
                            <li>Buka <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a>.</li>
                            <li>Buat <b>Project Baru</b> (Contoh: "Masjid Adz-Dzurriyyah").</li>
                            <li>Cari dan Aktifkan <b>Google Drive API</b>.</li>
                            <li>Masuk ke menu <b>APIs & Services > Credentials</b>.</li>
                            <li>Klik <b>Create Credentials > OAuth Client ID</b>. Pilih "Web Application".</li>
                            <li>Pada bagian <b>Authorized JavaScript origins</b>, masukkan URL aplikasi ini (misalnya: <code>http://localhost:5173</code> atau domain web Anda).</li>
                            <li>Salin <b>Client ID</b> yang didapat, lalu tempel di file <code>googleConfig.ts</code> di aplikasi ini.</li>
                            <li>Klik <b>Create Credentials > API Key</b>, lalu tempel juga di file tersebut.</li>
                        </ol>

                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <p className="text-amber-800 text-xs font-bold uppercase mb-2">💡 Tips</p>
                            <p className="text-amber-700 text-xs">Jika Anda bingung, Anda tetap bisa menggunakan aplikasi ini secara <b>Offline</b>. Data akan otomatis tersimpan di browser ini saja.</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Saya Mengerti</button>
                </div>
            </div>
        )}
    </div>
  );
};
