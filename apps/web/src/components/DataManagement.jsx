import { useState } from 'react';
import axios from 'axios';
import { Download, Trash2, AlertTriangle, CalendarDays, Database, Filter } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DataManagement = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dataType, setDataType] = useState('semua');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = () => {
    // Mengecek apakah data yang dipilih adalah data utama (tidak butuh filter tanggal)
    const isDataUtama = ['pelanggan', 'sopir', 'stok', 'supplier'].includes(dataType);
    if (!isDataUtama && (!startDate || !endDate)) return alert("Pilih Tanggal Mulai dan Tanggal Akhir terlebih dahulu!");
    
    let url = `${baseURL}/api/export?type=${dataType}&token=${localStorage.getItem('token')}`;
    if (!isDataUtama) url += `&start=${startDate}&end=${endDate}`;
    
    window.open(url, '_blank');
  };

  const handleDelete = async () => {
    const isDataUtama = ['pelanggan', 'sopir', 'stok', 'supplier'].includes(dataType);
    if (isDataUtama) return alert("Menu ini hanya untuk menghapus riwayat transaksi. Data Utama (Pelanggan/Sopir/Stok/Supplier) harus dihapus satu per satu di halamannya masing-masing untuk mencegah kerusakan data.");
    
    if (!startDate || !endDate) return alert("Silakan pilih rentang tanggal transaksi yang ingin dihapus!");
    
    if (window.confirm(`PERINGATAN KERAS!\n\nAnda akan menghapus riwayat ${dataType.toUpperCase()} dari ${startDate} s/d ${endDate} secara PERMANEN.\nSudah dibackup?`)) {
      if (window.confirm("Tindakan ini TIDAK BISA DIBATALKAN. Lanjutkan Hapus?")) {
        setIsDeleting(true);
        try {
          const res = await axios.post(`${baseURL}/api/export/delete`, { start: startDate, end: endDate, type: dataType });
          alert("✅ " + res.data.message);
          setStartDate(''); setEndDate('');
        } catch (e) { alert("❌ " + (e.response?.data?.error || "Gagal menghapus data.")); } 
        finally { setIsDeleting(false); }
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 bg-gray-50/50 p-2 md:p-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-2"><Database className="text-red-600"/> Manajemen & Arsip Database</h2>
        <p className="text-sm text-gray-500">Backup laporan ke Excel atau bersihkan data transaksi lama agar aplikasi tetap ringan.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
            <h3 className="font-bold text-blue-900">1. Filter Modul Data</h3>
            
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1"><Filter size={14}/> Pilih Jenis Data</label>
              <select className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 bg-white cursor-pointer" value={dataType} onChange={e => setDataType(e.target.value)}>
                <option value="semua">SEMUA DATA SISTEM (Utama & Transaksi)</option>
                <optgroup label="📝 DATA UTAMA (Hanya Bisa Di-Export)">
                  <option value="pelanggan">Data Pelanggan & Harga Khusus</option>
                  <option value="supplier">Database Supplier / Pabrik</option>
                  <option value="sopir">Data Sopir & Tarif Daerah</option>
                  <option value="stok">Data Stok & Produk Utama</option>
                </optgroup>
                <optgroup label="💸 DATA TRANSAKSI (Bisa Export & Hapus)">
                  <option value="penjualan">Rekap Transaksi Order (Penjualan)</option>
                  <option value="pembelian">Rekap Pembelian Pabrik</option>
                  <option value="mutasi">Riwayat Mutasi Stok (Masuk & Keluar)</option>
                  <option value="piutang">Catatan Hutang & Piutang</option>
                  <option value="keuangan">Buku Kas (Uang Masuk & Keluar)</option>
                  <option value="profit">Laporan Laba & Profit</option>
                </optgroup>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <div className="w-full">
                <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1"><CalendarDays size={14}/> Dari Tanggal</label>
                <input type="date" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold outline-none bg-white" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              </div>
              <span className="text-gray-400 font-bold hidden sm:block mt-5">-</span>
              <div className="w-full">
                <label className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1"><CalendarDays size={14}/> Sampai Tanggal</label>
                <input type="date" className="w-full border-2 border-blue-200 p-3 rounded-xl text-sm font-bold outline-none bg-white" value={endDate} onChange={e=>setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white p-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 shadow-md transition-transform active:scale-95 group">
              <Download size={32} className="group-hover:-translate-y-1 transition-transform"/>
              <div className="text-center">
                <span className="block text-base">Export ke Excel (.xlsx)</span>
                <span className="text-[10px] font-normal opacity-80 uppercase tracking-widest">Aman untuk semua data</span>
              </div>
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 p-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-3 transition-colors active:scale-95 group">
              <Trash2 size={32} className="group-hover:scale-110 transition-transform"/>
              <div className="text-center">
                <span className="block text-base">{isDeleting ? 'MENGHAPUS...' : 'Hapus Transaksi Permanen'}</span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Hanya untuk Laporan Transaksi</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DataManagement;