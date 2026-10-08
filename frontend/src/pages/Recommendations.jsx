import { useEffect, useState } from 'react';

import { fetchRecommendations } from '../api/recommendationApi';
import ProductCard from '../components/ProductCard';

function Recommendations() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendations()
      .then(setData)
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load recommendations.'));
  }, []);

  return (
    <section className="content-card wide-card">
      <h1>Recommended for you</h1>
      {error && <div className="error-message" role="alert">{error}</div>}
      {data && <p className="muted-text">{data.basedOnActivity ? `Based on ${data.activityCount} recent activities` : 'Based on popular products'}</p>}
      <div className="product-grid">
        {data?.recommendations.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}

export default Recommendations;
