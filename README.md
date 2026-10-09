# MultiVendor E-commerce Platform

A full-stack multi-vendor marketplace built with React, Express, and SQLite.

## Project structure

- `backend/` - Express REST API, database, authentication, services, and uploads
- `frontend/` - React application and reusable UI modules

## Run the project

Install dependencies in separate terminals:

```powershell
cd D:\multivendor-ecommerce\backend
npm install
npm run db:seed
npm run dev
```

```powershell
cd D:\multivendor-ecommerce\frontend
npm install
npm run dev
```

The backend health endpoint is available at `http://localhost:5000/api/health`.

## Database

Step 2 adds a persistent SQLite database at `backend/database/ecommerce.sqlite`.

```powershell
cd D:\multivendor-ecommerce\backend
npm run db:init
npm run db:seed
```

The seed command creates development accounts using the password `Password123!`:

- Admin: `admin@example.com`
- Vendor: `vendor1@example.com`
- Vendor: `vendor2@example.com`
- Buyer: `buyer@example.com`

## Backend foundation

Step 3 adds the structured Express application in `backend/app.js`, health routes,
JSON request parsing, CORS, disabled `X-Powered-By` headers, 404 handling, and
centralized error responses. Authentication and business routes will be added in
the next implementation steps.

## Step 4: Authentication

Authentication routes are available under `/api/auth`:

- `POST /api/auth/register` - register a buyer or pending vendor
- `POST /api/auth/login` - validate credentials and issue a JWT
- `GET /api/auth/me` - return the authenticated user's profile

Example buyer registration:

```json
{
  "name": "Jane Buyer",
  "phone": "01700000000",
  "email": "jane@example.com",
  "address": "Dhaka",
  "password": "Password123!",
  "role": "buyer"
}
```

Vendor registration additionally requires `storeName` and can include
`storeDescription`. Vendor accounts are created with `pending` approval status.
Admin accounts cannot be created through public registration.

Protected requests must send:

```text
Authorization: Bearer <token>
```

The reusable authentication middleware is in
`backend/middleware/authMiddleware.js`. Role checks are in
`backend/middleware/roleMiddleware.js`, including the approved-vendor guard.

## Step 5: Frontend authentication

The React frontend now includes:

- Axios API client with automatic JWT headers
- Session restoration through `/api/auth/me`
- Buyer and vendor registration forms
- Login and logout
- Protected profile route
- Role-aware authentication foundation
- User-friendly request errors

Frontend routes:

- `/` - marketplace home
- `/login` - login form
- `/register` - buyer/vendor registration form
- `/profile` - authenticated profile page

The token is stored in `localStorage` under `auth_token` for this browser-based
application. The API client removes the session automatically when the backend
returns a 401 response.

## Step 6: Categories and brands

Public catalog endpoints:

- `GET /api/categories`
- `GET /api/brands`

Admin-only catalog management endpoints:

- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/brands`
- `PUT /api/brands/:id`
- `DELETE /api/brands/:id`

Catalog write requests require an admin JWT. Names are validated and must be
unique. Categories or brands that are referenced by products cannot be deleted;
the API returns a conflict response instead of silently removing related data.

The frontend home page now loads categories and brands from the API through
`frontend/src/api/catalogApi.js` and renders them with reusable catalog cards.

## Step 7: Products

Public product endpoints:

- `GET /api/products`
- `GET /api/products/:id`

The listing endpoint supports:

- `q` - searches product name, description, brand, and category
- `categoryId`
- `brandId`
- `minPrice`
- `maxPrice`
- `sort=newest|price_asc|price_desc|popularity|rating`
- `page`
- `limit` (capped at 50)

Vendor endpoints require an approved vendor JWT:

- `GET /api/vendor/products`
- `POST /api/vendor/products`
- `PUT /api/vendor/products/:id`
- `DELETE /api/vendor/products/:id`

New and edited products are submitted as `pending` until an administrator
reviews them. Vendors can only access their own products.

Admin endpoints:

- `GET /api/admin/products`
- `PUT /api/admin/products/:id/status`

The frontend product foundation is available at `/products`, with API helpers
in `frontend/src/api/productApi.js` and reusable cards in
`frontend/src/components/ProductCard.jsx`.

## Step 8: Homepage data

The homepage aggregation endpoint is:

- `GET /api/home` - public homepage data
- `GET /api/home/personalized` - authenticated homepage data

Both return database-backed:

- `categories`
- `topBrands`
- `trendingProducts`
- `newArrivals`
- `bestSellingProducts`
- `recommendedProducts`

Trending products use views and sales, new arrivals use creation time, best
sellers use sales, and recommendations use recent user activity categories
when available. Anonymous users receive a popular-products fallback.

## Step 9: Browsing, search, and category pages

The frontend now provides:

- `/products` - complete product browser
- `/search?q=term` - search results
- `/category/:categoryId` - category-specific products

The reusable browser supports:

- Product-name and keyword search
- Category filtering
- Brand filtering
- Minimum and maximum price
- Newest, price, popularity, and rating sorting
- Server-backed pagination

Filters are represented in the URL query string, so filtered pages can be
shared or refreshed without losing their state. Category cards link directly
to their product pages.

## Step 10: Product details and reviews

Product detail pages are available at `/products/:id`.

The detail API now includes:

- Product and vendor information
- Category and brand
- Stock and pricing
- Average rating and review count
- Product images
- Related products from the same category or brand

Review endpoints:

- `GET /api/products/:productId/reviews`
- `POST /api/products/:productId/reviews`

Review submission requires an authenticated buyer who owns an order containing
the product and whose order status is `delivered`. The request must include the
delivered `orderId`, a rating from 1 to 5, and an optional comment. Duplicate
reviews for the same user, product, and order are rejected.

The details page displays rating distribution, verified reviews, stock status,
related products, and a review form for authenticated users.

## Step 11: Cart

Cart endpoints require authentication:

- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:id`
- `DELETE /api/cart/:id`

