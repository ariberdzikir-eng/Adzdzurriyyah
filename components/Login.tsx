
import React from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="w-full max-w-md p-10 space-y-8 bg-white rounded-3xl shadow-2xl border border-emerald-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        
        <div className="flex justify-center">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                <svg className="h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.95l.007-.005a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828l-.005.007a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828z" />
                </svg>
            </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Masjid <span className="text-emerald-600">Adzdzurriyyah</span>
          </h1>
          <p className="mt-3 text-gray-500 font-medium">
            Sistem Informasi Keuangan Masjid Terbuka & Amanah
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Nama Pengguna</label>
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" 
              placeholder="admin"
              defaultValue="admin"
            />
          </div>
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Kata Sandi</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" 
              placeholder="••••••••"
              defaultValue="password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-4 px-4 text-white bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transition-all shadow-lg shadow-emerald-100 transform active:scale-[0.98]"
          >
            Masuk ke Dashboard
          </button>
        </form>

        <div className="pt-6 border-t border-gray-50">
            <p className="text-xs text-gray-400">
                &copy; 2024 Manajemen Kas Masjid Adzdzurriyyah. Digunakan untuk keperluan transparansi umat.
            </p>
        </div>
      </div>
    </div>
  );
};
