import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, Users, Truck, Target, Calendar, ArrowRight, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MainDashboard = ({ setActiveTab }) => {
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [finance, setFinance] = useState([]);
  
  // STATE FILTER TANGGAL RENTANG (Start Date - End Date)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resO, resP, resF] = await Promise.all([ 
          axios.get(`${baseURL}/api/orders`), 
          axios.get(`${baseURL}/api/purchases`), 
          axios.get(`${baseURL}/api/finance`) 
        ]);
        setOrders(resO.data); setPurchases(resP.data); setFinance(resF.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const isMatch = (dateStr) => {
    if (!dateStr || !startDate || !endDate) return true;
    const d = new Date(dateStr).setHours(0,0,0,0);
    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(endDate).setHours(23,59,59,999);
    return d >= start && d <= end;
  };

  const filteredOrders = orders.filter(o => isMatch(o.tanggal));
  const filteredPurchases = purchases.filter(p => isMatch(p.tanggal));
  
  let omset = 0, piutang = 0, profitKasar = 0;
  
  filteredOrders.forEach(o => { 
    if (o.status !== 'DIBATALKAN') {
      omset += o.dp; 
      const tagihanTotal = o.totalHarga + (o.ongkosKirim || 0);
      piutang += (tagihanTotal - o.dp); 

      if (o.status === 'TERKIRIM' || o.status === 'SELESAI') {
        let hppOrder = 0;
        let penjualanOrder = 0;
        
        o.items.forEach(i => { 
          hppOrder += (i.qty * (i.hppSatuan || i.product?.hpp || 0)); 
          penjualanOrder += (i.qty * i.hargaSatuan);
        });
        
        const marginOngkir = (o.ongkosKirim || 0) - (o.ongkosKirimModal || 0);
        profitKasar += (penjualanOrder - hppOrder) + marginOngkir;
      }
    }
  });

  // HUTANG PABRIK
  let totalHutangAktif = 0;
  const supplierDebts = {};
  purchases.forEach(p => {
    const sisa = p.items.reduce((s, i)=>s+i.subtotal,0) - p.totalBayar;
    if (sisa > 0) {
      totalHutangAktif += sisa;
      if (!supplierDebts[p.supplier?.nama]) supplierDebts[p.supplier?.nama] = 0;
      supplierDebts[p.supplier?.nama] += sisa;
    }
  });
  const debtList = Object.keys(supplierDebts).map(k => ({ nama: k, sisa: supplierDebts[k] })).sort((a,b) => b.sisa - a.sisa);

  // KAS TOTAL (Hanya ditarik dari tabel Finance)
  const totalMasuk = finance.filter(f => f.tipe === 'PEMASUKAN').reduce((s, f) => s + f.nominal, 0);
  const totalKeluar = finance.filter(f => f.tipe === 'PENGELUARAN').reduce((s, f) => s + f.nominal, 0);
  const saldoKas = totalMasuk - totalKeluar;

  // DATA GRAFIK
  const chartDataMap = {};
  filteredOrders.forEach(o => { 
    if (o.status !== 'DIBATALKAN') {
      const dLabel = new Date(o.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month:'short'}); 
      if(!chartDataMap[dLabel]) chartDataMap[dLabel] = { name: dLabel, Omset: 0, sortDate: new Date(o.tanggal) }; 
      chartDataMap[dLabel].Omset += o.dp; 
    }
  });
  const chartData = Object.values(chartDataMap).sort((a,b) => a.sortDate - b.sortDate);

  // DATA PESANAN BELUM DIKIRIM (MENUNGGU & DP) - Diurutkan dari yang paling lama
  const pendingOrders = orders
    .filter(o => o.status === 'MENUNGGU' || o.status === 'DP')
    .sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 md:p-5 space-y-5 bg-gray-50/30">
      
      {/* HEADER DENGAN FILTER RENTANG TANGGAL */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard Analisis</h1>
          <p className="text-xs font-medium text-gray-500 mt-1">Ringkasan finansial dan performa bisnis.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 w-full md:w-auto">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs px-2"><Calendar size={16}/> Filter Data:</div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="date" className="border border-blue-200 bg-white p-2 rounded-lg text-xs font-semibold text-gray-700 outline-none w-full sm:w-auto" value={startDate} onChange={e=>setStartDate(e.target.value)} title="Tanggal Mulai"/>
            <span className="text-gray-400 font-bold">-</span>
            <input type="date" className="border border-blue-200 bg-white p-2 rounded-lg text-xs font-semibold text-gray-700 outline-none w-full sm:w-auto" value={endDate} onChange={e=>setEndDate(e.target.value)} title="Tanggal Akhir"/>
          </div>
        </div>
      </div>

      {/* KLIKABLE CARDS (NAVIGASI) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div onClick={() => setActiveTab('keuangan')} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-purple-300 hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex justify-between items-center relative z-10">Kas Aktif (Global) <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"><Wallet size={16}/></div></div>
          <h3 className={`text-lg md:text-2xl font-bold truncate relative z-10 ${saldoKas < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatRp(saldoKas)}</h3>
          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500 flex items-center gap-1 text-[10px] font-bold"><ArrowRight size={14}/> Buka Menu</div>
        </div>
        
        <div onClick={() => setActiveTab('rekap')} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex justify-between items-center relative z-10">Omset Terpilih <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><Target size={16}/></div></div>
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 truncate relative z-10">{formatRp(omset)}</h3>
          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 flex items-center gap-1 text-[10px] font-bold"><ArrowRight size={14}/> Buka Menu</div>
        </div>
        
        <div onClick={() => setActiveTab('profit')} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-green-300 hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex justify-between items-center relative z-10">Profit Terkirim <div className="p-1.5 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors"><TrendingUp size={16}/></div></div>
          <h3 className="text-lg md:text-2xl font-bold text-green-600 truncate relative z-10">{formatRp(profitKasar)}</h3>
          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-green-500 flex items-center gap-1 text-[10px] font-bold"><ArrowRight size={14}/> Buka Menu</div>
        </div>
        
        <div onClick={() => setActiveTab('piutang')} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex justify-between items-center relative z-10">Piutang Customer <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors"><Users size={16}/></div></div>
          <h3 className="text-lg md:text-2xl font-bold text-orange-600 truncate relative z-10">{formatRp(piutang)}</h3>
          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 flex items-center gap-1 text-[10px] font-bold"><ArrowRight size={14}/> Buka Menu</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-[400px]">
        
        {/* KOLOM KIRI (Span 2): ANTREAN BELUM DIKIRIM (TABEL LEBAR) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-orange-100 bg-orange-50 flex justify-between items-center shrink-0">
            <div>
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Antrean Belum Dikirim</h4>
              <p className="text-xs text-gray-500 mt-1"><span className="font-bold text-orange-600">{pendingOrders.length}</span> Pesanan perlu diproses dan dikirim</p>
            </div>
            <button onClick={() => setActiveTab('rekap')} className="text-xs font-bold text-orange-600 bg-orange-100 px-4 py-2 rounded-lg hover:bg-orange-200 transition-colors shadow-sm active:scale-95">Lihat Semua</button>
          </div>
          
          <div className="overflow-x-auto flex-1 p-0">
            <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b text-gray-500 font-semibold sticky top-0">
                <tr>
                  <th className="p-4 pl-6">Tanggal</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Rincian Barang</th>
                  <th className="p-4 text-right">Tagihan Total</th>
                  <th className="p-4 text-center pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y border-gray-100">
                {pendingOrders.map((o, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-4 pl-6 text-gray-500">{new Date(o.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
                    <td className="p-4 font-black text-gray-800 uppercase">{o.customer?.nama}</td>
                    <td className="p-4 text-gray-600 font-medium">
                      {o.items.length > 0 ? `${o.items[0].product?.nama} ${o.items.length > 1 ? `(+${o.items.length - 1} lainnya)` : ''}` : '-'}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">{formatRp(o.totalHarga + (o.ongkosKirim||0))}</td>
                    <td className="p-4 text-center pr-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border whitespace-nowrap shadow-sm ${o.status === 'DP' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pendingOrders.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-gray-400 text-sm font-medium italic">Semua pesanan sudah dikirim. Bebas antrean! 🎉</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* KOLOM KANAN (Span 1): GRAFIK & HUTANG */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          
          {/* GRAFIK OMSET (Atas) */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col h-[260px] shrink-0">
            <h4 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Grafik Omset Harian</h4>
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs><linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9ca3af', fontWeight: 500}} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9ca3af', fontWeight: 500}} tickFormatter={(v) => `${v/1000000}M`} />
                  <Tooltip formatter={(value) => formatRp(value)} contentStyle={{borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="Omset" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOmset)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DETAIL HUTANG PABRIK (Bawah) */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 min-h-[220px]">
            <div className="p-4 border-b border-red-100 bg-red-50/50 flex justify-between items-center cursor-pointer hover:bg-red-50 transition-colors group shrink-0" onClick={() => setActiveTab('piutang')}>
              <div>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Truck size={14}/> Total Hutang Pabrik</p>
                <h2 className="text-lg md:text-xl font-bold text-red-700">{formatRp(totalHutangAktif)}</h2>
              </div>
              <ArrowRight size={20} className="text-red-300 group-hover:text-red-600 transition-colors"/>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2.5">
                {debtList.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800 uppercase truncate">{d.nama}</span>
                    <span className="text-xs font-bold text-red-600">{formatRp(d.sisa)}</span>
                  </div>
                ))}
                {debtList.length === 0 && <p className="text-xs text-gray-400 text-center py-6 font-medium italic">Semua hutang lunas 🎉</p>}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default MainDashboard;