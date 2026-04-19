import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, X, Users, Truck, Link as LinkIcon, CheckCircle, FileText, CalendarClock, Edit3, Download } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PiutangDashboard = () => {
  const [activeTab, setActiveTab] = useState('customer'); 
  const [orders, setOrders] = useState([]); 
  const [purchases, setPurchases] = useState([]); 
  const [suppliers, setSuppliers] = useState([]); 
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState(''); 
  const [filterBulan, setFilterBulan] = useState('');
  const [filterStatusBayar, setFilterStatusBayar] = useState('');

  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [buktiTf, setBuktiTf] = useState(''); 

  const [dateModal, setDateModal] = useState(null); 
  const [newDueDate, setNewDueDate] = useState('');

  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [editPurchaseForm, setEditPurchaseForm] = useState({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: '', metodeBayar: 'TF', buktiTf: '', keterangan: '', buktiNota: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyBeli, setQtyBeli] = useState('');
  const [qtyJual, setQtyJual] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');

  useEffect(() => { loadData(); fetchProducts(); }, [activeTab]);

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
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => { try { const res = await axios.get(`${baseURL}/api/products`); setProducts(res.data.map(p => ({ ...p, value: p.id, label: p.nama, dataAsli: p }))); } catch(e){} };

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
      await axios.put(`${baseURL}/api/orders/${payModal.id}/payment`, { status: sisa <= 0 ? 'SELESAI' : 'TERKIRIM', dp: newDp, buktiLunas: buktiTf }); 
      alert("✅ Data Piutang Customer berhasil diupdate!");
      setPayModal(null); setPayAmount(''); setBuktiTf(''); loadData(); 
    } catch (e) { alert("Gagal update piutang"); } 
  };

  const handleSaveDueDate = async () => {
    if(!window.confirm("Simpan perubahan tanggal jatuh tempo ini?")) return;
    try {
      const formattedDate = newDueDate ? new Date(newDueDate).toISOString() : null;
      if (activeTab === 'customer') await axios.put(`${baseURL}/api/orders/${dateModal.id}/duedate`, { tanggalJatuhTempo: formattedDate });
      else await axios.put(`${baseURL}/api/purchases/${dateModal.id}/duedate`, { tanggalJatuhTempo: formattedDate });
      alert("✅ Tanggal Jatuh Tempo diperbarui!");
      setDateModal(null); setNewDueDate(''); loadData();
    } catch (e) { alert("Gagal menyimpan"); }
  };

  const openEditPurchase = (p) => {
    setEditPurchaseId(p.id);
    setEditPurchaseForm({
        supplier: { value: p.supplierId, label: p.supplier?.nama },
        tanggal: new Date(p.tanggal).toISOString().split('T')[0],
        tglJatuhTempo: p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toISOString().split('T')[0] : '',
        items: p.items.map(i => ({
            productId: i.productId, nama: i.product?.nama, satuanBeli: i.product?.satuanBeli || '-', satuanJual: i.product?.satuanJual || '-',
            qtyBeli: i.qtyBeli, qty: i.qty, hargaBeli: i.hargaBeli, subtotal: i.subtotal
        })),
        bayar: p.totalBayar, metodeBayar: 'TF', buktiTf: p.buktiBayar || '', keterangan: p.keterangan ? p.keterangan.replace(/ \[Via: .*?\]/, '') : '', buktiNota: p.buktiNota || ''
    });
  };

  const handleSelectProductForEdit = (opt) => { setSelectedProduct(opt); if (opt) setHargaBeli(opt.dataAsli?.hpp || 0); else setHargaBeli(''); };

  const handleAddItemToEdit = () => { 
      const qBeli = parseFloat(qtyBeli); const qJual = parseFloat(qtyJual); const hBeli = parseFloat(hargaBeli); 
      if(!selectedProduct || isNaN(qBeli) || isNaN(qJual) || isNaN(hBeli)) return alert("Lengkapi data barang!"); 
      const newItem = { productId: selectedProduct.value, nama: selectedProduct.label, satuanBeli: selectedProduct.dataAsli?.satuanBeli || '-', satuanJual: selectedProduct.dataAsli?.satuanJual || '-', qtyBeli: qBeli, qty: qJual, hargaBeli: hBeli, subtotal: qBeli*hBeli };
      setEditPurchaseForm(p => ({ ...p, items: [...p.items, newItem] })); 
      setSelectedProduct(null); setQtyBeli(''); setQtyJual(''); setHargaBeli(''); 
  };

  const handleUpdateBarangMasuk = async () => { 
    if(!editPurchaseForm.supplier || editPurchaseForm.items.length===0) return alert("Minimal 1 barang!"); 
    if(!window.confirm("PERINGATAN: Menyimpan revisi akan mengubah stok gudang. Lanjutkan?")) return;
    try { 
        await axios.put(`${baseURL}/api/purchases/${editPurchaseId}`, {
            supplierId: editPurchaseForm.supplier.value, items: editPurchaseForm.items, tanggal: editPurchaseForm.tanggal || new Date().toISOString(), 
            tanggalJatuhTempo: editPurchaseForm.tglJatuhTempo || null, totalBayar: parseFloat(editPurchaseForm.bayar || 0), metodeBayar: editPurchaseForm.metodeBayar,
            buktiTf: editPurchaseForm.buktiTf, keterangan: editPurchaseForm.keterangan, buktiNota: editPurchaseForm.buktiNota
        }); 
        alert("✅ REVISI BERHASIL!"); 
        setEditPurchaseId(null); loadData(); 
    } catch(e){ alert("Gagal revisi barang masuk"); } 
  };

  const handleExportPiutang = () => {
    let start, end;
    if (filterBulan) {
      start = `${filterBulan}-01`;
      end = new Date(filterBulan.split('-')[0], filterBulan.split('-')[1], 0).toISOString().split('T')[0];
    } else {
      start = `${new Date().getFullYear()}-01-01`;
      end = `${new Date().getFullYear()}-12-31`;
    }
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?start=${start}&end=${end}&type=piutang&token=${token}`, '_blank');
  };

  const totalTagihanEdit = editPurchaseForm.items.reduce((sum, item) => sum + item.subtotal, 0);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  const getYearMonth = (dateString) => { const d = new Date(dateString); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

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
    if (!dueDateStr) { targetDate = new Date(trxDate); if (activeTab === 'customer') targetDate.setMonth(targetDate.getMonth() + 1); else targetDate.setDate(targetDate.getDate() + 7); } 
    else { targetDate = new Date(dueDateStr); }

    const today = new Date(); today.setHours(0,0,0,0); targetDate.setHours(0,0,0,0);
    const diffTime = targetDate - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const label = targetDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});

    if (diffDays < 0) return { label, class: 'text-red-700 bg-white border-red-300 font-bold', isOverdue: true }; 
    if (diffDays <= 3) return { label, class: 'text-orange-700 bg-white border-orange-300 font-bold', isWarning: true }; 
    return { label, class: 'text-gray-700 bg-white border-gray-200 font-semibold' }; 
  };

  return (
    <div className="space-y-3 md:space-y-5 h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-3 shrink-0">
        <div className="flex gap-2 flex-1">
          <button onClick={() => {setActiveTab('customer'); setSearchTerm(''); setFilterSupplier('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 text-xs md:text-sm transition-all ${activeTab === 'customer' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Users size={18}/> PIUTANG CUSTOMER</button>
          <button onClick={() => {setActiveTab('supplier'); setSearchTerm(''); setFilterSupplier('');}} className={`flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 border-2 text-xs md:text-sm transition-all ${activeTab === 'supplier' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}><Truck size={18}/> HUTANG PABRIK</button>
        </div>
        <button onClick={handleExportPiutang} className="bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap">
          <Download size={18}/> Export Piutang
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="p-4 border-b flex flex-col lg:flex-row gap-3 items-center justify-between bg-gray-50/50">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center bg-white border rounded-xl px-3 shadow-sm flex-1 lg:flex-none"><input type="month" className="p-2 text-xs font-bold text-gray-700 bg-transparent outline-none w-full cursor-pointer" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />{filterBulan && <button onClick={()=>setFilterBulan('')} className="text-red-400 hover:text-red-600"><X size={16}/></button>}</div>
            {activeTab === 'supplier' && <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}><option value="">Semua Supplier</option>{suppliers.map(s => (<option key={s.id} value={s.id}>{s.nama}</option>))}</select>}
            <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterStatusBayar} onChange={(e) => setFilterStatusBayar(e.target.value)}><option value="">Semua Tagihan</option><option value="BELUM_LUNAS">Belum Lunas / Piutang</option><option value="LUNAS">Sudah Lunas</option></select>
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
                <th className="p-4">Tanggal Order</th><th className="p-4">{activeTab === 'customer' ? 'Nama Pelanggan' : 'Nama Supplier'}</th><th className="p-4">Jatuh Tempo</th><th className="p-4 text-center">Bukti / Link</th><th className="p-4">Rincian & QTY</th><th className="p-4 text-right">Total Tagihan</th><th className="p-4 text-right">Sudah Dibayar</th><th className="p-4 text-right">Sisa Hutang</th><th className="p-4 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-100">
              
              {activeTab === 'customer' && filteredOrders.map(o => {
                const isLunas = o.kekurangan <= 0; const due = getDueDateStatus(o.tanggal, o.tanggalJatuhTempo, isLunas);
                return (
                <tr key={o.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-blue-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(o.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className={`p-4 font-black uppercase ${isLunas ? 'text-gray-500' : 'text-blue-900'}`}>{o.customer?.nama}</td>
                  <td className="p-4"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>{isLunas ? 'LUNAS' : due.label}</span>{!isLunas && <button onClick={() => { setDateModal(o); setNewDueDate(o.tanggalJatuhTempo ? new Date(o.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-blue-600 p-1.5 bg-white border shadow-sm rounded-lg hover:bg-blue-50"><CalendarClock size={14}/></button>}</div></td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{(o.buktiLunas || o.buktiDp) ? renderLinks((o.buktiLunas || o.buktiDp), isLunas) : <span className="text-gray-300">-</span>}</div></td>
                  
                  {/* RINCIAN CUSTOMER DENGAN QTY */}
                  <td className="p-4 text-[11px] space-y-1">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <div>
                           <span className="font-bold text-gray-800">{i.product?.nama}</span>
                           <span className="ml-1 text-blue-600 font-medium">({i.qty} {i.product?.satuanJual || 'pcs'})</span>
                        </div>
                      </div>
                    ))}
                  </td>

                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(o.grandTotal)}</td>
                  <td className="p-4 text-right text-green-600 font-bold">{formatRp(o.dp)}</td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'}`}>{formatRp(o.kekurangan)}</td>
                  <td className="p-4 text-center">
                    {isLunas ? (<button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || '');}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 inline-flex items-center gap-1.5"><CheckCircle size={14}/> LUNAS (Edit)</button>
                    ) : (<button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || '');}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-700 shadow-md">Update Bayar</button>)}
                  </td>
                </tr>
              )})}

              {activeTab === 'supplier' && filteredPurchases.map(p => {
                const isLunas = p.sisaTagihan <= 0; const due = getDueDateStatus(p.tanggal, p.tanggalJatuhTempo, isLunas);
                return (
                <tr key={p.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-red-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className={`p-4 font-black uppercase ${isLunas ? 'text-gray-500' : 'text-red-900'}`}>{p.supplier?.nama}</td>
                  <td className="p-4"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>{isLunas ? 'LUNAS' : due.label}</span>{!isLunas && <button onClick={() => { setDateModal(p); setNewDueDate(p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-red-600 p-1.5 bg-white border shadow-sm rounded-lg hover:bg-red-50"><CalendarClock size={14}/></button>}</div></td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{p.buktiNota && <a href={p.buktiNota.startsWith('http') ? p.buktiNota : `https://${p.buktiNota}`} target="_blank" rel="noreferrer" className="text-orange-600 bg-white border p-1.5 rounded-lg shadow-sm hover:bg-gray-50"><FileText size={14}/></a>}{p.buktiBayar && renderLinks(p.buktiBayar, isLunas)}{!p.buktiNota && !p.buktiBayar && <span className="text-gray-300">-</span>}</div></td>
                  
                  {/* RINCIAN SUPPLIER DENGAN QTY DETAIL */}
                  <td className="p-4 text-[11px] space-y-1">
                    {p.items.map((i, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <div>
                           <span className="font-bold text-gray-800">{i.product?.nama}</span><br/>
                           <span className="text-[9px] font-medium text-red-600 bg-red-50 px-1 rounded uppercase">Pabrik: {i.qtyBeli} {i.product?.satuanBeli||'-'}</span>
                           <span className="text-[9px] text-gray-400 mx-1">➔</span>
                           <span className="text-[9px] font-medium text-green-700 bg-green-50 px-1 rounded uppercase">Gudang: {i.qty} {i.product?.satuanJual||'-'}</span>
                        </div>
                      </div>
                    ))}
                  </td>

                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(p.totalTagihan)}</td>
                  <td className="p-4 text-right text-green-600 font-bold">{formatRp(p.totalBayar)}</td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'}`}>{formatRp(p.sisaTagihan)}</td>
                  <td className="p-4 text-center space-y-2">
                     {isLunas ? (<button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || '');}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 inline-flex items-center gap-1.5 w-full justify-center"><CheckCircle size={14}/> LUNAS</button>
                     ) : (<button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || '');}} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-red-700 shadow-md w-full">Bayar Hutang</button>)}
                     
                     <button onClick={() => openEditPurchase(p)} className="text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl font-bold text-[10px] hover:bg-blue-100 flex items-center gap-1 w-full justify-center shadow-sm"><Edit3 size={13}/> REVISI NOTA</button>
                  </td>
                </tr>
              )})}
              {(filteredOrders.length === 0 && activeTab === 'customer') || (filteredPurchases.length === 0 && activeTab === 'supplier') ? <tr><td colSpan="9" className="p-10 text-center text-gray-500 font-medium">Tidak ada data transaksi pada filter ini.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT HUTANG / REVISI NOTA */}
      {editPurchaseId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col border-2 border-blue-500">
            <div className="p-3 border-b flex justify-between items-center bg-blue-50 shrink-0"><h3 className="font-black text-sm md:text-base text-blue-900 flex items-center gap-2"><Edit3 size={18}/> REVISI DATA BARANG MASUK</h3><button onClick={() => setEditPurchaseId(null)} className="p-1.5 bg-blue-100 hover:bg-red-500 hover:text-white rounded-full"><X size={16}/></button></div>
            
            <div className="p-3 md:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="text-[11px] text-yellow-800 font-medium">⚠️ <strong className="font-black">PERHATIAN:</strong> Menyimpan perubahan di form ini akan otomatis menyesuaikan ulang Stok Gudang dan nilai HPP produk yang bersangkutan. Pastikan qty revisi sudah benar.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 border-b pb-4 mt-2">
                <div className="col-span-1 md:col-span-4"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Supplier</label><input type="text" className="w-full border p-2 rounded-lg text-xs bg-gray-100 font-bold" value={editPurchaseForm.supplier?.label || ''} disabled /></div>
                <div className="col-span-1 md:col-span-4"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tanggal Beli Baru</label><input type="date" className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-blue-500" value={editPurchaseForm.tanggal} onChange={e=>setEditPurchaseForm({...editPurchaseForm, tanggal:e.target.value})}/></div>
                <div className="col-span-1 md:col-span-4"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Jatuh Tempo Baru</label><input type="date" className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-blue-500" value={editPurchaseForm.tglJatuhTempo} onChange={e=>setEditPurchaseForm({...editPurchaseForm, tglJatuhTempo:e.target.value})}/></div>
              </div>

              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-3 text-sm">Detail Konversi Barang (Revisi)</h4>
                <div className="flex flex-wrap gap-3 items-end mb-4">
                  <div className="w-full sm:flex-1 min-w-[200px]"><label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Pilih Produk</label><CreatableSelect options={products} value={selectedProduct} onChange={handleSelectProductForEdit} placeholder="Pilih produk..." styles={{control: (base) => ({...base, minHeight: '34px', fontSize: '12px'})}} /></div>
                  <div className="w-24"><label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Beli Pabrik</label><div className="flex bg-white border-2 rounded"><input type="number" className="w-full p-2 outline-none text-xs font-bold text-red-700 text-center" value={qtyBeli} onChange={e=>setQtyBeli(e.target.value)} placeholder="0" /><span className="bg-red-50 text-[9px] font-bold text-red-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</span></div></div>
                  <div className="w-32"><label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Harga/{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</label><input type="number" className="w-full border-2 p-2 rounded outline-none text-xs font-bold text-red-700" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)} placeholder="Rp" /></div>
                  <div className="w-24"><label className="text-[10px] font-bold text-green-700 mb-1 block uppercase">Masuk Gudang</label><div className="flex bg-white border-2 rounded"><input type="number" className="w-full p-2 outline-none text-xs font-bold text-green-700 text-center" value={qtyJual} onChange={e=>setQtyJual(e.target.value)} placeholder="0" /><span className="bg-green-50 text-[9px] font-bold text-green-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span></div></div>
                  <button onClick={handleAddItemToEdit} className="bg-blue-600 text-white px-3 rounded font-bold hover:bg-blue-700 h-[34px] shadow flex items-center gap-1"><PlusCircle size={14}/> Add</button>
                </div>
                
                <div className="overflow-x-auto border rounded bg-white">
                  <table className="w-full text-[11px] md:text-xs text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-2">Produk</th><th className="p-2 text-center text-red-700">Qty Pabrik</th><th className="p-2 text-center text-green-700">Masuk Gudang</th><th className="p-2 text-right">Harga Pabrik</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-center">Del</th></tr></thead>
                    <tbody className="divide-y">
                      {editPurchaseForm.items.length === 0 && <tr><td colSpan="6" className="p-3 text-center text-gray-400 italic">Data kosong. Tambahkan barang di atas.</td></tr>}
                      {editPurchaseForm.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-bold text-gray-800">{i.nama}</td>
                          <td className="p-2 text-center text-red-700 font-bold bg-red-50/50">{i.qtyBeli} <span className="text-[9px] font-normal uppercase">{i.satuanBeli}</span></td>
                          <td className="p-2 text-center text-green-700 font-bold bg-green-50/50">{i.qty} <span className="text-[9px] font-normal uppercase">{i.satuanJual}</span></td>
                          <td className="p-2 text-right text-gray-600">{formatRp(i.hargaBeli)}</td>
                          <td className="p-2 text-right font-black text-blue-900">{formatRp(i.subtotal)}</td>
                          <td className="p-2 text-center"><button onClick={() => setEditPurchaseForm(prev => ({...prev, items: prev.items.filter((_, index) => index !== idx)}))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div><label className="text-[10px] font-bold text-gray-600 mb-1 block">Catatan Revisi</label><textarea className="w-full border-2 p-2 rounded-lg h-12 outline-none text-xs focus:border-blue-500" value={editPurchaseForm.keterangan} onChange={e=>setEditPurchaseForm({...editPurchaseForm, keterangan:e.target.value})}></textarea></div>
                  <div className="bg-gray-50 p-2 rounded-lg border">
                    <label className="text-[10px] font-bold text-gray-700 mb-1 flex items-center gap-1"><LinkIcon size={12} className="text-blue-500"/> Link Surat Jalan Asli</label>
                    <input type="text" value={editPurchaseForm.buktiNota || ''} onChange={(e) => setEditPurchaseForm(prev=>({...prev, buktiNota: e.target.value}))} className="text-[10px] w-full bg-white p-2 rounded border outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex-1 bg-white p-3 rounded-xl border shadow-sm space-y-2">
                  <div className="flex justify-between font-bold text-gray-600 text-xs border-b pb-1"><span>Total Pabrik Baru:</span><span className="font-mono text-sm">{formatRp(totalTagihanEdit)}</span></div>
                  <div className="flex justify-between font-bold text-green-700 items-center gap-2"><span className="text-[11px]">Total Sudah Dibayar:</span><input type="number" className="w-1/2 border p-1.5 rounded-lg text-right font-bold bg-green-50 outline-none text-xs" value={editPurchaseForm.bayar} onChange={e=>setEditPurchaseForm({...editPurchaseForm, bayar:e.target.value})} placeholder="0" /></div>
                  <div className="flex justify-between font-black text-red-600 text-sm bg-red-50 p-1.5 rounded border border-red-100"><span>SISA HUTANG:</span><span>{formatRp(totalTagihanEdit - parseFloat(editPurchaseForm.bayar || 0))}</span></div>
                </div>
              </div>
            </div>
            <div className="p-3 shrink-0 bg-gray-50 border-t flex gap-2"><button onClick={() => setEditPurchaseId(null)} className="flex-1 bg-white border py-3 rounded-lg font-bold text-sm text-gray-600">Batal</button><button onClick={handleUpdateBarangMasuk} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm shadow-md flex justify-center items-center gap-2"><Save size={16}/> SIMPAN REVISI NOTA</button></div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN NORMAL & JATUH TEMPO */}
      {dateModal && ( <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10001] p-4 backdrop-blur-sm"><div className="bg-white p-5 md:p-6 rounded-2xl shadow-2xl w-full max-w-[350px]"><h3 className="font-bold text-base md:text-lg border-b border-gray-100 pb-3 mb-4 text-gray-800 flex items-center gap-2"><CalendarClock size={20} className={activeTab==='customer' ? 'text-blue-600' : 'text-red-600'}/> Atur Jatuh Tempo</h3><div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 text-sm"><p className="font-bold uppercase text-gray-900 mb-1">{activeTab === 'customer' ? dateModal.customer?.nama : dateModal.supplier?.nama}</p><div className="flex justify-between text-gray-500 text-xs"><span>Tgl Transaksi:</span><span>{new Date(dateModal.tanggal).toLocaleDateString('id-ID')}</span></div></div><div className="mb-6"><label className="text-xs font-bold text-gray-600 mb-2 block">Pilih Tanggal Jatuh Tempo Baru:</label><input type="date" className={`w-full border-2 p-3 rounded-xl font-bold text-sm outline-none focus:border-blue-500 ${!newDueDate ? 'border-red-300 bg-red-50' : 'bg-white'}`} value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div><div className="flex gap-3"><button onClick={() => setDateModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-colors">Batal</button><button onClick={handleSaveDueDate} className={`flex-1 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Tanggal</button></div></div></div> )}
      {payModal && ( <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm"><div className="bg-white p-5 md:p-6 rounded-2xl shadow-2xl w-full max-w-[400px]"><h3 className={`font-bold text-base md:text-lg border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 ${activeTab==='customer'?'text-blue-800':'text-red-800'}`}>{activeTab==='customer'?<Users size={20}/>:<Truck size={20}/>} Form Pembayaran</h3><div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-sm"><p className="font-black uppercase text-gray-900 mb-2">{activeTab === 'customer' ? payModal.customer?.nama : payModal.supplier?.nama}</p><div className="flex justify-between font-medium text-gray-600"><span>Tagihan:</span><span>{formatRp(activeTab === 'customer' ? payModal.grandTotal : payModal.totalTagihan)}</span></div><div className="flex justify-between text-red-600 mt-1"><span>Sisa Hutang:</span><span className="font-black">{formatRp(activeTab === 'customer' ? payModal.kekurangan : payModal.sisaTagihan)}</span></div></div><div className="mb-4"><label className="text-xs font-bold text-gray-600 mb-1.5 block">Total Akumulasi Dibayar (Rp)</label><input type="number" className="w-full border-2 p-3 rounded-xl font-black text-lg outline-none focus:border-green-500 text-green-700 bg-green-50/30" value={payAmount} onChange={e => setPayAmount(e.target.value)} /></div><div className="mb-6"><label className="text-xs font-bold text-gray-600 mb-1.5 block">Link Bukti Transfer / Nota</label><textarea className="w-full border-2 p-3 rounded-xl text-sm h-20 outline-none focus:border-blue-500 resize-none bg-white" value={buktiTf} onChange={e => setBuktiTf(e.target.value)} placeholder="Paste link Google Drive / foto di sini..."></textarea></div><div className="flex gap-3"><button onClick={() => setPayModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-colors">Batal</button><button onClick={activeTab === 'customer' ? handlePayCustomer : handlePaySupplier} className={`flex-1 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Pembayaran</button></div></div></div> )}
    </div>
  );
};
export default PiutangDashboard;