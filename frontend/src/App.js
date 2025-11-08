import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import AdminLogin from './components/AdminLogin'; 
import AdminRegister from './components/AdminRegister'; 
import AdminDashboard from './components/AdminDashboard'; 
import UserHome from './components/UserHome';
import AddKatalogProduk from './components/AddKatalogProduk';
import KatalogProdukList from './components/KatalogProdukList';
import UpdateKatalogProduk from './components/UpdateKatalogProduk';
import AdminCategoryList from './components/AdminCategoryList';
import AdminDiscounts from './components/AdminDiscounts';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import WishlistPage from './pages/WishlistPage';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutStaticPage from './pages/CheckoutStaticPage';
import UserProfile from './pages/UserProfile';
import CompanyProfile from './pages/CompanyProfile';
import EditCompanyProfile from './components/EditCompanyProfile';
import UserForgotPassword from './pages/UserForgotPassword';
import UserResetPassword from './pages/UserResetPassword';
import AdminOrders from './components/AdminOrders';
import UserOrdersPage from './pages/UserOrdersPage';
import AdminOrderDetail from './components/AdminOrderDetail';
import AdminOrderCancel from './components/AdminOrderCancel';
import AdminCancellations from './components/AdminCancellations';
import UserOrderDetail from './pages/UserOrderDetail';
import UserOrderCancel from './pages/UserOrderCancel';
import PaymentPage from './pages/PaymentPage';
import PaymentSelectionPage from './pages/PaymentSelectionPage';
import ContactPage from './pages/ContactPage';
import EditContactHelp from './components/EditContactHelp';
import UserReviewPage from './pages/UserReviewPage';
import UserOrderRefund from './pages/UserOrderRefund';
import AdminRefunds from './components/AdminRefunds';
import TermsPage from './pages/TermsPage';
import EditTerms from './components/EditTerms';
import AdminProfile from './pages/AdminProfile';
import AdminStock from './components/AdminStock';
 
function App() { 
  const isAuthenticated = () => { 
    return localStorage.getItem('adminToken') !== null; 
  }; 
  const isUserAuthenticated = () => {
    return localStorage.getItem('userToken') !== null;
  };
 
  return ( 
    <Router> 
      <div className="App"> 
        <Routes> 
          <Route path="/admin/login" element={<AdminLogin />} /> 
          <Route path="/admin/register" element={<AdminRegister />} /> 
          {/* Dashboard dapat diakses tanpa login */}
          <Route 
            path="/admin/dashboard" 
            element={isAuthenticated() ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/profile" 
            element={isAuthenticated() ? <AdminProfile /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/pesanan" 
            element={isAuthenticated() ? <AdminOrders /> : <Navigate to="/admin/login" />} 
          />
          {/* Halaman detail pesanan admin */}
          <Route 
            path="/admin/pesanan/detail" 
            element={isAuthenticated() ? <AdminOrderDetail /> : <Navigate to="/admin/login" />} 
          />
          {/* Halaman pembatalan pesanan (lama, untuk satu pesanan) */}
          <Route 
            path="/admin/pesanan/batal" 
            element={isAuthenticated() ? <AdminOrderCancel /> : <Navigate to="/admin/login" />} 
          />
          {/* Halaman daftar pengajuan pembatalan oleh user */}
          <Route 
            path="/admin/pembatalan" 
            element={isAuthenticated() ? <AdminCancellations /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/refund" 
            element={isAuthenticated() ? <AdminRefunds /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/admin/stock" 
            element={isAuthenticated() ? <AdminStock /> : <Navigate to="/admin/login" />} 
          />
          <Route 
            path="/addkatalogproduk" 
            element={ 
              isAuthenticated() ? <AddKatalogProduk /> : <Navigate to="/admin/login" /> 
            } 
          />
          <Route 
            path="/katalogproduk" 
            element={ 
              isAuthenticated() ? <KatalogProdukList /> : <Navigate to="/admin/login" /> 
            } 
          />
          <Route
            path="/admin/kategori"
            element={
              isAuthenticated() ? <AdminCategoryList /> : <Navigate to="/admin/login" />
            }
          />
          <Route
            path="/admin/diskon"
            element={
              isAuthenticated() ? <AdminDiscounts /> : <Navigate to="/admin/login" />
            }
          />
          <Route 
            path="/admin/company-profile/edit"
            element={
              isAuthenticated() ? <EditCompanyProfile /> : <Navigate to="/admin/login" />
            }
          />
          <Route 
            path="/updatekatalogproduk/:id" 
            element={ 
              isAuthenticated() ? <UpdateKatalogProduk /> : <Navigate to="/admin/login" /> 
            } 
          />
          {/* Beranda pengguna sebagai default root */}
          <Route path="/" element={<UserHome />} />
          {/* Opsi rute eksplisit */}
          <Route path="/home" element={<UserHome />} />
          {/* Halaman kategori */}
          <Route path="/kategori/:category" element={<CategoryPage />} />
          {/* Detail produk untuk user */}
          <Route path="/produk/:id" element={isUserAuthenticated() ? <ProductDetail /> : <Navigate to="/login" />} />
          {/* Halaman wishlist produk */}
          <Route path="/wishlist" element={isUserAuthenticated() ? <WishlistPage /> : <Navigate to="/login" />} />
          {/* Keranjang publik menggunakan localStorage */}
          <Route path="/keranjang" element={<CartPage />} />
          {/* Checkout dinamis (lama, tetap ada) */}
          <Route path="/checkout" element={isUserAuthenticated() ? <CheckoutPage /> : <Navigate to="/login" />} />
          {/* Checkout statis tanpa API */}
          <Route path="/checkout-static" element={<CheckoutStaticPage />} />
          {/* Profile user */}
          <Route path="/profile" element={isUserAuthenticated() ? <UserProfile /> : <Navigate to="/login" />} />
          {/* Halaman Company Profile */}
          <Route path="/company-profile" element={<CompanyProfile />} />
          {/* Rute /api-docs dihapus; dokumentasi dipindahkan ke dashboard Laravel */}

          {/* Halaman Contact */}
          <Route path="/contact" element={<ContactPage />} />
          {/* Halaman Terms & Conditions */}
          <Route path="/terms" element={<TermsPage />} />

          {/* Auth user */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/forgot-password" element={<UserForgotPassword />} />
          <Route path="/reset-password" element={<UserResetPassword />} />
          {/* Pesanan user */}
          <Route path="/pesanan" element={isUserAuthenticated() ? <UserOrdersPage /> : <Navigate to="/login" />} />
          <Route 
            path="/pesanan/detail" 
            element={<UserOrderDetail />} 
          />
          <Route 
            path="/pesanan/batal" 
            element={<UserOrderCancel />} 
          />
          <Route 
            path="/pesanan/ulasan" 
            element={isUserAuthenticated() ? <UserReviewPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/pembayaran" 
            element={isUserAuthenticated() ? <PaymentPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/select-payment" 
            element={isUserAuthenticated() ? <PaymentSelectionPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/pesanan/refund" 
            element={isUserAuthenticated() ? <UserOrderRefund /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin/contact/edit"
            element={
              isAuthenticated() ? <EditContactHelp /> : <Navigate to="/admin/login" />
            }
          />
          <Route 
            path="/admin/terms/edit"
            element={
              isAuthenticated() ? <EditTerms /> : <Navigate to="/admin/login" />
            }
          />
        </Routes> 
      </div> 
    </Router> 
  ); 
}

export default App;
