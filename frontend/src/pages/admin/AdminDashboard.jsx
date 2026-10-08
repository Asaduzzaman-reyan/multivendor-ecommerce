import { useEffect, useState } from 'react';

import { fetchAdminStatistics } from '../../api/adminApi';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { fetchAdminStatistics().then(setStatistics).catch(() => setError('Unable to load admin statistics.')); }, []);
  return <section className="content-card wide-card"><h1>Admin dashboard</h1><p><Link to="/admin/catalog">Manage categories and brands</Link></p>{error && <div className="error-message">{error}</div>}{statistics && <div className="stats-grid">{Object.entries(statistics).map(([key, value]) => <div key={key}><strong>{typeof value === 'number' ? value.toLocaleString() : value}</strong><span>{key}</span></div>)}</div>}</section>;
}

export default AdminDashboard;
