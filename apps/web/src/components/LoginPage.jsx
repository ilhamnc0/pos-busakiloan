import { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = ({ setToken }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post(`${baseURL}/api/auth/register`, form);
        alert("Pendaftaran berhasil! Silakan Login.");
        setIsRegister(false);
      } else {
        const res = await axios.post(`${baseURL}/api/auth/login`, { email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token); // Memicu App.jsx untuk masuk ke Dashboard
      }
    } catch (err) {
      setError(err.response?.data?.error || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) return setError("Masukkan email Anda terlebih dahulu untuk mereset sandi.");
    try {
      await axios.post(`${baseURL}/api/auth/forgot-password`, { email: form.email });
      alert("Link reset sandi telah dikirim ke email Anda!");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mengirim email reset.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-8 text-center text-white">
          <ShieldCheck size={48} className="mx-auto mb-3 opacity-90"/>
          <h1 className="text-3xl font-black tracking-tight">BusaKiloan ERP</h1>
          <p className="text-blue-200 text-sm mt-2 font-medium">Sistem Manajemen Terpadu v2.0</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {isRegister ? 'Buat Akun Admin Baru' : 'Login ke Sistem'}
          </h2>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-4 text-center border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input type="text" required className="w-full bg-gray-50 border-2 border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors font-semibold" placeholder="Nama admin..." value={form.username} onChange={e=>setForm({...form, username: e.target.value})} />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Email Akses</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                <input type="email" required className="w-full bg-gray-50 border-2 border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors font-semibold" placeholder="admin@busakiloan.com" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                <input type="password" required className="w-full bg-gray-50 border-2 border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors font-semibold" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2 mt-2">
              {loading ? 'Memproses...' : (isRegister ? 'Daftar Akun' : 'Masuk Sekarang')} <ArrowRight size={18}/>
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            {!isRegister && (
              <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-blue-600 hover:underline">Lupa Password?</button>
            )}
            <button type="button" onClick={() => {setIsRegister(!isRegister); setError('');}} className="text-xs font-medium text-gray-500 hover:text-gray-800">
              {isRegister ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;