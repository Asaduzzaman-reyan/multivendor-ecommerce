import { useParams } from 'react-router-dom';

import ProductBrowser from '../components/ProductBrowser';

function CategoryProducts() {
  const { categoryId } = useParams();
  return <ProductBrowser title="Category products" fixedCategoryId={categoryId} />;
}

export default CategoryProducts;
