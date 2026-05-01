import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Download, Filter, AlertCircle } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfitDashboard = () => {
  const [orders, setOrders] = useState([]);
  
  const currentMonthDate = new Date();
  const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [filterTahun, setFilterTahun] = useState(String(currentMonthDate.getFullYear()));
  const [filterBulan, setFilterBulan] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error("Gagal mengambil data profit", error);
    }
  };

  const handleExportExcel = () => {
    alert("Fitur Export Excel untuk halaman Profit bisa disesuaikan backend.");
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const processedOrders = orders.filter(o => {
    if (o.status !== 'SELESAI' && o.status !== 'TERKIRIM') return false;

    const custName = o.customer?.nama || '';
    if (searchTerm && !custName.toLowerCase().includes(searchTerm.toLowerCase()) && !o.customerId?.toString().includes(searchTerm)) return false;

    if (!o.tanggal) return false;
    const d = new Date(o.tanggal);
    if (isNaN(d.getTime())) return false;
    
    if (String(d.getFullYear()) !== filterTahun) return false;
    if (filterBulan !== '') {
      if (String(d.getMonth() + 1).padStart(2, '0') !== filterBulan) return false;
    }
    return true;
  });

  let totalOmset = 0;
  let totalModalHPP = 0;
  let totalOngkirIn = 0;
  let totalOngkirOut = 0;
  let grandTotalProfit = 0;

  const dataProfit = processedOrders.map(o => {
    let orderOmsetBarang = 0;
    let orderModalBarang = 0;
    let hasValidItem = false;
    let hasInvalidItem = false;

    const processedItems = o.items.map(item => {
      const hargaJualValid = parseFloat(item.hargaSatuan || item.hargaJual || 0);
      const hppValid = parseFloat(item.hppSatuan || 0);
      const qtyValid = parseFloat(item.qty || 0);

      if (hppValid > 0) {
        orderOmsetBarang += (hargaJualValid * qtyValid);
        orderModalBarang += (hppValid * qtyValid);
        hasValidItem = true;
        return { ...item, isValidProfit: true, hargaJualAktif: hargaJualValid, hppAktif: hppValid };
      } else {
        hasInvalidItem = true;
        return { ...item, isValidProfit: false, hargaJualAktif: hargaJualValid, hppAktif: hppValid };
      }
    });

    const ongkirIn = parseFloat(o.ongkosKirim) || 0;
    const ongkirOut = parseFloat(o.ongkosKirimModal) || 0;

    let profitBersih = 0;

    if (hasValidItem) {
      profitBersih = (orderOmsetBarang - orderModalBarang) + (ongkirIn - ongkirOut);
      
      totalOmset += orderOmsetBarang;
      totalModalHPP += orderModalBarang;
      totalOngkirIn += ongkirIn;
      totalOngkirOut += ongkirOut;
      grandTotalProfit += profitBersih;
    }

    return { 
      ...o, 
      items: processedItems, 
      orderOmsetBarang, 
      orderModalBarang, 
      ongkirIn, 
      ongkirOut, 
      profitBersih, 
      hasValidItem, 
      hasInvalidItem 
    };
  });

  const totalMarginOngkir = totalOngkirIn - totalOngkirOut;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-green-600"/> Analisis Laba & Profit
        </h2>
        <p className="text-xs text-gray-500">
          Dihitung otomatis. <b className="text-red-500">Barang dengan Modal (HPP) Rp 0 akan dilewati (tidak dihitung profitnya), tetapi barang lain yang valid dalam nota yang sama tetap dihitung.</b>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="p-4 border rounded-xl bg-white shadow-sm">
            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">$ OMSET BARANG (VALID)</span>
            <span className="text-xl font-black text-gray-900">{formatRp(totalOmset)}</span>
          </div>
          <div className="p-4 border rounded-xl bg-red-50 border-red-100 shadow-sm">
            <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">📦 TOTAL MODAL (HPP)</span>
            <span className="text-xl font-black text-red-700">{formatRp(totalModalHPP)}</span>
          </div>
          <div className="p-4 border rounded-xl bg-orange-50 border-orange-100 shadow-sm">
            <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">🚚 MARGIN ONGKIR</span>
            <span className={`text-xl font-black ${totalMarginOngkir < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatRp(totalMarginOngkir)}
            </span>
          </div>
          <div className="p-4 border rounded-xl bg-green-600 shadow-sm">
            <span className="text-[10px] font-bold text-green-100 uppercase block mb-1 flex items-center gap-1"><TrendingUp size={12}/> PROFIT BERSIH</span>
            <span className="text-2xl font-black text-white">{formatRp(grandTotalProfit)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 border px-3 py-2 rounded-xl bg-gray-50">
            <Filter size={16} className="text-gray-400" />
            <select className="bg-transparent outline-none text-sm font-semibold cursor-pointer" value={filterTahun} onChange={e => setFilterTahun(e.target.value)}>
              <option value="2024">Tahun 2024</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026</option>
            </select>
          </div>
          <select className="border px-3 py-2 rounded-xl text-sm font-semibold outline-none cursor-pointer w-full sm:w-auto" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}>
            <option value="">Semua Bulan (Setahun)</option>
            <option value="01">Januari</option>
            <option value="02">Februari</option>
            <option value="03">Maret</option>
            <option value="04">April</option>
            <option value="05">Mei</option>
            <option value="06">Juni</option>
            <option value="07">Juli</option>
            <option value="08">Agustus</option>
            <option value="09">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
          <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Download size={16}/> Export Excel
          </button>
        </div>
        <div className="w-full sm:w-64">
           <input type="text" className="w-full border px-4 py-2.5 rounded-xl text-sm outline-none focus:border-green-500" placeholder="Cari Pelanggan / ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-2xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b font-bold sticky top-0 z-10 text-gray-700 text-xs uppercase">
            <tr>
              <th className="p-4">Tgl</th>
              <th className="p-4">Nama Pelanggan</th>
              <th className="p-4">Barang & Kategori (Perhitungan Per Item)</th>
              <th className="p-4 text-center">Ongkir In</th>
              <th className="p-4 text-center">Ongkir Out</th>
              <th className="p-4 text-right">PROFIT BERSIH</th>
            </tr>
          </thead>
          <tbody className="divide-y border-gray-100">
            {dataProfit.map(o => (
              <tr key={o.id} className={`transition-colors ${!o.hasValidItem ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                <td className="p-4 text-xs text-gray-500">{o.tanggal ? new Date(o.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}</td>
                <td className="p-4 font-bold text-gray-900">
                  {o.customer?.nama || '-'} <span className="text-xs text-gray-500">(#{o.customerId})</span>
                  {o.hasInvalidItem && (
                     <span className="mt-1 flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-100 w-max px-2 py-0.5 rounded uppercase">
                       <AlertCircle size={10}/> Ada HPP Kosong
                     </span>
                  )}
                </td>
                <td className="p-4">
                  <div className={`border rounded-lg p-2 max-w-sm space-y-2 ${o.hasInvalidItem ? 'border-red-200 bg-white' : 'bg-gray-50/50'}`}>
                     {o.items.map((i, idx) => (
                       <div key={idx} className={`text-[11px] flex justify-between items-start gap-4 p-1.5 rounded ${i.isValidProfit ? 'text-gray-700' : 'bg-red-50/80'}`}>
                          <div>
                            <span className={`font-bold ${!i.isValidProfit ? 'text-red-700 line-through' : ''}`}>{i.product?.nama}</span> <span className="text-gray-400 uppercase text-[9px]">(#{i.productId} | {i.product?.kategori || 'UMUM'})</span><br/>
                            <span className={i.isValidProfit ? 'text-gray-500' : 'text-red-400'}>
                               {i.qty} x (Jual: <span className={`${i.isValidProfit ? 'text-blue-600' : ''} font-bold`}>{formatRp(i.hargaJualAktif)}</span> - Modal: <span className={`${i.isValidProfit ? 'text-red-500' : 'text-red-600'} font-bold`}>{formatRp(i.hppAktif)}</span>)
                            </span>
                          </div>
                          {!i.isValidProfit && (
                            <span className="text-[8px] font-black text-red-600 border border-red-200 bg-red-100 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                              TIDAK DIHITUNG
                            </span>
                          )}
                       </div>
                     ))}
                  </div>
                </td>
                <td className="p-4 text-center text-blue-600 font-semibold">{o.ongkirIn > 0 ? formatRp(o.ongkirIn) : '-'}</td>
                <td className="p-4 text-center text-red-500 font-semibold">{o.ongkirOut > 0 ? formatRp(o.ongkirOut) : '-'}</td>
                
                <td className="p-4 text-right">
                  {!o.hasValidItem ? (
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400 line-through text-xs">Rp 0</span>
                      <span className="text-[10px] font-bold text-red-500 uppercase mt-1">Nihil / Ditangguhkan</span>
                    </div>
                  ) : (
                    <span className="font-black text-green-700 bg-green-50/50 border border-green-100 p-2 rounded-lg text-base shadow-sm">
                      {formatRp(o.profitBersih)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {dataProfit.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <TrendingUp size={32} className="text-gray-300"/>
                    <span>Tidak ada data profit yang valid.</span>
                    <span className="text-[10px] text-orange-500 max-w-xs mt-1">Pastikan status order sudah 'SELESAI'/'TERKIRIM'.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ProfitDashboard;