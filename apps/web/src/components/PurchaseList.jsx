import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Save, X, Search, CheckCircle, PackagePlus, AlertCircle, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // STATE BARU: Untuk dropdown filter
  const [filterSupplier, setFilterSupplier] = useState('');

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '' });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState('');
  const [hargaBeli, setHargaBeli] = useState('');

  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => { loadData(); }, []);

  // Filter gabungan: Teks Search + Dropdown Supplier
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredPurchases(purchases.filter(p => {
      const matchSearch = p.supplier?.nama.toLowerCase().includes(term) || p.items.some(i => i.product?.nama.toLowerCase().includes(term));
      const matchFilter = filterSupplier === '' || p.supplierId.toString() === filterSupplier;
      return matchSearch && matchFilter;
    }));
  }, [searchTerm, filterSupplier, purchases]);

  const loadData = async () => {
    try {
      const resP = await axios.get('http://localhost:5000/api/purchases');
      setPurchases(resP.data);
      const resS = await axios.get('http://localhost:5000/api/suppliers');
      setSuppliers(resS.data.map(s => ({ value: s.id, label: s.nama })));
      const resProd = await axios.get('http://localhost:5000/api/products');
      setProducts(resProd.data.map(p => ({ value: p.id, label: p.nama, dataAsli: p })));
    } catch (e) { console.error("Gagal load data", e); }
  };

  const handleCreateSupplier = async (val) => {
    try {
      const res = await axios.post('http://localhost:5000/api/suppliers/upsert', { nama: val });
      const newOpt = { value: res.data.id, label: res.data.nama };
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
      const res = await axios.post('http://localhost:5000/api/products/upsert', { nama: val, hargaJual: 0, hpp: 0, stok: 0 });
      const newOpt = { value: res.data.id, label: res.data.nama, dataAsli: res.data };
      setProducts(prev => [...prev, newOpt]);
      handleSelectProduct(newOpt);
    } catch (e) { alert("Gagal buat produk baru"); }
  };

  // Anti-Crash QTY
  const handleAddItem = () => {
    const qtyNum = parseFloat(qty);
    const hargaNum = parseFloat(hargaBeli);
    
    if (!selectedProduct || isNaN(qtyNum) || isNaN(hargaNum) || qtyNum <= 0) {
      return alert("Pilih produk, dan pastikan Qty serta Harga Beli diisi angka yang benar!");
    }

    const newItem = {
      productId: selectedProduct.value,
      nama: selectedProduct.label,
      qty: qtyNum,
      hargaBeli: hargaNum,
      subtotal: qtyNum * hargaNum
    };
    
    setForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedProduct(null); setQty(''); setHargaBeli('');
  };

  const handleSetTempo = (days) => {
    if (!days) return setForm(prev => ({ ...prev, tglJatuhTempo: '' }));
    const baseDate = form.tanggal ? new Date(form.tanggal) : new Date();
    baseDate.setDate(baseDate.getDate() + parseInt(days)); 
    const dateString = baseDate.toISOString().split('T')[0];
    setForm(prev => ({ ...prev, tglJatuhTempo: dateString }));
  };

  const handleUploadNota = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, buktiNota: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const totalTagihan = form.items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSimpanBarangMasuk = async () => {
    if (!form.supplier || form.items.length === 0) return alert("Pilih supplier & masukkan minimal 1 barang!");
    try {
      await axios.post('http://localhost:5000/api/purchases', {
        supplierId: form.supplier.value,
        items: form.items,
        tanggal: form.tanggal || new Date().toISOString(),
        tanggalJatuhTempo: form.tglJatuhTempo || null,
        totalBayar: parseFloat(form.bayar || 0),
        keterangan: form.keterangan,
        buktiNota: form.buktiNota
      });
      alert("✅ Barang Masuk Berhasil Disimpan! Stok Bertambah.");
      setIsModalOpen(false);
      setForm({ supplier: null, tanggal: '', tglJatuhTempo: '', items: [], bayar: 0, keterangan: '', buktiNota: '' });
      loadData();
    } catch (e) { alert("Gagal menyimpan transaksi"); }
  };

  const handlePay = async () => {
    try {
      await axios.put(`http://localhost:5000/api/purchases/${payModal.id}/payment`, {
        totalBayar: parseFloat(payAmount)
      });
      alert("✅ Pembayaran diupdate!");
      setPayModal(null);
      loadData();
    } catch (e) { alert("Gagal update pembayaran"); }
  };

  const formatRp = (n) => {
    const num = Number(n);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
        <div><h2 className="text-xl font-bold text-gray-800">Barang Masuk & Hutang Supplier</h2><p className="text-sm text-gray-500">Catat tagihan pembelian dan otomatis tambah stok gudang.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold flex gap-2 hover:bg-green-700 shadow-md"><PackagePlus size={20}/> Input Barang Masuk</button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {/* HEADER DENGAN FILTER DROPDOWN BARU */}
        <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between items-center gap-3">
          <h4 className="font-bold text-gray-700 whitespace-nowrap">Rekap Piutang Supplier</h4>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              className="border p-2 rounded-lg text-sm font-bold text-gray-600 outline-none focus:border-blue-500 bg-white"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="">Semua Supplier</option>
              {suppliers.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input className="pl-10 pr-4 py-2 border rounded-lg w-full text-sm outline-none focus:border-green-500" placeholder="Cari Nota/Barang..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-800 text-white font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3">Tgl Transaksi</th><th className="p-3 text-red-300">Tgl JT</th><th className="p-3">Supplier</th><th className="p-3 text-center">Nota</th><th className="p-3">Rincian Barang</th><th className="p-3 text-right">Total Tagihan</th><th className="p-3 text-right text-green-400">Sudah Bayar</th><th className="p-3 text-right text-red-400">Sisa Hutang</th><th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3 text-red-500 font-bold">{p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="p-3 font-bold text-blue-900 uppercase">{p.supplier?.nama}</td>
                  
                  <td className="p-3 text-center">
                    {p.buktiNota ? (
                       <a href={p.buktiNota} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg inline-flex" title="Lihat Foto Surat Jalan"><ImageIcon size={18}/></a>
                    ) : <span className="text-gray-300">-</span>}
                  </td>

                  <td className="p-3 text-xs text-gray-600">{p.items.map((i, idx) => (<div key={idx} className="mb-1">• {i.product?.nama} <span className="font-bold">x{i.qty}</span></div>))}</td>
                  <td className="p-3 text-right font-medium">{formatRp(p.totalTagihan)}</td><td className="p-3 text-right text-green-600">{formatRp(p.totalBayar)}</td><td className="p-3 text-right font-bold text-red-600">{formatRp(p.sisaTagihan)}</td>
                  <td className="p-3 text-center">
                    {p.sisaTagihan <= 0 ? <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold inline-flex justify-center items-center gap-1 w-24"><CheckCircle size={14}/> LUNAS</span> : <button onClick={() => { setPayModal(p); setPayAmount(p.totalBayar); }} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">Bayar Hutang</button>}
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && <tr><td colSpan="9" className="p-6 text-center text-gray-400">Tidak ada data tagihan supplier.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-20"><h3 className="font-bold text-xl text-green-800 flex items-center gap-2"><PackagePlus/> Form Barang Masuk</h3><button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500"><X size={20}/></button></div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-6">
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pilih/Tambah Supplier</label>
                  <CreatableSelect options={suppliers} value={form.supplier} onChange={s=>setForm({...form, supplier: s})} onCreateOption={handleCreateSupplier} placeholder="Ketik nama supplier..." />
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
                  <div className="flex-1"><label className="text-xs font-bold text-gray-600 mb-1 block">Cari / Buat Produk</label><CreatableSelect options={products} value={selectedProduct} onChange={handleSelectProduct} onCreateOption={handleCreateProduct} placeholder="Ketik nama produk..." /></div>
                  <div className="w-24"><label className="text-xs font-bold text-gray-600 mb-1 block">Qty</label><input type="number" className="w-full border p-2 rounded" value={qty} onChange={e=>setQty(e.target.value)}/></div>
                  <div className="w-48"><label className="text-xs font-bold text-red-600 mb-1 block">Harga Beli / HPP (Rp)</label><input type="number" className="w-full border p-2 rounded text-red-600 font-bold" value={hargaBeli} onChange={e=>setHargaBeli(e.target.value)}/></div>
                  <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700 h-[38px]"><Plus size={18}/> Add</button>
                </div>
                
                <div className="border rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 border-b"><tr><th className="p-3">Produk</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Harga Beli</th><th className="p-3 text-right">Subtotal</th><th className="p-3 text-center">Hapus</th></tr></thead>
                    <tbody className="divide-y">
                      {form.items.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-400 italic">Belum ada barang diinput.</td></tr>}
                      {form.items.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{i.nama}</td><td className="p-3 text-center">{i.qty}</td><td className="p-3 text-right">{formatRp(i.hargaBeli)}</td><td className="p-3 text-right font-bold text-blue-900">{formatRp(i.subtotal)}</td>
                          <td className="p-3 text-center"><button onClick={() => setForm(prev => ({...prev, items: prev.items.filter((_, index) => index !== idx)}))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Catatan Tambahan</label>
                    <textarea className="w-full border p-3 rounded-lg h-16 outline-none" value={form.keterangan} onChange={e=>setForm({...form, keterangan:e.target.value})} placeholder="Catatan..."></textarea>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <label className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><FileText size={14}/> Upload Nota / Surat Jalan (Opsional)</label>
                    <input type="file" accept="image/*" onChange={handleUploadNota} className="text-[10px] w-full mt-1" />
                    {form.buktiNota && (
                      <div className="relative mt-2 inline-block">
                        <img src={form.buktiNota} className="h-20 rounded border shadow-sm" alt="Preview Nota" />
                        <button onClick={() => setForm({...form, buktiNota: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-lg border">
                  <div className="flex justify-between font-bold text-gray-600 text-sm border-b pb-2"><span>Total Tagihan:</span><span className="font-mono text-lg">{formatRp(totalTagihan)}</span></div>
                  <div className="flex justify-between font-bold text-green-700 items-center">
                    <span className="text-sm">Bayar Langsung (DP):</span>
                    <input type="number" className="w-1/2 border p-2 rounded-lg text-right font-bold focus:outline-green-500 bg-green-50" value={form.bayar} onChange={e=>setForm({...form, bayar:e.target.value})} placeholder="0" />
                  </div>
                  <div className="flex justify-between font-black text-red-600 text-xl pt-2 mt-2 bg-red-50 p-2 rounded border border-red-100">
                    <span>SISA HUTANG:</span><span>{formatRp(totalTagihan - parseFloat(form.bayar || 0))}</span>
                  </div>
                </div>
              </div>

              <button onClick={handleSimpanBarangMasuk} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg flex justify-center items-center gap-2"><Save size={22}/> SIMPAN BARANG MASUK</button>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4">
           <div className="bg-white p-6 rounded-xl shadow-2xl w-[400px]">
              <h3 className="font-bold text-xl text-red-800 flex items-center gap-2 mb-4 border-b pb-2"><AlertCircle/> Form Pembayaran Hutang</h3>
              <div className="mb-5 bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm font-bold text-gray-800 uppercase">{payModal.supplier?.nama}</p>
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

    </div>
  );
};
export default PurchaseList;