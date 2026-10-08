import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { fetchBrands, fetchCategories } from './api/catalogApi';
import { fetchHome, fetchPersonalizedHome } from './api/homeApi';
import BrandCard from './components/BrandCard';
import CategoryCard from './components/CategoryCard';
import ProductSection from './components/ProductSection';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Recommendations from './pages/Recommendations';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorProfile from './pages/vendor/VendorProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminCatalog from './pages/admin/AdminCatalog';
import CategoryProducts from './pages/CategoryProducts';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Register from './pages/Register';
import SearchResults from './pages/SearchResults';
import Wishlist from './pages/Wishlist';

function Home() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const [home, setHome] = useState(null);

  useEffect(() => {
    const homeRequest = localStorage.getItem('auth_token') ? fetchPersonalizedHome : fetchHome;
    Promise.all([fetchCategories(), fetchBrands(), homeRequest()])
      .then(([categoryItems, brandItems, homeData]) => {
        setCategories(categoryItems);
        setBrands(brandItems);
        setHome(homeData);
      })
      .catch(() => setError('Catalog data is temporarily unavailable.'));
  }, []);

  return (
    <section className="content-card">
      <h1>MultiVendor Marketplace</h1>
      <p>Discover products from independent stores.</p>
      <Link className="primary-link" to="/register">Get started</Link>
      {error && <div className="error-message" role="alert">{error}</div>}
      <h2>Categories</h2>
      <div className="catalog-grid">
        {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
      </div>
      <h2>Top brands</h2>
      <div className="catalog-grid">
        {brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
      </div>
      {home && (
        <>
          <ProductSection title="Trending products" products={home.trendingProducts} />
          <ProductSection title="New arrivals" products={home.newArrivals} />
          <ProductSection title="Best sellers" products={home.bestSellingProducts} />
          <ProductSection title="Recommended for you" products={home.recommendedProducts} />
        </>
      )}
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <main>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/category/:categoryId" element={<CategoryProducts />} />
            <Route path="/search" element={<SearchResults />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route element={<ProtectedRoute roles={['vendor']} />}>
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorProducts />} />
                <Route path="/vendor/orders" element={<VendorOrders />} />
                <Route path="/vendor/profile" element={<VendorProfile />} />
              </Route>
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/vendors" element={<AdminVendors />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/catalog" element={<AdminCatalog />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
            </Route>
            </Routes>
          </main>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
