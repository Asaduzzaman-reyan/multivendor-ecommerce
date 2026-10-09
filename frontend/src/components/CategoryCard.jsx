import { Link } from 'react-router-dom';
import CatalogIcon from './CatalogIcon';

function CategoryCard({ category }) {
  return (
    <article className="catalog-card">
      <div className="catalog-card-visual">
        {category.image ? <img src={category.image} alt="" /> : <CatalogIcon type="category" name={category.name} />}
      </div>
      <h3><Link to={`/category/${category.id}`}>{category.name}</Link></h3>
      {category.description && <p>{category.description}</p>}
    </article>
  );
}

export default CategoryCard;
