
import { GoogleGenAI } from "@google/genai";
import type { Transaction } from '../types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateFinancialSummary = async (transactions: Transaction[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API_KEY environment variable not set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const transactionData = transactions.slice(0, 20).map(t => 
    `- ${t.date}: ${t.description} (${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}) - ${formatCurrency(t.amount)}`
  ).join('\n');

  const prompt = `
Anda adalah asisten keuangan masjid yang transparan dan amanah. 
Berdasarkan data transaksi berikut, buatlah ringkasan singkat untuk para Donatur.

Tujuan: Memberikan kepercayaan bahwa dana dikelola dengan baik.
Poin utama:
1. Ringkasan saldo saat ini.
2. Tren pemasukan/pengeluaran singkat.
3. Kalimat apresiasi singkat kepada donatur.

Data Transaksi Terakhir:
${transactionData}

Berikan jawaban dalam Bahasa Indonesia yang sopan dan menyejukkan. Maksimal 3-4 kalimat.
Jangan gunakan salam pembuka/penutup formal yang berlebihan.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Ringkasan belum tersedia.";
  } catch (error) {
    console.error("Error generating financial summary:", error);
    return "Terjadi kesalahan saat membuat ringkasan otomatis.";
  }
};
