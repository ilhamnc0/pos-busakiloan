import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Save, X, Search, UserPlus, MapPin, Phone, Package, PlusCircle, Eye, PackagePlus, Link as LinkIcon, Download } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nama: '', kontak: '', alamat: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [detailSupplier, setDetailSupplier] = useState(null);
  const [suppliedProducts, setSuppliedProducts] = useState([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({ id: null, nama: '', categoryId: '', hargaJual: '', hpp: '', stok: '', parentId: '', isHppManual: false, satuanBeli: 'kg', satuanJual: 'pcs' });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [qtyBeli, setQtyBeli] = useState(''); 
  const [qtyJual, setQtyJual] = useState(''); 
  const [hargaBeli, setHargaBeli] = useState('');

  useEffect(() => { 
    fetchSuppliers(); fetchCategories(); fetchAllProducts();
  }, []);
  
  useEffect(() => { 
    setFilteredSuppliers(suppliers.filter(s => {
      const st = searchTerm.toLowerCase();
      return (s.nama && s.nama.toLowerCase().includes(st)) ||
             (s.alamat && s.alamat.toLowerCase().includes(st)) ||
             (s.kontak && s.kontak.toLowerCase().includes(st));
    })); 
  }, [searchTerm, suppliers]);

  const fetchSuppliers = () => axios.get(`${baseURL}/api/suppliers`).then(res => setSuppliers(res.data)).catch(console.error);
  const fetchCategories = () => axios.get(`${baseURL}/api/products/categories/all`).then(res => setCategories(res.data)).catch(console.error);
  const fetchAllProducts = () => axios.get(`${baseURL}/api/products`).then(res => setAllProducts(res.data)).catch(console.error);

  const openAddModal = () => { setForm({ id: null, nama: '', kontak: '', alamat: '' }); setIsEditing(false); setIsModalOpen(true); };
  const openEditModal = (s) => { setForm({ id: s.id, nama: s.nama, kontak: s.kontak || '', alamat: s.alamat || '' }); setIsEditing(true); setIsModalOpen(true); };

 const handleSave = async () => { 
    if (!form.nama) return alert("Nama supplier wajib diisi"); 
    try {
      await axios.post(`${baseURL}/api/suppliers/upsert`, form); 
      setIsModalOpen(false); 
      fetchSuppliers(); 
      alert("Supplier berhasil disimpan!"); 
    } catch(e) {
      console.error("Error simpan supplier:", e);
      alert("Gagal menyimpan supplier: \n" + (e.response?.data?.error || e.message));
    }
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?type=supplier&token=${token}`, '_blank');
  };

  const deleteSupplier = async (id) => {
    if (window.confirm('Yakin ingin menghapus supplier ini secara permanen?')) {
      try { await axios.delete(`${baseURL}/api/suppliers/${id}`); fetchSuppliers(); } catch (error) {}
    }
  };

  const loadSupplierProducts = async (supplierId) => {
      try {
          const res = await axios.get(`${baseURL}/api/purchases`);
          const suppPurchases = res.data.filter(p => p.supplierId === supplierId);
          const prodMap = {};
          suppPurchases.forEach(p => { p.items.forEach(i => { if (i.product) prodMap[i.productId] = i.product; }); });
          setSuppliedProducts(Object.values(prodMap));
      } catch(e) {}
  };

  const openDetail = (s) => { setDetailSupplier(s); loadSupplierProducts(s.id); };

  const openAddProduct = () => { 
      setProductForm({ id: null, nama: '', categoryId: '', hargaJual: '', hpp: '', stok: '', parentId: '', isHppManual: false, satuanBeli: 'kg', satuanJual: 'pcs' }); 
      setIsEditingProduct(false); setIsProductModalOpen(true); 
  };
  
  const openEditProduct = (p) => { 
      setProductForm({ 
          id: p.id, nama: p.nama, categoryId: p.categoryId || '', 
          hargaJual: p.hargaJual, hpp: p.hpp || 0, stok: p.stok, 
          parentId: p.parentId || '', isHppManual: p.isHppManual,
          satuanBeli: p.satuanBeli || 'kg', satuanJual: p.satuanJual || 'pcs'
      }); 
      setIsEditingProduct(true); setIsProductModalOpen(true); 
  };

  const handleSaveProduct = async () => {
      if(!productForm.nama) return alert("Nama produk wajib diisi!");
      try {
          await axios.post(`${baseURL}/api/products/upsert`, productForm);
          setIsProductModalOpen(false); fetchAllProducts();
          if (detailSupplier) loadSupplierProducts(detailSupplier.id);
      } catch (e) { 
          alert("Gagal menyimpan produk: \n\n" + (e.response?.data?.error || e.message)); 
      }
  };

  const deleteProduct = async (id) => {
      if (confirm("PERINGATAN: Yakin hapus produk ini dari MASTER DATA?")) {
          try { await axios.delete(`${baseURL}/api/products/${id}`); fetchAllProducts(); if (detailSupplier) loadSupplierProducts(detailSupplier.id); } catch (e) {}
      }
  };

  const openPurchaseModal = () => {
     setPurchaseForm({ supplier: detailSupplier ? {value: detailSupplier.id, label: detailSupplier.nama} : null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '' });
     setIsPurchaseModalOpen(true);
  };

  const handleCreateSupplier = async (val) => { const res = await axios.post(`${baseURL}/api/suppliers/upsert`, { nama: val }); setSuppliers(p => [...p, {value: res.data.id, label: res.data.nama}]); setPurchaseForm(p => ({ ...p, supplier: {value: res.data.id, label: res.data.nama} })); };

  const handleSelectProduct = (opt) => {
      setSelectedProduct(opt);
      if (opt) setHargaBeli(opt.dataAsli?.hpp || 0); 
      else setHargaBeli('');
  };

  const handleCreateProductDropdown = async (val) => { 
      const res = await axios.post(`${baseURL}/api/products/upsert`, { nama: val, hargaJual:0, hpp:0, stok:0, isHppManual:false, satuanBeli: 'kg', satuanJual: 'pcs' }); 
      const n = {...res.data, value:res.data.id, label:res.data.nama, dataAsli:res.data}; 
      setAllProducts(p=>[...p, n]); setSelectedProduct(n); setHargaBeli(''); 
  };

  const handleAddItemToPurchase = () => {
    const qBeli = parseFloat(qtyBeli);
    const qJual = parseFloat(qtyJual);
    const hBeli = parseFloat(hargaBeli);
    
    if (!selectedProduct || isNaN(qBeli) || isNaN(qJual) || isNaN(hBeli)) {
      return alert("Pilih produk dan isi semua angka qty & harga dengan benar!");
    }

    const newItem = {
      productId: selectedProduct.value,
      nama: selectedProduct.label,
      satuanBeli: selectedProduct.dataAsli?.satuanBeli || '-',
      satuanJual: selectedProduct.dataAsli?.satuanJual || '-',
      qtyBeli: qBeli,
      qty: qJual,
      hargaBeli: hBeli,
      subtotal: qBeli * hBeli
    };
    
    setPurchaseForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedProduct(null); setQtyBeli(''); setQtyJual(''); setHargaBeli('');
  };

  const handleSetTempo = (days) => { if (!days) return setPurchaseForm(p => ({ ...p, tglJatuhTempo: '' })); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); d.setDate(d.getDate() + parseInt(days)); setPurchaseForm(p => ({ ...p, tglJatuhTempo: d.toISOString().split('T')[0] })); };
  const handleSetFixedDate = (dayStr) => { if (!dayStr) return; const t = parseInt(dayStr); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); let y = d.getFullYear(); let m = d.getMonth(); if (t <= d.getDate()) { m++; if (m > 11) { m = 0; y++; } } let nd = new Date(y, m, t); if (nd.getMonth() !== m) nd = new Date(y, m + 1, 0); const pad = (n) => n.toString().padStart(2, '0'); setPurchaseForm(p => ({ ...p, tglJatuhTempo: `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}` })); };

  const handleSimpanBarangMasuk = async () => {
    if (!purchaseForm.supplier || purchaseForm.items.length === 0) return alert("Pilih supplier & masukkan minimal 1 barang!");
    try {
      await axios.post(`${baseURL}/api/purchases`, {
        supplierId: purchaseForm.supplier.value, items: purchaseForm.items,
        tanggal: purchaseForm.tanggal || new Date().toISOString(),
        tanggalJatuhTempo: purchaseForm.tglJatuhTempo || null,
        totalBayar: parseFloat(purchaseForm.bayar || 0), keterangan: purchaseForm.keterangan, buktiNota: purchaseForm.buktiNota
      });
      alert("✅ Barang Masuk Berhasil! Stok dan HPP Otomatis Terupdate.");
      setIsPurchaseModalOpen(false); setPurchaseForm({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '' });
      fetchAllProducts(); if (detailSupplier) loadSupplierProducts(detailSupplier.id);
    } catch (e) { alert("Gagal menyimpan transaksi: " + (e.response?.data?.error || e.message)); }
  };

  const masterProducts = (allProducts || []).filter(p => !p.parentId && p.id !== productForm.id);
  const totalTagihanPurchase = purchaseForm.items.reduce((sum, item) => sum + item.subtotal, 0);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      <datalist id="satuanList">
        <option value="kg" /><option value="gram" /><option value="meter" /><option value="cm" /><option value="roll" /><option value="lembar" /><option value="pcs" /><option value="box" /><option value="liter" />
      </datalist>

      <div className="bg-white p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={openAddModal} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
            <UserPlus size={18}/> Tambah Supplier
          </button>
          <button onClick={handleExportExcel} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
            <Download size={18}/> Export Excel
          </button>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input className="pl-10 pr-4 py-2.5 border rounded-lg w-full text-sm outline-none focus:border-blue-500 shadow-sm" placeholder="Cari Nama / Lokasi / Nomor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 font-semibold text-gray-600 sticky top-0 z-10 border-b">
            <tr><th className="p-4 w-1/3">Nama Supplier (Pabrik)</th><th className="p-4 w-1/3">Lokasi / Alamat</th><th className="p-4 w-1/4">Kontak / WA</th><th className="p-4 text-center">Aksi</th></tr>
          </thead>
          <tbody className="divide-y border-t-0">
            {filteredSuppliers.map(s => (
              <tr key={s.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="p-4 font-bold text-gray-900 uppercase">{s.nama}</td>
                <td className="p-4 text-gray-700"><div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400"/> {s.alamat || '-'}</div></td>
                <td className="p-4 text-blue-600 font-medium"><div className="flex items-center gap-1.5"><Phone size={14} className="text-gray-400"/> {s.kontak || '-'}</div></td>
                <td className="p-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <button onClick={() => openDetail(s)} className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-green-200"><Eye size={14}/> Detail / Input Pabrik</button>
                    <button onClick={() => openEditModal(s)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => deleteSupplier(s.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">Tidak ada data supplier.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-lg text-blue-800 flex items-center gap-2"><UserPlus size={20}/> {isEditing ? 'Edit Supplier' : 'Tambah Supplier'}</h3><button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full text-gray-600 hover:text-red-500 transition-colors"><X size={18}/></button></div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Pabrik / Supplier</label><input className="border-2 p-2.5 rounded-lg w-full text-sm font-bold outline-none focus:border-blue-500" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} placeholder="Wajib diisi..." /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Kontak / WA</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500" value={form.kontak} onChange={e=>setForm({...form, kontak:e.target.value})} placeholder="08..." /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Alamat Lengkap</label><textarea className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500 h-20" value={form.alamat} onChange={e=>setForm({...form, alamat:e.target.value})} placeholder="Alamat..."></textarea></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button><button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-transform active:scale-95"><Save size={18}/> Simpan</button></div>
          </div>
        </div>
      )}

      {detailSupplier && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9990] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[850px] flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <div>
                 <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Package size={20} className="text-blue-600"/> Produk dari {detailSupplier.nama}</h3>
              </div>
              <button onClick={() => setDetailSupplier(null)} className="p-1.5 bg-gray-200 rounded-full text-gray-600 hover:text-red-500"><X size={18}/></button>
            </div>
            
            <div className="p-4 bg-orange-50 border-b border-orange-100 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-3">
                <button onClick={openPurchaseModal} className="bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-orange-700 transition-colors w-full sm:w-auto justify-center"><Package size={16}/> Input Barang Masuk dari Pabrik</button>
                <button onClick={openAddProduct} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"><PlusCircle size={16}/> Tambah Produk</button>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
               <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase sticky top-0">
                     <tr><th className="p-4">Nama Produk</th><th className="p-4 text-right">Harga Jual</th><th className="p-4 text-right">HPP (Modal)</th><th className="p-4 text-center">Stok Gudang</th><th className="p-4 text-center">Kelola Master</th></tr>
                  </thead>
                  <tbody className="divide-y">
                     {suppliedProducts.map(p => (
                         <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-900 flex flex-col gap-0.5">
                              {p.nama}
                              <span className="text-[9px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-max uppercase">Pabrik: {p.satuanBeli || '-'} | Customer: {p.satuanJual || '-'}</span>
                            </td>
                            <td className="p-4 text-right text-blue-600 font-semibold">{formatRp(p.hargaJual)} <span className="text-[10px] text-gray-400 uppercase">/{p.satuanJual || '-'}</span></td>
                            <td className="p-4 text-right text-red-500 font-semibold">{formatRp(p.hpp)} <span className="text-[10px] text-gray-400 uppercase">/{p.satuanJual || '-'}</span></td>
                            <td className="p-4 text-center font-black text-gray-800">{p.stok} <span className="text-[10px] font-normal text-gray-500 uppercase">{p.satuanJual || '-'}</span></td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                   <button onClick={() => openEditProduct(p)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                   <button onClick={() => deleteProduct(p.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </td>
                         </tr>
                     ))}
                     {suppliedProducts.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic font-medium">Belum ada riwayat produk dari pabrik ini. <br/>Klik "Input Barang Masuk dari Pabrik" di atas untuk menambah data stok.</td></tr>}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="p-3 md:p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-sm md:text-base text-green-800 flex items-center gap-1.5"><Package size={16}/> {isEditingProduct ? 'Edit Master Produk' : 'Buat Master Produk Baru'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full hover:text-red-500"><X size={16}/></button>
            </div>
            <div className="p-3 md:p-4 space-y-3 overflow-y-auto">
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Nama Produk</label><input className="border-2 p-2 rounded-lg w-full outline-none focus:border-green-500 text-xs font-bold" value={productForm.nama} onChange={e => setProductForm({...productForm, nama: e.target.value})}/></div>
              
              <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div>
                  <label className="text-[10px] font-bold text-blue-800 mb-1 block uppercase">Satuan Beli Pabrik</label>
                  <input list="satuanList" className="border-2 border-blue-200 p-2 rounded-lg w-full text-xs font-bold text-gray-800 outline-none focus:border-blue-500" value={productForm.satuanBeli} onChange={e => setProductForm({...productForm, satuanBeli: e.target.value})} placeholder="Ketik: kg, dll" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-green-800 mb-1 block uppercase">Satuan Jual Customer</label>
                  <input list="satuanList" className="border-2 border-green-200 p-2 rounded-lg w-full text-xs font-bold text-gray-800 outline-none focus:border-green-500" value={productForm.satuanJual} onChange={e => setProductForm({...productForm, satuanJual: e.target.value})} placeholder="Ketik: meter, dll" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Kategori</label><select className="border-2 p-2 rounded-lg w-full text-xs outline-none focus:border-green-500" value={productForm.categoryId || ''} onChange={e => setProductForm({...productForm, categoryId: e.target.value})}><option value="">Pilih Kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-blue-600 mb-1 block">Sub-Produk Dari</label><select className="border-2 p-2 rounded-lg w-full bg-blue-50 text-xs outline-none focus:border-blue-500" value={productForm.parentId || ''} onChange={e => setProductForm({...productForm, parentId: e.target.value})}><option value="">Induk (Berdiri Sendiri)</option>{masterProducts.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border">
                <div><label className="text-[9px] font-bold text-gray-500 mb-1 block uppercase">Harga Jual (per {productForm.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-full text-xs font-bold text-blue-600 outline-none focus:border-blue-500" type="number" value={productForm.hargaJual} onChange={e => setProductForm({...productForm, hargaJual: e.target.value})} /></div>
                <div><label className="text-[9px] font-bold text-red-500 mb-1 block uppercase">HPP Modal (per {productForm.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-full text-xs font-bold text-red-600 bg-white outline-none focus:border-red-500" type="number" value={productForm.hpp} onChange={e => setProductForm({...productForm, hpp: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Stok Awal di Gudang ({productForm.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-1/2 text-xs outline-none focus:border-green-500" type="number" value={productForm.stok} onChange={e => setProductForm({...productForm, stok: e.target.value})} /></div>
              
              {!productForm.parentId && (
                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 flex items-start gap-2">
                  <input type="checkbox" id="hppManual" className="w-4 h-4 cursor-pointer mt-0.5 accent-yellow-600 shrink-0" checked={productForm.isHppManual} onChange={e => setProductForm({...productForm, isHppManual: e.target.checked})} />
                  <label htmlFor="hppManual" className="text-[10px] font-bold text-yellow-800 cursor-pointer select-none leading-tight">Set HPP Induk Manual (Ceklis agar HPP tidak berubah otomatis dari produk anak)</label>
                </div>
              )}
            </div>
            <div className="p-3 md:p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Batal</button>
              <button onClick={handleSaveProduct} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md">Simpan Master Produk</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL RESTOCK BARANG MASUK --- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-20"><h3 className="font-bold text-lg text-green-800 flex items-center gap-2"><PackagePlus/> Form Barang Masuk</h3><button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500"><X size={20}/></button></div>
            
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-5">
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Supplier Pabrik</label>
                  <CreatableSelect options={suppliers.map(s => ({value: s.id, label: s.nama}))} value={purchaseForm.supplier} onChange={s=>setPurchaseForm({...purchaseForm, supplier: s})} onCreateOption={handleCreateSupplier} placeholder="Ketik nama supplier..." />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tgl Beli</label>
                  <input type="date" className="w-full border-2 p-[9px] rounded-md outline-none text-sm focus:border-green-500" value={purchaseForm.tanggal} onChange={e=>setPurchaseForm({...purchaseForm, tanggal:e.target.value})}/>
                </div>
                <div className="col-span-1 md:col-span-5 grid grid-cols-2 gap-2 bg-red-50 border border-red-100 p-2 rounded-lg">
                  <div><label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Set Tempo</label><div className="flex flex-col sm:flex-row gap-1"><select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetTempo(e.target.value)}><option value="">+ Hari</option><option value="7">7 Hari</option><option value="14">14 Hari</option><option value="30">1 Bulan</option></select><select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetFixedDate(e.target.value)}><option value="">Tgl...</option>{[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div></div>
                  <div><label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Jatuh Tempo</label><input type="date" className="w-full border border-red-200 bg-white p-1 rounded text-[11px] font-bold outline-none focus:border-red-500" value={purchaseForm.tglJatuhTempo} onChange={e=>setPurchaseForm({...purchaseForm, tglJatuhTempo:e.target.value})} /></div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-900 mb-3 text-sm">Input Detail Konversi Barang</h4>
                <div className="flex flex-wrap gap-3 items-end mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Pilih Produk</label>
                    <CreatableSelect options={allProducts.map(p => ({value: p.id, label: p.nama, dataAsli: p}))} value={selectedProduct} onChange={handleSelectProduct} onCreateOption={handleCreateProductDropdown} placeholder="Ketik nama produk..." />
                  </div>
                  
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Beli Pabrik</label>
                    <div className="flex bg-white border-2 rounded focus-within:border-red-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-sm font-bold text-red-700 text-center" value={qtyBeli} onChange={e=>setQtyBeli(e.target.value)} placeholder="0" />
                       <span className="bg-red-50 text-[10px] font-bold text-red-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Harga/{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</label>
                    <input type="number" className="w-full border-2 p-2 rounded outline-none focus:border-red-500 text-sm font-bold text-red-700" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)} placeholder="Rp" />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] font-bold text-green-700 mb-1 block uppercase">Masuk Gudang</label>
                    <div className="flex bg-white border-2 rounded focus-within:border-green-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-sm font-bold text-green-700 text-center" value={qtyJual} onChange={e=>setQtyJual(e.target.value)} placeholder="0" />
                       <span className="bg-green-50 text-[10px] font-bold text-green-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span>
                    </div>
                  </div>

                  <button onClick={handleAddItemToPurchase} className="bg-orange-600 text-white px-4 rounded font-bold hover:bg-orange-700 h-[38px] shadow flex items-center gap-1"><PlusCircle size={16}/> Add</button>
                </div>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-2">Produk</th><th className="p-2 text-center">Qty Pabrik</th><th className="p-2 text-center text-green-700">Masuk Gudang</th><th className="p-2 text-right">Harga Pabrik</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-center">Del</th></tr></thead>
                    <tbody className="divide-y">
                      {purchaseForm.items.length === 0 && <tr><td colSpan="6" className="p-3 text-center text-gray-400 italic">Belum ada barang diinput.</td></tr>}
                      {purchaseForm.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-bold text-gray-800">{i.nama}</td>
                          <td className="p-2 text-center text-red-700 font-bold bg-red-50/50">{i.qtyBeli} <span className="text-[9px] font-normal uppercase">{i.satuanBeli}</span></td>
                          <td className="p-2 text-center text-green-700 font-bold bg-green-50/50">{i.qty} <span className="text-[9px] font-normal uppercase">{i.satuanJual}</span></td>
                          <td className="p-2 text-right text-gray-600">{formatRp(i.hargaBeli)}<span className="text-[9px] uppercase">/{i.satuanBeli}</span></td>
                          <td className="p-2 text-right font-black text-blue-900">{formatRp(i.subtotal)}</td>
                          <td className="p-2 text-center"><button onClick={() => setPurchaseForm(prev => ({...prev, items: prev.items.filter((_, index) => index !== idx)}))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Catatan Tambahan</label>
                    <textarea 
                      className="w-full border-2 p-2 rounded-xl h-[72px] outline-none text-xs focus:border-blue-500 resize-none" 
                      value={purchaseForm.keterangan} 
                      onChange={e=>setPurchaseForm({...purchaseForm, keterangan:e.target.value})} 
                      placeholder="Ketik catatan..."
                    ></textarea>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <label className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center gap-1 uppercase">
                      <LinkIcon size={12} className="text-blue-500"/> Link Foto Nota / Surat Jalan
                    </label>
                    <textarea 
                      placeholder="Paste link Drive...&#10;(Pisahkan dgn SPASI)" 
                      value={purchaseForm.buktiNota || ''} 
                      onChange={(e) => setPurchaseForm(prev=>({...prev, buktiNota: e.target.value}))} 
                      className="text-xs w-full bg-white p-2.5 rounded-lg border-2 outline-none focus:border-blue-500 h-[65px] resize-none" 
                    ></textarea>
                  </div>
                </div>

                <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between font-bold text-gray-600 text-xs border-b pb-2">
                    <span>Total Tagihan:</span>
                    <span className="font-black text-sm">{formatRp(totalTagihanPurchase)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700 items-center gap-2">
                    <span className="text-[11px] uppercase whitespace-nowrap">Dibayar Langsung:</span>
                    <input 
                      type="number" 
                      className="w-1/2 border-2 p-2 rounded-lg text-right font-black bg-green-50 outline-none focus:border-green-500 text-sm" 
                      value={purchaseForm.bayar} 
                      onChange={e=>setPurchaseForm({...purchaseForm, bayar:e.target.value})} 
                      placeholder="0" 
                    />
                  </div>

                  {parseFloat(purchaseForm.bayar || 0) > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-gray-200">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Metode</label>
                        <select className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-green-500 font-bold text-gray-700" value={purchaseForm.metodeBayar} onChange={e=>setPurchaseForm({...purchaseForm, metodeBayar:e.target.value})}>
                          <option value="TF">Transfer</option>
                          <option value="CASH">Cash / Tunai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Link Bukti TF</label>
                        <input type="text" className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-green-500" value={purchaseForm.buktiTf} onChange={e=>setPurchaseForm({...purchaseForm, buktiTf:e.target.value})} placeholder="Paste link..." />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-red-600 text-sm bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">
                    <span>SISA HUTANG:</span>
                    <span>{formatRp(totalTagihanPurchase - parseFloat(purchaseForm.bayar || 0))}</span>
                  </div>
                </div>
              </div>

            </div>
            <div className="p-3 shrink-0 bg-white border-t"><button onClick={handleSimpanBarangMasuk} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm shadow-md flex justify-center items-center gap-2"><Save size={16}/> SIMPAN BARANG MASUK</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupplierList;