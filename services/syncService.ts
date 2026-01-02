
import { Transaction } from '../types';

// Menggunakan KVDB.io - Layanan Key-Value storage yang sangat simpel
// Kita gunakan prefix 'masjid_sync_' agar ID tidak bentrok dengan aplikasi lain
const BASE_URL = 'https://kvdb.io/6rG6YvTf2yK7m8m9p8q8w2'; // Bucket ID publik untuk aplikasi ini

export const cloudSync = {
  // Menyimpan data ke awan
  push: async (syncId: string, transactions: Transaction[]) => {
    if (!syncId) return false;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`, {
        method: 'POST', // KVDB mendukung POST untuk menyimpan data
        body: JSON.stringify(transactions)
      });
      return response.ok;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    }
  },

  // Mengambil data dari awan
  pull: async (syncId: string): Promise<{ data: Transaction[] | null; status: number }> => {
    if (!syncId) return { data: null, status: 0 };
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`);
      if (response.status === 404) {
        return { data: null, status: 404 }; // ID belum pernah dipakai (Bukan error)
      }
      if (!response.ok) return { data: null, status: response.status };
      const data = await response.json();
      return { data, status: 200 };
    } catch (error) {
      console.error('Pull error:', error);
      return { data: null, status: 500 };
    }
  }
};
