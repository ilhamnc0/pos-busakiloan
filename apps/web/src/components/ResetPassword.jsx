import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mengambil token dari URL (contoh: ?token=abcde...)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Token tidak ditemukan di URL. Pastikan Anda mengklik link yang benar dari email.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      return setError("Konfirmasi password tidak cocok!");
    }
    if (newPassword.length < 6) {
      return setError("Password minimal harus 6 karakter.");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${baseURL}/api/auth/reset-password`, {
        token,
        newPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mereset password. Link mungkin sudah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header Biru Khas BusaKiloan */}
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">BusaKiloan ERP</h1>
          <p className="text-blue-100 text-sm mt-1">Buat Password Baru Anda</p>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Password Berhasil Diubah!</h2>
              <p className="text-sm text-gray-600">Sandi akun Anda telah berhasil diperbarui. Silakan login menggunakan password baru Anda.</p>
              <button 
                onClick={() => window.location.href = '/'} 
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-4"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-start gap-2 border border-red-100">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full border-2 border-gray-200 pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                    placeholder="Minimal 6 karakter..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={!token}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full border-2 border-gray-200 pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 transition-colors"
                    placeholder="Ketik ulang password baru..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!token}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !token}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md flex justify-center items-center"
              >
                {loading ? 'Memproses...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
          
          {!success && (
             <div className="mt-6 text-center">
               <button onClick={() => window.location.href = '/'} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto">
                 <ArrowLeft size={16}/> Kembali ke Login
               </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;