import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  password: '',
  confirmPassword: '',
  role: 'buyer',
  storeName: '',
  storeDescription: '',
};

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to create your account. Please try again.';
}

function Register() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(form);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Create an account</h1>
      <p>Join buyers and vendors on the marketplace.</p>
      {error && <div className="error-message" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" value={form.address} onChange={handleChange} required />
        <label htmlFor="role">Account type</label>
        <select id="role" name="role" value={form.role} onChange={handleChange}>
          <option value="buyer">Buyer</option>
          <option value="vendor">Vendor</option>
        </select>
        {form.role === 'vendor' && (
          <>
            <label htmlFor="storeName">Store name</label>
            <input id="storeName" name="storeName" value={form.storeName} onChange={handleChange} required />
            <label htmlFor="storeDescription">Store description</label>
            <textarea id="storeDescription" name="storeDescription" value={form.storeDescription} onChange={handleChange} />
          </>
        )}
        <label htmlFor="register-password">Password</label>
        <input id="register-password" name="password" type="password" minLength="8" value={form.password} onChange={handleChange} required />
        <label htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" minLength="8" value={form.confirmPassword} onChange={handleChange} required />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p>Already registered? <Link to="/login">Sign in</Link></p>
    </section>
  );
}

export default Register;
