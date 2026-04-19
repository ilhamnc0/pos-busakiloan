import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, PlusCircle, X, Wallet, ArrowDownLeft, ArrowUpRight, Link as LinkIcon, Trash2, Edit2, Download } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FinanceDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [form, setForm] = useState({ id: null, tipe: 'PENGELUARAN', nama: '', nominal: '', tanggal: '', metode: 'CASH', keterangan: '', buktiLink: '' });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const res = await axios.get(`${baseURL}/api/finance`); setTransactions(res.data); } catch (e) {} };

  const openAddModal = () => {
    setForm({ id: null, tipe: 'PENGELUARAN', nama: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], metode: 'CASH', keterangan: '', buktiLink: '' });
    setIsEditing(false); setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setForm({ id: t.dbId, tipe: t.tipe, nama: t.nama, nominal: t.nominal, tanggal: new Date(t.tanggal).toISOString().split('T')[0], metode: t.metode, keterangan: t.keterangan || '', buktiLink: t.buktiLink || '' });
    setIsEditing(true); setIsModalOpen(true);
  };

  const handleSaveManual = async () => {
    if (!form.nama || !form.nominal) return alert("Nama dan Nominal wajib diisi!");
    try { 
      if (isEditing) await axios.put(`${baseURL}/api/finance/manual/${form.id}`, form);
      else await axios.post(`${baseURL}/api/finance/manual`, form); 
      setIsModalOpen(false); loadData(); 
    } catch (e) { alert("Gagal menyimpan data"); }
  };

  const handleDeleteManual = async (dbId) => {
    if (confirm("Hapus catatan manual ini?")) { await axios.delete(`${baseURL}/api/finance/manual/${dbId}`); loadData(); }
  };

  const handleExportKeuangan = () => {
    let start, end;
    if (filterBulan) {
      start = `${filterBulan}-01`;
      end = new Date(filterBulan.split('-')[0], filterBulan.split('-')[1], 0).toISOString().split('T')[0];
    } else {
      start = `${new Date().getFullYear()}-01-01`;
      end = `${new Date().getFullYear()}-12-31`;
    }
    const token = localStorage.getItem('token');
    window.open(`${baseURL}/api/export?start=${start}&end=${end}&type=keuangan&token=${token}`, '_blank');
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  const getYearMonth = (dateString) => { const d = new Date(dateString); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  const renderLinks = (textString) => {
    if (!textString) return <span className="text-gray-300">-</span>;
    const links = textString.split(/\s+/).filter(link => link.trim() !== '');
    if(links.length === 0) return <span className="text-gray-300">-</span>;
    return links.map((link, idx) => (
      <a key={idx} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="text-blue-600 bg-blue-50 p-1.5 rounded shadow-sm hover:opacity-80"><LinkIcon size={14}/></a>
    ));
  };

  const filtered = transactions.filter(t => {
    const matchTab = activeTab === 'ALL' || t.tipe === activeTab;
    const matchSearch = t.nama.toLowerCase().includes(searchTerm.toLowerCase()) || t.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBulan = filterBulan === '' || getYearMonth(t.tanggal) === filterBulan;
    return matchTab && matchSearch && matchBulan;
  });

  const totalMasuk = filtered.filter(t => t.tipe === 'PEMASUKAN').reduce((s, t) => s + t.nominal, 0);
  const totalKeluar = filtered.filter(t => t.tipe === 'PENGELUARAN').reduce((s, t) => s + t.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  return (
    <div className="space-y-3 md:space-y-4 h-full flex flex-col">
      {/* HEADER DENGAN TOMBOL EXCEL */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between gap-3">
        <div><h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2"><Wallet size={20}/> Buku Kas</h2><p className="text-[10px] md:text-xs text-gray-500">Pemasukan (Order) dan Pengeluaran (Supplier & Operasional).</p></div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleExportKeuangan} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex justify-center items-center gap-1.5 text-xs md:text-sm shadow-sm transition-transform active:scale-95"><Download size={16}/> Export</button>
          <button onClick={openAddModal} className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex justify-center items-center gap-1.5 text-xs md:text-sm shadow-sm transition-transform active:scale-95"><PlusCircle size={16}/> Input Manual</button>
        </div>
      </div>

      {/* KOTAK REKAP COMPACT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200"><p className="text-green-800 font-bold text-[9px] md:text-xs mb-0.5 flex items-center gap-1"><ArrowDownLeft size={12}/> PEMASUKAN</p><h3 className="text-lg md:text-xl font-black text-green-700">{formatRp(totalMasuk)}</h3></div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200"><p className="text-red-800 font-bold text-[9px] md:text-xs mb-0.5 flex items-center gap-1"><ArrowUpRight size={12}/> PENGELUARAN</p><h3 className="text-lg md:text-xl font-black text-red-700">{formatRp(totalKeluar)}</h3></div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200"><p className="text-blue-800 font-bold text-[9px] md:text-xs mb-0.5">SALDO BERSIH</p><h3 className={`text-lg md:text-xl font-black ${saldo < 0 ? 'text-red-600' : 'text-blue-700'}`}>{formatRp(saldo)}</h3></div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {/* FILTER & SEARCH */}
        <div className="p-3 bg-gray-50 border-b flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-1 bg-white border p-1 rounded-lg w-full sm:w-auto">
            <button onClick={()=>setActiveTab('ALL')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-bold text-[10px] md:text-xs ${activeTab==='ALL'?'bg-gray-800 text-white':'text-gray-500'}`}>SEMUA</button>
            <button onClick={()=>setActiveTab('PEMASUKAN')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-bold text-[10px] md:text-xs ${activeTab==='PEMASUKAN'?'bg-green-600 text-white':'text-green-600'}`}>MASUK</button>
            <button onClick={()=>setActiveTab('PENGELUARAN')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-bold text-[10px] md:text-xs ${activeTab==='PENGELUARAN'?'bg-red-600 text-white':'text-red-600'}`}>KELUAR</button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-white border rounded-lg px-2 w-1/3 sm:w-auto"><input type="month" className="p-1 text-[10px] md:text-xs font-bold text-gray-700 outline-none w-full cursor-pointer" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} />{filterBulan && <button onClick={()=>setFilterBulan('')} className="text-red-400"><X size={12}/></button>}</div>
            <div className="relative w-2/3 sm:w-48"><Search className="absolute left-2.5 top-2 text-gray-400" size={14} /><input className="pl-8 pr-3 py-1.5 border rounded-lg w-full text-xs outline-none focus:border-purple-500" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          </div>
        </div>

        {/* KONTEN */}
        <div className="overflow-auto flex-1 bg-gray-50 md:bg-white p-2 md:p-0">
          <div className="grid grid-cols-1 gap-3 md:hidden pb-4">
            {filtered.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm border p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start border-b border-gray-100 pb-1.5">
                  <div>
                    <span className="font-bold text-sm text-gray-800 uppercase block">{t.nama}</span>
                    <span className="text-[9px] text-gray-400">{new Date(t.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${t.tipe === 'PEMASUKAN' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{t.tipe}</span>
                    <span className={`block font-black text-sm mt-1 ${t.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'}`}>{t.tipe === 'PEMASUKAN' ? '+' : '-'}{formatRp(t.nominal)}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-md">
                  <span className="font-bold uppercase text-gray-500">Ket:</span> {t.keterangan || '-'}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex gap-2 items-center">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${t.metode === 'TF' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{t.metode}</span>
                    <div className="flex gap-1">{renderLinks(t.buktiLink)}</div>
                  </div>
                  {!t.isAuto ? (
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(t)} className="text-blue-500 bg-blue-50 p-1.5 rounded-lg"><Edit2 size={12}/></button>
                      <button onClick={() => handleDeleteManual(t.dbId)} className="text-red-500 bg-red-50 p-1.5 rounded-lg"><Trash2 size={12}/></button>
                    </div>
                  ) : <span className="text-[9px] text-gray-400 italic">Otomatis</span>}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-6 text-center text-xs text-gray-400 bg-white rounded-lg border">Kosong.</div>}
          </div>

          {/* VIEW 2: DESKTOP TABLE */}
          <table className="hidden md:table w-full text-sm text-left"><thead className="bg-gray-800 text-white font-bold sticky top-0 z-10"><tr><th className="p-3">Tanggal</th><th className="p-3">Nama / Tujuan</th><th className="p-3">Nominal</th><th className="p-3 text-center">Tipe/Metode</th><th className="p-3">Keterangan</th><th className="p-3 text-center">Bukti</th><th className="p-3 text-center">Aksi</th></tr></thead><tbody className="divide-y">{filtered.map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="p-3 text-xs">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td><td className="p-3 font-bold text-gray-800 uppercase">{t.nama}{!t.isAuto && <span className="ml-2 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">MANUAL</span>}</td><td className={`p-3 font-black ${t.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'}`}>{t.tipe === 'PEMASUKAN' ? '+' : '-'} {formatRp(t.nominal)}</td><td className="p-3 text-center"><span className={`text-[9px] px-2 py-0.5 rounded-full font-bold mr-1 ${t.tipe === 'PEMASUKAN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.tipe}</span><span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${t.metode === 'TF' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{t.metode}</span></td><td className="p-3 text-xs text-gray-600 max-w-xs truncate">{t.keterangan || '-'}</td><td className="p-3 text-center"><div className="flex justify-center gap-1">{renderLinks(t.buktiLink)}</div></td><td className="p-3 text-center">{!t.isAuto ? (<div className="flex justify-center gap-1.5"><button onClick={() => openEditModal(t)} className="text-blue-500 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100"><Edit2 size={14}/></button><button onClick={() => handleDeleteManual(t.dbId)} className="text-red-500 bg-red-50 p-1.5 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button></div>) : (<span className="text-[10px] text-gray-400 italic">Otomatis</span>)}</td></tr>))}{filtered.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-gray-400">Kosong.</td></tr>}</tbody></table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000] p-3 backdrop-blur-sm">
           <div className="bg-white p-4 md:p-5 rounded-xl shadow-2xl w-full max-w-[450px] flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-3 border-b pb-2 shrink-0">
                <h3 className="font-bold text-sm md:text-base text-purple-800 flex items-center gap-1.5"><Wallet size={16}/> {isEditing ? 'Edit Data Manual' : 'Form Data Manual'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 bg-gray-100 p-1.5 rounded-full hover:text-red-500"><X size={16}/></button>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Tipe Arus Kas</label><select className={`w-full border p-2 rounded-lg text-xs font-bold outline-none ${form.tipe === 'PEMASUKAN' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`} value={form.tipe} onChange={e=>setForm({...form, tipe:e.target.value})}><option value="PENGELUARAN">PENGELUARAN (-)</option><option value="PEMASUKAN">PEMASUKAN (+)</option></select></div>
                  <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Tanggal</label><input type="date" className="w-full border p-2 rounded-lg text-xs outline-none focus:border-purple-500" value={form.tanggal} onChange={e=>setForm({...form, tanggal:e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 mb-1 block">Nama (Misal: GAJI, MINUM)</label><input type="text" className="w-full border p-2 rounded-lg text-xs font-bold uppercase outline-none focus:border-purple-500" value={form.nama} onChange={e=>setForm({...form, nama:e.target.value})} /></div>
                  <div className="col-span-1"><label className="text-[10px] font-bold text-gray-500 mb-1 block">Metode</label><select className="w-full border p-2 rounded-lg text-xs font-bold outline-none" value={form.metode} onChange={e=>setForm({...form, metode:e.target.value})}><option value="CASH">CASH</option><option value="TF">TF</option></select></div>
                </div>

                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Nominal (Rp)</label><input type="number" className="w-full border-2 p-2.5 rounded-lg text-base font-black text-gray-800 outline-none focus:border-purple-500" placeholder="0" value={form.nominal} onChange={e=>setForm({...form, nominal:e.target.value})} /></div>
                <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">Keterangan Detail</label><textarea className="w-full border p-2 rounded-lg text-xs outline-none h-12 focus:border-purple-500" placeholder="Catatan..." value={form.keterangan} onChange={e=>setForm({...form, keterangan:e.target.value})}></textarea></div>
                <div className="bg-gray-50 p-2 rounded-lg border">
                  <label className="text-[10px] font-bold text-gray-600 mb-1 flex items-center gap-1"><LinkIcon size={12} className="text-blue-500"/> Link Bukti G-Drive</label>
                  <textarea className="text-[10px] w-full bg-white p-2 rounded border outline-none h-12 resize-y focus:border-purple-500" value={form.buktiLink} onChange={e=>setForm({...form, buktiLink:e.target.value})} placeholder="Pisahkan dengan enter..."></textarea>
                </div>
              </div>

              <div className="flex gap-2 pt-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-200">Batal</button>
                <button onClick={handleSaveManual} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-purple-700 shadow-sm transition-transform active:scale-95">Simpan</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default FinanceDashboard;