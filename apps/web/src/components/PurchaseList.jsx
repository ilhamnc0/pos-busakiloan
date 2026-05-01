import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Save, X, Search, CheckCircle, PackagePlus, AlertCircle, FileText, Image as ImageIcon, Trash2, Edit3 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // FORM UNIFIED UNTUK TAMBAH & EDIT
  const [form, setForm] = useState({ id: null, supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '', buktiTf: '', metodeBayar: 'TF' });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyBeli, setQtyBeli] = useState('');
  const [qtyJual, setQtyJual] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');

  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [noteModal, setNoteModal] = useState(null); 

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredPurchases(purchases.filter(p => {
      const matchSearch = p.id?.toString().includes(term) || p.supplierId?.toString().includes(term) || p.supplier?.nama.toLowerCase().includes(term) || p.items.some(i => i.product?.nama.toLowerCase().includes(term) || i.productId?.toString().includes(term));
      const matchFilter = filterSupplier === '' || p.supplierId.toString() === filterSupplier;
      return matchSearch && matchFilter;
    }));
  }, [searchTerm, filterSupplier, purchases]);

  const loadData = async () => {
    try {
      const resP = await axios.get(`${baseURL}/api/purchases`);
      setPurchases(resP.data);
      const resS = await axios.get(`${baseURL}/api/suppliers`);
      setSuppliers(resS.data.map(s => ({ value: s.id, label: `${s.nama} (#${s.id})` })));
      const resProd = await axios.get(`${baseURL}/api/products`);
      setProducts(resProd.data.map(p => ({ value: p.id, label: `${p.nama} (#${p.id})`, dataAsli: p })));
    } catch (e) { console.error("Gagal load data", e); }
  };

  const handleCreateSupplier = async (val) => {
    try {
      const res = await axios.post(`${baseURL}/api/suppliers/upsert`, { nama: val });
      const newOpt = { value: res.data.id, label: `${res.data.nama} (#${res.data.id})` };
      setSuppliers(prev => [...prev, newOpt]);
      setForm(prev => ({ ...prev, supplier: newOpt }));
    } catch (e) { alert("Gagal buat supplier baru"); }
  };

  const handleSelectProduct = (opt) => {
    setSelectedProduct(opt);
    if (opt) setHargaBeli(opt.dataAsli.hpp || 0); 
    else setHargaBeli('');
  };

  const handleCreateProduct = async (val) => {
    try {
      const res = await axios.post(`${baseURL}/api/products/upsert`, { nama: val, hargaJual: 0, hpp: 0, stok: 0 });
      const newOpt = { value: res.data.id, label: `${res.data.nama} (#${res.data.id})`, dataAsli: res.data };
      setProducts(prev => [...prev, newOpt]);
      handleSelectProduct(newOpt);
    } catch (e) { alert("Gagal buat produk baru"); }
  };

  const handleAddItem = () => {
    const qBeli = parseFloat(qtyBeli);
    const qJual = parseFloat(qtyJual);
    const hBeli = parseFloat(hargaBeli);
    
    if (!selectedProduct || isNaN(qBeli) || isNaN(qJual) || isNaN(hBeli) || qBeli <= 0 || qJual <= 0) {
      return alert("Pilih produk, dan pastikan Qty serta Harga Beli diisi angka yang benar!");
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
    
    setForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedProduct(null); setQtyBeli(''); setQtyJual(''); setHargaBeli('');
  };

  const handleSetTempo = (days) => {
    if (!days) return setForm(prev => ({ ...prev, tglJatuhTempo: '' }));
    const baseDate = form.tanggal ? new Date(form.tanggal) : new Date();
    baseDate.setDate(baseDate.getDate() + parseInt(days)); 
    const dateString = baseDate.toISOString().split('T')[0];
    setForm(prev => ({ ...prev, tglJatuhTempo: dateString }));
  };

  const openAddPurchase = () => {
    setForm({ id: null, supplier: null, tanggal: new Date().toISOString().split('T')[0], tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '', buktiTf: '', metodeBayar: 'TF' });
    setIsModalOpen(true);
  };

  const openEditPurchase = (p) => {
    let safeTanggal = new Date().toISOString().split('T')[0];
    try { if (p.tanggal) safeTanggal = new Date(p.tanggal).toISOString().split('T')[0]; } catch(e) {}
    let safeJatuhTempo = '';
    try { if (p.tanggalJatuhTempo) safeJatuhTempo = new Date(p.tanggalJatuhTempo).toISOString().split('T')[0]; } catch(e) {}

    setForm({
        id: p.id,
        supplier: { value: p.supplierId, label: `${p.supplier?.nama || 'Unknown'} (#${p.supplierId})` },
        tanggal: safeTanggal, tglJatuhTempo: safeJatuhTempo,
        items: (p.items || []).map(i => ({
            productId: i.productId, nama: i.product?.nama || 'Unknown', satuanBeli: i.product?.satuanBeli || '-', satuanJual: i.product?.satuanJual || '-',
            qtyBeli: i.qtyBeli || i.qty || 0, qty: i.qty || 0, hargaBeli: i.hargaBeli || 0, subtotal: i.subtotal || 0
        })),
        bayar: p.totalBayar || 0, metodeBayar: p.metodeBayar || 'TF', buktiTf: p.buktiBayar || '', 
        keterangan: p.keterangan ? String(p.keterangan).replace(/ \[Via: .*?\]/, '') : '', buktiNota: p.buktiNota || ''
    });
    setIsModalOpen(true);
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm("PERINGATAN: Menghapus nota ini akan MENARIK KEMBALI STOK yang sudah ditambahkan dan menghapus riwayat transaksinya. Lanjutkan?")) {
        try {
            await axios.delete(`${baseURL}/api/purchases/${id}`);
            alert("✅ Nota berhasil dihapus dan stok dikembalikan!");
            loadData();
        } catch (e) { alert("Gagal menghapus nota"); }
    }
  };

  const totalTagihan = form.items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSimpanBarangMasuk = async () => {
    if (!form.supplier || form.items.length === 0) return alert("Pilih supplier & masukkan minimal 1 barang!");
    if (!window.confirm(`Simpan ${form.id ? 'Revisi Nota' : 'Nota Baru'} ini? Stok akan otomatis disesuaikan.`)) return;
    
    try {
      const payload = {
        supplierId: form.supplier.value, items: form.items,
        tanggal: form.tanggal || new Date().toISOString(), tanggalJatuhTempo: form.tglJatuhTempo || null,
        totalBayar: parseFloat(form.bayar || 0), metodeBayar: form.metodeBayar, buktiTf: form.buktiTf,
        keterangan: form.keterangan, buktiNota: form.buktiNota
      };

      if (form.id) {
        await axios.put(`${baseURL}/api/purchases/${form.id}`, payload);
        alert("✅ Revisi Barang Masuk Berhasil! Stok dan Hutang terupdate.");
      } else {
        await axios.post(`${baseURL}/api/purchases`, payload);
        alert("✅ Barang Masuk Berhasil Disimpan! Stok Bertambah.");
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (e) { alert("Gagal menyimpan transaksi"); }
  };

  const handlePay = async () => {
    try {
      await axios.put(`${baseURL}/api/purchases/${payModal.id}/payment`, {
        totalBayar: parseFloat(payAmount)
      });
      alert("✅ Pembayaran diupdate!");
      setPayModal(null);
      loadData();
    } catch (e) { alert("Gagal update pembayaran"); }
  };

  const formatRp = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };
  const parseNum = (n) => { const num = parseFloat(n); return isNaN(num) ? 0 : num; };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Barang Masuk & Hutang Supplier</h2><p className="text-sm text-gray-500">Catat tagihan pembelian dan otomatis tambah stok gudang.</p></div>
        <button onClick={openAddPurchase} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold flex gap-2 hover:bg-green-700 shadow-md"><PackagePlus size={20}/> Input Barang Masuk</button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-center gap-3">
          <h4 className="font-bold text-gray-700 whitespace-nowrap">Daftar Transaksi Pembelian</h4>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="border p-2 rounded-lg text-sm font-bold text-gray-600 outline-none focus:border-blue-500 bg-white" value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
              <option value="">Semua Supplier</option>
              {suppliers.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm outline-none focus:border-green-500" placeholder="Cari ID / Nota / Barang..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3">ID Nota</th><th className="p-3">Tgl Transaksi</th><th className="p-3 text-red-300">Tgl JT</th><th className="p-3">Supplier</th><th className="p-3 text-center">Nota</th><th className="p-3">Rincian Barang</th><th className="p-3 text-right">Total Tagihan</th><th className="p-3 text-right text-green-400">Sudah Bayar</th><th className="p-3 text-right text-red-400">Sisa Hutang</th><th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-700">#{p.id}</td>
                  <td className="p-3">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3 text-red-500 font-bold">{p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toLocaleDateString('id-ID') : '-'}</td>
                  
                  <td className="p-3">
                    <span className="font-bold text-blue-900 uppercase block">{p.supplier?.nama} <span className="text-[10px] text-gray-500">(#{p.supplierId})</span></span>
                    {p.keterangan ? (
                      <button onClick={() => setNoteModal({ nama: p.supplier?.nama, text: p.keterangan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors shadow-sm text-left font-medium w-full">
                        <FileText size={12} className="shrink-0"/> {p.keterangan.length > 25 ? p.keterangan.substring(0, 25) + '...' : p.keterangan}
                      </button>
                    ) : ( <div className="mt-1.5 text-[10px] text-gray-400 italic flex items-center gap-1"><FileText size={12}/> Tidak ada catatan</div> )}
                  </td>
                  
                  <td className="p-3 text-center">
                    {p.buktiNota ? (<a href={p.buktiNota} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg inline-flex" title="Lihat Foto Surat Jalan"><ImageIcon size={18}/></a>) : <span className="text-gray-300">-</span>}
                  </td>

                  <td className="p-3 text-xs text-gray-600">{p.items.map((i, idx) => (<div key={idx} className="mb-1">• {i.product?.nama} <span className="text-[9px] text-gray-400">(#{i.productId})</span> <span className="font-bold">x{i.qty}</span></div>))}</td>
                  <td className="p-3 text-right font-medium">{formatRp(p.totalTagihan)}</td><td className="p-3 text-right text-green-600">{formatRp(p.totalBayar)}</td><td className="p-3 text-right font-bold text-red-600">{formatRp(p.sisaTagihan)}</td>
                  
                  <td className="p-3 text-center">
                    {p.sisaTagihan <= 0 ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 w-full mb-1"><CheckCircle size={14}/> LUNAS</span>
                    ) : (
                        <button onClick={() => { setPayModal(p); setPayAmount(p.totalBayar); }} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm w-full mb-1">Bayar Hutang</button>
                    )}
                    <div className="flex gap-1 justify-center mt-1">
                        <button onClick={() => openEditPurchase(p)} className="flex-1 bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100 border border-blue-100" title="Revisi Nota"><Edit3 size={14} className="mx-auto"/></button>
                        <button onClick={() => handleDeletePurchase(p.id)} className="flex-1 bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100 border border-red-100" title="Hapus Nota"><Trash2 size={14} className="mx-auto"/></button>
                    </div>
                  </td>

                </tr>
              ))}
              {filteredPurchases.length === 0 && <tr><td colSpan="10" className="p-6 text-center text-gray-400">Tidak ada data tagihan supplier.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className={`bg-white rounded-xl shadow-2xl w-[900px] max-h-[95vh] overflow-y-auto flex flex-col ${form.id ? 'border-2 border-blue-500' : ''}`}>
            <div className={`p-4 border-b flex justify-between items-center sticky top-0 z-20 ${form.id ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <h3 className={`font-bold text-xl flex items-center gap-2 ${form.id ? 'text-blue-800' : 'text-green-800'}`}>
                    {form.id ? <Edit3 size={20}/> : <PackagePlus size={20}/>} 
                    {form.id ? 'Revisi Nota / Barang Masuk' : 'Form Barang Masuk'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              {form.id && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-[11px] text-yellow-800 font-medium">
                      ⚠️ <strong className="font-black">PERHATIAN REVISI:</strong> Menyimpan perubahan di form ini akan otomatis menyesuaikan ulang Stok Gudang. Pastikan qty revisi sudah benar.
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-6">
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pilih/Tambah Supplier</label>
                  <CreatableSelect options={suppliers} value={form.supplier} onChange={s=>setForm({...form, supplier: s})} onCreateOption={handleCreateSupplier} placeholder="Ketik nama supplier..." isDisabled={!!form.id} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tgl Transaksi / Beli</label>
                  <input type="date" className="w-full border p-[9px] rounded outline-none" value={form.tanggal} onChange={e=>setForm({...form, tanggal:e.target.value})}/>
                </div>
                
                <div className="col-span-5 grid grid-cols-2 gap-2 bg-red-50 border border-red-100 p-2 rounded-lg">
                  <div>
                    <label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Set Tempo</label>
                    <select className="w-full border border-red-200 bg-white p-1.5 rounded text-sm outline-none focus:border-red-500" onChange={e => handleSetTempo(e.target.value)}>
                      <option value="">Pilih Tempo...</option><option value="7">1 Minggu (7 Hr)</option><option value="14">2 Minggu (14 Hr)</option><option value="30">1 Bulan (30 Hr)</option><option value="60">2 Bulan (60 Hr)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Tgl Jatuh Tempo</label>
                    <input type="date" className="w-full border border-red-200 bg-white p-1.5 rounded text-sm outline-none focus:border-red-500" value={form.tglJatuhTempo} onChange={e=>setForm({...form, tglJatuhTempo:e.target.value})}/>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 text-sm">Input Detail Barang</h4>
                <div className="flex gap-2 items-end mb-4">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-600 mb-1 block">Cari / Buat Produk</label><CreatableSelect options={products} value={selectedProduct} onChange={handleSelectProduct} onCreateOption={handleCreateProduct} placeholder="Ketik nama produk / ID..." /></div>
                  <div className="w-24">
                     <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Beli Pabrik</label>
                     <div className="flex bg-white border-2 rounded"><input type="number" className="w-full p-2 outline-none text-xs font-bold text-red-700 text-center" value={qtyBeli} onChange={e=>setQtyBeli(e.target.value)} placeholder="0" /><span className="bg-red-50 text-[9px] font-bold text-red-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</span></div>
                  </div>
                  <div className="w-32">
                     <label className="text-[10px] font-bold text-red-600 mb-1 block uppercase">Harga/{selectedProduct ? (selectedProduct.dataAsli?.satuanBeli || '-') : '-'}</label>
                     <input type="number" className="w-full border-2 p-2 rounded outline-none text-xs font-bold text-red-700 focus:border-red-500" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)} placeholder="Rp"/>
                  </div>
                  <div className="w-24">
                     <label className="text-[10px] font-bold text-green-700 mb-1 block uppercase">Masuk Gudang</label>
                     <div className="flex bg-white border-2 rounded"><input type="number" className="w-full p-2 outline-none text-xs font-bold text-green-700 text-center" value={qtyJual} onChange={e=>setQtyJual(e.target.value)} placeholder="0" /><span className="bg-green-50 text-[9px] font-bold text-green-800 flex items-center px-1 border-l uppercase">{selectedProduct ? (selectedProduct.dataAsli?.satuanJual || '-') : '-'}</span></div>
                  </div>
                  <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700 h-[38px]"><Plus size={18}/> Add</button>
                </div>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-[11px] md:text-xs text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-2">Produk</th><th className="p-2 text-center text-red-700">Qty Pabrik</th><th className="p-2 text-center text-green-700">Masuk Gudang</th><th className="p-2 text-right">Harga Pabrik</th><th className="p-2 text-right">Subtotal</th><th className="p-2 text-center">Del</th></tr></thead>
                    <tbody className="divide-y">
                      {form.items.length === 0 && <tr><td colSpan="6" className="p-3 text-center text-gray-400 italic">Belum ada barang diinput.</td></tr>}
                      {form.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 font-bold text-gray-800">{i.nama}</td>
                          <td className="p-2 text-center font-bold text-red-700 bg-red-50/50">{i.qtyBeli} <span className="text-[9px] font-normal uppercase">{i.satuanBeli}</span></td>
                          <td className="p-2 text-center font-bold text-green-700 bg-green-50/50">{i.qty} <span className="text-[9px] font-normal uppercase">{i.satuanJual}</span></td>
                          <td className="p-2 text-right">{formatRp(i.hargaBeli)}</td>
                          <td className="p-2 text-right font-black text-blue-900">{formatRp(i.subtotal)}</td>
                          <td className="p-2 text-center"><button onClick={() => setForm(prev => ({...prev, items: prev.items.filter((_, index) => index !== idx)}))} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 mb-1 block uppercase">Catatan Tambahan</label>
                    <textarea 
                      className="w-full border-2 p-2 rounded-xl h-[72px] outline-none text-xs focus:border-blue-500 resize-none" 
                      value={form.keterangan} 
                      onChange={e=>setForm({...form, keterangan:e.target.value})} 
                      placeholder="Ketik catatan..."
                    ></textarea>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <label className="text-[10px] font-bold text-gray-700 mb-1.5 flex items-center gap-1 uppercase">
                      <LinkIcon size={12} className="text-blue-500"/> Link Foto Nota / Surat Jalan
                    </label>
                    <textarea 
                      placeholder="Paste link Drive...&#10;(Pisahkan dgn SPASI)" 
                      value={form.buktiNota || ''} 
                      onChange={(e) => setForm(prev=>({...prev, buktiNota: e.target.value}))} 
                      className="text-xs w-full bg-gray-50 p-2.5 rounded-lg border outline-none focus:border-blue-500 h-[65px] resize-none" 
                    ></textarea>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between font-bold text-gray-600 text-xs border-b pb-2">
                    <span>Total Tagihan Pabrik:</span>
                    <span className="font-mono text-lg">{formatRp(totalTagihan)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700 items-center gap-2">
                    <span className="text-[11px] uppercase whitespace-nowrap">Dibayar Langsung:</span>
                    <input type="number" className="w-1/2 border-2 p-2 rounded-lg text-right font-black bg-green-50 outline-none focus:border-green-500 text-sm" value={form.bayar} onChange={e=>setForm({...form, bayar:e.target.value})} placeholder="0" />
                  </div>
                  
                  {parseNum(form.bayar) > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-gray-200">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Metode</label>
                        <select className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-green-500 font-bold text-gray-700" value={form.metodeBayar} onChange={e=>setForm({...form, metodeBayar:e.target.value})}>
                          <option value="TF">Transfer</option>
                          <option value="CASH">Cash / Tunai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Link Bukti TF</label>
                        <input type="text" className="w-full border-2 p-2 rounded-lg outline-none text-xs focus:border-green-500" value={form.buktiTf} onChange={e=>setForm({...form, buktiTf:e.target.value})} placeholder="Paste link..." />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-red-600 text-sm bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">
                    <span>SISA HUTANG:</span>
                    <span>{formatRp(totalTagihan - parseNum(form.bayar))}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleSimpanBarangMasuk} className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 ${form.id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  <Save size={22}/> {form.id ? 'SIMPAN REVISI NOTA' : 'SIMPAN BARANG MASUK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4">
           <div className="bg-white p-6 rounded-xl shadow-2xl w-[400px]">
              <h3 className="font-bold text-xl text-red-800 flex items-center gap-2 mb-4 border-b pb-2"><AlertCircle/> Form Pembayaran Hutang</h3>
              <div className="mb-5 bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm font-bold text-gray-800 uppercase">{payModal.supplier?.nama} <span className="text-gray-500">(#{payModal.supplierId})</span></p>
                <div className="flex justify-between mt-2 text-xs text-gray-600"><span>Total Tagihan Awal:</span> <span className="font-bold">{formatRp(payModal.totalTagihan)}</span></div>
                <div className="flex justify-between mt-1 text-xs text-red-600"><span>Sisa Hutang Saat Ini:</span> <span className="font-bold">{formatRp(payModal.sisaTagihan)}</span></div>
              </div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Total yang sudah dibayar (s.d Hari Ini)</label>
              <input type="number" className="w-full border-2 p-3 rounded-lg font-bold text-green-700 mb-1 focus:outline-green-500 text-lg" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              <p className="text-[10px] text-gray-400 mb-6 italic">*Ganti angka ini dengan total akumulasi yang sudah dikirim ke supplier.</p>
              <div className="flex gap-3">
                <button onClick={() => setPayModal(null)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg font-bold">Batal</button>
                <button onClick={handlePay} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"><Save size={18}/> Simpan Pembayaran</button>
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
                  Pabrik/Supplier: <span className="text-blue-600">{noteModal?.nama}</span>
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
export default PurchaseList;