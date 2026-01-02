
import React from 'react';
import { HomeIcon, ReportsIcon, LogoutIcon, IncomeIcon, ExpenseIcon, TransferIcon, SettingsIcon } from './icons';

type View = 'dashboard' | 'income' | 'expense' | 'transfer' | 'reports' | 'category-settings';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    return (
        <li
            onClick={onClick}
            className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-all ${
                isActive
                ? 'bg-blue-600 text-white shadow-lg translate-x-1'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
        >
            {icon}
            <span className="ml-4 font-semibold">{label}</span>
        </li>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  return (
    <aside className="w-64 bg-white p-6 shadow-xl flex flex-col justify-between shrink-0">
        <div>
            <div className="flex items-center space-x-3 mb-10">
                <div className="p-2 bg-blue-600 rounded-xl shrink-0">
                     <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.95l.007-.005a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828l-.005.007a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828z" />
                    </svg>
                </div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">Masjid <br/><span className="text-blue-600">Adzdzurriyyah</span></h1>
            </div>

            <nav>
                <ul>
                    <NavItem
                        icon={<HomeIcon className="h-6 w-6" />}
                        label="Dashboard"
                        isActive={currentView === 'dashboard'}
                        onClick={() => setCurrentView('dashboard')}
                    />
                     <NavItem
                        icon={<IncomeIcon />}
                        label="Pemasukan"
                        isActive={currentView === 'income'}
                        onClick={() => setCurrentView('income')}
                    />
                    <NavItem
                        icon={<ExpenseIcon />}
                        label="Pengeluaran"
                        isActive={currentView === 'expense'}
                        onClick={() => setCurrentView('expense')}
                    />
                    <NavItem
                        icon={<TransferIcon />}
                        label="Transfer Kas"
                        isActive={currentView === 'transfer'}
                        onClick={() => setCurrentView('transfer')}
                    />
                    <NavItem
                        icon={<ReportsIcon className="h-6 w-6" />}
                        label="Laporan"
                        isActive={currentView === 'reports'}
                        onClick={() => setCurrentView('reports')}
                    />
                    <div className="border-t border-gray-100 my-4"></div>
                    <NavItem
                        icon={<SettingsIcon className="h-6 w-6" />}
                        label="Kategori"
                        isActive={currentView === 'category-settings'}
                        onClick={() => setCurrentView('category-settings')}
                    />
                </ul>
            </nav>
        </div>
        
        <div>
             <NavItem
                icon={<LogoutIcon className="h-6 w-6" />}
                label="Logout"
                isActive={false}
                onClick={onLogout}
            />
        </div>
    </aside>
  );
};
