import { X, Printer, Store } from 'lucide-react';
import { useState, useEffect } from 'react';

const InvoiceModal = ({ order, onClose }) => {
  // 1. STATE UNTUK PILIH TOKO
  const [brand, setBrand] = useState('busakiloan');

  // 2. STATE UNTUK NAMA TTD (Bisa diedit langsung di layar)
  const [adminName, setAdminName] = useState('ERYNA');
  const [deliveryName, setDeliveryName] = useState('');
  const [penerimaName, setPenerimaName] = useState('');

  // Saat modal terbuka, otomatis isi nama penerima dengan nama pelanggan
  useEffect(() => {
    if (order) {
      setPenerimaName(order.customer?.nama || '');
    }
  }, [order]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRp = (n) => 'Rp' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(n || 0);
  
  // Format Tanggal: "16 Februari 2026"
  const dateObj = new Date(order.tanggal);
  const dateString = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Format No Invoice: DD/MM/YY/ID (Contoh: 16/02/26/3)
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(-2);
  const invoiceNo = `${dd}/${mm}/${yy}/${order.id}`;

  // Data Profil Toko
  const storeProfiles = {
    busakiloan: {
      id: 'busakiloan',
      title: 'BUSAKILOAN.COM',
      email: 'busakiloan.com@gmail.com',
      hasNomorUsaha: false,
      logoColor: 'bg-blue-600',
      logoText1: 'BUSA',
      logoText2: 'KILOan',
      textColor: 'text-yellow-300'
    },
    bantalindo: {
      id: 'bantalindo',
      title: 'BANTALINDO',
      email: 'admin@bantalindonesia.com',
      hasNomorUsaha: true,
      logoColor: 'bg-red-600 rounded-full',
      logoText1: 'Bantal',
      logoText2: 'Lindo',
      textColor: 'text-white'
    }
  };

  const activeStore = storeProfiles[brand];

  // Supaya tabelnya tidak terlalu kosong, kita buat minimal 6 baris (seperti Excel)
  const MIN_ROWS = 6;
  const paddedItems = [...order.items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push({ isEmpty: true });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 print:p-0 print:bg-white print:static">
      
      {/* WRAPPER NOTA */}
      <div id="printable-invoice" className="bg-white w-[900px] max-h-[90vh] overflow-y-auto shadow-2xl relative print:shadow-none print:w-full print:max-h-full print:overflow-visible">
        
        {/* --- HEADER KONTROL (HILANG SAAT PRINT) --- */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-100 no-print sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-gray-700 mr-4">Preview Nota</h3>
            
            {/* OPSI PILIH TOKO */}
            <div className="flex bg-white rounded-lg border p-1 shadow-sm">
              <button 
                onClick={() => setBrand('busakiloan')}
                className={`px-4 py-1 text-sm font-bold rounded flex items-center gap-2 ${brand === 'busakiloan' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              ><Store size={14}/> BusaKiloan</button>
              <button 
                onClick={() => setBrand('bantalindo')}
                className={`px-4 py-1 text-sm font-bold rounded flex items-center gap-2 ${brand === 'bantalindo' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              ><Store size={14}/> Bantalindo</button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
              <Printer size={18}/> CETAK
            </button>
            <button onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-400">
              <X size={18}/>
            </button>
          </div>
        </div>
        {/* ------------------------------------------- */}

        {/* --- KERTAS NOTA (YANG AKAN DI-PRINT) --- */}
        <div className="p-8 text-black font-sans print:p-0">
          
          <table className="w-full border-collapse border-2 border-black text-xs leading-tight">
            <tbody>
              
              {/* --- BAGIAN KOP SURAT --- */}
              <tr>
                <td rowSpan="4" className="border border-black p-2 text-center w-[12%] align-middle">
                  <div className={`mx-auto w-20 h-16 flex flex-col justify-center items-center font-bold ${activeStore.logoColor} ${activeStore.textColor}`}>
                    <span className="text-sm leading-none">{activeStore.logoText1}</span>
                    <span className="text-[10px] leading-none">{activeStore.logoText2}</span>
                  </div>
                </td>
                <td colSpan="2" className="border border-black px-2 py-1 font-bold underline text-sm tracking-wide">
                  {activeStore.title}
                </td>
                <td colSpan="3" className="border border-black px-2 py-1 font-bold uppercase text-sm">
                  FAKTUR NOTA & SURAT JALAN
                </td>
              </tr>
              
              <tr>
                <td colSpan="2" className="border border-black px-2 py-1">Onggojayan. Banyurejo. Tempel. Sleman. DIY 55552</td>
                <td className="border border-black px-2 py-1 w-[15%]">Kepada Yth.</td>
                <td colSpan="2" className="border border-black px-2 py-1 font-bold uppercase">NO {invoiceNo}</td>
              </tr>
              
              <tr>
                <td className="border border-black px-2 py-1 w-[15%]">Email</td>
                <td className="border border-black px-2 py-1 w-[30%]">: {activeStore.email}</td>
                <td className="border border-black px-2 py-1 font-bold uppercase">{penerimaName}</td>
                <td colSpan="2" className="border border-black px-2 py-1 font-bold">{dateString}</td>
              </tr>
              
              <tr>
                <td className="border border-black px-2 py-1">Kode KBLI</td>
                <td className="border border-black px-2 py-1">: 13993</td>
                <td colSpan="3" className="border border-black px-2 py-1 font-bold uppercase">{order.customer?.alamat}</td>
              </tr>

              {activeStore.hasNomorUsaha && (
                <tr>
                  <td className="border border-black px-2 py-1">Nomor usaha</td>
                  <td colSpan="5" className="border border-black px-2 py-1">: 021301020294</td>
                </tr>
              )}

              {/* --- HEADER TABEL BARANG --- */}
              <tr className="text-center font-bold uppercase">
                <td className="border border-black p-1">NO</td>
                <td className="border border-black p-1">PACK</td>
                <td className="border border-black p-1 w-[35%]">PRODUK</td>
                <td className="border border-black p-1 w-[10%]">QTY</td>
                <td className="border border-black p-1 w-[15%]">HARGA</td>
                <td className="border border-black p-1 w-[15%]">TOTAL</td>
              </tr>

              {/* --- LOOPING BARANG --- */}
              {paddedItems.map((item, idx) => (
                <tr key={idx} className="h-6">
                  {item.isEmpty ? (
                    <>
                      <td className="border border-black p-1 text-center"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-right"></td>
                      <td className="border border-black p-1 text-right"></td>
                    </>
                  ) : (
                    <>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 font-bold uppercase">{item.product?.nama}</td>
                      <td className="border border-black p-1 text-center">{item.qty}</td>
                      <td className="border border-black p-1 text-right">{formatRp(item.hargaSatuan)}</td>
                      <td className="border border-black p-1 text-right">{formatRp(item.subtotal)}</td>
                    </>
                  )}
                </tr>
              ))}

              {/* Jika ada Ongkir, tambahkan sebagai baris barang */}
              {order.ongkir > 0 && (
                <tr className="h-6">
                  <td className="border border-black p-1 text-center"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 font-bold">BIAYA PENGIRIMAN (ONGKIR)</td>
                  <td className="border border-black p-1 text-center">1</td>
                  <td className="border border-black p-1 text-right">{formatRp(order.ongkir)}</td>
                  <td className="border border-black p-1 text-right">{formatRp(order.ongkir)}</td>
                </tr>
              )}

              {/* --- BARIS TOTAL KESELURUHAN --- */}
              <tr>
                <td colSpan="5" className="border border-black p-1 text-right font-bold uppercase text-sm">TOTAL</td>
                <td className="border border-black p-1 text-right font-bold text-sm">{formatRp(order.grandTotal)}</td>
              </tr>

              {/* --- BAGIAN FOOTER (REKENING & TTD) --- */}
              <tr>
                <td colSpan="3" className="border border-black px-2 py-1 text-left font-bold text-[11px] uppercase">
                  NB. TIDAK MENERIMA KOMPLAIN SETELAH BARANG DITERIMA
                </td>
                <td className="border border-black px-2 py-1 text-center font-bold">Admin</td>
                <td className="border border-black px-2 py-1 text-center font-bold">Delivery</td>
                <td className="border border-black px-2 py-1 text-center font-bold">Penerima</td>
              </tr>
              
              <tr>
                <td className="border border-black px-2 py-1 text-left">a.n</td>
                <td colSpan="2" className="border border-black px-2 py-1 text-left font-bold uppercase">ARDI RAHMAD S.Pd.I.,M.Pd</td>
                
                {/* KOLOM TTD (Bisa diketik sebelum print) */}
                <td rowSpan="4" className="border border-black p-1 align-bottom text-center font-bold h-20">
                  <input 
                    type="text" 
                    className="w-full text-center outline-none bg-transparent uppercase font-bold text-xs" 
                    value={adminName} 
                    onChange={e => setAdminName(e.target.value)} 
                    placeholder="Nama Admin"
                  />
                </td>
                <td rowSpan="4" className="border border-black p-1 align-bottom text-center font-bold h-20">
                  <input 
                    type="text" 
                    className="w-full text-center outline-none bg-transparent uppercase font-bold text-xs" 
                    value={deliveryName} 
                    onChange={e => setDeliveryName(e.target.value)} 
                    placeholder="Nama Supir"
                  />
                </td>
                <td rowSpan="4" className="border border-black p-1 align-bottom text-center font-bold h-20">
                  <input 
                    type="text" 
                    className="w-full text-center outline-none bg-transparent uppercase font-bold text-xs" 
                    value={penerimaName} 
                    onChange={e => setPenerimaName(e.target.value)} 
                    placeholder="Nama Penerima"
                  />
                </td>
              </tr>

              <tr>
                <td className="border border-black px-2 py-1 text-left">BCA</td>
                <td colSpan="2" className="border border-black px-2 py-1 text-left font-bold">8610636919</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-left">BRI</td>
                <td colSpan="2" className="border border-black px-2 py-1 text-left font-bold">305901011954533</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-left">BNI</td>
                <td colSpan="2" className="border border-black px-2 py-1 text-left font-bold">1131662027</td>
              </tr>

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;