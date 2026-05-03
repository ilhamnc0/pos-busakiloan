import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, X, Users, Truck, Link as LinkIcon, CheckCircle, FileText, CalendarClock, Edit3, Download, Calendar, PackagePlus, PlusCircle, Trash2, AlertCircle } from 'lucide-react';
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
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]); 
  const [buktiTf, setBuktiTf] = useState(''); 

  const [dateModal, setDateModal] = useState(null); 
  const [newDueDate, setNewDueDate] = useState('');
  const [noteModal, setNoteModal] = useState(null); 

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ id: null, supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '', buktiTf: '', metodeBayar: 'TF' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyBeli, setQtyBeli] = useState('');
  const [qtyJual, setQtyJual] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');

  // FUNGSI ANTI CRASH GLOBAL
  const safeNum = (val) => { const num = parseFloat(val); return isNaN(num) ? 0 : num; };
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(safeNum(n));

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

  const fetchProducts = async () => { 
    try { 
      const res = await axios.get(`${baseURL}/api/products`); 
      setProducts(res.data); 
    } catch(e){} 
  };

  const handlePaySupplier = async () => { 
    if(!window.confirm("Simpan pembaruan data pembayaran ini?")) return;
    try { 
      await axios.put(`${baseURL}/api/purchases/${payModal.id}/payment`, { totalBayar: safeNum(payAmount), buktiBayar: buktiTf, tanggal: payDate }); 
      alert("✅ Data Hutang Supplier berhasil diupdate!");
      setPayModal(null); setPayAmount(''); setBuktiTf(''); loadData(); 
    } catch (e) { alert("Gagal update hutang"); } 
  };

  const handlePayCustomer = async () => { 
    if(!window.confirm("Simpan pembaruan data pembayaran ini?")) return;
    try { 
      const newDp = safeNum(payAmount); const sisa = payModal.grandTotal - newDp; 
      await axios.put(`${baseURL}/api/orders/${payModal.id}/payment`, { status: sisa <= 0 ? 'SELESAI' : 'TERKIRIM', dp: newDp, buktiLunas: buktiTf, tanggal: payDate }); 
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

  const handleCreateSupplier = async (val) => {
    try {
      const res = await axios.post(`${baseURL}/api/suppliers/upsert`, { nama: val });
      setSuppliers(prev => [...prev, { id: res.data.id, nama: res.data.nama }]);
      setPurchaseForm(prev => ({ ...prev, supplier: { value: res.data.id, label: `${res.data.nama} (#${res.data.id})` } }));
    } catch (e) { alert("Gagal buat supplier baru"); }
  };

  const handleCreateProductDropdown = async (val) => { 
      const res = await axios.post(`${baseURL}/api/products/upsert`, { nama: val, hargaJual:0, hpp:0, stok:0, isHppManual:false, satuanBeli: 'kg', satuanJual: 'pcs' }); 
      const n = {...res.data, value:res.data.id, label:`${res.data.nama} (#${res.data.id})`, dataAsli:res.data}; 
      setProducts(p=>[...p, n]); setSelectedProduct(n); setHargaBeli(''); 
  };

  const openAddPurchase = () => {
    setPurchaseForm({ id: null, supplier: null, tanggal: new Date().toISOString().split('T')[0], tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '', buktiTf: '', metodeBayar: 'TF' });
    setIsPurchaseModalOpen(true);
  };

  const openEditPurchase = (p) => {
    let safeTanggal = new Date().toISOString().split('T')[0];
    try { if (p.tanggal) safeTanggal = new Date(p.tanggal).toISOString().split('T')[0]; } catch(e) {}
    
    let safeJatuhTempo = '';
    try { if (p.tanggalJatuhTempo) safeJatuhTempo = new Date(p.tanggalJatuhTempo).toISOString().split('T')[0]; } catch(e) {}

    const formSupplier = p.supplier ? { value: p.supplierId, label: `${p.supplier.nama} (#${p.supplierId})` } : null;

    setPurchaseForm({
        id: p.id, supplier: formSupplier, tanggal: safeTanggal, tglJatuhTempo: safeJatuhTempo,
        items: (p.items || []).map(i => ({
            productId: i.productId, nama: i.product?.nama || 'Unknown', satuanBeli: i.product?.satuanBeli || '-', satuanJual: i.product?.satuanJual || '-',
            qtyBeli: safeNum(i.qtyBeli || i.qty), qty: safeNum(i.qty), hargaBeli: safeNum(i.hargaBeli), subtotal: safeNum(i.subtotal)
        })),
        bayar: safeNum(p.totalBayar), metodeBayar: p.metodeBayar || 'TF', buktiTf: p.buktiBayar || '', 
        keterangan: p.keterangan ? String(p.keterangan).replace(/ \[Via: .*?\]/, '') : '', buktiNota: p.buktiNota || ''
    });
    setIsPurchaseModalOpen(true);
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm("PERINGATAN SEVERITAS TINGGI:\n\nMenghapus nota ini akan MENARIK KEMBALI STOK gudang yang berasal dari nota ini.\n\nApakah Anda yakin ingin melanjutkan?")) {
        try {
            await axios.delete(`${baseURL}/api/purchases/${id}`);
            alert("✅ Nota berhasil dihapus dan stok dikembalikan!");
            loadData();
        } catch (e) { alert("Gagal menghapus nota: " + (e.response?.data?.error || e.message)); }
    }
  };

  const handleSelectProduct = (opt) => { setSelectedProduct(opt); if (opt) setHargaBeli(opt.dataAsli?.hpp || 0); else setHargaBeli(''); };

  const handleAddItemToPurchase = () => { 
      const qBeli = safeNum(qtyBeli); const qJual = safeNum(qtyJual); const hBeli = safeNum(hargaBeli); 
      if(!selectedProduct || qBeli <= 0 || qJual <= 0) return alert("Pilih produk dan pastikan angka qty/harga lebih dari 0!"); 
      const newItem = { productId: selectedProduct.value, nama: selectedProduct.label, satuanBeli: selectedProduct.dataAsli?.satuanBeli || '-', satuanJual: selectedProduct.dataAsli?.satuanJual || '-', qtyBeli: qBeli, qty: qJual, hargaBeli: hBeli, subtotal: qBeli*hBeli };
      setPurchaseForm(p => ({ ...p, items: [...p.items, newItem] })); 
      setSelectedProduct(null); setQtyBeli(''); setQtyJual(''); setHargaBeli(''); 
  };

  const handleSetTempo = (days) => { if (!days) return setPurchaseForm(p => ({ ...p, tglJatuhTempo: '' })); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); d.setDate(d.getDate() + parseInt(days)); setPurchaseForm(p => ({ ...p, tglJatuhTempo: d.toISOString().split('T')[0] })); };
  const handleSetFixedDate = (dayStr) => { if (!dayStr) return; const t = parseInt(dayStr); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); let y = d.getFullYear(); let m = d.getMonth(); if (t <= d.getDate()) { m++; if (m > 11) { m = 0; y++; } } let nd = new Date(y, m, t); if (nd.getMonth() !== m) nd = new Date(y, m + 1, 0); const pad = (n) => n.toString().padStart(2, '0'); setPurchaseForm(p => ({ ...p, tglJatuhTempo: `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}` })); };

  const handleSimpanBarangMasuk = async () => { 
    if(!purchaseForm.supplier || purchaseForm.items.length===0) return alert("Pilih supplier dan tambahkan minimal 1 barang!"); 
    if(!window.confirm(purchaseForm.id ? "PERINGATAN: Menyimpan revisi akan menyesuaikan ulang stok gudang. Lanjutkan?" : "Simpan Barang Masuk ini? Stok akan otomatis bertambah.")) return;
    try { 
        const payload = {
            supplierId: purchaseForm.supplier.value, items: purchaseForm.items, tanggal: purchaseForm.tanggal || new Date().toISOString(), 
            tanggalJatuhTempo: purchaseForm.tglJatuhTempo || null, totalBayar: safeNum(purchaseForm.bayar), metodeBayar: purchaseForm.metodeBayar,
            buktiTf: purchaseForm.buktiTf, keterangan: purchaseForm.keterangan, buktiNota: purchaseForm.buktiNota
        };
        if (purchaseForm.id) {
           await axios.put(`${baseURL}/api/purchases/${purchaseForm.id}`, payload); 
           alert("✅ REVISI NOTA BERHASIL! Stok diperbarui."); 
        } else {
           await axios.post(`${baseURL}/api/purchases`, payload); 
           alert("✅ BARANG MASUK BERHASIL DISIMPAN!"); 
        }
        setIsPurchaseModalOpen(false); loadData(); 
    } catch(e){ alert("Gagal menyimpan data."); } 
  };

  const handleExportPiutang = () => {
    let start, end;
    if (filterBulan) {
      start = `${filterBulan}-01`; end = new Date(filterBulan.split('-')[0], filterBulan.split('-')[1], 0).toISOString().split('T')[0];
    } else {
      start = `${new Date().getFullYear()}-01-01`; end = `${new Date().getFullYear()}-12-31`;
    }
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?start=${start}&end=${end}&type=piutang&token=${token}`, '_blank');
  };

  const getYearMonth = (dateString) => { const d = new Date(dateString); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  const filteredOrders = orders.filter(o => { 
    const matchName = o.customer?.nama.toLowerCase().includes(searchTerm.toLowerCase()) || o.customerId?.toString().includes(searchTerm) || o.id?.toString().includes(searchTerm);
    const matchBulan = filterBulan === '' || getYearMonth(o.tanggal) === filterBulan;
    const isLunas = o.kekurangan <= 0;
    const matchStatus = filterStatusBayar === '' ? true : filterStatusBayar === 'LUNAS' ? isLunas : !isLunas;
    return matchName && matchBulan && matchStatus; 
  });
  const totalPiutangCustomer = filteredOrders.reduce((sum, o) => sum + o.kekurangan, 0); 
  
  const filteredPurchases = purchases.filter(p => { 
    const matchSearch = p.supplier?.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.supplierId?.toString().includes(searchTerm) || p.id?.toString().includes(searchTerm);
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
    const label = targetDate.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});

    if (diffDays < 0) return { label, class: 'text-red-700 bg-white border-red-300 font-bold', isOverdue: true }; 
    if (diffDays <= 3) return { label, class: 'text-orange-700 bg-white border-orange-300 font-bold', isWarning: true }; 
    return { label, class: 'text-gray-700 bg-white border-gray-200 font-semibold' }; 
  };

  const totalTagihanPurchaseForm = (purchaseForm.items || []).reduce((sum, item) => sum + safeNum(item.subtotal), 0);

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
            {activeTab === 'supplier' && (
              <button onClick={openAddPurchase} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 w-full lg:w-auto whitespace-nowrap">
                 <PackagePlus size={16}/> Input Barang Masuk
              </button>
            )}
            <div className="flex items-center bg-white border rounded-xl px-3 shadow-sm flex-1 lg:flex-none"><input type="month" className="p-2 text-xs font-bold text-gray-700 bg-transparent outline-none w-full cursor-pointer" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />{filterBulan && <button onClick={()=>setFilterBulan('')} className="text-red-400 hover:text-red-600"><X size={16}/></button>}</div>
            {activeTab === 'supplier' && <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}><option value="">Semua Supplier</option>{suppliers.map(s => (<option key={s.id} value={s.id}>{s.nama} (#{s.id})</option>))}</select>}
            <select className="border bg-white p-2.5 rounded-xl text-xs font-bold text-gray-600 outline-none flex-1 lg:flex-none shadow-sm cursor-pointer" value={filterStatusBayar} onChange={(e) => setFilterStatusBayar(e.target.value)}><option value="">Semua Tagihan</option><option value="BELUM_LUNAS">Belum Lunas / Piutang</option><option value="LUNAS">Sudah Lunas</option></select>
          </div>
          <div className="relative w-full lg:w-64 mt-2 lg:mt-0"><Search className="absolute left-3 top-2.5 text-gray-400" size={16} /><input className="pl-9 pr-4 py-2.5 border rounded-xl w-full text-xs outline-none focus:border-blue-500 shadow-sm bg-white" placeholder="Cari ID / Nama..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
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
                <th className="p-4">ID Nota</th>
                <th className="p-4">{activeTab === 'customer' ? 'Nama Pelanggan' : 'Nama Supplier'}</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-center">Bukti / Link</th>
                <th className="p-4">Rincian & QTY</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right text-green-700 bg-green-50/50">Sudah Dibayar</th>
                <th className="p-4 text-center text-green-700 bg-green-50/50">Tgl Pembayaran</th>
                <th className="p-4 text-right text-red-700 bg-red-50/50">Sisa Hutang</th>
                <th className="p-4 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y border-gray-100">
              
              {activeTab === 'customer' && filteredOrders.map(o => {
                const isLunas = o.kekurangan <= 0; const due = getDueDateStatus(o.tanggal, o.tanggalJatuhTempo, isLunas);
                return (
                <tr key={o.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-blue-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(o.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                  <td className="p-4 font-bold text-gray-700">#{o.id}</td>
                  <td className="p-4">
                    <span className={`font-black uppercase ${isLunas ? 'text-gray-500' : 'text-blue-900'} block`}>{o.customer?.nama} <span className="text-xs text-gray-500 lowercase font-medium">(#{o.customerId})</span></span>
                    {o.keterangan ? (
                      <button onClick={() => setNoteModal({ nama: o.customer?.nama, text: o.keterangan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm text-left font-medium w-full">
                        <FileText size={12} className="shrink-0"/> {o.keterangan.length > 25 ? o.keterangan.substring(0, 25) + '...' : o.keterangan}
                      </button>
                    ) : ( <div className="mt-1.5 text-[10px] text-gray-400 italic flex items-center gap-1"><FileText size={12}/> Tidak ada catatan</div> )}
                  </td>
                  <td className="p-4"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>{isLunas ? 'LUNAS' : due.label}</span>{!isLunas && <button onClick={() => { setDateModal(o); setNewDueDate(o.tanggalJatuhTempo ? new Date(o.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-blue-600 p-1.5 bg-white border shadow-sm rounded-lg hover:bg-blue-50"><CalendarClock size={14}/></button>}</div></td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{(o.buktiLunas || o.buktiDp) ? renderLinks((o.buktiLunas || o.buktiDp), isLunas) : <span className="text-gray-300">-</span>}</div></td>
                  <td className="p-4 text-[11px] space-y-1">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-gray-400">•</span>
                        <div>
                           <span className="font-bold text-gray-800">{i.product?.nama} <span className="text-[9px] text-gray-500 font-medium">(#{i.productId})</span></span>
                           <span className="ml-1 text-blue-600 font-medium">({i.qty} {i.product?.satuanJual || 'pcs'})</span>
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(o.grandTotal)}</td>
                  <td className="p-4 text-right text-green-600 font-bold bg-green-50/20">{formatRp(o.dp)}</td>
                  <td className="p-4 text-center text-[12px] font-bold text-green-700 bg-green-50/20">
                    {o.lastPaymentDate ? new Date(o.lastPaymentDate).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'}) : '-'}
                  </td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'} bg-red-50/20`}>{formatRp(o.kekurangan)}</td>
                  <td className="p-4 text-center">
                    {isLunas ? (<button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || ''); setPayDate(o.lastPaymentDate ? o.lastPaymentDate.split('T')[0] : new Date().toISOString().split('T')[0]);}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 inline-flex items-center gap-1.5"><CheckCircle size={14}/> LUNAS (Edit)</button>
                    ) : (<button onClick={() => {setPayModal(o); setPayAmount(o.dp); setBuktiTf(o.buktiLunas || o.buktiDp || ''); setPayDate(new Date().toISOString().split('T')[0]);}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-700 shadow-md">Update Bayar</button>)}
                  </td>
                </tr>
              )})}

              {activeTab === 'supplier' && filteredPurchases.map(p => {
                const isLunas = p.sisaTagihan <= 0; const due = getDueDateStatus(p.tanggal, p.tanggalJatuhTempo, isLunas);
                return (
                <tr key={p.id} className={`transition-colors ${isLunas ? 'bg-green-50/50 text-gray-500' : 'hover:bg-red-50/30'}`}>
                  <td className="p-4 text-xs text-gray-600">{new Date(p.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                  <td className="p-4 font-bold text-gray-700">#{p.id}</td>
                  <td className="p-4">
                    <span className={`font-black uppercase ${isLunas ? 'text-gray-500' : 'text-red-900'} block`}>{p.supplier?.nama} <span className="text-xs text-gray-500 lowercase font-medium">(#{p.supplierId})</span></span>
                    {p.keterangan ? (
                      <button onClick={() => setNoteModal({ nama: p.supplier?.nama, text: p.keterangan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm text-left font-medium w-full">
                        <FileText size={12} className="shrink-0"/> {p.keterangan.length > 25 ? p.keterangan.substring(0, 25) + '...' : p.keterangan}
                      </button>
                    ) : ( <div className="mt-1.5 text-[10px] text-gray-400 italic flex items-center gap-1"><FileText size={12}/> Tidak ada catatan</div> )}
                  </td>
                  <td className="p-4"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-lg text-[11px] shadow-sm border ${due.class} ${due.isOverdue && !isLunas ? 'animate-pulse ring-2 ring-red-200' : ''}`}>{isLunas ? 'LUNAS' : due.label}</span>{!isLunas && <button onClick={() => { setDateModal(p); setNewDueDate(p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toISOString().split('T')[0] : ''); }} className="text-gray-400 hover:text-red-600 p-1.5 bg-white border shadow-sm rounded-lg hover:bg-blue-50"><CalendarClock size={14}/></button>}</div></td>
                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5 flex-wrap max-w-[120px] mx-auto">{p.buktiNota && <a href={p.buktiNota.startsWith('http') ? p.buktiNota : `https://${p.buktiNota}`} target="_blank" rel="noreferrer" className="text-orange-600 bg-white border p-1.5 rounded-lg shadow-sm hover:bg-gray-50"><FileText size={14}/></a>}{p.buktiBayar && renderLinks(p.buktiBayar, isLunas)}{!p.buktiNota && !p.buktiBayar && <span className="text-gray-300">-</span>}</div></td>
                  <td className="p-4 text-[11px] space-y-2">
                    {p.items.map((i, idx) => (
                      <div key={idx} className="flex flex-col bg-white p-2 rounded border border-gray-100 shadow-sm">
                         <span className="font-bold text-gray-800 mb-1">{i.product?.nama} <span className="text-[9px] text-gray-500 font-medium">(#{i.productId})</span></span>
                         <div className="flex items-center gap-1">
                           <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase border border-red-100">Beli Pabrik: {i.qtyBeli} {i.product?.satuanBeli||'-'}</span>
                           <span className="text-gray-300">➔</span>
                           <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded uppercase border border-green-100">Msk Gudang: {i.qty} {i.product?.satuanJual||'-'}</span>
                         </div>
                      </div>
                    ))}
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-800">{formatRp(p.totalTagihan)}</td>
                  <td className="p-4 text-right text-green-600 font-bold bg-green-50/20">{formatRp(p.totalBayar)}</td>
                  <td className="p-4 text-center text-[12px] font-bold text-green-700 bg-green-50/20">{p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'}) : '-'}</td>
                  <td className={`p-4 text-right font-black ${isLunas ? 'text-gray-400' : 'text-red-600 text-base'} bg-red-50/20`}>{formatRp(p.sisaTagihan)}</td>
                  <td className="p-4 text-center space-y-2">
                     {isLunas ? (<button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || ''); setPayDate(p.lastPaymentDate ? p.lastPaymentDate.split('T')[0] : new Date().toISOString().split('T')[0]);}} className="text-green-700 font-bold text-[11px] bg-white border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 inline-flex items-center gap-1.5 w-full justify-center"><CheckCircle size={14}/> LUNAS</button>
                     ) : (<button onClick={() => {setPayModal(p); setPayAmount(p.totalBayar); setBuktiTf(p.buktiBayar || ''); setPayDate(new Date().toISOString().split('T')[0]);}} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-red-700 shadow-md w-full">Bayar Hutang</button>)}
                     
                     <div className="flex gap-1 justify-center mt-1">
                        <button onClick={() => openEditPurchase(p)} className="flex-1 bg-white text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 shadow-sm" title="Revisi Nota"><Edit3 size={14} className="mx-auto"/></button>
                        <button onClick={() => handleDeletePurchase(p.id)} className="flex-1 bg-white text-red-600 p-1.5 rounded-lg hover:bg-red-50 border border-red-200 shadow-sm" title="Hapus Nota (Tarik Stok)"><Trash2 size={14} className="mx-auto"/></button>
                     </div>
                  </td>
                </tr>
              )})}
              {(filteredOrders.length === 0 && activeTab === 'customer') || (filteredPurchases.length === 0 && activeTab === 'supplier') ? <tr><td colSpan="11" className="p-10 text-center text-gray-500 font-medium">Tidak ada data transaksi pada filter ini.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-2 md:p-4 backdrop-blur-sm">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col ${purchaseForm.id ? 'border-2 border-blue-500' : ''}`}>
            <div className={`p-4 border-b flex justify-between items-center sticky top-0 z-20 ${purchaseForm.id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${purchaseForm.id ? 'text-blue-800' : 'text-green-800'}`}>
                    {purchaseForm.id ? <Edit3 size={20}/> : <PackagePlus size={20}/>} 
                    {purchaseForm.id ? `Revisi Nota Pembelian (#${purchaseForm.id})` : 'Form Barang Masuk (Restock)'}
                </h3>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 bg-white border shadow-sm hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500"><X size={18}/></button>
            </div>
            
            <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
              {purchaseForm.id && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 font-medium flex items-start gap-2 shadow-sm">
                      <AlertCircle size={18} className="shrink-0 mt-0.5"/>
                      <p><strong className="font-black">PERHATIAN REVISI:</strong> Menyimpan perubahan di form ini akan <b>otomatis menyesuaikan ulang Stok Gudang Anda</b>. Pastikan kuantitas (Qty Masuk Gudang) direvisi dengan benar agar stok tidak selisih.</p>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-5">
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Pilih Supplier Pabrik</label>
                  <CreatableSelect options={suppliers.map(s => ({value: s.id, label: `${s.nama} (#${s.id})`}))} value={purchaseForm.supplier} onChange={s=>setPurchaseForm({...purchaseForm, supplier: s})} onCreateOption={handleCreateSupplier} placeholder="Ketik nama supplier..." />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tanggal Beli / Masuk</label>
                  <input type="date" className="w-full border-2 p-[9px] rounded-lg outline-none text-sm focus:border-green-500" value={purchaseForm.tanggal} onChange={e=>setPurchaseForm({...purchaseForm, tanggal:e.target.value})}/>
                </div>
                
                <div className="col-span-5 grid grid-cols-2 gap-2 bg-red-50 border border-red-100 p-2 rounded-lg">
                  <div>
                    <label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Set Tempo</label>
                    <div className="flex flex-col sm:flex-row gap-1">
                      <select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetTempo(e.target.value)}>
                        <option value="">+ Hari</option><option value="7">7 Hari</option><option value="14">14 Hari</option><option value="30">1 Bulan</option><option value="45">45 Hari</option><option value="60">2 Bulan</option>
                      </select>
                      <select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetFixedDate(e.target.value)}>
                        <option value="">Tgl...</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Jatuh Tempo</label><input type="date" className="w-full border border-red-200 bg-white p-1 rounded text-[11px] font-bold outline-none focus:border-red-500" value={purchaseForm.tglJatuhTempo} onChange={e=>setPurchaseForm({...purchaseForm, tglJatuhTempo:e.target.value})} /></div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                <h4 className="font-bold text-orange-900 mb-3 text-sm flex items-center gap-1.5"><PackagePlus size={16}/> Input Detail Konversi Barang</h4>
                <div className="flex flex-wrap gap-3 items-end mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Pilih Produk</label>
                    <CreatableSelect options={products.map(p => ({value: p.id, label: `${p.nama} (#${p.id})`, dataAsli: p}))} value={selectedProduct} onChange={handleSelectProduct} onCreateOption={handleCreateProductDropdown} placeholder="Pilih..." styles={{control: (base) => ({...base, minHeight: '38px', fontSize: '13px'})}} />
                  </div>
                  
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Beli Pabrik</label>
                    <div className="flex bg-white border-2 rounded-lg focus-within:border-red-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-sm font-bold text-red-700 text-center" value={qtyBeli} onChange={e=>setQtyBeli(e.target.value)} placeholder="0" />
                       <span className="bg-red-50 text-[10px] font-bold text-red-800 flex items-center px-1.5 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Harga/{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</label>
                    <input type="number" className="w-full border-2 p-2 rounded-lg outline-none focus:border-red-500 text-sm font-bold text-red-700" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)} placeholder="Rp" />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] font-bold text-green-700 mb-1 block uppercase">Masuk Gudang</label>
                    <div className="flex bg-white border-2 rounded-lg focus-within:border-green-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-sm font-bold text-green-700 text-center" value={qtyJual} onChange={e=>setQtyJual(e.target.value)} placeholder="0" />
                       <span className="bg-green-50 text-[10px] font-bold text-green-800 flex items-center px-1.5 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span>
                    </div>
                  </div>

                  <button onClick={handleAddItemToPurchase} className="bg-orange-600 text-white px-5 rounded-lg font-bold hover:bg-orange-700 h-[38px] shadow-sm flex items-center gap-1.5"><PlusCircle size={16}/> Add</button>
                </div>
                
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-3">Produk</th><th className="p-3 text-center border-l text-red-700 bg-red-50/30">QTY dari Pabrik</th><th className="p-3 text-center border-r text-green-700 bg-green-50/30">QTY Masuk Gudang</th><th className="p-3 text-right">Harga Pabrik</th><th className="p-3 text-right">Subtotal</th><th className="p-3 text-center">Del</th></tr></thead>
                    <tbody className="divide-y">
                      {purchaseForm.items.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-400 italic">Belum ada barang diinput di form ini.</td></tr>}
                      {purchaseForm.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-800">{i.nama} <span className="text-[10px] text-gray-500 font-medium">(#{i.productId})</span></td>
                          <td className="p-3 text-center text-red-700 font-bold bg-red-50/50 border-l">{i.qtyBeli} <span className="text-[9px] font-normal uppercase">{i.satuanBeli}</span></td>
                          <td className="p-3 text-center text-green-700 font-bold bg-green-50/50 border-r">{i.qty} <span className="text-[9px] font-normal uppercase">{i.satuanJual}</span></td>
                          <td className="p-3 text-right text-gray-600">{formatRp(i.hargaBeli)}<span className="text-[9px] uppercase">/{i.satuanBeli}</span></td>
                          <td className="p-3 text-right font-black text-blue-900">{formatRp(i.subtotal)}</td>
                          <td className="p-3 text-center"><button onClick={() => setPurchaseForm(prev => ({...prev, items: prev.items.filter((_, index) => index !== idx)}))} className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 mb-1.5 block uppercase">Catatan Transaksi</label>
                    <textarea 
                      className="w-full border-2 p-3 rounded-xl h-[80px] outline-none text-xs focus:border-blue-500 resize-none shadow-sm" 
                      value={purchaseForm.keterangan} 
                      onChange={e=>setPurchaseForm({...purchaseForm, keterangan:e.target.value})} 
                      placeholder="Ketik catatan tambahan..."
                    ></textarea>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 uppercase">
                      <LinkIcon size={14} className="text-blue-500"/> Link Foto Nota / Surat Jalan
                    </label>
                    <textarea 
                      placeholder="Paste link Drive / Link Foto di sini...&#10;(Pisahkan dgn SPASI)" 
                      value={purchaseForm.buktiNota || ''} 
                      onChange={(e) => setPurchaseForm(prev=>({...prev, buktiNota: e.target.value}))} 
                      className="text-xs w-full bg-white p-2.5 rounded-lg border-2 outline-none focus:border-blue-500 h-[65px] resize-none" 
                    ></textarea>
                  </div>
                </div>

                <div className="flex-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center space-y-3">
                  <div className="flex justify-between font-bold text-gray-600 text-sm border-b pb-2">
                    <span>{purchaseForm.id ? 'Total:' : 'Total Tagihan Pabrik:'}</span>
                    <span className="font-black text-lg">{formatRp(totalTagihanPurchaseForm)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700 items-center gap-2">
                    <span className="text-xs uppercase whitespace-nowrap">Bayar:</span>
                    <input 
                      type="number" 
                      className="w-1/2 border-2 p-2.5 rounded-lg text-right font-black bg-green-50 outline-none focus:border-green-500 text-sm" 
                      value={purchaseForm.bayar} 
                      onChange={e=>setPurchaseForm({...purchaseForm, bayar:e.target.value})} 
                      placeholder="0" 
                    />
                  </div>
                  
                  {safeNum(purchaseForm.bayar) > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-gray-200">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Metode</label>
                        <select className="w-full border-2 p-2.5 rounded-lg outline-none text-xs focus:border-green-500 font-bold text-gray-700" value={purchaseForm.metodeBayar} onChange={e=>setPurchaseForm({...purchaseForm, metodeBayar:e.target.value})}>
                          <option value="TF">Transfer</option>
                          <option value="CASH">Cash / Tunai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Link Bukti TF</label>
                        <input type="text" className="w-full border-2 p-2.5 rounded-lg outline-none text-xs focus:border-green-500" value={purchaseForm.buktiTf} onChange={e=>setPurchaseForm({...purchaseForm, buktiTf:e.target.value})} placeholder="Paste link..." />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-red-600 text-lg bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
                    <span>SISA HUTANG:</span>
                    <span>{formatRp(totalTagihanPurchaseForm - safeNum(purchaseForm.bayar))}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsPurchaseModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batalkan</button>
                  <button onClick={handleSimpanBarangMasuk} className={`flex-[2] text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 ${purchaseForm.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      <Save size={22}/> {purchaseForm.id ? 'SIMPAN REVISI NOTA' : 'SIMPAN BARANG MASUK'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL PEMBAYARAN */}
      {payModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-[400px] border border-gray-100">
              <h3 className={`font-bold text-xl border-b pb-3 mb-4 flex items-center gap-2 ${activeTab==='customer'?'text-blue-800':'text-red-800'}`}>
                {activeTab==='customer'?<Users size={20}/>:<Truck size={20}/>} Form Pembayaran
              </h3>
              
              <div className="mb-5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-bold text-gray-800 uppercase">
                   {activeTab === 'customer' 
                     ? `${payModal.customer?.nama} (#${payModal.customerId})` 
                     : `${payModal.supplier?.nama} (#${payModal.supplierId})`}
                </p>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Tagihan Nota:</span> 
                  <span className="font-bold">{formatRp(activeTab === 'customer' ? payModal.grandTotal : payModal.totalTagihan)}</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-red-600">
                  <span>Sisa Kurang:</span> 
                  <span className="font-bold">{formatRp(activeTab === 'customer' ? payModal.kekurangan : payModal.sisaTagihan)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1"><Calendar size={14} className="text-blue-500"/> Tanggal Pembayaran Masuk</label>
                <input type="date" className="w-full border-2 p-3 rounded-xl font-bold text-sm outline-none focus:border-blue-500 bg-white shadow-sm" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Total Akumulasi Dibayar (Rp)</label>
                <input type="number" className="w-full border-2 p-3 rounded-xl font-black text-lg outline-none focus:border-green-500 text-green-700 bg-green-50/50 shadow-sm" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                <p className="text-[10px] text-gray-400 mt-1.5 italic">*Ganti angka ini dengan total akumulasi yang sudah dibayar secara keseluruhan.</p>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Link Bukti Transfer / Nota</label>
                <textarea className="w-full border-2 p-3 rounded-xl text-sm h-16 outline-none focus:border-blue-500 resize-none bg-white shadow-sm" value={buktiTf} onChange={e => setBuktiTf(e.target.value)} placeholder="Paste link Google Drive..."></textarea>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPayModal(null)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Batal</button>
                <button onClick={activeTab === 'customer' ? handlePayCustomer : handlePaySupplier} className={`flex-1 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}><Save size={18}/> Simpan</button>
              </div>
           </div>
        </div>
      )}

      {/* POP-UP CATATAN */}
      {noteModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-yellow-500"/> Catatan Transaksi
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">
                  Oleh: <span className="text-blue-600">{noteModal?.nama}</span>
                </p>
              </div>
              <button onClick={() => setNoteModal(null)} className="text-gray-400 bg-gray-100 p-2 rounded-full hover:text-red-500 transition-colors">
                <X size={16}/>
              </button>
            </div>
            <div className="bg-yellow-50/50 p-4 rounded-2xl text-sm text-gray-700 leading-relaxed max-h-[40vh] overflow-auto border border-yellow-100 font-medium whitespace-pre-wrap">
              {noteModal?.text}
            </div>
          </div>
        </div>
      )}

      {dateModal && ( 
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10001] p-4 backdrop-blur-sm">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-2xl w-full max-w-[350px]">
            <h3 className={`font-bold text-base md:text-lg border-b border-gray-100 pb-3 mb-4 flex items-center gap-2 ${activeTab==='customer' ? 'text-blue-600' : 'text-red-600'}`}><CalendarClock size={20}/> Atur Jatuh Tempo</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 text-sm">
              <p className="font-bold uppercase text-gray-900 mb-1">{activeTab === 'customer' ? dateModal.customer?.nama : dateModal.supplier?.nama}</p>
              <div className="flex justify-between text-gray-500 text-xs"><span>Tgl Transaksi:</span><span>{new Date(dateModal.tanggal).toLocaleDateString('id-ID')}</span></div>
            </div>
            <div className="mb-6"><label className="text-xs font-bold text-gray-600 mb-2 block">Pilih Tanggal Jatuh Tempo Baru:</label><input type="date" className={`w-full border-2 p-3 rounded-xl font-bold text-sm outline-none focus:border-blue-500 ${!newDueDate ? 'border-red-300 bg-red-50' : 'bg-white'}`} value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
            <div className="flex gap-3"><button onClick={() => setDateModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-xs font-bold text-gray-600 transition-colors">Batal</button><button onClick={handleSaveDueDate} className={`flex-1 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-transform active:scale-95 ${activeTab === 'customer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>Simpan Tanggal</button></div>
          </div>
        </div> 
      )}
    </div>
  );
};
export default PiutangDashboard;