The backend:

- Creates one cart per user
- Merges duplicate product additions
- Uses the current effective product price
- Validates requested quantities against live stock
- Calculates item subtotals and cart subtotal
- Records cart activity for recommendations
- Preserves vendor information for multi-vendor carts

The frontend provides a protected `/cart` route with quantity updates, item
removal, stock-aware controls, subtotal display, and an empty-cart state.
Delivery charges are intentionally deferred to checkout.

## Step 12: Checkout preview

Checkout endpoints require authentication:

- `GET /api/checkout`
- `POST /api/checkout/preview`

Checkout supports Inside Dhaka delivery at 80 BDT, Outside Dhaka delivery at
150 BDT, bKash, Nagad, and Cash on Delivery. The preview reloads current cart
prices and stock from SQLite and recalculates the subtotal, delivery charge,
and final amount on the backend.

## Step 13: Simulated payments

The simulated payment endpoint is:

- `POST /api/payments/simulate`

Online payments require a valid Bangladesh mobile number and a transaction ID.
Cash on Delivery does not accept payment credentials and returns a pending
payment status. Online simulations return a paid status and a payment
reference. No real gateway is contacted, no credentials are stored, and no
order is created in this step.

## Step 14: Orders

Order endpoints require authentication:

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

Order placement revalidates the current cart, prices, stock, delivery charge,
and simulated payment details inside one SQLite transaction. It creates one
customer order with vendor-specific `order_items`, reduces stock, increments
sales, records purchase activity, and clears the cart only after every step
succeeds. Buyers can view their order history and complete order details.

## Step 12: Checkout preview

Checkout endpoints require authentication:

- `GET /api/checkout`
- `POST /api/checkout/preview`

The checkout flow supports:

- Inside Dhaka delivery: 80 BDT
- Outside Dhaka delivery: 150 BDT
- bKash
- Nagad
- Cash on Delivery
- Shipping address
- Customer contact summary

The preview endpoint reloads current cart prices and stock from SQLite, then
recalculates subtotal, delivery charge, and final amount on the backend. The
frontend `/checkout` page never treats a client-supplied total as authoritative.
Order placement and simulated payment are intentionally reserved for the next
step.

## Step 15: Vendor dashboard

Approved vendors can use:

- `GET /api/vendor/profile`
- `PUT /api/vendor/profile`
- `GET /api/vendor/products`
- `POST /api/vendor/products`
- `PUT /api/vendor/products/:id`
- `DELETE /api/vendor/products/:id`
- `GET /api/vendor/orders`
- `PUT /api/vendor/orders/:id/status`
- `GET /api/vendor/statistics`

Vendor order results contain only order items belonging to the authenticated
vendor. Status updates support confirmed, processing, shipped, delivered, and
cancelled. The frontend adds vendor dashboard, product, order, and store
profile routes under `/vendor`.

## Step 17: Recommendations

Authenticated recommendations are available at:

- `GET /api/recommendations?limit=8`

The recommendation score combines recent activity with these weights:

- Search: 1
- View: 2
- Cart: 4
- Purchase: 6

Category affinity is prioritized over brand affinity, followed by sales,
ratings, and recency. Authenticated product searches and views, cart additions,
and purchases are recorded in `user_activity`. The frontend provides the
protected `/recommendations` page and the homepage continues to show the
personalized section.

