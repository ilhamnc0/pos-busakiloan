import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, TrendingUp, DollarSign, PackageOpen, Truck, Filter } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfitDashboard = () => {
  const [profitData, setProfitData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // STATE FILTER TAHUNAN & BULANAN
  const currentYear = new Date().getFullYear().toString();
  const [filterTahun, setFilterTahun] = useState(currentYear);
  const [filterBulan, setFilterBulan] = useState(''); // Kosong = Sepanjang Tahun

  useEffect(() => {
    axios.get(`${baseURL}/api/profit`).then(res => setProfitData(res.data)).catch(console.error);
  }, []);

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  
  // LOGIKA FILTER TAHUN & BULAN
  const filtered = profitData.filter(p => {
    const d = new Date(p.tanggal);
    const pTahun = d.getFullYear().toString();
    const pBulan = String(d.getMonth() + 1).padStart(2, '0');

    const matchName = p.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTahun = filterTahun === '' || pTahun === filterTahun;
    const matchBulan = filterBulan === '' || pBulan === filterBulan;
    
    return matchName && matchTahun && matchBulan;
  });

  const summary = filtered.reduce((acc, curr) => {
    acc.omset += curr.totalPenjualan; acc.hpp += curr.totalHpp;
    acc.ongkirMasuk += curr.ongkirMasuk; acc.ongkirKeluar += curr.ongkirKeluar;
    acc.netProfit += curr.netProfit; return acc;
  }, { omset: 0, hpp: 0, ongkirMasuk: 0, ongkirKeluar: 0, netProfit: 0 });

  // Bikin List Tahun Unik dari Data
  const availableYears = [...new Set(profitData.map(p => new Date(p.tanggal).getFullYear().toString()))].sort().reverse();
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

  return (
    <div className="space-y-3 md:space-y-4 h-full flex flex-col">
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border">
        <h2 className="text-base md:text-xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={18}/> Analisis Laba & Profit</h2>
        <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Dihitung otomatis dari selisih Harga Jual dan Modal (HPP) serta margin Ongkir.</p>
      </div>

      {/* KARTU SUMMARY PROFIT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm"><p className="text-gray-500 font-bold text-[9px] md:text-xs flex items-center gap-1 mb-1"><DollarSign size={12}/> OMSET</p><h3 className="text-sm md:text-lg font-black text-gray-800">{formatRp(summary.omset)}</h3></div>
        <div className="bg-red-50 p-3 rounded-xl border border-red-200 shadow-sm"><p className="text-red-700 font-bold text-[9px] md:text-xs flex items-center gap-1 mb-1"><PackageOpen size={12}/> MODAL (HPP)</p><h3 className="text-sm md:text-lg font-black text-red-700">{formatRp(summary.hpp)}</h3></div>
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 shadow-sm"><p className="text-orange-700 font-bold text-[9px] md:text-xs flex items-center gap-1 mb-1"><Truck size={12}/> MARGIN ONGKIR</p><h3 className="text-sm md:text-lg font-black text-orange-700">{formatRp(summary.ongkirMasuk - summary.ongkirKeluar)}</h3></div>
        <div className="bg-green-600 p-3 rounded-xl shadow-md text-white"><p className="font-bold text-[9px] md:text-xs flex items-center gap-1 mb-1 opacity-90"><TrendingUp size={12}/> PROFIT BERSIH</p><h3 className="text-lg md:text-xl font-black">{formatRp(summary.netProfit)}</h3></div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {/* HEADER & FILTER TAHUNAN */}
        <div className="p-3 border-b flex flex-col md:flex-row gap-2 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-gray-400 hidden sm:block"/>
            
            {/* OPSI TAHUN */}
            <select className="border p-1.5 rounded-lg text-xs font-bold text-gray-700 outline-none flex-1 md:flex-none shadow-sm" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              <option value="">Semua Tahun</option>
              {availableYears.map(y => <option key={y} value={y}>Tahun {y}</option>)}
            </select>

            {/* OPSI BULAN */}
            <select className="border p-1.5 rounded-lg text-xs font-bold text-gray-700 outline-none flex-1 md:flex-none shadow-sm" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
              <option value="">Semua Bulan (Setahun)</option>
              <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option>
              <option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option>
              <option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option>
              <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
            <input className="pl-8 pr-3 py-1.5 border rounded-lg w-full text-xs outline-none focus:border-green-500 shadow-sm" placeholder="Cari Pelanggan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* KONTEN BAWAH (CARDS & TABLE) - Tetap Sama */}
        <div className="overflow-auto flex-1 bg-gray-50 md:bg-white p-2 md:p-0">
          {/* MOBILE CARDS */}
          <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div><span className="font-bold text-sm text-gray-800 uppercase">{p.customer}</span><p className="text-[10px] text-gray-400">{new Date(p.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month:'short', year:'numeric'})}</p></div>
                  <div className="text-right bg-green-50 px-2 py-1 rounded-lg border border-green-200"><span className="text-[8px] font-bold text-green-700 block uppercase">Profit Bersih</span><span className="font-black text-sm text-green-700">{formatRp(p.netProfit)}</span></div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-dashed space-y-1.5">
                  {p.rincian.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-200 pb-1 last:border-0 last:pb-0">
                      <div className="flex justify-between text-xs font-bold text-gray-800"><span>{item.namaProduk}</span><span>x{item.qty}</span></div>
                      <div className="flex justify-between text-[9px] text-gray-500 mt-0.5"><span>Jual: <span className="text-blue-600 font-bold">{formatRp(item.hargaJual)}</span></span><span>Modal: <span className="text-red-500 font-bold">{formatRp(item.hppSatuan)}</span></span></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-medium text-gray-500 mt-1">
                  <div className="flex justify-between bg-gray-50 p-1.5 rounded"><span>Ongkir In:</span><span className="text-blue-600 font-bold">{p.ongkirMasuk > 0 ? formatRp(p.ongkirMasuk) : '-'}</span></div>
                  <div className="flex justify-between bg-gray-50 p-1.5 rounded"><span>Ongkir Out:</span><span className="text-red-500 font-bold">{p.ongkirKeluar > 0 ? formatRp(p.ongkirKeluar) : '-'}</span></div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-6 text-center text-xs text-gray-400 bg-white rounded-xl border">Tidak ada data.</div>}
          </div>

          {/* DESKTOP TABLE */}
          <table className="hidden md:table w-full text-sm text-left whitespace-nowrap"><thead className="bg-green-100 text-green-900 font-bold sticky top-0 z-10"><tr><th className="p-3">Tgl</th><th className="p-3">Nama Pelanggan</th><th className="p-3">Barang & Kategori (Harga Jual vs Modal)</th><th className="p-3 text-center">Ongkir In</th><th className="p-3 text-center">Ongkir Out</th><th className="p-3 text-right bg-green-200">PROFIT BERSIH</th></tr></thead><tbody className="divide-y">{filtered.map(p => (<tr key={p.id} className="hover:bg-green-50/50"><td className="p-3 text-xs text-gray-600">{new Date(p.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month:'short', year:'numeric'})}</td><td className="p-3 font-bold text-gray-800 uppercase">{p.customer}</td><td className="p-3"><div className="space-y-1">{p.rincian.map((item, idx) => (<div key={idx} className="bg-gray-50 p-1.5 rounded border text-[11px]"><span className="font-bold">{item.namaProduk}</span> <span className="text-gray-500">({item.kategori})</span> <br/><span className="text-[10px] text-gray-500">{item.qty} x (Jual: <span className="text-blue-600 font-bold">{formatRp(item.hargaJual)}</span> - Modal: <span className="text-red-500 font-bold">{formatRp(item.hppSatuan)}</span>)</span></div>))}</div></td><td className="p-3 text-center font-medium text-blue-600">{p.ongkirMasuk > 0 ? formatRp(p.ongkirMasuk) : '-'}</td><td className="p-3 text-center font-medium text-red-500">{p.ongkirKeluar > 0 ? formatRp(p.ongkirKeluar) : '-'}</td><td className="p-3 text-right font-black text-green-700 text-base bg-green-50/30">{formatRp(p.netProfit)}</td></tr>))}{filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">Belum ada data profit.</td></tr>}</tbody></table>
        </div>
      </div>
    </div>
  );
};
export default ProfitDashboard;