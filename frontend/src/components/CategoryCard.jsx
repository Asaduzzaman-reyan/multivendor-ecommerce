import { Link } from 'react-router-dom';

function CategoryCard({ category }) {
  return (
    <article className="catalog-card">
      {category.image && <img src={category.image} alt="" />}
      <h3><Link to={`/category/${category.id}`}>{category.name}</Link></h3>
      {category.description && <p>{category.description}</p>}
    </article>
  );
}

export default CategoryCard;
