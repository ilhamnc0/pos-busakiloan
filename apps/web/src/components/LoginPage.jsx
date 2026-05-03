import { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = ({ setToken }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);

    try {
      const res = await axios.post(`${baseURL}/api/auth/login`, {
        email: form.email,
        password: form.password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token); 
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(''); setSuccessMsg('');
    if (!form.email) {
      return setError('Masukkan email Anda di kolom "EMAIL AKSES" terlebih dahulu untuk mereset sandi.');
    }

    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/api/auth/forgot-password`, { email: form.email });
      setSuccessMsg(res.data.message || 'Link reset password telah dikirim ke email Anda!');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim email reset password. Pastikan email terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">BusaKiloan ERP</h1>
          <p className="text-blue-100 text-sm mt-1">Portal Login Karyawan</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Login ke Sistem</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-100 mb-5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold flex items-start gap-2 border border-green-200 mb-5">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Akses</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  className="w-full border-2 border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  className="w-full border-2 border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-transform active:scale-95 disabled:bg-gray-400 shadow-md flex justify-center items-center gap-2 mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-5 text-center border-t border-gray-100 pt-5">
            <button 
              type="button" 
              onClick={handleForgotPassword} 
              disabled={loading}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
            >
              {loading ? 'Mengirim Email...' : 'Lupa Password?'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;