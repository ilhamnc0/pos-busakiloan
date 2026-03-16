import { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';
import { UserPlus, X, Save } from 'lucide-react';

const CustomerSelect = ({ onSelectCustomer }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State Modal Pop-up
  const [showModal, setShowModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [form, setForm] = useState({ alamat: '', kontak: '', ongkirDefault: 0, ongkirPerusahaanDefault: 0 });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/customers');
      setOptions(res.data.map(c => ({ 
        value: c.id, 
        label: c.nama, 
        dataAsli: c // Simpan data lengkap
      })));
    } catch (e) { console.error(e); }
  };

  // Saat mengetik nama yang belum ada, fungsi ini jalan
  const handleCreateOption = (inputValue) => {
    setNewCustName(inputValue); // Simpan nama yang diketik
    setShowModal(true); // Buka Pop-up
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustName) return;
    setIsLoading(true);
    try {
      const payload = { 
        nama: newCustName, 
        alamat: form.alamat,
        kontak: form.kontak,
        ongkirDefault: form.ongkirDefault,
        ongkirPerusahaanDefault: form.ongkirPerusahaanDefault
      };
      
      const res = await axios.post('http://localhost:5000/api/customers/upsert', payload);
      
      const newOption = { value: res.data.id, label: res.data.nama, dataAsli: res.data };
      setOptions((prev) => [...prev, newOption]);
      
      // Otomatis pilih pelanggan baru tersebut
      onSelectCustomer(newOption); 
      
      alert(`✅ Pelanggan "${newCustName}" berhasil dibuat & dipilih!`);
      setShowModal(false);
      setForm({ alamat: '', kontak: '', ongkirDefault: 0, ongkirPerusahaanDefault: 0 });
    } catch (e) {
      alert("Gagal membuat pelanggan: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{ maxWidth: '400px' }}>
        <CreatableSelect
          isClearable
          isDisabled={isLoading}
          isLoading={isLoading}
          onChange={onSelectCustomer}
          onCreateOption={handleCreateOption} // Trigger Modal
          options={options}
          placeholder="Cari atau Ketik Nama Baru..."
          formatCreateLabel={(iv) => `➕ Buat Baru: "${iv}"`}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </div>

      {/* --- MODAL POP-UP (MUNCUL JIKA BUAT BARU) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <UserPlus size={20}/> Pelanggan Baru
              </h3>
              <button onClick={()=>setShowModal(false)}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                <label className="text-xs font-bold text-gray-500">Nama</label>
                <div className="font-bold text-lg text-blue-900">{newCustName}</div>
              </div>

              <input className="w-full border p-2 rounded" placeholder="Alamat / Kota" value={form.alamat} onChange={e=>setForm({...form, alamat:e.target.value})} />
              <input className="w-full border p-2 rounded" placeholder="Kontak (HP/WA)" value={form.kontak} onChange={e=>setForm({...form, kontak:e.target.value})} />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">Ongkir Tagihan</label>
                  <input type="number" className="w-full border p-2 rounded font-bold text-green-700" placeholder="0" value={form.ongkirDefault} onChange={e=>setForm({...form, ongkirDefault:e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Ongkir Modal</label>
                  <input type="number" className="w-full border p-2 rounded font-bold text-red-500" placeholder="0" value={form.ongkirPerusahaanDefault} onChange={e=>setForm({...form, ongkirPerusahaanDefault:e.target.value})} />
                </div>
              </div>
            </div>

            <button onClick={handleSaveNewCustomer} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg">
              <Save size={20}/> SIMPAN & PILIH
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSelect;