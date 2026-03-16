import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, History, ArrowDownLeft, ArrowUpRight, X, PackagePlus, ShoppingCart } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RiwayatProses = () => {
  const [activeTab, setActiveTab] = useState('masuk'); 
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState('');

  // 1. TETAP MENGGUNAKAN LOGIKA DATA YANG LAMA (API GLOBAL)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/products/history/global`);
        setHistory(res.data);
      } catch (e) { console.error("Gagal load riwayat", e); }
    };
    fetchHistory();
  }, []);

  const getYearMonth = (dateString) => {
    const d = new Date(dateString); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const filteredHistory = history.filter(h => {
    const matchTab = activeTab === 'masuk' ? h.tipe === 'MASUK' : h.tipe === 'KELUAR';
    const matchSearch = h.productName.toLowerCase().includes(searchTerm.toLowerCase()) || h.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || h.ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBulan = filterBulan === '' || getYearMonth(h.tanggal) === filterBulan;
    return matchTab && matchSearch && matchBulan;
  });

  return (
    <div className="flex flex-col h-full space-y-3 md:space-y-4">
      {/* TABS COMPACT */}
      <div className="flex gap-2 shrink-0">
        <button onClick={() => {setActiveTab('masuk'); setSearchTerm('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 transition-all text-xs md:text-sm ${activeTab === 'masuk' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
          <PackagePlus size={18}/> MASUK
        </button>
        <button onClick={() => {setActiveTab('keluar'); setSearchTerm('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 transition-all text-xs md:text-sm ${activeTab === 'keluar' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
          <ShoppingCart size={18}/> KELUAR
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {/* HEADER & FILTER */}
        <div className="p-4 bg-gray-50/50 border-b flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          
          {/* 2. JUDUL DIPERBARUI SESUAI PERMINTAAN */}
          <h3 className={`font-bold text-sm md:text-base flex items-center gap-2 w-full sm:w-auto ${activeTab === 'masuk' ? 'text-green-700' : 'text-red-700'}`}>
            {activeTab === 'masuk' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>} 
            Riwayat {activeTab === 'masuk' ? 'Masuk' : 'Keluar'} Produk
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border rounded-xl px-3 shadow-sm flex-1 sm:flex-none">
              <input type="month" className="p-2 text-xs font-bold text-gray-700 bg-transparent outline-none w-full cursor-pointer" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} />
              {filterBulan && <button onClick={()=>setFilterBulan('')} className="text-red-400 hover:text-red-600"><X size={16}/></button>}
            </div>
            <div className="relative w-full sm:w-64 flex-1 sm:flex-none">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input className="pl-9 pr-4 py-2 border rounded-xl w-full text-sm outline-none focus:border-blue-500 shadow-sm bg-white" placeholder="Cari Produk / Ket..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        {/* 3. KONTEN MURNI TABEL RESPONSIF (TIDAK ADA KOTAK MOBILE LAGI) */}
        <div className="overflow-x-auto flex-1 bg-white p-0">
          <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
            <thead className={`${activeTab === 'masuk' ? 'bg-green-50 text-green-900 border-green-100' : 'bg-red-50 text-red-900 border-red-100'} font-bold sticky top-0 z-10 border-b`}>
              <tr>
                <th className="p-4">Tanggal Waktu</th>
                <th className="p-4">Nama Produk</th>
                <th className="p-4">{activeTab === 'masuk' ? 'Masuk Dari (Supplier)' : 'Terjual Ke (Pelanggan)'}</th>
                <th className="p-4 text-center">Tipe Arah</th>
                <th className="p-4 text-center">Jumlah (Qty)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-100">
              {filteredHistory.map((h, idx) => (
                <tr key={idx} className={`transition-colors ${activeTab === 'masuk' ? 'hover:bg-green-50/30' : 'hover:bg-red-50/30'}`}>
                  <td className="p-4 text-gray-600">{new Date(h.tanggal).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                  <td className="p-4 font-bold text-gray-800">{h.productName}</td>
                  <td className="p-4">
                    <span className="font-bold block text-gray-700 uppercase">{h.keterangan}</span>
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 inline-block">{h.ref}</span>
                  </td>
                  <td className="p-4 text-center">
                    {h.tipe === 'MASUK' ? (
                      <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-bold">MASUK</span>
                    ) : (
                      <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-bold">KELUAR</span>
                    )}
                  </td>
                  <td className={`p-4 text-center font-black text-xl ${h.tipe==='MASUK'?'text-green-600':'text-red-600'}`}>
                    {h.tipe==='MASUK'?'+':'-'}{h.qty}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-medium">Tidak ada data riwayat pada filter ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default RiwayatProses;