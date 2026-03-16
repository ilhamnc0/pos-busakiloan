import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, X, Users, Truck, Link as LinkIcon, CheckCircle, FileText, CalendarClock, AlertTriangle, Edit3 } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PiutangDashboard = () => {
  const [activeTab, setActiveTab] = useState('customer'); 
  const [orders, setOrders] = useState([]); 
  const [purchases, setPurchases] = useState([]); 
  const [suppliers, setSuppliers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState(''); 
  const [filterBulan, setFilterBulan] = useState('');
  
  // FILTER BARU: STATUS LUNAS/PIUTANG
  const [filterStatusBayar, setFilterStatusBayar] = useState('');

  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [buktiTf, setBuktiTf] = useState(''); 

  const [dateModal, setDateModal] = useState(null); 
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'customer') { 
        const res = await axios.get(`${baseURL}/api/orders`); 
        setOrders(res.data.filter(o => o.status === 'TERKIRIM' || o.status === 'SELESAI')); 
      } else { 
        const resP = await axios.get(`${baseURL}/api/purchases`); 
        setPurchases(resP.data); 
        const resS = await axios.get(`${baseURL}/api/suppliers`); 
        setSuppliers(resS.data); 
      }
    } catch (e) { console.error("Gagal memuat data piutang", e); }
  };

  const handlePaySupplier = async () => { 
    if(!window.confirm("Simpan pembaruan data pembayaran ini?")) return;
    try { 
      await axios.put(`${baseURL}/api/purchases/${payModal.id}/payment`, { totalBayar: parseFloat(payAmount || 0), buktiBayar: buktiTf }); 
      alert("✅ Data Hutang Supplier berhasil diupdate!");
      setPayModal(null); setPayAmount(''); setBuktiTf(''); loadData(); 
    } catch (e) { alert("Gagal update hutang"); } 
  };

  const handlePayCustomer = async () => { 
    if(!window.confirm("Simpan pembaruan data pembayaran ini?")) return;
    try { 
      const newDp = parseFloat(payAmount || 0); 
      const sisa = payModal.grandTotal - newDp; 
      
      await axios.put(`${baseURL}/api/orders/${payModal.id}/payment`, { 
        status: sisa <= 0 ? 'SELESAI' : 'TERKIRIM', 
        dp: newDp, 
        buktiLunas: buktiTf 
      }); 
      
      alert("✅ Data Piutang Customer berhasil diupdate!");
      setPayModal(null); setPayAmount(''); setBuktiTf(''); loadData(); 
    } catch (e) { 
      alert("Gagal update piutang: " + (e.response?.data?.error || e.message)); 
    } 
  };

  const handleSaveDueDate = async () => {
    if(!window.confirm("Simpan perubahan tanggal jatuh tempo ini?")) return;
    try {
      const formattedDate = newDueDate ? new Date(newDueDate).toISOString() : null;

      if (activeTab === 'customer') {
        await axios.put(`${baseURL}/api/orders/${dateModal.id}/duedate`, { tanggalJatuhTempo: formattedDate });
      } else {
        await axios.put(`${baseURL}/api/purchases/${dateModal.id}/duedate`, { tanggalJatuhTempo: formattedDate });
      }
      alert("✅ Tanggal Jatuh Tempo berhasil diperbarui!");
      setDateModal(null); 
      setNewDueDate(''); 
      loadData();
    } catch (e) { 
      alert("Gagal menyimpan tanggal jatuh tempo"); 
    }
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  const getYearMonth = (dateString) => { const d = new Date(dateString); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  // LOGIKA PENCARIAN & FILTER DIPERBARUI
  const filteredOrders = orders.filter(o => { 
    const matchName = o.customer?.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBulan = filterBulan === '' || getYearMonth(o.tanggal) === filterBulan;
    const isLunas = o.kekurangan <= 0;
    const matchStatus = filterStatusBayar === '' ? true : filterStatusBayar === 'LUNAS' ? isLunas : !isLunas;
    return matchName && matchBulan && matchStatus; 
  });
  const totalPiutangCustomer = filteredOrders.reduce((sum, o) => sum + o.kekurangan, 0); 
  
  const filteredPurchases = purchases.filter(p => { 
    const matchSearch = p.supplier?.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSupplier = filterSupplier === '' || p.supplierId.toString() === filterSupplier;
    const matchBulan = filterBulan === '' || getYearMonth(p.tanggal) === filterBulan;
    const isLunas = p.sisaTagihan <= 0;
    const matchStatus = filterStatusBayar === '' ? true : filterStatusBayar === 'LUNAS' ? isLunas : !isLunas;
    return matchSearch && matchSupplier && matchBulan && matchStatus; 
  });
  const totalHutangSupplier = filteredPurchases.reduce((sum, p) => sum + p.sisaTagihan, 0); 

  const renderLinks = (textString, isLunas) => {
    if (!textString) return null; const links = textString.split(/\s+/).filter(l => l.trim() !== '');
    return links.map((link, idx) => ( <a key={idx} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className={`${isLunas ? 'text-gray-500 bg-white' : 'text-blue-600 bg-white'} p-2 rounded-lg inline-flex shadow-sm hover:opacity-80 transition-opacity border border-gray-200`}><LinkIcon size={14}/></a> ));
  };

  const getDueDateStatus = (trxDate, dueDateStr, isLunas) => {
    if (isLunas) return { label: '-', class: 'text-green-700 bg-white font-bold border-green-200' };

    let targetDate;
    if (!dueDateStr) {
      targetDate = new Date(trxDate);
      if (activeTab === 'customer') targetDate.setMonth(targetDate.getMonth() + 1);
      else targetDate.setDate(targetDate.getDate() + 7);
    } else {
      targetDate = new Date(dueDateStr);
    }

    const today = new Date();
    today.setHours(0,0,0,0); targetDate.setHours(0,0,0,0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const label = targetDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});

    if (diffDays < 0) return { label, class: 'text-red-700 bg-white border-red-300 font-bold', isOverdue: true }; 
    if (diffDays <= 3) return { label, class: 'text-orange-700 bg-white border-orange-300 font-bold', isWarning: true }; 
    return { label, class: 'text-gray-700 bg-white border-gray-200 font-semibold' }; 
  };

  return (
    <div className="space-y-3 md:space-y-5 h-full flex flex-col">
      <div className="flex gap-3 shrink-0">
        <button onClick={() => {setActiveTab('customer'); setSearchTerm(''); setFilterSupplier('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 text-xs md:text-sm transition-all ${activeTab === 'customer' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Users size={18}/> PIUTANG CUSTOMER</button>
        <button onClick={() => {setActiveTab('supplier'); setSearchTerm(''); setFilterSupplier('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 text-xs md:text-sm transition-all ${activeTab === 'supplier' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Truck size={18}/> HUTANG PABRIK</button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="p-4 border-b flex flex-col lg:flex-row gap-3 items-center justify-between bg-gray-50/50">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center bg-white border rounded-xl px-3 shadow-sm flex-1 lg:flex-none">
              <input type="month" className="p-2 text-xs font-bold text-gray-700 bg-transparent outline-none w-full cursor-pointer" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />
              {filterBulan && <button onClick={()=>setFilterBulan('')} className="text-red-400 hover:text-red-600"><X size={16}/></button>}
            </div>
            
            {activeTab === 'supplier' && <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}><option value="">Semua Supplier</option>{suppliers.map(s => (<option key={s.id} value={s.id}>{s.nama}</option>))}</select>}
            
            <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterStatusBayar} onChange={(e) => setFilterStatusBayar(e.target.value)}>
              <option value="">Semua Tagihan</option>
              <option value="BELUM_LUNAS">Belum Lunas / Piutang</option>
              <option value="LUNAS">Sudah Lunas</option>
            </select>
          </div>
          <div className="relative w-full lg:w-64 mt-2 lg:mt-0"><Search className="absolute left-3 top-2.5 text-gray-400" size={16} /><input className="pl-9 pr-4 py-2 border rounded-xl w-full text-xs outline-none focus:border-blue-500 shadow-sm bg-white" placeholder="Cari Nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </div>

        <div className={`p-4 border-b flex justify-between items-center ${activeTab === 'customer' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
          <div className="font-bold text-xs md:text-sm opacity-90 flex items-center gap-2">{activeTab === 'customer' ? <Users size={18}/> : <Truck size={18}/>} {activeTab === 'customer' ? 'TOTAL PIUTANG BEREDAR:' : 'TOTAL HUTANG BELUM LUNAS:'}</div>
          <div className="text-xl md:text-3xl font-black">{formatRp(activeTab === 'customer' ? totalPiutangCustomer : totalHutangSupplier)}</div>
        </div>

        <div className="overflow-x-auto flex-1 bg-white p-0">
          <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
            <thead className={`${activeTab === 'customer' ? 'bg-blue-50 text-blue-900 border-blue-100' : 'bg-red-50 text-red-900 border-red-100'} font-bold sticky top-0 z-10 border-b`}>
              <tr>
                <th className="p-4">Tanggal Order</th>
                <th className="p-4">{activeTab === 'customer' ? 'Nama Pelanggan' : 'Nama Supplier'}</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-center">Bukti / Link</th>
                <th className="p-4">Rincian</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right">Sudah Dibayar</th>
                <th className="p-4 text-right">Sisa Hutang</th>
                <th className="p-4 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-100">
              
              {activeTab === 'customer' && filteredOrders.map(o => {
                const isLunas = o.kekurangan <= 0;
                const due = getDueDateStatus(o.tanggal, o.tanggalJatuhTempo, isLunas);
                return (
                <tr key={o.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-blue-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(o.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className={`p-4 font-black uppercase ${isLunas ? 'text-gray-500' : 'text-blue-900'}`}>{o.customer?.nama}</td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>
                        {isLunas ? 'LUNAS' : due.label}
                      </span>
                      {!isLunas && <button onClick={() => { setDateModal(o); setNewDueDate(o.tanggalJatuhTempo ? new Date(o.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-blue-600 p-1.5 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-blue-50 transition-colors" title="Ubah Jatuh Tempo"><CalendarClock size={14}/></button>}
                    </div>
                  </td>

                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{(o.buktiLunas || o.buktiDp) ? renderLinks((o.buktiLunas || o.buktiDp), isLunas) : <span className="text-gray-300">-</span>}</div></td>
                  <td className="p-4 text-[11px] space-y-0.5">{o.items.map((i, idx) => (<div key={idx}>• {i.product?.nama}</div>))}</td>
                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(o.grandTotal)}</td>
                  <td className="p-4 text-right text-green-600 font-bold">{formatRp(o.dp)}</td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'}`}>{formatRp(o.kekurangan)}</td>
                  <td className="p-4 text-center">
                    {isLunas ? (
                      <button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || '');}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"><CheckCircle size={14}/> LUNAS (Edit)</button>
                    ) : (
                      <button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || '');}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-700 shadow-md transition-transform active:scale-95">Update Bayar</button>
                    )}
                  </td>
                </tr>
              )})}

              {activeTab === 'supplier' && filteredPurchases.map(p => {
                const isLunas = p.sisaTagihan <= 0;
                const due = getDueDateStatus(p.tanggal, p.tanggalJatuhTempo, isLunas);
                return (
                <tr key={p.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-red-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className={`p-4 font-black uppercase ${isLunas ? 'text-gray-500' : 'text-red-900'}`}>{p.supplier?.nama}</td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>
                        {isLunas ? 'LUNAS' : due.label}
                      </span>
                      {!isLunas && <button onClick={() => { setDateModal(p); setNewDueDate(p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-red-600 p-1.5 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-red-50 transition-colors" title="Ubah Jatuh Tempo"><CalendarClock size={14}/></button>}
                    </div>
                  </td>

                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{p.buktiNota && <a href={p.buktiNota.startsWith('http') ? p.buktiNota : `https://${p.buktiNota}`} target="_blank" rel="noreferrer" className="text-orange-600 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm hover:bg-gray-50" title="Lihat Nota"><FileText size={14}/></a>}{p.buktiBayar && renderLinks(p.buktiBayar, isLunas)}{!p.buktiNota && !p.buktiBayar && <span className="text-gray-300">-</span>}</div></td>
                  <td className="p-4 text-[11px] space-y-0.5">{p.items.map((i, idx) => (<div key={idx}>• {i.product?.nama}</div>))}</td>
                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(p.totalTagihan)}</td>
                  <td className="p-4 text-right text-green-600 font-bold">{formatRp(p.totalBayar)}</td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'}`}>{formatRp(p.sisaTagihan)}</td>
                  <td className="p-4 text-center">
                     {isLunas ? (
                        <button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || '');}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors inline-flex items-center gap-1.5 shadow-sm"><CheckCircle size={14}/> LUNAS (Edit)</button>
                     ) : (
                        <button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || '');}} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-red-700 shadow-md transition-transform active:scale-95">Bayar Hutang</button>
                     )}
                  </td>
                </tr>
              )})}
              {(filteredOrders.length === 0 && activeTab === 'customer') || (filteredPurchases.length === 0 && activeTab === 'supplier') ? <tr><td colSpan="9" className="p-10 text-center text-gray-500 font-medium">Tidak ada data transaksi pada filter ini.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {dateModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10001] p-4 backdrop-blur-sm">
           <div className="bg-white p-5 md:p-6 rounded-2xl shadow-2xl w-full max-w-[350px]">
              <h3 className="font-bold text-base md:text-lg border-b border-gray-100 pb-3 mb-4 text-gray-800 flex items-center gap-2"><CalendarClock size={20} className={activeTab==='customer' ? 'text-blue-600' : 'text-red-600'}/> Atur Jatuh Tempo</h3>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 text-sm">
                <p className="font-bold uppercase text-gray-900 mb-1">{activeTab === 'customer' ? dateModal.customer?.nama : dateModal.supplier?.nama}</p>
                <div className="flex justify-between text-gray-500 text-xs"><span>Tgl Transaksi:</span><span>{new Date(dateModal.tanggal).toLocaleDateString('id-ID')}</span></div>
              </div>
              
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-600 mb-2 block">Pilih Tanggal Jatuh Tempo Baru:</label>
                <input type="date" className={`w-full border-2 p-3 rounded-xl font-bold text-sm outline-none focus:border-blue-500 ${!newDueDate ? 'border-red-300 bg-red-50' : 'bg-white'}`} value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setDateModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-colors">Batal</button>
                <button onClick={handleSaveDueDate} className={`flex-1 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Tanggal</button>
              </div>
           </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
           <div className="bg-white p-5 md:p-6 rounded-2xl shadow-2xl w-full max-w-[400px]">
              <h3 className={`font-bold text-base md:text-lg border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 ${activeTab==='customer'?'text-blue-800':'text-red-800'}`}>
                {activeTab==='customer'?<Users size={20}/>:<Truck size={20}/>} Form Pembayaran
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-sm">
                <p className="font-black uppercase text-gray-900 mb-2">{activeTab === 'customer' ? payModal.customer?.nama : payModal.supplier?.nama}</p>
                <div className="flex justify-between font-medium text-gray-600"><span>Tagihan:</span><span>{formatRp(activeTab === 'customer' ? payModal.grandTotal : payModal.totalTagihan)}</span></div>
                <div className="flex justify-between text-red-600 mt-1"><span>Sisa Hutang:</span><span className="font-black">{formatRp(activeTab === 'customer' ? payModal.kekurangan : payModal.sisaTagihan)}</span></div>
              </div>
              
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Total Akumulasi Dibayar (Rp)</label>
                <input type="number" className="w-full border-2 p-3 rounded-xl font-black text-lg outline-none focus:border-green-500 text-green-700 bg-green-50/30" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              
              <div className="mb-6">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Link Bukti Transfer / Nota</label>
                <textarea className="w-full border-2 p-3 rounded-xl text-sm h-20 outline-none focus:border-blue-500 resize-none bg-white" value={buktiTf} onChange={e => setBuktiTf(e.target.value)} placeholder="Paste link Google Drive / foto di sini..."></textarea>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setPayModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-colors">Batal</button>
                <button onClick={activeTab === 'customer' ? handlePayCustomer : handlePaySupplier} className={`flex-1 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Pembayaran</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default PiutangDashboard;