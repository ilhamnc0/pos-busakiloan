import { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Save, X, Search, UserPlus, Tag, FileText, MapPin, Phone } from 'lucide-react';

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
  const [spForm, setSpForm] = useState({ productId: '', harga: '' });
  const [noteModal, setNoteModal] = useState(null);

  useEffect(() => { fetchCustomers(); fetchProducts(); }, []);
  
  // LOGIKA PENCARIAN DIPERBARUI: Cari di Nama ATAU Alamat ATAU Kontak
  useEffect(() => { 
    setFilteredCustomers(customers.filter(c => {
      const st = searchTerm.toLowerCase();
      return (c.nama && c.nama.toLowerCase().includes(st)) ||
             (c.alamat && c.alamat.toLowerCase().includes(st)) ||
             (c.kontak && c.kontak.toLowerCase().includes(st));
    })); 
  }, [searchTerm, customers]);

  const fetchCustomers = () => axios.get(`${baseURL}/api/customers`).then(res => setCustomers(res.data));
  const fetchProducts = () => axios.get(`${baseURL}/api/products`).then(res => setProducts(res.data));

  const openAddModal = () => { setForm({ id: null, nama: '', alamat: '', kontak: '', ongkirDefault: '', ongkirPerusahaanDefault: '', catatan: '' }); setIsEditing(false); setIsModalOpen(true); };
  const openEditModal = (c) => { setForm({ id: c.id, nama: c.nama, alamat: c.alamat, kontak: c.kontak, ongkirDefault: c.ongkirDefault, ongkirPerusahaanDefault: c.ongkirPerusahaanDefault, catatan: c.catatan || '' }); setIsEditing(true); setIsModalOpen(true); };

  const handleSave = async () => { 
    if (!form.nama) return alert("Nama wajib diisi"); 
    if(!window.confirm("Apakah Anda yakin ingin menyimpan data pelanggan ini?")) return;

    await axios.post(`${baseURL}/api/customers/upsert`, form); 
    setIsModalOpen(false); 
    fetchCustomers(); 
  };

  const handleSaveSpecialPrice = async () => { 
    if(!spForm.productId || !spForm.harga) return; 
    if(!window.confirm("Apakah Anda yakin ingin menyimpan harga khusus ini?")) return;

    await axios.post(`${baseURL}/api/customers/special-price`, { customerId: specialPriceModal.customer.id, productId: spForm.productId, harga: spForm.harga }); 
    setSpForm({productId: '', harga: ''}); 
    fetchCustomers(); 
    setSpecialPriceModal({isOpen: false, customer: null}); 
  };
  
  const handleRemoveSpecialPrice = async (id) => { await axios.delete(`${baseURL}/api/customers/special-price/${id}`); fetchCustomers(); setSpecialPriceModal(prev => ({...prev, isOpen: false})); };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl shadow-sm shrink-0">
        <button onClick={openAddModal} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
          <UserPlus size={18}/> Tambah Pelanggan
        </button>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          {/* PLACEHOLDER PENCARIAN DIUBAH */}
          <input className="pl-10 pr-4 py-2.5 border rounded-lg w-full text-sm outline-none focus:border-blue-500 shadow-sm" placeholder="Cari Nama / Lokasi / Nomor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-xl shadow-sm">
        <table className="w-full text-xs md:text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 font-semibold text-gray-600 sticky top-0 z-10 border-b">
            <tr>
              <th className="p-4">Nama Pelanggan</th>
              <th className="p-4">Terakhir Order</th>
              <th className="p-4">Lokasi / Kontak</th>
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
                  <td className="p-4">
                    <span className="font-bold text-gray-900 uppercase block">{c.nama}</span>
                    {c.catatan && (
                      <button onClick={() => setNoteModal({ nama: c.nama, text: c.catatan })} className="mt-1.5 text-[10px] text-yellow-700 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200 hover:bg-yellow-100 transition-colors">
                        <FileText size={12}/> {c.catatan.length > 25 ? c.catatan.substring(0, 25) + '...' : c.catatan}
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{lastOrder ? <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">{new Date(lastOrder.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span> : <span className="text-gray-400 italic">Belum ada</span>}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-700 flex items-center gap-1.5 mb-1"><MapPin size={14} className="text-gray-400"/>{c.alamat || '-'}</div>
                    <div className="text-xs text-blue-600 font-medium flex items-center gap-1.5"><Phone size={14} className="text-gray-400"/>{c.kontak || '-'}</div>
                  </td>
                  <td className="p-4 text-right text-green-700 font-bold">{formatRp(c.ongkirDefault)}</td>
                  <td className="p-4 text-right text-red-600 font-semibold">{formatRp(c.ongkirPerusahaanDefault)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => setSpecialPriceModal({ isOpen: true, customer: c })} className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 mx-auto border border-yellow-200 transition-colors">
                      <Tag size={14}/> {c.hargaKhusus?.length || 0} Produk
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => openEditModal(c)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={async () => { if(confirm('Hapus pelanggan permanen?')) { await axios.delete(`${baseURL}/api/customers/${c.id}`); fetchCustomers(); } }} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredCustomers.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada data pelanggan.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-lg text-blue-800 flex items-center gap-2"><UserPlus size={20}/> {isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3><button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full text-gray-600 hover:text-red-500 transition-colors"><X size={18}/></button></div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Lengkap / Toko</label><input className="border-2 p-2.5 rounded-lg w-full text-sm font-bold outline-none focus:border-blue-500" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} placeholder="Wajib diisi..." /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Kontak / WA</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500" value={form.kontak} onChange={e=>setForm({...form, kontak:e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Alamat</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500" value={form.alamat} onChange={e=>setForm({...form, alamat:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Ongkir dari Customer</label><input type="number" className="border-2 p-2.5 rounded-lg w-full text-sm font-bold text-green-700 outline-none focus:border-green-500 bg-white" value={form.ongkirDefault} onChange={e=>setForm({...form, ongkirDefault:e.target.value})} placeholder="0" /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Ongkir ke Sopir</label><input type="number" className="border-2 p-2.5 rounded-lg w-full text-sm font-bold text-red-600 outline-none focus:border-red-500 bg-white" value={form.ongkirPerusahaanDefault} onChange={e=>setForm({...form, ongkirPerusahaanDefault:e.target.value})} placeholder="0" /></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Catatan Khusus</label><textarea className="border-2 p-2.5 rounded-lg w-full text-sm h-20 outline-none focus:border-blue-500" value={form.catatan} onChange={e=>setForm({...form, catatan:e.target.value})}></textarea></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button><button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-blue-700 transition-transform active:scale-95"><Save size={18}/> Simpan</button></div>
          </div>
        </div>
      )}

      {specialPriceModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-[450px] flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0"><h3 className="font-bold text-lg text-yellow-700 flex items-center gap-2"><Tag size={20}/> Harga Khusus</h3><button onClick={() => setSpecialPriceModal({isOpen:false, customer:null})} className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"><X size={18}/></button></div>
              <div className="p-5 overflow-y-auto flex-1">
                <p className="text-sm font-bold text-gray-900 mb-4 bg-gray-100 p-2.5 rounded-lg text-center uppercase tracking-wide border border-gray-200">{specialPriceModal.customer.nama}</p>
                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200 mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Produk</label>
                  <select className="w-full border-2 p-2.5 rounded-lg bg-white text-sm outline-none focus:border-yellow-500 font-medium" value={spForm.productId} onChange={e=>setSpForm({...spForm, productId: e.target.value})}><option value="">Pilih Produk...</option>{products.map(p => <option key={p.id} value={p.id}>{p.nama} (Normal: {formatRp(p.hargaJual)})</option>)}</select>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 mt-3">Harga Khusus (Rp)</label>
                  <input type="number" className="w-full border-2 p-2.5 rounded-lg text-base font-bold text-blue-700 outline-none focus:border-yellow-500" value={spForm.harga} onChange={e=>setSpForm({...spForm, harga: e.target.value})} placeholder="0" />
                  <button onClick={handleSaveSpecialPrice} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold p-2.5 rounded-lg text-sm mt-4 transition-transform active:scale-95 shadow-sm">SIMPAN HARGA</button>
                </div>
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap"><thead className="bg-gray-50 border-b text-gray-600"><tr><th className="p-3">Produk</th><th className="p-3 text-right">Harga Khusus</th><th className="p-3 text-center">Hapus</th></tr></thead><tbody className="divide-y">
                    {specialPriceModal.customer.hargaKhusus?.map(hk => (<tr key={hk.id} className="hover:bg-gray-50"><td className="p-3 font-semibold text-gray-800">{hk.product?.nama}</td><td className="p-3 text-right text-blue-700 font-bold">{formatRp(hk.harga)}</td><td className="p-3 text-center"><button onClick={()=>handleRemoveSpecialPrice(hk.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={14}/></button></td></tr>))}
                    {(!specialPriceModal.customer.hargaKhusus || specialPriceModal.customer.hargaKhusus.length === 0) && <tr><td colSpan="3" className="p-6 text-center text-gray-400 italic">Belum ada harga khusus.</td></tr>}
                  </tbody></table>
                </div>
              </div>
           </div>
        </div>
      )}

      {noteModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
          <div className="bg-white p-5 rounded-2xl shadow-xl w-full max-w-[350px]">
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <div><h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><FileText size={16} className="text-yellow-500"/> Catatan</h3><p className="text-[10px] text-blue-600 font-semibold uppercase mt-0.5">{noteModal.nama}</p></div>
              <button onClick={() => setNoteModal(null)} className="text-gray-400 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"><X size={16}/></button>
            </div>
            <div className="bg-yellow-50/50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-yellow-100 max-h-[40vh] overflow-auto whitespace-pre-wrap">{noteModal.text}</div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerList;