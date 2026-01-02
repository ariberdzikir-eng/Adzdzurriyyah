import { Transaction } from './types';

export const INCOME_CATEGORIES = ['Donasi', 'Infaq', 'Sumbangan Acara', 'Zakat', 'Lain-lain'];
export const EXPENSE_CATEGORIES = ['Operasional', 'Listrik & Air', 'Gaji Staff', 'Perbaikan', 'Acara Keagamaan', 'Lain-lain'];
export const TRANSFER_CATEGORIES = ['Kas Umum ke Dana Pembangunan', 'Kas Umum ke Dana Zakat', 'Dana Acara ke Kas Umum'];


export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-07-01', description: 'Donasi Hamba Allah', amount: 500000, type: 'income', category: 'Donasi' },
  { id: '2', date: '2024-07-01', description: 'Pembelian Karpet Baru', amount: 1200000, type: 'expense', category: 'Perbaikan' },
  { id: '3', date: '2024-07-03', description: 'Infaq Kotak Amal Jumat', amount: 750000, type: 'income', category: 'Infaq' },
  { id: '4', date: '2024-07-05', description: 'Biaya Listrik & Air', amount: 450000, type: 'expense', category: 'Listrik & Air' },
  { id: '5', date: '2024-07-07', description: 'Sumbangan Idul Adha', amount: 2500000, type: 'income', category: 'Sumbangan Acara' },
  { id: '6', date: '2024-07-10', description: 'Perbaikan Atap Bocor', amount: 800000, type: 'expense', category: 'Perbaikan' },
  { id: '7', date: '2024-07-12', description: 'Infaq Pengajian Rutin', amount: 300000, type: 'income', category: 'Infaq' },
  { id: '8', date: '2024-07-15', description: 'Gaji Marbot & Imam', amount: 2000000, type: 'expense', category: 'Gaji Staff' },
  { id: '9', date: '2024-07-18', description: 'Pindah buku ke dana renovasi', amount: 1000000, type: 'transfer', category: 'Kas Umum ke Dana Pembangunan' },
];
