// 3. StockList.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Save, X, PlusCircle, Search, PackagePlus, Tags, FolderPlus, FileText, Link as LinkIcon, History, Download } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StockList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStok, setFilterStok] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nama: '', categoryId: '', hargaJual: '', hpp: '', stok: '', parentId: '', isHppManual: false, satuanBeli: 'kg', satuanJual: 'pcs' });
  const [isEditing, setIsEditing] = useState(false);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [historyModal, setHistoryModal] = useState(null); 
  const [stockHistory, setStockHistory] = useState([]); 

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: '', metodeBayar: 'TF', buktiTf: '', keterangan: '', buktiNota: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [qtyBeli, setQtyBeli] = useState('');
  const [qtyJual, setQtyJual] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');

  useEffect(() => { fetchProducts(); fetchCategories(); fetchSuppliers(); }, []);
  
  useEffect(() => { 
    let result = products.filter(p => (p.id?.toString().includes(searchTerm)) || (p.nama && p.nama.toLowerCase().includes(searchTerm.toLowerCase()))); 
    if (filterCategory) result = result.filter(p => p.categoryId?.toString() === filterCategory); 
    if (filterStok === 'TERSEDIA') result = result.filter(p => p.stok > 5);
    if (filterStok === 'KRITIS') result = result.filter(p => p.stok <= 5);
    setFilteredProducts(result); 
  }, [searchTerm, filterCategory, filterStok, products]);

  const fetchProducts = async () => { try { const res = await axios.get(`${baseURL}/api/products`); setProducts(res.data.map(p => ({ ...p, value: p.id, label: `${p.nama} (#${p.id})`, dataAsli: p }))); } catch(e){} };
  const fetchCategories = async () => { try { const res = await axios.get(`${baseURL}/api/products/categories/all`); setCategories(res.data); } catch(e){} };
  const fetchSuppliers = async () => { try { const res = await axios.get(`${baseURL}/api/suppliers`); setSuppliers(res.data.map(s => ({ value: s.id, label: `${s.nama} (#${s.id})` }))); } catch(e){} };

  const handleSaveCategory = async () => { 
    if(!newCategoryName) return; 
    if(!window.confirm("Apakah Anda yakin ingin menyimpan kategori baru ini?")) return;
    try { await axios.post(`${baseURL}/api/products/categories`, { nama: newCategoryName }); setNewCategoryName(''); fetchCategories(); } catch(e){} 
  };

  const handleDeleteCategory = async (id, nama) => {
    if(window.confirm(`Yakin ingin menghapus kategori "${nama}"?`)) {
      try {
        await axios.delete(`${baseURL}/api/products/categories/${id}`);
        fetchCategories();
        alert("Kategori berhasil dihapus!");
      } catch (error) {
        alert("GAGAL MENGHAPUS!\n\nKategori ini tidak bisa dihapus karena MASIH DIPAKAI oleh suatu produk di daftar stok.\n\nSolusi: Edit produk yang bersangkutan (ubah atau kosongkan kategorinya), lalu coba hapus lagi.");
      }
    }
  };
  
  const openAddProductModal = () => { 
    setForm({ id: null, nama: '', categoryId: '', hargaJual: '', hpp: '', stok: '', parentId: '', isHppManual: false, satuanBeli: 'kg', satuanJual: 'pcs' }); 
    setIsEditing(false); setIsProductModalOpen(true); 
  };
  
  const openEditProductModal = (p) => { 
    setForm({ 
        id: p.id, nama: p.nama, categoryId: p.categoryId || '', hargaJual: p.hargaJual, hpp: p.hpp || 0, 
        stok: p.stok, parentId: p.parentId || '', isHppManual: p.isHppManual,
        satuanBeli: p.satuanBeli || 'kg', satuanJual: p.satuanJual || 'pcs'
    }); 
    setIsEditing(true); setIsProductModalOpen(true); 
  };
  
  const handleSaveProduct = async () => { 
    if(!form.nama) return alert("Nama produk wajib diisi!"); 
    try { 
      await axios.post(`${baseURL}/api/products/upsert`, form); 
      setIsProductModalOpen(false); 
      fetchProducts(); 
    } catch(e) { 
      alert("Gagal menyimpan produk: \n\n" + (e.response?.data?.error || e.message)); 
    } 
  };
  
  const openHistory = async (product) => { setHistoryModal(product); try { const res = await axios.get(`${baseURL}/api/products/${product.id}/history`); setStockHistory(res.data); } catch (e) {} };

  const handleCreateSupplier = async (val) => { const res = await axios.post(`${baseURL}/api/suppliers/upsert`, { nama: val }); setSuppliers(p => [...p, {value: res.data.id, label: `${res.data.nama} (#${res.data.id})`}]); setPurchaseForm(p => ({ ...p, supplier: {value: res.data.id, label: `${res.data.nama} (#${res.data.id})`} })); };
  
  const handleCreateProductDropdown = async (val) => { 
      const res = await axios.post(`${baseURL}/api/products/upsert`, { nama: val, hargaJual:0, hpp:0, stok:0, isHppManual:false, satuanBeli: 'kg', satuanJual: 'pcs' }); 
      const n = {...res.data, value:res.data.id, label:`${res.data.nama} (#${res.data.id})`, dataAsli:res.data}; 
      setProducts(p=>[...p, n]); setSelectedProduct(n); setHargaBeli(''); 
  };
  
  const handleSelectProductForRestock = (opt) => {
      setSelectedProduct(opt);
      if (opt) setHargaBeli(opt.dataAsli?.hpp || 0);
      else setHargaBeli('');
  }

  const handleAddItemToPurchase = () => { 
      const qBeli = parseFloat(qtyBeli); 
      const qJual = parseFloat(qtyJual); 
      const hBeli = parseFloat(hargaBeli); 
      
      if(!selectedProduct || isNaN(qBeli) || isNaN(qJual) || isNaN(hBeli)) return alert("Lengkapi data barang (Pilih produk, isi kedua Qty, dan Harga)!"); 
      
      const newItem = {
          productId: selectedProduct.value, 
          nama: selectedProduct.dataAsli?.nama || selectedProduct.label, 
          satuanBeli: selectedProduct.dataAsli?.satuanBeli || '-',
          satuanJual: selectedProduct.dataAsli?.satuanJual || '-',
          qtyBeli: qBeli,
          qty: qJual,
          hargaBeli: hBeli, 
          subtotal: qBeli*hBeli
      };
      setPurchaseForm(p => ({ ...p, items: [...p.items, newItem] })); 
      setSelectedProduct(null); setQtyBeli(''); setQtyJual(''); setHargaBeli(''); 
  };
  
  const handleSetTempo = (days) => { if (!days) return setPurchaseForm(p => ({ ...p, tglJatuhTempo: '' })); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); d.setDate(d.getDate() + parseInt(days)); setPurchaseForm(p => ({ ...p, tglJatuhTempo: d.toISOString().split('T')[0] })); };
  const handleSetFixedDate = (dayStr) => { if (!dayStr) return; const t = parseInt(dayStr); const d = purchaseForm.tanggal ? new Date(purchaseForm.tanggal) : new Date(); let y = d.getFullYear(); let m = d.getMonth(); if (t <= d.getDate()) { m++; if (m > 11) { m = 0; y++; } } let nd = new Date(y, m, t); if (nd.getMonth() !== m) nd = new Date(y, m + 1, 0); const pad = (n) => n.toString().padStart(2, '0'); setPurchaseForm(p => ({ ...p, tglJatuhTempo: `${nd.getFullYear()}-${pad(nd.getMonth() + 1)}-${pad(nd.getDate())}` })); };
  
  const handleSimpanBarangMasuk = async () => { 
    if(!purchaseForm.supplier || purchaseForm.items.length===0) return alert("Pilih supplier dan minimal 1 barang!"); 
    if(!window.confirm("Apakah Anda yakin ingin menyimpan data restock barang masuk ini?")) return;
    try { 
        await axios.post(`${baseURL}/api/purchases`, {
            supplierId: purchaseForm.supplier.value, 
            items: purchaseForm.items, 
            tanggal: purchaseForm.tanggal || new Date().toISOString(), 
            tanggalJatuhTempo: purchaseForm.tglJatuhTempo || null, 
            totalBayar: parseFloat(purchaseForm.bayar || 0), 
            metodeBayar: purchaseForm.metodeBayar,
            buktiTf: purchaseForm.buktiTf,
            keterangan: purchaseForm.keterangan, 
            buktiNota: purchaseForm.buktiNota
        }); 
        alert("Sukses restock barang! Stok dan HPP otomatis diperbarui."); 
        setIsPurchaseModalOpen(false); 
        setPurchaseForm({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: '', metodeBayar: 'TF', buktiTf: '', keterangan: '', buktiNota: '' }); 
        fetchProducts(); 
    } catch(e){ alert("Gagal simpan barang masuk: " + (e.response?.data?.error || e.message)); } 
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?type=stok&token=${token}`, '_blank');
  };

  const totalTagihanPurchase = purchaseForm.items.reduce((sum, item) => sum + item.subtotal, 0);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  
  const masterProducts = (products || []).filter(p => !p.parentId && p.id !== form.id);

  return (
    <div className="flex flex-col h-full space-y-3 md:space-y-4">
      <datalist id="satuanList">
        <option value="kg" /><option value="gram" /><option value="meter" /><option value="cm" /><option value="roll" /><option value="lembar" /><option value="pcs" /><option value="box" /><option value="liter" />
      </datalist>

      <div className="bg-white p-3 md:p-4 border flex flex-col xl:flex-row justify-between gap-3 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex gap-2 w-full xl:w-auto shrink-0">
          <button onClick={openAddProductModal} className="col-span-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-bold flex justify-center items-center gap-1.5 text-[11px] md:text-sm shadow-sm transition-transform active:scale-95"><PlusCircle size={14}/> Tambah</button>
          <button onClick={() => setIsCatModalOpen(true)} className="col-span-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-2 px-3 rounded-lg font-bold flex justify-center items-center gap-1.5 text-[11px] md:text-sm"><Tags size={14}/> Kategori</button>
          <button onClick={() => setIsPurchaseModalOpen(true)} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-bold flex justify-center items-center gap-1.5 text-[11px] md:text-sm shadow-sm transition-transform active:scale-95"><PackagePlus size={14}/> Restock Produk</button>
          <button onClick={handleExportExcel} className="col-span-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-bold flex justify-center items-center gap-1.5 text-[11px] md:text-sm shadow-sm transition-transform active:scale-95"><Download size={14}/> Export</button>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
          <select className="border p-2 rounded-lg text-[11px] md:text-sm font-bold bg-gray-50 w-full lg:w-auto flex-1 outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="">Semua Kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select>
          <select className="border p-2 rounded-lg text-[11px] md:text-sm font-bold bg-gray-50 w-full lg:w-auto flex-1 outline-none" value={filterStok} onChange={(e) => setFilterStok(e.target.value)}>
            <option value="">Semua Stok</option>
            <option value="TERSEDIA">Stok Aman (&gt; 5)</option>
            <option value="KRITIS">Stok Kritis / Habis</option>
          </select>
          <div className="relative w-full lg:w-64 mt-2 lg:mt-0 flex-none"><Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} /><input className="pl-8 pr-3 py-2 border rounded-lg w-full text-xs md:text-sm outline-none bg-white shadow-sm focus:border-blue-500" placeholder="Cari ID / Produk..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </div>
      </div>
        
      <div className="overflow-x-auto flex-1 bg-white border rounded-xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left">
            <thead className="bg-gray-100 font-bold sticky top-0 z-10 text-gray-700">
                <tr><th className="p-4">ID Produk</th><th className="p-4">Produk</th><th className="p-4">Kategori</th><th className="p-4">Harga Jual</th><th className="p-4">HPP (Modal)</th><th className="p-4 text-center">Stok</th><th className="p-4 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y">
                {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-700">#{p.id}</td>
                        <td className="p-4">
                            <span className="font-bold text-gray-800 block mb-1">{p.nama}</span>
                            <span className="text-[9px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded w-max mr-1 uppercase">Pabrik: {p.satuanBeli || '-'} | Jual: {p.satuanJual || '-'}</span>
                            {p.parentId && <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mr-1 mt-1">↳ Sub: {p.parent?.nama} (#{p.parentId})</span>}
                            {!p.parentId && !p.isHppManual && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200 inline-block mt-1">★ HPP Auto</span>}
                        </td>
                        <td className="p-4 font-bold text-gray-500 uppercase">{p.category?.nama || '-'}</td>
                        <td className="p-4 text-blue-600 font-bold">{formatRp(p.hargaJual)} <span className="text-[9px] text-gray-400">/{p.satuanJual || '-'}</span></td>
                        <td className="p-4 text-red-500 font-medium">{formatRp(p.hpp)} <span className="text-[9px] text-gray-400">/{p.satuanJual || '-'}</span></td>
                        <td className={`p-4 text-center font-black text-xl ${p.stok <= 5 ? 'text-red-600 bg-red-50/50' : 'text-gray-800'}`}>{p.stok} <span className="text-[10px] font-normal text-gray-500 uppercase">{p.satuanJual || '-'}</span></td>
                        <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => openHistory(p)} className="text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-green-100 border border-green-200 transition-colors">Riwayat</button>
                                <button onClick={() => openEditProductModal(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors"><Edit2 size={16}/></button>
                                <button onClick={async () => { if(confirm('Hapus produk ini?')) { await axios.delete(`${baseURL}/api/products/${p.id}`); fetchProducts(); } }} className="text-red-400 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
                {filteredProducts.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Data produk kosong.</td></tr>}
            </tbody>
        </table>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="p-3 md:p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-sm md:text-base text-green-800 flex items-center gap-1.5"><PackagePlus size={16}/> {isEditing ? 'Edit Produk' : 'Produk Baru'}</h3>
                <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full hover:text-red-500"><X size={16}/></button>
            </div>
            
            <div className="p-3 md:p-4 space-y-3 overflow-y-auto">
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Nama Produk</label><input className="border-2 p-2 rounded-lg w-full outline-none focus:border-green-500 text-xs font-bold" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})}/></div>
              
              <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div>
                  <label className="text-[10px] font-bold text-blue-800 mb-1 block uppercase">Satuan Beli Pabrik</label>
                  <input list="satuanList" className="border-2 border-blue-200 p-2 rounded-lg w-full text-xs font-bold text-gray-800 outline-none focus:border-blue-500" value={form.satuanBeli} onChange={e => setForm({...form, satuanBeli: e.target.value})} placeholder="Ketik: kg, dll" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-green-800 mb-1 block uppercase">Satuan Jual Customer</label>
                  <input list="satuanList" className="border-2 border-green-200 p-2 rounded-lg w-full text-xs font-bold text-gray-800 outline-none focus:border-green-500" value={form.satuanJual} onChange={e => setForm({...form, satuanJual: e.target.value})} placeholder="Ketik: meter, dll" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Kategori</label><select className="border-2 p-2 rounded-lg w-full text-xs outline-none focus:border-green-500" value={form.categoryId || ''} onChange={e => setForm({...form, categoryId: e.target.value})}><option value="">Pilih Kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></div>
                <div><label className="text-[10px] font-bold text-blue-600 mb-1 block">Sub-Produk Dari</label><select className="border-2 p-2 rounded-lg w-full bg-blue-50 text-xs outline-none focus:border-blue-500" value={form.parentId || ''} onChange={e => setForm({...form, parentId: e.target.value})}><option value="">Induk (Berdiri Sendiri)</option>{masterProducts.map(p => <option key={p.id} value={p.id}>{p.nama} (#{p.id})</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border">
                <div><label className="text-[9px] font-bold text-gray-500 mb-1 block uppercase">Harga Jual (per {form.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-full text-xs font-bold text-blue-600 outline-none focus:border-blue-500" type="number" value={form.hargaJual} onChange={e => setForm({...form, hargaJual: e.target.value})} /></div>
                <div><label className="text-[9px] font-bold text-red-500 mb-1 block uppercase">HPP Modal (per {form.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-full text-xs font-bold text-red-600 bg-white outline-none focus:border-red-500" type="number" value={form.hpp} onChange={e => setForm({...form, hpp: e.target.value})} /></div>
              </div>
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Stok Awal ({form.satuanJual || '-'})</label><input className="border-2 p-2 rounded-lg w-1/2 text-xs outline-none focus:border-green-500" type="number" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} /></div>
              
              {!form.parentId && (
                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-200 flex items-start gap-2">
                  <input type="checkbox" id="hppManual" className="w-4 h-4 cursor-pointer mt-0.5 accent-yellow-600 shrink-0" checked={form.isHppManual} onChange={e => setForm({...form, isHppManual: e.target.checked})} />
                  <label htmlFor="hppManual" className="text-[10px] font-bold text-yellow-800 cursor-pointer select-none leading-tight">Set HPP Induk Manual (Ceklis agar HPP tidak berubah otomatis dari produk anak)</label>
                </div>
              )}
            </div>
            <div className="p-3 md:p-4 border-t bg-gray-50 flex gap-2">
                <button onClick={() => setIsProductModalOpen(false)} className="flex-1 py-2 bg-white border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100">Batal</button>
                <button onClick={handleSaveProduct} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md">Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px]">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50 rounded-t-xl"><h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><FolderPlus size={16}/> Kelola Kategori</h3><button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-1.5 rounded-full"><X size={16}/></button></div>
            <div className="p-4">
              <div className="flex gap-2 mb-4"><input className="border-2 p-2 rounded-lg flex-1 outline-none focus:border-blue-500 text-xs" placeholder="Kategori baru..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}/><button onClick={handleSaveCategory} className="bg-blue-600 text-white px-3 rounded-lg font-bold shadow text-xs">Tambah</button></div>
              <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y">
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td className="p-2 font-bold text-gray-700 uppercase">{c.nama}</td>
                        <td className="p-2 text-right">
                          <button onClick={() => handleDeleteCategory(c.id, c.nama)} className="text-red-500 bg-red-100 p-1 rounded hover:bg-red-200"><Trash2 size={12}/></button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-gray-400">Belum ada kategori</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL RESTOCK BARANG MASUK --- */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-sm md:text-base text-blue-800 flex items-center gap-2"><PackagePlus size={18}/> Form Restock Barang Masuk</h3><button onClick={() => setIsPurchaseModalOpen(false)} className="p-1.5 bg-gray-200 hover:text-red-500 rounded-full"><X size={16}/></button></div>
            
            <div className="p-3 md:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 border-b pb-4">
                <div className="col-span-1 md:col-span-4"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Supplier Pabrik</label><CreatableSelect options={suppliers} value={purchaseForm.supplier} onChange={s=>setPurchaseForm({...purchaseForm, supplier: s})} onCreateOption={handleCreateSupplier} placeholder="Pilih..." styles={{control: (base) => ({...base, minHeight: '34px', fontSize: '12px'})}} /></div>
                <div className="col-span-1 md:col-span-3"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tgl Masuk</label><input type="date" className="w-full border-2 p-[7px] rounded-lg outline-none text-xs focus:border-blue-500" value={purchaseForm.tanggal} onChange={e=>setPurchaseForm({...purchaseForm, tanggal:e.target.value})}/></div>
                <div className="col-span-1 md:col-span-5 grid grid-cols-2 gap-2 bg-red-50 border border-red-100 p-2 rounded-lg">
                  <div>
                    <label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Set Tempo</label>
                    <div className="flex flex-col sm:flex-row gap-1">
                      <select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetTempo(e.target.value)}>
                        <option value="">+ Hari</option>
                        <option value="7">7 Hari</option>
                        <option value="14">14 Hari</option>
                        <option value="30">1 Bulan</option>
                        <option value="45">45 Hari</option>
                        <option value="60">2 Bulan</option>
                      </select>
                      <select className="w-full border border-red-200 bg-white p-1 rounded text-[10px] font-bold outline-none focus:border-red-500" onChange={e => handleSetFixedDate(e.target.value)}>
                        <option value="">Tgl...</option>
                        {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-[9px] font-bold text-red-600 mb-1 uppercase">Jatuh Tempo</label><input type="date" className="w-full border border-red-200 bg-white p-1 rounded text-[11px] font-bold outline-none focus:border-red-500" value={purchaseForm.tglJatuhTempo} onChange={e=>setPurchaseForm({...purchaseForm, tglJatuhTempo:e.target.value})} /></div>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-900 mb-3 text-sm">Input Detail Konversi Barang</h4>
                <div className="flex flex-wrap gap-3 items-end mb-4">
                  <div className="w-full sm:flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Pilih Produk</label>
                    <CreatableSelect options={products} value={selectedProduct} onChange={handleSelectProductForRestock} onCreateOption={handleCreateProductDropdown} placeholder="Pilih..." styles={{control: (base) => ({...base, minHeight: '34px', fontSize: '12px'})}} />
                  </div>
                  
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Beli Pabrik</label>
                    <div className="flex bg-white border-2 rounded focus-within:border-red-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-xs font-bold text-red-700 text-center" value={qtyBeli} onChange={e=>setQtyBeli(e.target.value)} placeholder="0" />
                       <span className="bg-red-50 text-[9px] font-bold text-red-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Harga/{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</label>
                    <input type="number" className="w-full border-2 p-2 rounded outline-none focus:border-red-500 text-xs font-bold text-red-700" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)} placeholder="Rp" />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-bold text-green-700 mb-1 block uppercase">Masuk Gudang</label>
                    <div className="flex bg-white border-2 rounded focus-within:border-green-500 overflow-hidden">
                       <input type="number" className="w-full p-2 outline-none text-xs font-bold text-green-700 text-center" value={qtyJual} onChange={e=>setQtyJual(e.target.value)} placeholder="0" />
                       <span className="bg-green-50 text-[9px] font-bold text-green-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span>
                    </div>
                  </div>

                  <button onClick={handleAddItemToPurchase} className="bg-orange-600 text-white px-3 rounded font-bold hover:bg-orange-700 h-[34px] shadow flex items-center gap-1"><PlusCircle size={14}/> Add</button>
                </div>
                
                <div className="overflow-x-auto border rounded bg-white">
                  <table className="w-full text-[11px] md:text-xs text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-2">Produk</th><th className="p-2 text-center text-red-700">Qty Pabrik</th><th className="p-2 text-center text-green-700">Masuk Gudang</th><th className="p-2 text-right">Harga Pabrik</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-center">Del</th></tr></thead>
                    <tbody className="divide-y">
                      {purchaseForm.items.length === 0 && <tr><td colSpan="6" className="p-3 text-center text-gray-400 italic">Belum ada barang diinput.</td></tr>}
                      {purchaseForm.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-bold text-gray-800">{i.nama} <span className="text-[9px] text-gray-500">(#{i.productId})</span></td>
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

      {historyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-3 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b flex justify-between items-center bg-gray-50 shrink-0"><div><h3 className="font-bold text-sm text-gray-800">Kartu Stok</h3><p className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">{historyModal.nama} (#{historyModal.id})</p></div><button onClick={() => setHistoryModal(null)} className="p-1.5 bg-gray-200 rounded-full"><X size={16}/></button></div>
            <div className="overflow-x-auto p-3 flex-1">
              <table className="w-full text-[11px] text-left border rounded-lg whitespace-nowrap">
                <thead className="bg-gray-800 text-white sticky top-0"><tr><th className="p-2">Tanggal</th><th className="p-2">Keterangan</th><th className="p-2 text-center">Tipe</th><th className="p-2 text-center">Qty</th></tr></thead>
                <tbody className="divide-y">
                  {stockHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50"><td className="p-2 text-gray-600">{new Date(h.tanggal).toLocaleDateString('id-ID')}</td><td className="p-2"><span className="font-bold block text-gray-800">{h.keterangan}</span><span className="text-[9px] text-gray-500 font-mono mt-0.5 inline-block">{h.ref}</span></td><td className="p-2 text-center">{h.tipe === 'MASUK' ? <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">MASUK</span> : <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">KELUAR</span>}</td><td className={`p-2 text-center font-black text-sm ${h.tipe==='MASUK'?'text-green-600':'text-red-600'}`}>{h.tipe==='MASUK'?'+':'-'}{h.qty}</td></tr>
                  ))}
                  {stockHistory.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">Belum ada riwayat pergerakan stok.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StockList;