
import { Transaction } from '../types';

// Kita menggunakan layanan KV Store gratis atau JSON bin untuk memudahkan user
// Dalam lingkungan produksi, ini bisa diganti dengan Supabase atau Firebase
const BASE_URL = 'https://api.npoint.io'; 

export const cloudSync = {
  // Menyimpan data ke awan berdasarkan ID Unik
  push: async (syncId: string, transactions: Transaction[]) => {
    if (!syncId) return;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactions)
      });
      return response.ok;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    }
  },

  // Mengambil data dari awan
  pull: async (syncId: string): Promise<Transaction[] | null> => {
    if (!syncId) return null;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Pull error:', error);
      return null;
    }
  }
};
