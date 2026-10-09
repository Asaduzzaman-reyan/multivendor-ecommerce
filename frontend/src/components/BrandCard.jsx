import CatalogIcon from './CatalogIcon';

function BrandCard({ brand }) {
  return (
    <article className="catalog-card">
      <div className="catalog-card-visual">
        {brand.logo ? <img src={brand.logo} alt="" /> : <CatalogIcon type="brand" name={brand.name} />}
      </div>
      <h3>{brand.name}</h3>
      {brand.description && <p>{brand.description}</p>}
    </article>
  );
}

export default BrandCard;
