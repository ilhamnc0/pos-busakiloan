import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit2, Trash2, PlusCircle, Save, X, Truck, MapPin, ChevronDown, Download } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SopirList = () => {
  const [sopirs, setSopirs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);

  const [form, setForm] = useState({ id: null, nama: '', kontak: '', ongkir: [] });

  useEffect(() => { fetchSopirs(); }, []);

  const fetchSopirs = () => axios.get(`${baseURL}/api/sopir`).then(res => setSopirs(res.data)).catch(console.error);

  const openAddModal = () => {
    setForm({ id: null, nama: '', kontak: '', ongkir: [{ daerah: '', tarif: '' }] });
    setIsEditing(false); setIsModalOpen(true);
  };

  const openEditModal = (s) => {
    setForm({ 
      id: s.id, nama: s.nama, kontak: s.kontak || '', 
      ongkir: s.ongkir.length > 0 ? s.ongkir : [{ daerah: '', tarif: '' }] 
    });
    setIsEditing(true); setIsModalOpen(true);
  };

  const handleAddOngkirRow = () => setForm({ ...form, ongkir: [...form.ongkir, { daerah: '', tarif: '' }] });
  
  const handleRemoveOngkirRow = (index) => {
    const newOngkir = form.ongkir.filter((_, idx) => idx !== index);
    setForm({ ...form, ongkir: newOngkir });
  };

  const handleChangeOngkir = (index, field, value) => {
    const newOngkir = [...form.ongkir];
    newOngkir[index][field] = value;
    setForm({ ...form, ongkir: newOngkir });
  };

  const handleSave = async () => {
    if (!form.nama) return alert("Nama sopir wajib diisi!");
    const validOngkir = form.ongkir.filter(o => o.daerah.trim() !== '' && o.tarif !== '');
    try {
      await axios.post(`${baseURL}/api/sopir/upsert`, { ...form, ongkir: validOngkir });
      setIsModalOpen(false); fetchSopirs();
    } catch (e) { 
      alert("Gagal menyimpan data: " + (e.response?.data?.error || e.message)); 
    }
  };

  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?type=sopir&token=${token}`, '_blank');
  };

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const filtered = sopirs.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 border flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl shadow-sm shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button onClick={openAddModal} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
            <PlusCircle size={18}/> Tambah Sopir
          </button>
          <button onClick={handleExportExcel} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
            <Download size={18}/> Export Excel
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input className="pl-10 pr-4 py-2.5 border rounded-lg w-full text-sm outline-none focus:border-blue-500 shadow-sm" placeholder="Cari Sopir..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white border rounded-xl shadow-sm">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 font-semibold text-gray-600 border-b">
            <tr>
              <th className="p-4">Nama Sopir</th>
              <th className="p-4">Kontak</th>
              <th className="p-4">Cakupan Daerah & Tarif Ongkir</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(s => (
              <>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-4 font-bold text-gray-900 uppercase">{s.nama}</td>
                  <td className="p-4 text-gray-600">{s.kontak || '-'}</td>
                  <td className="p-4">
                    {s.ongkir.length > 0 ? (
                      <button 
                        onClick={() => toggleRow(s.id)} 
                        className="flex items-center gap-1.5 text-orange-700 font-bold text-xs bg-orange-50 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors shadow-sm"
                      >
                        <MapPin size={14}/> Lihat Tarif ({s.ongkir.length} Daerah)
                        <ChevronDown size={14} className={`transition-transform duration-200 ${expandedRow === s.id ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Belum ada tarif disetel</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => openEditModal(s)} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit2 size={16}/></button>
                      <button onClick={async () => { if(confirm('Hapus sopir ini?')) { await axios.delete(`${baseURL}/api/sopir/${s.id}`); fetchSopirs(); } }} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>

                {expandedRow === s.id && s.ongkir.length > 0 && (
                  <tr>
                    <td colSpan="4" className="p-0 border-b border-gray-100 bg-orange-50/30">
                      <div className="p-4 m-2 border-l-4 border-orange-400 bg-white rounded-r-lg shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {s.ongkir.map((o, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="font-bold text-gray-700 text-xs uppercase truncate pr-2">{o.daerah}</span>
                              <span className="text-orange-600 font-black text-sm">{formatRp(o.tarif)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2"><Truck size={20}/> {isEditing ? 'Edit Sopir' : 'Tambah Sopir'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-200 rounded-full text-gray-600 hover:text-red-500"><X size={18}/></button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto">
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Sopir</label><input className="border-2 p-2.5 rounded-lg w-full text-sm font-bold outline-none focus:border-blue-500 uppercase" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} placeholder="Nama..." /></div>
              <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Nomor WA / Kontak</label><input className="border-2 p-2.5 rounded-lg w-full text-sm outline-none focus:border-blue-500" value={form.kontak} onChange={e=>setForm({...form, kontak:e.target.value})} placeholder="08..." /></div>
              
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">Data Tarif Ongkir Daerah</label>
                  <button onClick={handleAddOngkirRow} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">+ Tambah Daerah</button>
                </div>
                
                <div className="space-y-2">
                  {form.ongkir.map((o, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 border rounded-lg">
                      <input className="flex-1 border p-2 rounded text-xs outline-none focus:border-blue-500 uppercase" placeholder="Nama Daerah (cth: Sleman)" value={o.daerah} onChange={e => handleChangeOngkir(idx, 'daerah', e.target.value)} />
                      <input type="number" className="w-32 border p-2 rounded text-xs font-bold text-orange-700 outline-none focus:border-blue-500" placeholder="Tarif (Rp)" value={o.tarif} onChange={e => handleChangeOngkir(idx, 'tarif', e.target.value)} />
                      <button onClick={() => handleRemoveOngkirRow(idx)} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {form.ongkir.length === 0 && <p className="text-xs text-center text-gray-400 italic py-2">Belum ada rincian daerah.</p>}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">Batal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"><Save size={18} className="inline mr-1"/> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SopirList;