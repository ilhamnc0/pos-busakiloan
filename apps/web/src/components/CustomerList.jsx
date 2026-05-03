import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Save, X, Search, UserPlus, Tag, FileText, MapPin, Phone, Download, Trophy, Calendar } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: null, nama: '', alamat: '', kontak: '', ongkirDefault: '', ongkirPerusahaanDefault: '', catatan: '' });
  const [isEditing, setIsEditing] = useState(false);

  const [products, setProducts] = useState([]);
  const [specialPriceModal, setSpecialPriceModal] = useState({ isOpen: false, customer: null });
  const [noteModal, setNoteModal] = useState(null);
  const [spForm, setSpForm] = useState({ productId: '', harga: '' });

  // STATE UNTUK FITUR RANK PROFIT
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  
  // PERBAIKAN: Default Tanggal Awal adalah Tanggal 1 di Bulan Ini, Tanggal Akhir adalah Hari Ini
  const getFirstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [rankStartDate, setRankStartDate] = useState(getFirstDayOfMonth());
  const [rankEndDate, setRankEndDate] = useState(getToday());
  const [rankData, setRankData] = useState([]);
  const [isCalculatingRank, setIsCalculatingRank] = useState(false);

  useEffect(() => { fetchCustomers(); fetchProducts(); }, []);
  
  useEffect(() => { 
    setFilteredCustomers(customers.filter(c => {
      const st = searchTerm.toLowerCase();
      return (c.id?.toString().includes(st)) ||
             (c.nama && c.nama.toLowerCase().includes(st)) ||
             (c.alamat && c.alamat.toLowerCase().includes(st)) ||
             (c.kontak && c.kontak.toLowerCase().includes(st));
    })); 
  }, [searchTerm, customers]);

  const fetchCustomers = () => {
    axios.get(`${baseURL}/api/customers`).then(res => setCustomers(res.data)).catch(err => alert("Gagal memuat data pelanggan. Cek terminal backend!"));
  };
  
  const fetchProducts = () => axios.get(`${baseURL}/api/products`).then(res => setProducts(res.data)).catch(e => console.error(e));

  const openAddModal = () => { setForm({ id: null, nama: '', alamat: '', kontak: '', ongkirDefault: '', ongkirPerusahaanDefault: '', catatan: '' }); setIsEditing(false); setIsModalOpen(true); };
  const openEditModal = (c) => { setForm({ id: c.id, nama: c.nama, alamat: c.alamat, kontak: c.kontak, ongkirDefault: c.ongkirDefault, ongkirPerusahaanDefault: c.ongkirPerusahaanDefault, catatan: c.catatan || '' }); setIsEditing(true); setIsModalOpen(true); };

  const handleSave = async () => { 
    if (!form.nama) return alert("Nama wajib diisi!"); 
    if (!window.confirm("Apakah Anda yakin ingin menyimpan data pelanggan ini?")) return;
    try {
      await axios.post(`${baseURL}/api/customers/upsert`, form); 
      setIsModalOpen(false); fetchCustomers(); alert("✅ Data pelanggan berhasil disimpan!");
    } catch (error) { alert("❌ GAGAL MENYIMPAN!\n\nPesan Error: " + (error.response?.data?.error || error.message)); }
  };

  const handleSaveSpecialPrice = async () => { 
    if(!spForm.productId || !spForm.harga) return; 
    try {
      await axios.post(`${baseURL}/api/customers/special-price`, { customerId: specialPriceModal.customer.id, productId: spForm.productId, harga: spForm.harga }); 
      setSpForm({productId: '', harga: ''}); fetchCustomers(); setSpecialPriceModal({isOpen: false, customer: null}); 
    } catch(e) { alert("Gagal menyimpan harga khusus"); }
  };
  
  const handleRemoveSpecialPrice = async (id) => { 
    try { await axios.delete(`${baseURL}/api/customers/special-price/${id}`); fetchCustomers(); setSpecialPriceModal(prev => ({...prev, isOpen: false})); }
    catch(e) { alert("Gagal menghapus harga khusus"); }
  };

  const handleExportExcel = () => { const token = localStorage.getItem('token'); window.open(`${baseURL}/api/export?type=pelanggan&token=${token}`, '_blank'); };
  
  const handleExportRank = () => { 
    if(!rankStartDate || !rankEndDate) return alert("Pilih rentang tanggal!");
    const token = localStorage.getItem('token'); 
    // Kita kirimkan start dan end ke backend
    const url = `${baseURL}/api/export?type=rank_profit&start=${rankStartDate}&end=${rankEndDate}&token=${token}`;
    window.open(url, '_blank'); 
};

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  // FUNGSI HITUNG RANK PROFIT (DENGAN PERBAIKAN LOGIKA)
  const handleCalculateRank = async () => {
    if (!rankStartDate || !rankEndDate) return;

    setIsCalculatingRank(true);
    try {
      const res = await axios.get(`${baseURL}/api/orders`);
      const orders = res.data;
      
      const start = new Date(rankStartDate).setHours(0,0,0,0);
      const end = new Date(rankEndDate).setHours(23,59,59,999);
      
      let profits = {};

      orders.forEach(o => {
        // Hanya hitung jika status SELESAI atau TERKIRIM
        if (o.status !== 'SELESAI' && o.status !== 'TERKIRIM') return;
        
        // Lewati nota yang tidak memiliki tanggal
        if (!o.tanggal) return;

        const orderDate = new Date(o.tanggal).getTime();
        
        // Pengecekan Rentang Tanggal
        if (orderDate >= start && orderDate <= end) {
          let hppOrder = 0; 
          let jualOrder = 0; 
          let hasValidItem = false;

          // Evaluasi per item (Sama seperti logika di ProfitDashboard)
          o.items.forEach(i => {
             const hppValid = parseFloat(i.hppSatuan || 0);
             if (hppValid > 0) {
                 hppOrder += hppValid * i.qty;
                 jualOrder += parseFloat(i.hargaSatuan || 0) * i.qty;
                 hasValidItem = true;
             }
          });

          // Jika ada minimal 1 barang valid dalam nota tersebut, masukkan ke klasemen
          if (hasValidItem) {
             const profitBersih = (jualOrder - hppOrder) + (parseFloat(o.ongkosKirim || 0) - parseFloat(o.ongkosKirimModal || 0));
             const cid = o.customerId;
             
             if (!profits[cid]) {
               profits[cid] = { id: cid, nama: o.customer?.nama || 'Unknown', profit: 0 };
             }
             profits[cid].profit += profitBersih;
          }
        }
      });

      // Urutkan dari yang terbesar ke terkecil
      const sortedRank = Object.values(profits).sort((a,b) => b.profit - a.profit);
      setRankData(sortedRank);
    } catch (e) {
      console.error("Gagal Rank:", e);
      alert("Gagal menghitung Rank Profit.");
    } finally {
      setIsCalculatingRank(false);
    }
  };

  // Efek Samping: Otomatis hitung ulang Rank jika modal terbuka dan tanggal berubah
  useEffect(() => {
    if (isRankModalOpen) handleCalculateRank();
  }, [rankStartDate, rankEndDate, isRankModalOpen]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 border flex flex-col xl:flex-row justify-between items-center gap-4 rounded-xl shadow-sm shrink-0">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button onClick={openAddModal} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"><UserPlus size={16}/> Tambah Pelanggan</button>
          
          <button onClick={() => setIsRankModalOpen(true)} className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"><Trophy size={16}/> Rank Profit</button>

          <button onClick={handleExportExcel} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95 text-xs md:text-sm whitespace-nowrap"><Download size={16}/> Export Excel</button>
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input className="pl-10 pr-4 py-2.5 border rounded-lg w-full text-sm outline-none focus:border-blue-500 shadow-sm" placeholder="Cari ID / Nama / Daerah / Nomor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 font-semibold text-gray-600 sticky top-0 z-10 border-b">
            <tr>
              <th className="p-4">ID Pelanggan</th>
              <th className="p-4">Nama Pelanggan</th>
              <th className="p-4">Terakhir Order</th>
              <th className="p-4">Daerah / Kontak</th>
              <th className="p-4 text-right">Ongkir dari Customer</th>
              <th className="p-4 text-right">Ongkir ke Sopir</th>
              <th className="p-4 text-center">Harga Khusus</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y border-t-0">
            {filteredCustomers.map(c => { 
              const lastOrder = c.orders && c.orders.length > 0 ? c.orders[0] : null; 
              return (
                <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-black text-gray-400">#{c.id}</td>
                  <td className="p-4">
                    <span className="font-bold text-gray-900 uppercase block">{c.nama}</span>
                    {c.catatan && (
                      <button onClick={() => setNoteModal({ nama: c.nama, text: c.catatan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer max-w-xs overflow-hidden"><FileText size={12} className="shrink-0"/> <span className="truncate">{c.catatan}</span></button>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{lastOrder ? <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">{new Date(lastOrder.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span> : <span className="text-gray-400 italic">Belum ada</span>}</td>
                  <td className="p-4"><div className="font-medium text-gray-700 flex items-center gap-1.5 mb-1"><MapPin size={14} className="text-gray-400"/>{c.alamat || '-'}</div><div className="text-xs text-blue-600 font-medium flex items-center gap-1.5"><Phone size={14} className="text-gray-400"/>{c.kontak || '-'}</div></td>
                  <td className="p-4 text-right text-green-700 font-bold">{formatRp(c.ongkirDefault)}</td>
                  <td className="p-4 text-right text-red-600 font-semibold">{formatRp(c.ongkirPerusahaanDefault)}</td>
                  <td className="p-4 text-center"><button onClick={() => setSpecialPriceModal({ isOpen: true, customer: c })} className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 mx-auto border border-yellow-200 transition-colors"><Tag size={14}/> {c.hargaKhusus?.length || 0} Produk</button></td>
                  <td className="p-4 text-center"><div className="flex justify-center items-center gap-2"><button onClick={() => openEditModal(c)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button><button onClick={async () => { if(confirm('Hapus pelanggan permanen?')) { await axios.delete(`${baseURL}/api/customers/${c.id}`); fetchCustomers(); } }} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button></div></td>
                </tr>
              )
            })}
            {filteredCustomers.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-400">Tidak ada data pelanggan.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* --- MODAL RANK PROFIT --- */}
      {isRankModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[700px] flex flex-col max-h-[90vh] overflow-hidden border-2 border-yellow-400">
            <div className="p-4 border-b flex justify-between items-center bg-yellow-50 shrink-0">
              <h3 className="font-black text-lg text-yellow-800 flex items-center gap-2"><Trophy size={20}/> Rank Profit Pelanggan</h3>
              <button onClick={() => setIsRankModalOpen(false)} className="p-1.5 bg-yellow-100 rounded-full text-yellow-700 hover:text-red-500 hover:bg-red-50 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-2 rounded-lg border shadow-sm">
                <Calendar size={16} className="text-gray-500"/>
                <input type="date" className="bg-transparent text-xs font-bold outline-none" value={rankStartDate} onChange={e=>setRankStartDate(e.target.value)} />
                <span className="text-gray-400 font-bold">-</span>
                <input type="date" className="bg-transparent text-xs font-bold outline-none" value={rankEndDate} onChange={e=>setRankEndDate(e.target.value)} />
              </div>
              <button onClick={handleExportRank} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
                 <Download size={14}/> Export Excel
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-0 bg-gray-50">
              {isCalculatingRank ? (
                <div className="p-10 text-center text-gray-500 font-bold animate-pulse">Menghitung Rank...</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-white border-b sticky top-0">
                    <tr><th className="p-3 text-center w-16">Peringkat</th><th className="p-3">Pelanggan</th><th className="p-3 text-right">Total Profit Disumbangkan</th></tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {rankData.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-yellow-50/30">
                        <td className="p-3 text-center">
                          {idx === 0 ? <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-black text-xs border border-yellow-200 shadow-sm">🥇 #1</span> :
                           idx === 1 ? <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-black text-xs border border-gray-300 shadow-sm">🥈 #2</span> :
                           idx === 2 ? <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-black text-xs border border-orange-200 shadow-sm">🥉 #3</span> :
                           <span className="font-bold text-gray-500">#{idx + 1}</span>}
                        </td>
                        <td className="p-3 font-bold text-gray-900 uppercase">{r.nama} <span className="text-gray-400 font-mono text-[10px]">(#{r.id})</span></td>
                        <td className="p-3 text-right font-black text-green-700 text-base">{formatRp(r.profit)}</td>
                      </tr>
                    ))}
                    {rankData.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-400">Tidak ada data profit di rentang tanggal tersebut. Pastikan pelanggan memiliki transaksi berstatus SELESAI/TERKIRIM.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH/EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-lg text-blue-800 flex items-center gap-2"><UserPlus size={20}/> {isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3><button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full text-gray-600 hover:text-red-500 transition-colors"><X size={18}/></button></div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Lengkap / Toko</label><input className="border-2 p-2.5 rounded-lg w-full text-sm font-bold outline-none focus:border-blue-500 uppercase" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} placeholder="Wajib diisi..." /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Kontak / WA</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500" value={form.kontak} onChange={e=>setForm({...form, kontak:e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Daerah</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500 uppercase" value={form.alamat} onChange={e=>setForm({...form, alamat:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Ongkir dari Customer</label><input type="number" className="border-2 p-2.5 rounded-lg w-full text-sm font-bold text-green-700 outline-none focus:border-green-500 bg-white" value={form.ongkirDefault} onChange={e=>setForm({...form, ongkirDefault:e.target.value})} placeholder="0" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Ongkir ke Sopir</label><input type="number" className="border-2 p-2.5 rounded-lg w-full text-sm font-bold text-red-600 outline-none focus:border-red-500 bg-white" value={form.ongkirPerusahaanDefault} onChange={e=>setForm({...form, ongkirPerusahaanDefault:e.target.value})} placeholder="0" /></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Catatan Khusus</label><textarea className="border-2 p-2.5 rounded-lg w-full text-sm h-20 outline-none focus:border-blue-500" value={form.catatan} onChange={e=>setForm({...form, catatan:e.target.value})}></textarea></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button><button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-transform active:scale-95"><Save size={18}/> Simpan Data</button></div>
          </div>
        </div>
      )}

      {/* --- MODAL HARGA KHUSUS --- */}
      {specialPriceModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-[450px] flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-lg text-yellow-700 flex items-center gap-2"><Tag size={20}/> Harga Khusus</h3><button onClick={() => setSpecialPriceModal({isOpen:false, customer:null})} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"><X size={18}/></button></div>
              <div className="p-5 overflow-y-auto flex-1">
                <p className="text-sm font-bold text-gray-900 mb-4 bg-gray-100 p-2.5 rounded-lg text-center uppercase tracking-wide border border-gray-200">{specialPriceModal.customer.nama} <span className="text-blue-600">(#{specialPriceModal.customer.id})</span></p>
                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200 mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Produk</label>
                  <select className="w-full border-2 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-yellow-500 font-medium" value={spForm.productId} onChange={e=>setSpForm({...spForm, productId: e.target.value})}><option value="">Pilih Produk...</option>{products.map(p => <option key={p.id} value={p.id}>{p.nama} (#{p.id}) (Normal: {formatRp(p.hargaJual)})</option>)}</select>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 mt-3">Harga Khusus (Rp)</label>
                  <input type="number" className="w-full border-2 p-2.5 rounded-lg text-base font-bold text-blue-700 outline-none focus:border-yellow-500" value={spForm.harga} onChange={e=>setSpForm({...spForm, harga: e.target.value})} placeholder="0" />
                  <button onClick={handleSaveSpecialPrice} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold p-2.5 rounded-lg text-sm mt-4 transition-transform active:scale-95 shadow-sm">SIMPAN HARGA</button>
                </div>
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap"><thead className="bg-gray-50 border-b text-gray-600"><tr><th className="p-3">Produk</th><th className="p-3 text-right">Harga Khusus</th><th className="p-3 text-center">Hapus</th></tr></thead><tbody className="divide-y">
                    {specialPriceModal.customer.hargaKhusus?.map(hk => (<tr key={hk.id} className="hover:bg-gray-50"><td className="p-3 font-semibold text-gray-800">{hk.product?.nama} <span className="text-[10px] text-gray-500">(#{hk.productId})</span></td><td className="p-3 text-right text-blue-700 font-bold">{formatRp(hk.harga)}</td><td className="p-3 text-center"><button onClick={()=>handleRemoveSpecialPrice(hk.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={14}/></button></td></tr>))}
                  </tbody></table>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* --- POP-UP MODAL CATATAN --- */}
      {noteModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-[400px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-yellow-500"/> Catatan Pelanggan
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
export default CustomerList;