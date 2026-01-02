
import { Transaction } from '../types';

// Pantry ID unik untuk Masjid Adz-Dzurriyyah
const PANTRY_ID = '3e8e2b83-9b93-4a12-874e-7b7e8d2e6f9a'; 
const BASE_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket`;

export const cloudSync = {
  // Simpan data (Push) - Pantry menggunakan POST untuk membuat/update basket
  push: async (syncId: string, transactions: Transaction[]) => {
    if (!syncId) return false;
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      });
      return response.ok;
    } catch (error) {
      console.error('Push error:', error);
      return false;
    }
  },

  // Ambil data (Pull)
  pull: async (syncId: string): Promise<{ data: Transaction[] | null; status: number }> => {
    if (!syncId) return { data: null, status: 0 };
    try {
      const response = await fetch(`${BASE_URL}/${syncId}`);
      if (response.status === 404) return { data: null, status: 404 };
      if (!response.ok) return { data: null, status: response.status };
      const result = await response.json();
      return { data: result.transactions || null, status: 200 };
    } catch (error) {
      console.error('Pull error:', error);
      return { data: null, status: 500 };
    }
  },

  // Cek apakah internet kantor memblokir server ini
  checkNetwork: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}`, { 
        method: 'GET',
        signal: controller.signal 
      });
      clearTimeout(id);
      return res.ok;
    } catch (e) {
      return false;
    }
  }
};
