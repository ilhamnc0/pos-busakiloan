import { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, Truck, 
  Contact, History, Wallet, TrendingUp, Menu, X, FileText // Tambah FileText untuk icon Piutang
} from 'lucide-react'; 

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Menu Items - Tambah Menu Sopir
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, color: 'text-purple-600' },
    // { id: 'kasir', label: 'Kasir / Order Baru', icon: ShoppingCart, color: 'text-blue-600', gap: true }, 
    { id: 'rekap', label: 'Rekap Transaksi', icon: LayoutDashboard, color: 'text-gray-500' }, 
    { id: 'pelanggan', label: 'Data Pelanggan', icon: Users, color: 'text-gray-500' },
    { id: 'sopir', label: 'Data Sopir & Ongkir', icon: Truck, color: 'text-gray-500' }, // MENU BARU SOPIR
    { id: 'stok', label: 'Stok & Produk', icon: Package, color: 'text-gray-500' },
    { id: 'riwayat', label: 'Mutasi Produk', icon: History, color: 'text-gray-500' },
    { id: 'piutang', label: 'Hutang & Piutang', icon: FileText, gap: true, color: 'text-gray-500' }, // Ganti icon dari Truck ke FileText
    { id: 'supplier', label: 'Database Supplier', icon: Contact, color: 'text-gray-500' },
    { id: 'keuangan', label: 'Buku Kas & Keuangan', icon: Wallet, color: 'text-purple-600', gap: true },
    { id: 'profit', label: 'Laba & Profit', icon: TrendingUp, color: 'text-green-600' },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id); setIsSidebarOpen(false); 
  };

  return (
    <div className="flex h-screen w-full bg-gray-50/50 overflow-hidden text-gray-700 font-sans antialiased text-sm">
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && <div className="fixed inset-0 bg-gray-950/60 z-30 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl lg:shadow-none lg:border-r lg:border-gray-100 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-blue-600 tracking-tight">BusaKiloan</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">ERP System v2.0</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-red-500 bg-gray-100 p-2 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(false)}><X size={18} /></button>
        </div>
        
        <nav className="flex-1 p-3 md:p-4 space-y-1.5 overflow-y-auto scrollbar-hide bg-white">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold ${item.gap ? 'mt-5 border-t border-gray-100 pt-5 rounded-none' : ''} ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02] text-xs md:text-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 text-xs md:text-sm'}`}>
              <item.icon size={18} className={activeTab === item.id ? 'text-white' : item.color} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 bg-white shadow-none flex items-center px-4 md:px-8 justify-between shrink-0 z-20 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}><Menu size={18} /></button>
            <h1 className="text-base font-semibold text-gray-950 truncate tracking-tight">{menuItems.find(m => m.id === activeTab)?.label || "Dashboard Utama"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-semibold text-gray-400 uppercase leading-none">Administrator</p>
              <p className="text-xs font-bold text-gray-900 leading-tight mt-1">Admin Utama</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-sm md:text-base font-black shadow-inner border-2 border-white ring-1 ring-gray-100">A</div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <div className="flex-1 overflow-auto p-3 md:p-6 bg-gray-50/50">
          {/* CONTAINER PUTIH UTAMA (Pastikan 'sopir' dimasukkan ke dalam array ini agar tingginya full) */}
          <div className={`max-w-full mx-auto bg-white rounded-2xl shadow-sm border border-gray-100/70 ${['rekap', 'piutang', 'supplier', 'stok', 'riwayat', 'pelanggan', 'keuangan', 'profit', 'sopir'].includes(activeTab) ? 'min-h-full flex flex-col' : 'p-4 md:p-6'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminLayout;