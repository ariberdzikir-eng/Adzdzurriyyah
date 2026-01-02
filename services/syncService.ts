
import { Transaction } from '../types';

// Bucket ID unik untuk aplikasi Masjid Adz-Dzurriyyah
const BUCKET_ID = '6rG6YvTf2yK7m8m9p8q8w2'; 
const BASE_URL = `https://kvdb.io/${BUCKET_ID}`;

export const cloudSync = {
  // Mengupdate data (Push)
  push: async (syncId: string, transactions: Transaction[]) => {
    if (!syncId) return false;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`, {
        method: 'POST', // KVDB menggunakan POST atau PUT untuk menyimpan
        body: JSON.stringify(transactions)
      });
      return response.ok;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    }
  },

  // Mengambil data (Pull)
  pull: async (syncId: string): Promise<{ data: Transaction[] | null; status: number }> => {
    if (!syncId) return { data: null, status: 0 };
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`);
      if (response.status === 404) {
        return { data: null, status: 404 }; // ID belum ada datanya (masih baru)
      }
      if (!response.ok) return { data: null, status: response.status };
      const data = await response.json();
      return { data, status: 200 };
    } catch (error) {
      console.error('Pull error:', error);
      return { data: null, status: 500 };
    }
  },

  // Diagnosa koneksi sederhana
  testConnection: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/test-connection`, { method: 'POST', body: 'ping' });
      return res.ok;
    } catch (e) {
      return false;
    }
  }
};
