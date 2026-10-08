import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/">MultiVendor</Link>
      <nav aria-label="Main navigation">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        {isAuthenticated ? (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/recommendations">For you</Link>
            <Link to="/wishlist">Wishlist</Link>
            {user.role === 'vendor' && <Link to="/vendor/dashboard">Vendor</Link>}
            {user.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
            <span className="welcome">Hi, {user.name}</span>
            <Link to="/profile">Profile</Link>
            <button type="button" className="link-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
