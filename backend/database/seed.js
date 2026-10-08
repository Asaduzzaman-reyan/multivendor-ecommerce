require('dotenv').config();

const bcrypt = require('bcryptjs');
const { getDatabase, initializeDatabase } = require('../config/database');

initializeDatabase();

const database = getDatabase();

if (process.argv.includes('--schema-only')) {
  console.log('Database schema initialized.');
  process.exit(0);
}

function seed() {
  database.exec('BEGIN');

  try {
  const password = bcrypt.hashSync('Password123!', 10);
  const insertUser = database.prepare(
    'INSERT OR IGNORE INTO users (name, phone, email, address, password, role) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertVendor = database.prepare(
    'INSERT OR IGNORE INTO vendors (user_id, store_name, store_description, status) VALUES (?, ?, ?, ?)',
  );
  const insertCategory = database.prepare(
    'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
  );
  const insertBrand = database.prepare(
    'INSERT OR IGNORE INTO brands (name, description) VALUES (?, ?)',
  );
  const insertProduct = database.prepare(
    `INSERT OR IGNORE INTO products
      (vendor_id, category_id, brand_id, name, description, price, discount_price, stock, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
  );

  insertUser.run('Platform Admin', '01700000000', 'admin@example.com', 'Dhaka', password, 'admin');
  insertUser.run('Demo Vendor One', '01700000001', 'vendor1@example.com', 'Dhaka', password, 'vendor');
  insertUser.run('Demo Vendor Two', '01700000002', 'vendor2@example.com', 'Chattogram', password, 'vendor');
  insertUser.run('Demo Buyer', '01700000003', 'buyer@example.com', 'Dhaka', password, 'buyer');

  const vendorOne = database.prepare('SELECT id FROM users WHERE email = ?').get('vendor1@example.com');
  const vendorTwo = database.prepare('SELECT id FROM users WHERE email = ?').get('vendor2@example.com');
  insertVendor.run(vendorOne.id, 'Tech Horizon', 'Electronics and accessories', 'approved');
  insertVendor.run(vendorTwo.id, 'Urban Living', 'Everyday lifestyle products', 'approved');

  const categories = [
    ['Electronics', 'Devices and electronic accessories'],
    ['Fashion', 'Clothing and fashion accessories'],
    ['Grocery', 'Daily grocery essentials'],
    ['Beauty', 'Beauty and personal care'],
    ['Home & Living', 'Furniture and home essentials'],
    ['Sports', 'Sports and fitness equipment'],
    ['Books', 'Books and learning materials'],
    ['Accessories', 'Useful accessories for everyday life'],
  ];
  categories.forEach((category) => insertCategory.run(...category));

  const brands = [
    ['NovaTech', 'Reliable consumer electronics'],
    ['SoundPeak', 'Audio products for everyday listening'],
    ['UrbanWear', 'Modern clothing and apparel'],
    ['FreshChoice', 'Quality grocery products'],
    ['GlowLab', 'Personal care and beauty products'],
    ['HomeNest', 'Comfortable home products'],
    ['FitCore', 'Fitness and sports gear'],
    ['ReadMore', 'Books for every reader'],
    ['CarryPro', 'Bags and travel accessories'],
    ['DailyBasics', 'Practical everyday essentials'],
  ];
  brands.forEach((brand) => insertBrand.run(...brand));

  const categoryId = (name) => database.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;
  const brandId = (name) => database.prepare('SELECT id FROM brands WHERE name = ?').get(name).id;
  const vendorId = (storeName) => database.prepare('SELECT id FROM vendors WHERE store_name = ?').get(storeName).id;

  insertProduct.run(vendorId('Tech Horizon'), categoryId('Electronics'), brandId('NovaTech'), 'NovaTech Wireless Headphones', 'Comfortable wireless headphones with clear sound.', 3200, 2799, 40);
  insertProduct.run(vendorId('Tech Horizon'), categoryId('Electronics'), brandId('SoundPeak'), 'SoundPeak Bluetooth Speaker', 'Portable speaker with long battery life.', 2400, 1999, 30);
  insertProduct.run(vendorId('Urban Living'), categoryId('Home & Living'), brandId('HomeNest'), 'HomeNest Desk Lamp', 'Adjustable LED desk lamp for study and work.', 1800, 1499, 25);
    insertProduct.run(vendorId('Urban Living'), categoryId('Sports'), brandId('FitCore'), 'FitCore Running Shoes', 'Lightweight running shoes with breathable mesh.', 4500, 3899, 20);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

seed();
console.log(`Database seeded at ${require('../config/database').databasePath}`);
