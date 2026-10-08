function BrandCard({ brand }) {
  return (
    <article className="catalog-card">
      {brand.logo && <img src={brand.logo} alt="" />}
      <h3>{brand.name}</h3>
      {brand.description && <p>{brand.description}</p>}
    </article>
  );
}

export default BrandCard;
