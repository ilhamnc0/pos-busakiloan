import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { Search, Edit2, Trash2, Printer, PlusCircle, X, ArrowUpDown, ShoppingCart, FileText, Save, User, Package, CreditCard, CalendarClock, Truck } from 'lucide-react'; 
import CreatableSelect from 'react-select/creatable';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sopirs, setSopirs] = useState([]);
  
  const currentMonthDate = new Date();
  const currentMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterStatus, setFilterStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [noteModal, setNoteModal] = useState(null);

  const [form, setForm] = useState({ 
    id: null, customerId: null, sopirId: null, tanggal: '', status: 'MENUNGGU', 
    items: [], dp: '', ongkir: '', ongkirModal: '', metodeBayar: 'TF', buktiLunas: '', catatan: '', tanggalJatuhTempo: '' 
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hargaSatuan, setHargaSatuan] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => { 
    fetchOrders(); fetchCustomers(); fetchProducts(); fetchSopirs();
  }, []);

  const fetchOrders = () => axios.get(`${baseURL}/api/orders`).then(res => {
    if (Array.isArray(res.data)) setOrders(res.data);
  }).catch(console.error);
  
  const fetchCustomers = () => axios.get(`${baseURL}/api/customers`).then(res => {
    if (Array.isArray(res.data)) setCustomers(res.data.map(c => ({value: c.id, label: `${c.nama} (${c.alamat || '-'})`, dataAsli: c})));
  }).catch(console.error);
  
  const fetchProducts = () => axios.get(`${baseURL}/api/products`).then(res => {
    if (Array.isArray(res.data)) setProducts(res.data.map(p => ({value: p.id, label: p.nama, dataAsli: p})));
  }).catch(console.error);
  
  const fetchSopirs = () => axios.get(`${baseURL}/api/sopir`).then(res => {
    if (Array.isArray(res.data)) setSopirs(res.data.map(s => ({value: s.id, label: s.nama, dataAsli: s})));
  }).catch(console.error);

  const openAddModal = () => {
    const today = new Date();
    const jtDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    
    const safeToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const safeJt = `${jtDate.getFullYear()}-${String(jtDate.getMonth()+1).padStart(2,'0')}-${String(jtDate.getDate()).padStart(2,'0')}`;

    setForm({ 
      id: null, customerId: null, sopirId: null, tanggal: safeToday, status: 'MENUNGGU', 
      items: [], dp: '', ongkir: '', ongkirModal: '', metodeBayar: 'TF', buktiLunas: '', catatan: '', tanggalJatuhTempo: safeJt 
    });
    setSelectedProduct(null); setHargaSatuan(''); setQty(1); setIsEditing(false); setIsModalOpen(true);
  };

  const openEditModal = (o) => {
    const fullCustomerData = customers.find(c => c.value === o.customerId) || (o.customer ? { value: o.customerId, label: `${o.customer.nama} (${o.customer.alamat || '-'})`, dataAsli: o.customer } : null);
    const fullSopirData = sopirs.find(s => s.value === o.sopirId) || (o.sopir ? { value: o.sopirId, label: o.sopir.nama, dataAsli: o.sopir } : null);
    
    let safeTanggal = '';
    try { safeTanggal = o.tanggal ? new Date(o.tanggal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; } catch(e) { safeTanggal = new Date().toISOString().split('T')[0]; }
    
    let safeJatuhTempo = '';
    try { if (o.tanggalJatuhTempo) safeJatuhTempo = new Date(o.tanggalJatuhTempo).toISOString().split('T')[0]; } catch(e) {}

    setForm({ 
      id: o.id, 
      customerId: fullCustomerData, 
      sopirId: fullSopirData,
      namaPelanggan: o.customer?.nama,
      tanggal: safeTanggal, 
      tanggalJatuhTempo: safeJatuhTempo, 
      status: o.status || 'MENUNGGU', 
      items: o.items.map(i => ({ 
        productId: i.productId, nama: i.product?.nama, qty: i.qty, subtotal: i.subtotal, 
        hargaJual: i.hargaSatuan, hppSatuan: i.hppSatuan || i.product?.hpp || 0,
        satuanJual: i.product?.satuanJual || '-'
      })), 
      dp: o.dp || '', ongkir: o.ongkosKirim || '', ongkirModal: o.ongkosKirimModal || '', metodeBayar: o.metodeBayar || 'TF', buktiLunas: o.buktiLunas || o.buktiDp || '', catatan: o.keterangan || ''
    });
    setIsEditing(true); setIsModalOpen(true);
  };

  const handleCreateCustomer = async (inputValue) => {
    try {
      const res = await axios.post(`${baseURL}/api/customers/upsert`, { nama: inputValue, ongkirDefault: 0, ongkirPerusahaanDefault: 0 });
      const newCust = { value: res.data.id, label: `${res.data.nama} (-)`, dataAsli: res.data };
      setCustomers(prev => [...prev, newCust]);
      setForm(prev => ({ ...prev, customerId: newCust, ongkir: '', ongkirModal: '' }));
    } catch (e) { alert("Gagal membuat data pelanggan baru."); }
  };

  const handleCreateSopir = async (inputValue) => {
    try {
      const res = await axios.post(`${baseURL}/api/sopir/upsert`, { nama: inputValue, ongkir: [] });
      const newSopir = { value: res.data.id, label: res.data.nama, dataAsli: res.data };
      setSopirs(prev => [...prev, newSopir]);
      setForm(prev => ({ ...prev, sopirId: newSopir, ongkirModal: '' }));
    } catch (e) { alert("Gagal membuat data sopir baru."); }
  };

  const handleCreateProduct = async (inputValue) => {
    try {
      const res = await axios.post(`${baseURL}/api/products/upsert`, { nama: inputValue, hargaJual: 0, hpp: 0, stok: 0, isHppManual: false });
      const newProd = { ...res.data, value: res.data.id, label: res.data.nama, dataAsli: res.data };
      setProducts(prev => [...prev, newProd]);
      setSelectedProduct(newProd);
      setHargaSatuan(0);
    } catch (e) { alert("Gagal membuat produk baru."); }
  };

  const handleCustomerChange = (selectedCust) => {
    let tarifTagihan = selectedCust?.dataAsli?.ongkirDefault || '';
    let tarifModal = selectedCust?.dataAsli?.ongkirPerusahaanDefault || '';

    setForm({ ...form, customerId: selectedCust, ongkir: tarifTagihan, ongkirModal: tarifModal });
    
    if (selectedProduct) {
      const prodId = selectedProduct.dataAsli?.id;
      if (selectedCust?.dataAsli?.hargaKhusus) {
        const hk = selectedCust.dataAsli.hargaKhusus.find(h => h.productId === prodId);
        setHargaSatuan(hk ? hk.harga : selectedProduct.dataAsli.hargaJual);
      } else {
        setHargaSatuan(selectedProduct.dataAsli.hargaJual);
      }
    }
  };

  const handleSopirChange = (selectedSopir) => {
    setForm({ ...form, sopirId: selectedSopir });
  };

  const handleProductChange = (selectedProd) => {
    setSelectedProduct(selectedProd);
    if (selectedProd) {
      const prodId = selectedProd.dataAsli?.id;
      if (form.customerId?.dataAsli?.hargaKhusus) {
        const hk = form.customerId?.dataAsli.hargaKhusus.find(h => h.productId === prodId);
        if (hk) return setHargaSatuan(hk.harga);
      }
      setHargaSatuan(selectedProd.dataAsli?.hargaJual || '');
    } else {
      setHargaSatuan('');
    }
  };

  const handleAddItem = (e) => { 
    e.preventDefault(); 
    const qtyNum = parseFloat(qty); 
    const hargaNum = parseFloat(hargaSatuan);
    
    if (!selectedProduct) return alert("Silakan pilih produk terlebih dahulu!");
    if (isNaN(qtyNum) || qtyNum <= 0) return alert("Jumlah (Qty) harus lebih dari 0!");
    if (isNaN(hargaNum)) return alert("Harga satuan tidak valid!");
    
    const hppSaatIni = selectedProduct.dataAsli?.hpp || 0;
    const newItem = { 
      productId: selectedProduct.value, 
      nama: selectedProduct.label, 
      satuanJual: selectedProduct.dataAsli?.satuanJual || '-', 
      qty: qtyNum, 
      hargaJual: hargaNum, 
      hppSatuan: hppSaatIni, 
      subtotal: hargaNum * qtyNum 
    };
    
    setForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedProduct(null); 
    setHargaSatuan(''); 
    setQty(1);
  };
  
  const handleRemoveItem = (index) => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));

  const totalBarang = form.items.reduce((sum, item) => sum + item.subtotal, 0);
  const ongkirNum = parseFloat(form.ongkir) || 0;
  const ongkirModalNum = parseFloat(form.ongkirModal) || 0;
  const grandTotal = totalBarang + ongkirNum;
  const dpNum = parseFloat(form.dp) || 0;
  const sisaBayar = grandTotal - dpNum;

  useEffect(() => {
    if (isModalOpen && form.items.length > 0) {
      setForm(prev => {
        if (sisaBayar <= 0 && ['MENUNGGU', 'DP'].includes(prev.status)) return { ...prev, status: 'SELESAI' };
        else if (dpNum > 0 && sisaBayar > 0 && prev.status === 'MENUNGGU') return { ...prev, status: 'DP' };
        else if (dpNum === 0 && prev.status === 'DP') return { ...prev, status: 'MENUNGGU' };
        return prev;
      });
    }
  }, [sisaBayar, dpNum, isModalOpen, form.items.length]);

  const handleQuickStatusChange = async (order, newStatus) => {
    if (!window.confirm(`Ubah status order ${order.customer?.nama} menjadi ${newStatus}?`)) return;

    try {
      const payload = { 
        status: newStatus, dp: order.dp, tanggal: order.tanggal, tanggalJatuhTempo: order.tanggalJatuhTempo, 
        keterangan: order.keterangan, 
        items: order.items.map(i => ({ productId: i.productId, qty: i.qty, hargaJual: i.hargaSatuan, hppSatuan: i.hppSatuan })), 
        ongkosKirim: order.ongkosKirim, ongkosKirimModal: order.ongkosKirimModal, metodeBayar: order.metodeBayar, 
        sopirId: order.sopirId, buktiLunas: order.buktiLunas
      };
      await axios.put(`${baseURL}/api/orders/${order.id}`, payload);
      fetchOrders();
    } catch (e) { alert("Gagal mengubah status."); }
  };

  const handleSaveOrder = async () => {
    if (!form.customerId) return alert("Pelanggan harus dipilih!");
    if (form.items.length === 0) return alert("Pilih minimal 1 barang!");
    if (!window.confirm("Apakah Anda yakin ingin menyimpan data transaksi pesanan ini?")) return;

    try {
      const payload = { 
        status: form.status, dp: dpNum, tanggal: form.tanggal, tanggalJatuhTempo: form.tanggalJatuhTempo, keterangan: form.catatan, 
        items: form.items, ongkosKirim: ongkirNum, ongkosKirimModal: ongkirModalNum, metodeBayar: form.metodeBayar, sopirId: form.sopirId?.value || null,
        buktiLunas: form.buktiLunas, customerId: form.customerId.value, totalHarga: totalBarang 
      };
      
      if (isEditing) await axios.put(`${baseURL}/api/orders/${form.id}`, payload);
      else await axios.post(`${baseURL}/api/orders`, payload);
      
      setIsModalOpen(false); fetchOrders();
    } catch (e) { alert("Gagal menyimpan order: " + (e.response?.data?.error || e.message)); }
  };

  const deleteOrder = async (id) => {
    if (confirm('Yakin hapus order permanen?')) {
      try { await axios.delete(`${baseURL}/api/orders/${id}`); fetchOrders(); } catch (e) {}
    }
  };

  let processedOrders = orders.filter(o => {
    const custName = o.customer?.nama || '';
    const custAlamat = o.customer?.alamat || '';
    const matchSearch = custName.toLowerCase().includes(searchTerm.toLowerCase()) || custAlamat.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchBulan = true;
    if (filterBulan !== '') {
       try {
         if(!o.tanggal) matchBulan = false;
         else {
            const d = new Date(o.tanggal);
            if (!isNaN(d.getTime())) {
                const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                matchBulan = yearMonth === filterBulan;
            } else matchBulan = false;
         }
       } catch(e) { matchBulan = false; }
    }
    
    const matchStatus = filterStatus === '' || o.status === filterStatus;
    return matchSearch && matchBulan && matchStatus;
  });

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const formatCustomerName = (cust) => {
    if (!cust) return '-';
    if (cust.alamat && cust.alamat.trim() !== '' && cust.alamat.trim() !== '-') return `${cust.nama} (${cust.alamat})`;
    return cust.nama;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SELESAI': return 'bg-green-500/15 text-green-700 border-green-200';
      case 'DP': return 'bg-amber-500/15 text-amber-700 border-amber-300';
      case 'DIKIRIM': return 'bg-orange-400/15 text-orange-600 border-orange-200'; 
      case 'TERKIRIM': return 'bg-blue-500/15 text-blue-700 border-blue-200'; 
      case 'DIBATALKAN': return 'bg-gray-800/10 text-gray-800 border-gray-300';
      case 'MENUNGGU': default: return 'bg-red-500/15 text-red-700 border-red-200';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 border flex flex-col lg:flex-row justify-between gap-4 rounded-2xl shadow-sm">
        <button onClick={openAddModal} className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shrink-0"><PlusCircle size={18}/> Buat Order Baru</button>
        <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto">
          <input type="month" className="p-2 border rounded-xl text-sm outline-none text-gray-700 w-full sm:w-auto flex-1 lg:flex-none" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} />
          <select className="p-2 border rounded-xl text-sm outline-none text-gray-700 w-full sm:w-auto flex-1 lg:flex-none font-semibold bg-gray-50 cursor-pointer" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="MENUNGGU">Menunggu</option>
            <option value="DP">DP</option>
            <option value="DIKIRIM">Dikirim</option>
            <option value="TERKIRIM">Terkirim</option>
            <option value="SELESAI">Selesai</option>
            <option value="DIBATALKAN">Dibatalkan</option>
          </select>
          <div className="relative w-full sm:w-64 flex-none mt-2 lg:mt-0">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input className="pl-9 pr-4 py-2 border rounded-xl w-full text-sm outline-none" placeholder="Cari Pelanggan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-2xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b font-semibold sticky top-0 z-10 text-gray-600 text-xs uppercase">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Pelanggan & Sopir</th>
              <th className="p-4">Rincian</th>
              <th className="p-4 text-right">Total Tagihan</th>
              <th className="p-4 text-right">Sisa (Piutang)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y border-gray-100">
            {processedOrders.map(o => (
              <tr key={o.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="p-4 text-xs">{o.tanggal ? new Date(o.tanggal).toLocaleDateString('id-ID') : '-'}</td>
                <td className="p-4">
                  <span className="font-bold uppercase block text-sm text-gray-900">{formatCustomerName(o.customer)}</span>
                  {o.sopir && <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5"><Truck size={12}/> Dikirim oleh: {o.sopir.nama}</span>}
                  {o.keterangan && (
                    <button onClick={() => setNoteModal({ nama: formatCustomerName(o.customer), text: o.keterangan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm text-left font-medium">
                      <FileText size={12} className="text-yellow-600 shrink-0"/> {o.keterangan.length > 25 ? o.keterangan.substring(0, 25) + '...' : o.keterangan}
                    </button>
                  )}
                </td>
                <td className="p-4 text-xs text-gray-700">
                  {o.items.map((i, idx) => ( 
                    <div key={idx}>• {i.product?.nama} <b>{i.qty}</b><span className="text-[9px] text-gray-400 ml-0.5 uppercase">{i.product?.satuanJual || '-'}</span></div> 
                  ))}
                </td>
                <td className="p-4 text-right font-bold">{formatRp(o.grandTotal)}</td>
                <td className="p-4 text-right font-black text-red-600">{formatRp(o.kekurangan)}</td>
                <td className="p-4 text-center">
                  <select
                    value={o.status}
                    onChange={(e) => handleQuickStatusChange(o, e.target.value)}
                    className={`px-2 py-1.5 pr-6 rounded-lg text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-colors hover:brightness-95 ${getStatusBadge(o.status)}`}
                  >
                    <option value="MENUNGGU" className="text-gray-900 bg-white">MENUNGGU</option>
                    <option value="DP" className="text-gray-900 bg-white">DP</option>
                    <option value="DIKIRIM" className="text-gray-900 bg-white">DIKIRIM</option>
                    <option value="TERKIRIM" className="text-gray-900 bg-white">TERKIRIM</option>
                    <option value="SELESAI" className="text-gray-900 bg-white">SELESAI</option>
                    <option value="DIBATALKAN" className="text-gray-900 bg-white">BATAL</option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => openEditModal(o)} className="text-blue-500 bg-blue-50 p-2 rounded-xl"><Edit2 size={16}/></button>
                    <button onClick={() => deleteOrder(o.id)} className="text-red-500 bg-red-50 p-2 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {processedOrders.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada data order.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-[950px] max-h-[95vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2"><ShoppingCart size={22}/> {isEditing ? 'Edit Order' : 'Buat Order Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 hover:text-red-600 rounded-xl"><X size={20}/></button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="bg-white p-4 rounded-2xl border shadow-sm">
                <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2 border-b pb-2"><User size={16} className="text-blue-500"/> Informasi Pelanggan & Pengiriman</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Pelanggan</label>
                    <CreatableSelect 
                      options={customers} value={form.customerId} onChange={handleCustomerChange} 
                      onCreateOption={handleCreateCustomer} 
                      placeholder="Cari Pelanggan..." styles={{control: base => ({...base, borderRadius: '0.75rem', borderColor: '#e5e7eb', borderWidth: '2px'})}} 
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-1"><Truck size={12}/> Sopir (Hanya Referensi)</label>
                    <CreatableSelect 
                      isClearable options={sopirs} value={form.sopirId} onChange={handleSopirChange} 
                      onCreateOption={handleCreateSopir} 
                      placeholder="Pilih Sopir..." styles={{control: base => ({...base, borderRadius: '0.75rem', borderColor: '#ffedd5', backgroundColor: '#fff7ed', borderWidth: '2px'})}} 
                    />
                  </div>
                  <div className="lg:col-span-2"><label className="text-xs font-semibold block mb-1">Tanggal Transaksi</label><input type="date" className="w-full border-2 p-2.5 rounded-xl text-sm" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} /></div>
                  <div className="lg:col-span-2"><label className="text-xs font-semibold text-red-600 block mb-1">Jatuh Tempo</label><input type="date" className="w-full border-2 p-2.5 rounded-xl text-sm border-red-200 text-red-700 bg-red-50 font-medium" value={form.tanggalJatuhTempo} onChange={e => setForm({...form, tanggalJatuhTempo: e.target.value})} /></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border shadow-sm">
                <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2 border-b pb-2"><Package size={16} className="text-blue-500"/> Input Barang</h4>
                <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
                  <div className="w-full md:flex-1">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Cari Produk (Busa / Bantal)</label>
                    <CreatableSelect 
                      options={products} value={selectedProduct} onChange={handleProductChange} 
                      onCreateOption={handleCreateProduct} 
                      placeholder="Ketik nama barang..." styles={{control: base => ({...base, minHeight:'42px', borderRadius: '0.75rem', borderWidth: '2px'})}} 
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-36">
                      <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase">Harga / {selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</label>
                      <input type="number" className="w-full border-2 p-2.5 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 text-blue-700" value={hargaSatuan} onChange={e=>setHargaSatuan(e.target.value)} placeholder="0" />
                    </div>
                    
                    <div className="w-28">
                      <label className="text-[10px] font-semibold text-gray-600 mb-1 block uppercase">Qty Jual</label>
                      <div className="flex bg-white border-2 rounded-xl focus-within:border-blue-500 overflow-hidden h-[42px]">
                        <input type="number" className="w-full p-2 text-sm font-bold text-center outline-none" value={qty} onChange={e=>setQty(e.target.value)} placeholder="1" />
                        <span className="bg-gray-100 text-[10px] font-bold text-gray-500 flex items-center px-1.5 border-l uppercase truncate max-w-[40px]">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"><PlusCircle size={16}/> Tambah</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold text-xs uppercase">
                      <tr><th className="p-3">Nama Barang</th><th className="p-3 text-right">Harga Satuan</th><th className="p-3 text-center">Qty Jual</th><th className="p-3 text-right">Subtotal</th><th className="p-3 text-center">Hapus</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {form.items.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-400 italic text-xs">Belum ada barang di keranjang.</td></tr>}
                      {form.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">{i.nama}</td>
                          <td className="p-3 text-right text-gray-600">{formatRp(i.hargaJual)}</td>
                          <td className="p-3 text-center font-black text-blue-800 bg-blue-50/30">{i.qty} <span className="text-[9px] font-normal text-gray-500 uppercase">{i.satuanJual}</span></td>
                          <td className="p-3 text-right font-bold text-gray-900">{formatRp(i.subtotal)}</td>
                          <td className="p-3 text-center"><button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 bg-white p-4 rounded-2xl border space-y-4 shadow-sm">
                  <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 border-b pb-2"><CreditCard size={16} className="text-blue-500"/> Rincian Pembayaran</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl">
                      <label className="text-[10px] font-bold text-orange-800 uppercase block mb-1">Ongkir dari Customer</label>
                      <input type="number" className="w-full border-2 p-2 rounded-lg text-sm bg-white font-bold text-orange-700 outline-none" value={form.ongkir} onChange={e=>setForm({...form, ongkir:e.target.value})} placeholder="0" title="Dibayar oleh pelanggan ke kita" />
                    </div>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Ongkir ke Sopir</label>
                      <input type="number" className="w-full border-2 p-2 rounded-lg text-sm bg-white font-bold text-red-700 outline-none" value={form.ongkirModal} onChange={e=>setForm({...form, ongkirModal:e.target.value})} placeholder="0" title="Uang jalan yang dibayar ke sopir" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Sudah Bayar (DP)</label>
                      <input type="number" className="w-full border-2 p-2.5 rounded-xl text-green-700 bg-green-50 font-bold outline-none border-green-200" value={form.dp} onChange={e=>setForm({...form, dp:e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Metode</label>
                      <select className="w-full border-2 p-2.5 rounded-xl font-bold outline-none bg-white text-gray-700" value={form.metodeBayar} onChange={e=>setForm({...form, metodeBayar:e.target.value})}>
                        <option value="TF">Transfer Bank</option>
                        <option value="CASH">Tunai (Cash)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Status Order</label>
                      <select className="w-full border-2 p-2.5 rounded-xl font-bold outline-none bg-gray-50 text-gray-700" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                        <option value="MENUNGGU">MENUNGGU (Belum Bayar)</option>
                        <option value="DP">DP (Bayar Sebagian)</option>
                        <option value="DIKIRIM">DIKIRIM (Jalan)</option>
                        <option value="TERKIRIM">TERKIRIM (Piutang)</option>
                        <option value="SELESAI">SELESAI (Lunas)</option>
                        <option value="DIBATALKAN">DIBATALKAN (Cancel)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Bukti Transfer (Link)</label>
                      <input type="text" className="w-full border-2 p-2.5 rounded-xl text-sm outline-none bg-white" value={form.buktiLunas} onChange={e=>setForm({...form, buktiLunas:e.target.value})} placeholder="Opsional..." />
                    </div>
                  </div>
                  <div>
                     <label className="text-xs font-semibold text-gray-600 block mb-1 flex items-center gap-1"><FileText size={12}/> Catatan (Opsional)</label>
                     <textarea className="w-full border-2 p-2.5 rounded-xl text-sm outline-none resize-none h-16" value={form.catatan} onChange={e=>setForm({...form, catatan:e.target.value})} placeholder="Tulis catatan..."></textarea>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-600"><span>Total Barang:</span><span>{formatRp(totalBarang)}</span></div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 border-b border-blue-200 pb-3 mt-1"><span>Ongkir Tagihan:</span><span>+ {formatRp(ongkirNum)}</span></div>
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-3"><span>GRAND TOTAL:</span><span>{formatRp(grandTotal)}</span></div>
                    <div className="flex justify-between text-sm font-semibold text-green-600 mt-1"><span>Sudah Dibayar (DP):</span><span>- {formatRp(dpNum)}</span></div>
                    
                    <div className={`mt-5 p-4 rounded-xl flex justify-between items-center border ${sisaBayar <= 0 ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
                      <span className="text-sm font-bold">{sisaBayar <= 0 ? 'LUNAS / KEMBALI:' : 'PIUTANG:'}</span>
                      <span className="text-2xl font-black">{formatRp(Math.abs(sisaBayar))}</span>
                    </div>
                  </div>
                  <button type="button" onClick={handleSaveOrder} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-base mt-6 shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2">
                    <Save size={20}/> SIMPAN TRANSAKSI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {noteModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-yellow-500"/> Catatan Order
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1">
                  Pelanggan: <span className="text-blue-600">{noteModal?.nama}</span>
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
    </div>
  );
};
export default OrderList;