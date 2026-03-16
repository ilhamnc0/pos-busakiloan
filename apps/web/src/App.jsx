import { useState } from 'react';
import AdminLayout from './layout/AdminLayout';
import CustomerSelect from './components/CustomerSelect';
import OrderCart from './components/OrderCart';
import OrderList from './components/OrderList';
import CustomerList from './components/CustomerList';
import StockList from './components/StockList';
import SupplierList from './components/SupplierList'; 
import PiutangDashboard from './components/PiutangDashboard'; 
import RiwayatProses from './components/RiwayatProses'; 
import FinanceDashboard from './components/FinanceDashboard'; 
import ProfitDashboard from './components/ProfitDashboard';
import MainDashboard from './components/MainDashboard';
import SopirList from './components/SopirList'; // IMPORT SOPIR

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCustomer, setActiveCustomer] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <MainDashboard setActiveTab={setActiveTab} />; 
        
      case 'kasir':
        return (
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border shrink-0">
              <h3 className="text-sm md:text-base font-bold text-gray-800 border-b pb-2 mb-3">1. Informasi Pelanggan</h3>
              <div className="w-full md:w-1/2 lg:w-1/3">
                <CustomerSelect onSelectCustomer={setActiveCustomer} />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
               <OrderCart selectedCustomer={activeCustomer} />
            </div>
          </div>
        );
        
      case 'rekap': 
        return <OrderList setActiveTab={setActiveTab} />;
      case 'pelanggan': 
        return <CustomerList />;
      case 'sopir': // TAMBAHAN RUTE SOPIR
        return <SopirList />;
      case 'stok': 
        return <StockList />;
      case 'riwayat': 
        return <RiwayatProses />; 
      case 'piutang': 
        return <PiutangDashboard />; 
      case 'supplier': 
        return <SupplierList />;
      case 'keuangan': 
        return <FinanceDashboard />;
      case 'profit': 
        return <ProfitDashboard />;
        
      default: 
        return <MainDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}

export default App;