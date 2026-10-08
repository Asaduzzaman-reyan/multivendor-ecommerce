import { useEffect, useState } from 'react';

import { fetchVendorStatistics } from '../../api/vendorApi';

function VendorDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchVendorStatistics().then(setStatistics).catch(() => setError('Unable to load vendor statistics.'));
  }, []);
  return (
    <section className="content-card wide-card">
      <h1>Vendor dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      {statistics && <div className="stats-grid">
        <div><strong>{statistics.productCount}</strong><span>Products</span></div>
        <div><strong>{statistics.orderCount}</strong><span>Orders</span></div>
        <div><strong>{statistics.unitsSold}</strong><span>Units sold</span></div>
        <div><strong>{statistics.grossSales.toLocaleString()} BDT</strong><span>Gross sales</span></div>
      </div>}
    </section>
  );
}

export default VendorDashboard;
