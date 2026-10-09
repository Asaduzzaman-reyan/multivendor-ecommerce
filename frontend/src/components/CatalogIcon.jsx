const categoryIcons = {
  electronics: '💻',
  fashion: '👕',
  grocery: '🛒',
  beauty: '✨',
  'home & living': '🏠',
  sports: '⚽',
  books: '📚',
  accessories: '🎒',
};

function CatalogIcon({ type, name }) {
  const normalizedName = name.toLowerCase();
  const icon = type === 'category'
    ? categoryIcons[normalizedName] || '▦'
    : name.slice(0, 1).toUpperCase();

  return (
    <span className={`catalog-icon catalog-icon-${type}`} aria-hidden="true">
      {icon}
    </span>
  );
}

export default CatalogIcon;
