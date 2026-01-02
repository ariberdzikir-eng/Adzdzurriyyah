// PENTING: Ganti nilai-nilai di bawah ini dengan kredensial dari Google Cloud Console Anda.
// Kunjungi https://console.cloud.google.com/ untuk mendapatkannya.

// 1. Buat "API Key" di bawah "APIs & Services" > "Credentials".
export const API_KEY = 'MASUKKAN_API_KEY_ANDA_DI_SINI';

// 2. Buat "OAuth 2.0 Client ID" untuk "Web application".
export const CLIENT_ID = 'MASUKKAN_CLIENT_ID_ANDA_DI_SINI.apps.googleusercontent.com';

// 3. Ini adalah cakupan (scope) yang dibutuhkan aplikasi untuk mengakses Google Drive.
export const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// 4. Nama file untuk backup di Google Drive pengguna.
export const BACKUP_FILE_NAME = 'masjidku_backup_data.json';
