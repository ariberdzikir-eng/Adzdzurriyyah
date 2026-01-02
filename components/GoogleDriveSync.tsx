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
        callback: '', // Callback is handled by the promise flow
      });
      setTokenClient(client);
    };

    // Wait for both scripts to be loaded
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
            setSyncMessage('Gagal melakukan backup. Lihat konsol untuk detail.');
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
        setSyncMessage('File backup tidak ditemukan di Google Drive Anda.');
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
        setSyncMessage('Gagal memulihkan data. Lihat konsol untuk detail.');
    }
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sinkronisasi Google Drive</h2>
        <p className="text-sm text-gray-500 mb-4">Simpan data transaksi Anda dengan aman di Google Drive.</p>
        
        {authState !== 'authenticated' && (
            <button 
                onClick={handleAuthClick}
                disabled={authState === 'pending' || !tokenClient}
                className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
                {authState === 'pending' ? 'Menghubungkan...' : 'Login dengan Google untuk Sinkronisasi'}
            </button>
        )}

        {authState === 'authenticated' && (
            <div className="space-y-4">
                <p className="text-green-600 font-medium text-center bg-green-50 p-3 rounded-lg">Terhubung dengan Google Drive.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={handleBackup} disabled={syncState === 'syncing'} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400">
                        {syncState === 'syncing' ? 'Memproses...' : 'Backup ke Google Drive'}
                    </button>
                    <button onClick={handleRestore} disabled={syncState === 'syncing'} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400">
                        {syncState === 'syncing' ? 'Memproses...' : 'Restore dari Google Drive'}
                    </button>
                </div>
            </div>
        )}

        {syncMessage && (
            <p className={`mt-4 text-center text-sm font-medium p-2 rounded-md ${
                syncState === 'success' ? 'bg-green-100 text-green-800' : 
                syncState === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
                {syncMessage}
            </p>
        )}
    </div>
  );
};
