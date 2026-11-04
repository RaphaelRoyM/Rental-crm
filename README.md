# Equipment & Tool Rental CRM

Equipment and tool rental CRM with inventory management, customer management, rental lifecycle handling, payments, maintenance tracking, reporting, and separate Admin and Operations portals.

## Task coverage

### Admin Portal

The Admin Portal is available at `/admin` for users with the `admin` role.

- Dashboard with rental, revenue, inventory, overdue, and payment summaries
- Product catalogue management
  - Tool types, categories, brands, models, rates, deposits, and specifications
  - Individual asset records with asset IDs, serial numbers, condition, status, location, and warranty details
  - Asset rental history and availability lookup
- Customer management
  - Customer profiles, contact information, ID proof details, rental history, and pending dues
  - Search and paginated customer list
- Rental management
  - Create reservations with selected assets
  - Dispatch reservations
  - Process returns
  - Automatic late-fee calculation
  - Per-asset damage inspection and damage charges
  - Rental cancellation
  - Downloadable customer bills after dispatch and after return
- Payment and deposit management
  - Rent, late-fee, damage-fee, deposit, deposit refund, and deposit deduction transactions
  - Cash, card, bank transfer, and online payment methods
- Staff management
  - Create, edit, deactivate, delete, and reset staff passwords
- Supplier management
- Maintenance management and asset maintenance history
- Reports
  - Revenue
  - Product utilization
  - Overdue rentals
  - Top customers
- Rental export to Excel

### Operations / Front Desk Portal

The Operations Portal is available at `/ops` for authenticated users.

- Operations dashboard
- Search and register customers
- Check available assets for a selected rental period
- Create rental reservations
- Dispatch rentals and mark equipment as rented
- Process returns and damage inspection
- Automatically calculate late fees
- Record payments and deposits
- View rental financial summaries
- Download customer bills after dispatch and after return
- Search, filter, paginate, and export rental records

### Mobile Admin UI

The Admin Portal is implemented as a responsive, mobile-friendly web layout. The sidebar collapses into a mobile menu and the pages use responsive tables, cards, forms, and layouts.

After starting the application and signing in with an admin account, open:

```text
http://localhost:5173/admin
```

This is the URL for testing the complete Admin Portal in a mobile browser or browser device emulation mode. No separate APK is required.

## Rental lifecycle

1. Create a rental reservation.
2. The reservation starts with `reserved` status and assets are marked `reserved`.
3. Dispatch the rental.
4. The rental changes to `active` and assets change to `rented`.
5. Add rent, deposit, or other payment transactions as needed.
6. Process the return.
7. The system calculates the final rental duration, late fees, damage fees, and total amount.
8. Assets change back to `available`.
9. Download the bill from the rental detail page for the customer.

The downloaded bill contains customer information, rental dates, rented assets, rates, rental days, subtotal, late fees, damage fees, total bill, payments, deposit activity, and outstanding balance. It downloads as a formatted HTML document that can be opened or printed/saved as PDF from the browser.

## Technology stack

- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React
- Recharts
- XLSX export
- Node.js and Express
- PostgreSQL / Supabase PostgreSQL
- JWT authentication
- bcryptjs password hashing

## Project structure

```text
client/
  src/
    components/
    context/
    lib/
    pages/
      admin/
      auth/
      ops/
server/
  config/
  database/
  middleware/
  routes/
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL database, preferably Supabase PostgreSQL

## Setup

### 1. Install client dependencies

```bash
cd client
npm install
```

### 2. Install server dependencies

```bash
cd ../server
npm install
```

### 3. Configure the database

Copy the server environment template:

```bash
cd server
copy .env.example .env
```

Set the following values in `server/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres
JWT_SECRET=use_a_long_random_secret
PORT=5000
```

Run [`server/database/schema.sql`](./server/database/schema.sql) against the PostgreSQL database before using the application.

### 4. Start the API server

```bash
cd server
npm run dev
```

The API runs at `http://localhost:5000`.

### 5. Start the client

In another terminal:

```bash
cd client
npm run dev
```

The client runs at `http://localhost:5173`.

Vite proxies `/api` requests to `http://localhost:5000`.

## Authentication and access control

- `POST /api/auth/login` authenticates users and returns a JWT.
- Admin routes require an authenticated user with the `admin` role.
- Operations routes require any authenticated user.
- Admin-only server operations include product, asset, category, maintenance, supplier, and staff administration.
- Passwords are stored as bcrypt hashes.

## Main application URLs

| Area | URL |
|---|---|
| Login | `/login` |
| Admin dashboard | `/admin` |
| Admin products/assets | `/admin/products` |
| Admin customers | `/admin/customers` |
| Admin rentals | `/admin/rentals` |
| Admin payments | `/admin/payments` |
| Admin staff | `/admin/staff` |
| Admin suppliers | `/admin/suppliers` |
| Admin maintenance | `/admin/maintenance` |
| Admin reports | `/admin/reports` |
| Operations dashboard | `/ops` |
| Operations customers | `/ops/customers` |
| Operations rentals | `/ops/rentals` |
| Operations payments | `/ops/payments` |

## API areas

The Express API is mounted under `/api`:

- `/api/auth`
- `/api/users`
- `/api/customers`
- `/api/suppliers`
- `/api/categories`
- `/api/tool-types`
- `/api/assets`
- `/api/rentals`
- `/api/payments`
- `/api/maintenance`
- `/api/damage`
- `/api/reports`

## Validation commands

```bash
cd client
npm run build
npm run lint
```

```bash
cd server
node --check index.js
```

The server package currently does not include an automated test suite.