## Step 18: Ranking algorithms

The homepage ranking algorithms are also available as dedicated public APIs:

- `GET /api/home/trending?limit=8`
- `GET /api/home/new-arrivals?limit=8`
- `GET /api/home/best-sellers?limit=8`
- `GET /api/home/top-brands?limit=10`

Trending products combine views, sales, average rating, and a recency boost
for products created within the last 30 days. New arrivals are approved
products created within the last 30 days. Best sellers are ranked by sales,
views, rating, and recency. Top brands are ranked by approved-product sales,
average rating, and product count. Limits are capped at 50 for products and
brands.

## Step 19: Wishlist

Authenticated buyers can save approved products for later:

- `GET /api/wishlist`
- `POST /api/wishlist/:productId`
- `DELETE /api/wishlist/:productId`

The frontend provides the protected `/wishlist` page and wishlist controls
on product detail pages. Wishlist entries are unique per user and product,
and products that are no longer approved or whose vendor is no longer
approved are excluded from the list.

## Step 20: Admin catalog management

Administrators can manage categories and brands from the protected
`/admin/catalog` page. The page supports creating, editing, and deleting
catalog records through the existing admin-only APIs. Deletion conflicts from
products that still reference a category or brand are shown to the admin
instead of being silently ignored.

## Step 21: Vendor product management

Approved vendors can manage their product catalog from `/vendor/products`.
The page supports adding, editing, and deleting products, including category,
brand, price, discount price, stock, description, and image URL fields.
Created or edited products are submitted with `pending` status for admin
approval. Vendor product APIs remain scoped to the authenticated vendor.

## Step 22: Order status workflow

Order statuses now follow a controlled lifecycle:

```text
pending -> confirmed -> processing -> shipped -> delivered
    \          \            \ 
     cancelled  cancelled    cancelled
```

Delivered and cancelled orders are terminal. Vendor and admin APIs reject
skipped, reversed, or terminal-state transitions with a conflict response,
and the vendor/admin order pages only show valid next statuses.

## Step 23: Product detail cart actions

Authenticated buyers can add products to their cart directly from
`/products/:id`. The product detail page supports quantity selection bounded
by current stock, shows an in-progress state while the request is submitted,
and displays backend stock or availability errors. Anonymous visitors receive
a login prompt instead.

## Step 24: Buyer order progress

Order detail pages now display a buyer-facing progress timeline for pending,
confirmed, processing, shipped, and delivered orders. Cancelled orders show a
dedicated cancellation state. The timeline is responsive and collapses into a
vertical layout on narrow screens.

## Step 25: Buyer order cancellation

Buyers can cancel their own orders while the order is still `pending` from
the order detail page. Cancellation is performed transactionally: the order
becomes `cancelled`, purchased stock is restored, and sales counts are
reversed. Confirmed, processing, shipped, delivered, and already cancelled
orders cannot be cancelled by the buyer.

## Vendor product creation

Approved vendors can open **Add new product** from the vendor dashboard,
vendor navigation, or the products page. The form captures the product name,
description, category, optional brand, regular price, discount price, stock,
and image URL. New products are submitted for admin approval before becoming
visible in the public catalog.

## Step 26: Checkout completion

The checkout page now completes the simulated payment and order flow without
runtime handler errors. Buyers can simulate payment, review the successful
payment state, and place the order from the same page. Payment and order
requests show independent loading states, prevent duplicate submissions, and
navigate to the new order detail page after successful placement.

## Catalog card icons

Category and top-brand cards display styled icons when no custom category
image or brand logo is available. Category icons are selected by category
type, while brand cards use a branded initial mark. Existing uploaded images
and logos continue to take priority.

Vendors can select an existing brand or choose **Create custom brand** while
adding or editing a product. Custom brands are stored in the shared brands
catalog and attached to the product. The product is submitted for approval;
once an admin approves it, it appears in the public product list and can be
added to a buyer cart normally.

Vendor product forms now support direct image uploads instead of requiring an
image URL. Accepted formats are JPEG, PNG, WEBP, and GIF, with a 5 MB limit.
Uploaded images are stored under `backend/uploads/products` and served through
the `/uploads/products/...` path.

## Step 16: Admin dashboard

Admin-only APIs cover:

- Platform statistics
- User listing, disable/enable, and deletion
- Vendor listing and approval/rejection
- Product listing and approval/rejection
- Order listing and status updates
- Category and brand management

The frontend adds protected routes under `/admin` for the dashboard, users,
vendors, products, and orders. Admin authorization is enforced by the backend,
not only by frontend route visibility.
