
import React, { useState } from 'react';
import { CategoryState } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons';

interface CategorySettingsViewProps {
  categories: CategoryState;
  onUpdateCategories: (newCategories: CategoryState) => void;
}

type CategoryType = 'income' | 'expense' | 'transfer';

export const CategorySettingsView: React.FC<CategorySettingsViewProps> = ({ categories, onUpdateCategories }) => {
  const [activeTab, setActiveTab] = useState<CategoryType>('income');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const currentList = categories[activeTab];
    if (currentList.includes(newCategoryName.trim())) {
      alert('Kategori sudah ada.');
      return;
    }

    const updatedList = [...currentList, newCategoryName.trim()];
    onUpdateCategories({
      ...categories,
      [activeTab]: updatedList
    });
    setNewCategoryName('');
  };

  const handleDeleteCategory = (index: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini? Transaksi yang sudah ada mungkin masih merujuk ke kategori ini.')) return;
    
    const updatedList = categories[activeTab].filter((_, i) => i !== index);
    onUpdateCategories({
      ...categories,
      [activeTab]: updatedList
    });
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const saveEdit = (index: number) => {
    if (!editingValue.trim()) return;
    
    const updatedList = [...categories[activeTab]];
    updatedList[index] = editingValue.trim();
    
    onUpdateCategories({
      ...categories,
      [activeTab]: updatedList
    });
    setEditingIndex(null);
  };

  const tabLabels: Record<CategoryType, string> = {
    income: 'Kategori Pemasukan',
    expense: 'Kategori Pengeluaran',
    transfer: 'Kategori Transfer',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pengaturan Kategori</h1>
      
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['income', 'expense', 'transfer'] as CategoryType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setEditingIndex(null);
              }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === type 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {type === 'income' ? 'Pemasukan' : type === 'expense' ? 'Pengeluaran' : 'Transfer'}
            </button>
          ))}
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-700 mb-6">{tabLabels[activeTab]}</h2>
          
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-3 mb-8">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori baru..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Tambah
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-3">
            {categories[activeTab].map((cat, index) => (
              <div 
                key={`${activeTab}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-blue-200 transition-colors"
              >
                {editingIndex === index ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(index)}
                      className="flex-1 px-3 py-1 border border-blue-500 rounded-lg focus:outline-none"
                    />
                    <button 
                      onClick={() => saveEdit(index)}
                      className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm font-bold"
                    >
                      Simpan
                    </button>
                    <button 
                      onClick={() => setEditingIndex(null)}
                      className="px-4 py-1 bg-gray-400 text-white rounded-lg text-sm font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-700 font-medium text-lg">{cat}</span>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(index, cat)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {categories[activeTab].length === 0 && (
              <p className="text-center py-8 text-gray-400 italic">Belum ada kategori ditambahkan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
