# 🏡 RentLux — Complete Backend Build Prompt (Opus-Grade)
## Full-Stack South India Property Marketplace Platform

---

> **Purpose of this document:** Hand this entire file to Claude Opus (or any capable LLM) as a system/context prompt. It contains every architectural decision, schema, API contract, tech stack choice, dataset strategy, phase plan, and upgrade roadmap needed to build the RentLux backend from scratch — end-to-end, A to Z.

---

## 📌 PROJECT OVERVIEW

**RentLux** is a premium dark-themed property rental marketplace targeting **South India** (initially Hyderabad + Vijayawada, expanding to Bangalore, Chennai, Vizag, Coimbatore). It connects three roles:

| Role | Core Job |
|------|----------|
| **Tenant** | Search properties, apply for rent, sign agreements |
| **Owner** | List properties, review applications, accept/reject, sign agreements |
| **Admin** | System oversight, user/property management, analytics |

The frontend already exists (dark glassmorphism, Node.js/Express static serving). **This prompt is exclusively for building the backend.**

### What the frontend already has:
- `frontend/index.html` — Landing page with login/register modal
- `frontend/tenant/dashboard.html` — Tenant property search + application flow
- `frontend/owner/dashboard.html` — Owner listing management + application review
- `frontend/admin/dashboard.html` — System stats, user/property management
- `frontend/css/theme.css` — Complete dark luxury design system
- `frontend/js/api.js` — All API call functions already wired
- `frontend/js/auth.js` — JWT storage + role-redirect helpers
- `frontend/js/chatbot.js` — Floating AI chat widget

### What needs to be built (backend):
Everything in `backend/` — server, routes, controllers, database, utils, data pipeline, AI features, and all integrations.

---

## 🗂️ FULL DIRECTORY STRUCTURE (Target)

```
rentlux/
├── backend/
│   ├── server.js                        ← Express entry point
│   ├── .env                             ← Secrets (never commit)
│   ├── .env.example
│   ├── package.json
│   │
│   ├── database/
│   │   ├── db.js                        ← MSSQL pool + schema init
│   │   └── schema.sql                   ← Manual DDL reference
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── properties.js
│   │   ├── tenant.js
│   │   ├── owner.js
│   │   ├── admin.js
│   │   ├── agreements.js
│   │   ├── chat.js
│   │   └── users.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── propertyController.js
│   │   ├── tenantController.js
│   │   ├── ownerController.js
│   │   ├── adminController.js
│   │   ├── agreementController.js
│   │   ├── chatController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── auth.js                      ← JWT protect + requireRole
│   │   ├── rateLimiter.js               ← express-rate-limit configs
│   │   ├── validator.js                 ← express-validator schemas
│   │   └── errorHandler.js             ← Global error middleware
│   │
│   ├── utils/
│   │   ├── dataStore.js                 ← JSON dataset loader + cache
│   │   ├── normalizer.js                ← Raw Apify data cleaner
│   │   ├── filter.js                    ← Property search + pagination
│   │   ├── imageDownloader.js           ← Batch image download script
│   │   └── seedAdmin.js                 ← One-time admin seeder
│   │
│   └── data/
│       ├── hyderabad.json               ← Raw/scraped Hyderabad data
│       ├── vijayawada.json              ← Raw/scraped Vijayawada data
│       ├── bangalore.json               ← Phase 2 expansion
│       ├── chennai.json                 ← Phase 2 expansion
│       └── users.json                   ← Auto-created on first register
│
└── frontend/                            ← Already built (do not modify structure)
    ├── index.html
    ├── css/theme.css
    ├── js/
    │   ├── api.js
    │   ├── auth.js
    │   └── chatbot.js
    ├── tenant/dashboard.html
    ├── owner/dashboard.html
    └── admin/dashboard.html
```

---

## 🛠️ TECH STACK

### Core Runtime
| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Runtime | Node.js | 20 LTS | Stable, widely hosted |
| Framework | Express.js | 4.x | Minimal, fast, flexible |
| Database | Microsoft SQL Server | 2019/2022 | Already configured in project |
| ORM/Driver | mssql (node-mssql) | 10.x | Native MSSQL, no ORM bloat |
| Auth | jsonwebtoken + bcryptjs | Latest | Industry standard JWT |

### AI / ML Layer
| Service | Use Case | Provider |
|---------|----------|----------|
| Chat assistant | Property Q&A, process guidance | Groq (llama3-8b-8192) — free tier |
| Agreement generation | AI-drafted rental contracts | Groq (llama3-8b-8192) |
| Recommendation engine | Similar properties | Custom cosine similarity (in-memory) |
| Semantic search | NLP property search | Optional: Groq embeddings |

### Supporting Libraries
```json
{
  "express": "^4.18.2",
  "mssql": "^10.0.4",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "uuid": "^9.0.0",
  "axios": "^1.6.2",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "express-validator": "^7.0.1",
  "morgan": "^1.10.0",
  "compression": "^1.7.4",
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.32.6",
  "node-cron": "^3.0.3",
  "nodemailer": "^6.9.7"
}
```

### Dev Dependencies
```json
{
  "nodemon": "^3.0.2",
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "eslint": "^8.56.0"
}
```

---

## 🗄️ DATABASE SCHEMA (Microsoft SQL Server)

### Full DDL

```sql
-- ── Users
CREATE TABLE Users (
  id            VARCHAR(50)   PRIMARY KEY,
  name          NVARCHAR(100) NOT NULL,
  email         NVARCHAR(100) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  role          NVARCHAR(20)  NOT NULL DEFAULT 'tenant', -- tenant|owner|admin
  phone         NVARCHAR(20),
  avatar_url    NVARCHAR(500),
  is_verified   BIT           DEFAULT 0,
  is_active     BIT           DEFAULT 1,
  created_at    DATETIME2     DEFAULT GETDATE(),
  updated_at    DATETIME2     DEFAULT GETDATE()
);

-- ── Owner-posted DB Properties
CREATE TABLE Properties (
  id            VARCHAR(50)    PRIMARY KEY,
  owner_id      VARCHAR(50)    NOT NULL REFERENCES Users(id),
  title         NVARCHAR(200)  NOT NULL,
  city          NVARCHAR(100)  NOT NULL,
  location      NVARCHAR(200),
  price         DECIMAL(18,2)  NOT NULL,
  bhk           INT,
  type          NVARCHAR(50)   DEFAULT 'Apartment', -- Apartment|Villa|House|Plot|Office|Shop|PG
  purpose       NVARCHAR(20)   DEFAULT 'rent',       -- rent|sale|pg
  furnishing    NVARCHAR(30),                        -- furnished|semi-furnished|unfurnished
  area_sqft     DECIMAL(10,2),
  description   NVARCHAR(MAX),
  amenities     NVARCHAR(MAX),                       -- JSON array ["Parking","Gym",...]
  images        NVARCHAR(MAX),                       -- JSON array of URLs
  status        NVARCHAR(20)   DEFAULT 'available',  -- available|rented|sold|inactive
  is_featured   BIT            DEFAULT 0,
  view_count    INT            DEFAULT 0,
  created_at    DATETIME2      DEFAULT GETDATE(),
  updated_at    DATETIME2      DEFAULT GETDATE()
);

-- ── Tenant Applications
CREATE TABLE Applications (
  id            VARCHAR(50)  PRIMARY KEY,
  tenant_id     VARCHAR(50)  NOT NULL REFERENCES Users(id),
  property_id   VARCHAR(50)  NOT NULL REFERENCES Properties(id),
  message       NVARCHAR(MAX),
  status        NVARCHAR(20) DEFAULT 'pending', -- pending|accepted|rejected|withdrawn
  applied_at    DATETIME2    DEFAULT GETDATE(),
  resolved_at   DATETIME2
);

-- ── Rental Agreements
CREATE TABLE Agreements (
  id             VARCHAR(50)   PRIMARY KEY,
  application_id VARCHAR(50)   NOT NULL REFERENCES Applications(id),
  terms          NVARCHAR(MAX) NOT NULL,
  generated_at   DATETIME2     DEFAULT GETDATE(),
  signed_tenant  BIT           DEFAULT 0,
  signed_owner   BIT           DEFAULT 0,
  signed_tenant_at DATETIME2,
  signed_owner_at  DATETIME2
);

-- ── Saved/Wishlist Properties (tenant)
CREATE TABLE SavedProperties (
  id          VARCHAR(50)  PRIMARY KEY DEFAULT NEWID(),
  user_id     VARCHAR(50)  NOT NULL REFERENCES Users(id),
  property_id VARCHAR(50)  NOT NULL,  -- can be JSON dataset id OR DB id
  saved_at    DATETIME2    DEFAULT GETDATE(),
  CONSTRAINT UQ_Saved UNIQUE (user_id, property_id)
);

-- ── Property Reviews (tenant post-rental)
CREATE TABLE Reviews (
  id          VARCHAR(50)   PRIMARY KEY,
  property_id VARCHAR(50)   NOT NULL,
  reviewer_id VARCHAR(50)   NOT NULL REFERENCES Users(id),
  rating      TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     NVARCHAR(MAX),
  created_at  DATETIME2     DEFAULT GETDATE()
);

-- ── Notifications
CREATE TABLE Notifications (
  id          VARCHAR(50)   PRIMARY KEY,
  user_id     VARCHAR(50)   NOT NULL REFERENCES Users(id),
  title       NVARCHAR(200) NOT NULL,
  message     NVARCHAR(MAX),
  type        NVARCHAR(50),  -- application_update|agreement_ready|new_applicant
  is_read     BIT           DEFAULT 0,
  created_at  DATETIME2     DEFAULT GETDATE()
);

-- ── Indexes
CREATE INDEX IX_Properties_Owner   ON Properties   (owner_id);
CREATE INDEX IX_Properties_City    ON Properties   (city);
CREATE INDEX IX_Properties_Status  ON Properties   (status);
CREATE INDEX IX_Applications_Tenant    ON Applications (tenant_id);
CREATE INDEX IX_Applications_Property ON Applications (property_id);
CREATE INDEX IX_Applications_Status   ON Applications (status);
CREATE INDEX IX_Notifications_User    ON Notifications (user_id, is_read);
CREATE INDEX IX_SavedProperties_User  ON SavedProperties (user_id);
```

---

## 📡 COMPLETE API CONTRACT

### Base URL: `http://localhost:5000/api`

### Authentication Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

### 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register` | None | `{name, email, password, role}` | `{token, user}` |
| POST | `/auth/login` | None | `{email, password}` | `{token, user}` |
| GET | `/auth/me` | JWT | — | `{user}` |
| POST | `/auth/forgot-password` | None | `{email}` | `{message}` |
| POST | `/auth/reset-password` | None | `{token, newPassword}` | `{message}` |
| PUT | `/auth/change-password` | JWT | `{oldPassword, newPassword}` | `{message}` |

**Register body validation:**
- `name`: 2–100 chars
- `email`: valid email format
- `password`: min 6 chars
- `role`: must be `tenant` or `owner` (admin created only via seeder)

---

### 🏠 Public Properties (`/api/properties`)

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|-------------|-------------|
| GET | `/properties` | None | See filters below | Paginated property list |
| GET | `/properties/stats` | None | — | City/type breakdown |
| GET | `/properties/featured` | None | `limit` | Featured listings |
| GET | `/properties/:id` | None | — | Single property detail |
| GET | `/properties/similar/:id` | None | `limit` | Similar by city+price |

**Filter Query Parameters:**
```
?city=Hyderabad          Strict match (Hyderabad|Vijayawada|Bangalore|Chennai)
&bhk=2                   BHK count (1|2|3|4)
&type=Apartment          Property type
&purpose=rent            rent|sale|pg
&furnishing=furnished    furnished|semi-furnished|unfurnished
&minPrice=500000         Minimum price (in ₹)
&maxPrice=5000000        Maximum price (in ₹)
&search=2BHK Hyderabad   Smart full-text search
&page=1                  Page number (default: 1)
&limit=12                Results per page (default: 12, max: 50)
&sortBy=price_asc        price_asc|price_desc|newest|oldest
```

**Sample response:**
```json
{
  "success": true,
  "data": [ { "id": "...", "title": "...", "price": 2500000, ... } ],
  "total": 450,
  "page": 1,
  "limit": 12,
  "totalPages": 38
}
```

---

### 👤 Tenant Routes (`/api/tenant`) — Role: tenant

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| POST | `/tenant/applications` | `{property_id, message}` | Submit application |
| GET | `/tenant/applications` | — | All my applications |
| DELETE | `/tenant/applications/:id` | — | Withdraw pending app |
| GET | `/tenant/saved` | — | Wishlist properties |
| POST | `/tenant/saved` | `{property_id}` | Save property |
| DELETE | `/tenant/saved/:property_id` | — | Unsave property |
| GET | `/tenant/notifications` | — | My notifications |
| PUT | `/tenant/notifications/:id/read` | — | Mark as read |
| POST | `/tenant/reviews` | `{property_id, rating, comment}` | Post a review |

---

### 🏘️ Owner Routes (`/api/owner`) — Role: owner

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/owner/properties` | `{title, city, price, ...}` | Create listing |
| GET | `/owner/properties` | `?page&limit` | My listings |
| GET | `/owner/properties/:id` | — | Single listing detail |
| PUT | `/owner/properties/:id` | `{title, price, ...}` | Update listing |
| DELETE | `/owner/properties/:id` | — | Delete listing |
| GET | `/owner/applications` | `?status&page` | All applications |
| PUT | `/owner/applications/:id/accept` | — | Accept application |
| PUT | `/owner/applications/:id/reject` | `{reason?}` | Reject application |
| GET | `/owner/stats` | — | Dashboard stats |

**Create Property body:**
```json
{
  "title": "Spacious 3BHK in Jubilee Hills",
  "city": "Hyderabad",
  "location": "Jubilee Hills, Road No. 36",
  "price": 35000,
  "bhk": 3,
  "type": "Apartment",
  "purpose": "rent",
  "furnishing": "semi-furnished",
  "area_sqft": 1800,
  "description": "...",
  "amenities": ["Parking", "Gym", "Swimming Pool", "24hr Security"],
  "images": ["https://...", "https://..."]
}
```

---

### 📜 Agreements (`/api/agreements`) — Role: tenant|owner|admin

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/agreements` | `{application_id}` | Generate AI agreement |
| GET | `/agreements/:applicationId` | — | Fetch agreement |
| PUT | `/agreements/:id/sign` | — | Sign (based on JWT role) |

---

### 🛡️ Admin Routes (`/api/admin`) — Role: admin

| Method | Endpoint | Query | Description |
|--------|----------|-------|-------------|
| GET | `/admin/stats` | — | Full system stats |
| GET | `/admin/users` | `?page&limit&role` | All users (paginated) |
| DELETE | `/admin/users/:id` | — | Delete user (cascade) |
| GET | `/admin/properties` | `?page&limit` | DB properties only |
| DELETE | `/admin/properties/:id` | — | Delete property (cascade) |
| GET | `/admin/applications` | `?page&limit&status` | All applications |
| PUT | `/admin/users/:id/role` | `{role}` | Change user role |
| GET | `/admin/analytics` | `?period` | Detailed analytics |

---

### 💬 Chat (`/api/chat`) — Role: any authenticated

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/chat` | `{message, context}` | AI assistant response |

---

## 🌍 SOUTH INDIA DATASET STRATEGY

### Cities and Data Sources

The project uses real property data scraped from Indian real-estate portals via Apify. The data normalizer already handles this format. Here's the dataset expansion plan:

#### Phase 1 (Already Implemented)
| City | File | Properties (approx) |
|------|------|-------------------|
| Hyderabad | `data/hyderabad.json` | 300–500 |
| Vijayawada | `data/vijayawada.json` | 100–200 |

#### Phase 2 (Backend must support)
| City | File | Target Properties |
|------|------|-----------------|
| Bangalore | `data/bangalore.json` | 400–600 |
| Chennai | `data/chennai.json` | 300–400 |
| Vizag (Visakhapatnam) | `data/vizag.json` | 150–200 |
| Coimbatore | `data/coimbatore.json` | 100–150 |
| Kochi | `data/kochi.json` | 100–150 |

#### How to Acquire Data (Apify Approach)
Use **Apify's MagicScraper** or **99acres.com scraper** actor:

```javascript
// Apify Actor: apify/web-scraper or magicscraper
// Target sites:
//   - https://www.99acres.com/property-for-rent-in-CITYNAME-ffid
//   - https://www.magicbricks.com/property-for-rent/residential-real-estate
//   - https://housing.com/rent/flats-in-CITYNAME

// Apify input config:
{
  "startUrls": [
    { "url": "https://www.99acres.com/property-for-rent-in-hyderabad-ffid" }
  ],
  "maxRequestsPerCrawl": 500,
  "pageFunction": "// Extract: name, price, address, images, BHK, type, features"
}
```

**Expected Raw Record Format** (what normalizer.js already handles):
```json
{
  "id": "12345678",
  "name": "Modi Sterling Homes",
  "min_price": 7470000,
  "max_price": 12500000,
  "price_display_value": "₹74.70 L - ₹1.25 Cr",
  "address": {
    "address": "Gundlapochampalli, Hyderabad",
    "long_address": "Gundlapochampalli, Medchal-Malkajgiri, Hyderabad, Telangana",
    "detailed_property_address": [
      { "id": "locality", "val": "Gundlapochampalli" },
      { "id": "city", "val": "Hyderabad" }
    ]
  },
  "image_url": "https://img.99acres.com/...",
  "property_information": {
    "bedrooms": "3",
    "bathrooms": "3",
    "area": "2377 sq.ft"
  },
  "features": [
    { "id": "configs", "label": "Configurations", "description": "3 BHK Apartment" }
  ],
  "details": {
    "images": [
      { "category": "exterior", "images": [ { "src": "https://..." } ] }
    ]
  },
  "description": "<p>Premium residential complex...</p>",
  "current_possession_status": "Ready to Move",
  "posted_date": "2024-01-15"
}
```

#### Normalizer Output (Cleaned Format)
```json
{
  "id": "12345678",
  "title": "Modi Sterling Homes",
  "price": 7470000,
  "priceDisplay": "₹74.70 L",
  "city": "Hyderabad",
  "location": "Gundlapochampalli, Hyderabad",
  "bhk": 3,
  "type": "Apartment",
  "image": "https://img.99acres.com/...",
  "images": ["https://...", "https://..."],
  "description": "Premium residential complex...",
  "area": "2377 sq.ft",
  "bedrooms": 3,
  "bathrooms": 3,
  "possessionStatus": "Ready to Move"
}
```

#### DataStore Architecture
```javascript
// utils/dataStore.js — In-memory cache strategy
// Properties load ONCE at startup, cache in RAM
// Lookup is O(1) for ID, O(n) for filters
// Total memory: ~300KB for 500 properties (negligible)

// Hybrid Query Flow:
// GET /api/properties → merges JSON dataset + DB properties
// JSON props: scraped data (read-only, no applications)
// DB props: owner-posted (full CRUD, applications enabled)

// Key rule: Tenants can only APPLY to DB-listed properties
// JSON properties are for browse/discovery only
```

---

## 🔧 SERVER CONFIGURATION (`server.js`)

```javascript
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const compression = require('compression');

const { initializeSchema } = require('./database/db');
const { loadData }         = require('./utils/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/properties',  require('./routes/properties'));
app.use('/api/tenant',      require('./routes/tenant'));
app.use('/api/owner',       require('./routes/owner'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/agreements',  require('./routes/agreements'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/users',       require('./routes/users'));

// ── Health check
app.get('/api/health', (req, res) => res.json({
  success: true,
  uptime : process.uptime(),
  memory : process.memoryUsage(),
  env    : process.env.NODE_ENV || 'development',
}));

// ── SPA fallback (serve index.html for all non-API routes)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// ── Global error handler
app.use(require('./middleware/errorHandler'));

// ── Startup
async function start() {
  try {
    await initializeSchema();  // Connect DB + create tables
    loadData();                // Pre-load JSON property dataset
    app.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════════╗`);
      console.log(`║   RentLux API running on port ${PORT}   ║`);
      console.log(`╚══════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
```

---

## 🔑 ENVIRONMENT VARIABLES (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Microsoft SQL Server)
DB_SERVER=LOCALHOST\SQLEXPRESS
DB_PORT=1433
DB_NAME=RentLux
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!

# JWT
JWT_SECRET=rentlux_super_secret_jwt_key_2024_change_in_production
JWT_EXPIRES_IN=7d

# AI (Groq - free at console.groq.com)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Email (optional, Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# CORS
ALLOWED_ORIGINS=http://localhost:5000,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 🚦 MIDDLEWARE SPECIFICATIONS

### `middleware/auth.js` — JWT Protection
```javascript
// protect(req, res, next)
// - Reads Bearer token from Authorization header
// - Verifies with JWT_SECRET
// - Attaches req.user = { id, email, name, role }

// requireRole(...roles)
// - Factory function: requireRole('admin') or requireRole('tenant', 'owner')
// - Returns 403 if req.user.role not in allowed roles
```

### `middleware/rateLimiter.js` — Rate Limits
```javascript
// authLimiter: 5 requests/15min per IP (for login/register)
// apiLimiter:  100 requests/15min per IP (general API)
// chatLimiter: 20 messages/min per user (AI chat)
```

### `middleware/validator.js` — Input Validation
```javascript
// Use express-validator chains
// validateRegister: name, email, password checks
// validateLogin: email, password present
// validateProperty: title, city, price required + type checks
// Middleware returns 400 with field-level errors array
```

### `middleware/errorHandler.js` — Global Error Handler
```javascript
// Catches errors thrown/passed via next(err)
// Logs stack in development
// Returns clean JSON: { success: false, message: "...", ...(dev: stack) }
// Never exposes internal details in production
```

---

## 🏗️ PHASE-BY-PHASE BUILD PLAN

---

### PHASE 1 — Foundation (Days 1–3)
**Goal: Server boots, DB connects, auth works, static files served.**

#### Tasks:
1. `npm init` in `/backend`, install all dependencies
2. Create `.env` and `.env.example`
3. Write `database/db.js` — MSSQL pool, `query()` helper, `initializeSchema()`
4. Create all 4 core tables: Users, Properties, Applications, Agreements
5. Seed admin user (admin@rentlux.com / Admin@123)
6. Write `server.js` — Express setup, static serving, all route mounts
7. Write `middleware/auth.js` — JWT protect + requireRole
8. Write `routes/auth.js` + `controllers/authController.js`
   - POST /register (hash password, insert user, return JWT)
   - POST /login (verify password, return JWT)
   - GET /me (return current user from DB)
9. Test: Register → Login → /me all work
10. Frontend login/register modal should fully work at this point

**Deliverable:** `npm start` serves frontend at :5000, login/register functional.

---

### PHASE 2 — Property Data Pipeline (Days 4–5)
**Goal: JSON dataset loaded, /api/properties returns real South India listings.**

#### Tasks:
1. Place `hyderabad.json` + `vijayawada.json` in `/data/`
2. Write `utils/normalizer.js` — `mergeAndClean()` normalizes raw Apify records
3. Write `utils/dataStore.js` — loads on startup, caches in memory
4. Write `utils/filter.js` — `applyFilters()` + `paginate()`
   - City filter (strict case-insensitive)
   - BHK filter (integer exact match)
   - Price range (minPrice/maxPrice)
   - Smart text search (extracts city + BHK from query string)
   - Type filter
   - Sort: price_asc, price_desc, newest
5. Write `controllers/propertyController.js`
   - GET /properties → applyFilters + paginate
   - GET /properties/stats → counts by city/type
   - GET /properties/:id → single item
   - GET /properties/similar/:id → same city, ±40% price
6. Write `routes/properties.js` (IMPORTANT: /stats before /:id)
7. Test: Tenant dashboard search, filters, pagination all work

**Deliverable:** All 500+ South India properties browseable with working filters.

---

### PHASE 3 — Tenant Workflow (Days 6–7)
**Goal: Tenants can apply to DB-listed properties, track applications.**

#### Tasks:
1. Add remaining DB tables: SavedProperties, Notifications
2. Write `controllers/tenantController.js`
   - POST /applications → validate property exists + available, check duplicate, insert
   - GET /applications → all apps with property + owner info JOIN
   - DELETE /applications/:id → withdraw (only pending)
   - GET /saved → fetch saved property IDs, resolve from both sources
   - POST /saved → insert SavedProperties row
   - DELETE /saved/:property_id → remove from wishlist
3. Write `routes/tenant.js` (all protected + requireRole('tenant'))
4. Write notification helpers: `createNotification(userId, title, message, type)`
   - Trigger on: new application submitted, application status change
5. Test: Full tenant flow — browse → apply → track → withdraw

**Deliverable:** Tenant dashboard fully functional end-to-end.

---

### PHASE 4 — Owner Workflow (Days 8–9)
**Goal: Owners can list properties, review and decide on applications.**

#### Tasks:
1. Write `controllers/ownerController.js`
   - POST /properties → create DB listing (owner_id = req.user.id)
   - GET /properties → paginated owner's listings with pending_applications count
   - PUT /properties/:id → update (verify owner_id matches)
   - DELETE /properties/:id → cascade delete agreements → applications → property
   - GET /applications → all applications for owner's properties (JOIN tenant info)
   - PUT /applications/:id/accept:
     - Set application status = 'accepted'
     - Auto-reject all other pending apps for same property
     - Set property status = 'rented'
     - Create notification for accepted tenant
   - PUT /applications/:id/reject → set status = 'rejected', notify tenant
   - GET /stats → total listings, available, rented, pending apps count
2. Write `routes/owner.js` (all protected + requireRole('owner'))
3. Test: Full owner flow — list property → receive application → accept/reject

**Deliverable:** Owner dashboard fully functional.

---

### PHASE 5 — AI Agreement Generation (Day 10)
**Goal: AI-powered rental agreements generated via Groq, both parties sign.**

#### Tasks:
1. Write `controllers/agreementController.js`
   - POST /agreements:
     - Verify application exists + status = 'accepted'
     - Check if agreement already exists (return existing if so)
     - Call Groq API with detailed property/tenant/owner context
     - Template fallback if no GROQ_API_KEY
     - Insert into Agreements table
   - GET /agreements/:applicationId → fetch agreement text
   - PUT /agreements/:id/sign → set signed_tenant or signed_owner based on JWT role
2. Groq prompt for agreement generation:
   ```
   Generate a professional Indian rental agreement for:
   Property: [title] in [city]
   Monthly Rent: ₹[price]
   Tenant: [name] ([email])
   Landlord: [name] ([email])
   BHK: [bhk] | Type: [type]
   
   Include: 1) Parties 2) Property Description 3) Rent & Deposit (2 months)
   4) Tenure (11 months) 5) Terms & Conditions (8 clauses) 6) Signatures
   Professional Indian legal format, under 700 words.
   ```
3. Write `routes/agreements.js`
4. Test: Generate agreement → sign as tenant → sign as owner

**Deliverable:** Complete agreement generation + digital signing works.

---

### PHASE 6 — AI Chat Assistant (Day 11)
**Goal: Groq-powered property assistant floating widget works for all roles.**

#### Tasks:
1. Write `controllers/chatController.js`
   - POST /chat → send to Groq with rich system context
   - System prompt includes: user role, current page, sample properties
   - Context-aware: tenant sees tenant guidance, owner sees owner guidance
   - Rate limit: 20 messages/min per user
2. System prompt template:
   ```
   You are RentLux AI, integrated in a South India property rental platform.
   User: [name] (Role: [role]) | Page: [context]
   
   Platform: Tenants browse & apply. Owners list & manage. Admin oversees all.
   Available cities: Hyderabad, Vijayawada, Bangalore, Chennai
   
   Sample properties: [inject 5-8 real properties from dataset]
   
   Help with: finding properties, application process, agreement terms,
   owner listing guidance, Indian rental law basics.
   Use ₹ for rupees. Max 250 words. Be friendly and specific.
   ```
3. Write `routes/chat.js`
4. Test: Chat widget in all 3 dashboards, context-aware responses

**Deliverable:** AI chatbot works across all dashboards.

---

### PHASE 7 — Admin Panel (Day 12)
**Goal: Admin can see all data, manage users/properties, view analytics.**

#### Tasks:
1. Write `controllers/adminController.js`
   - GET /stats → users count, owners, tenants, db properties, json properties, total listings, applications, pending, accepted, rented
   - GET /users → paginated with role filter
   - DELETE /users/:id → cascade: agreements → applications (as tenant + as owner's properties) → properties → user
   - GET /properties → DB-listed properties only, paginated
   - DELETE /properties/:id → cascade delete
   - GET /applications → all applications, paginated, filterable by status
   - PUT /users/:id/role → change role (cannot change own role or other admins)
   - GET /analytics → detailed: daily signups, applications by day/week/month
2. Write `routes/admin.js` (all protected + requireRole('admin'))
3. Test: Admin dashboard stats load, user delete works, all tabs function

**Deliverable:** Full admin dashboard functional.

---

### PHASE 8 — Polish & Production Hardening (Day 13–14)
**Goal: Security, validation, error handling, performance.**

#### Tasks:
1. Input validation with express-validator on all mutation endpoints
2. Rate limiting (auth: 5/15min, api: 100/15min, chat: 20/min)
3. Helmet security headers
4. CORS configuration for production domain
5. Request logging with Morgan
6. Global error handler with clean JSON responses
7. Database connection pooling tuning (min: 2, max: 10)
8. Property view count increment on GET /properties/:id
9. Add `compression` middleware for gzip
10. Write `/api/health` endpoint with uptime + memory stats
11. Add `node-cron` job: clean expired/withdrawn applications daily at 2am
12. Test all endpoints with Postman/Thunder Client

**Deliverable:** Production-ready backend.

---

## 🚀 UPGRADE ROADMAP (Post-MVP)

### Upgrade 1 — Image Upload & Management
**Stack additions:** `multer` (file upload), `sharp` (resize/optimize), AWS S3 or Cloudinary

```javascript
// POST /api/upload/image
// Accept: multipart/form-data
// Process: resize to 800x600, compress to WebP, upload to S3
// Return: { url: "https://s3.amazonaws.com/rentlux/..." }

// Owner dashboard: replace "Image URL" text input with actual file upload
// Serve from CDN for fast South India loading
```

### Upgrade 2 — Google OAuth
**Stack additions:** `passport`, `passport-google-oauth20`, Google Cloud Console project

```javascript
// GET /api/auth/google → redirect to Google consent
// GET /api/auth/google/callback → exchange code, upsert user, return JWT
// Frontend: "Continue with Google" button already in design system
// Users who sign in via Google get a random password_hash (never used)
```

### Upgrade 3 — Real-time Notifications
**Stack additions:** `socket.io`

```javascript
// On application accept/reject → emit to tenant's socket room
// On new application received → emit to owner's socket room
// Frontend: toast notification appears instantly without refresh
// Notification bell icon in navbar shows unread count badge
```

### Upgrade 4 — Advanced Search & Recommendations
**Stack additions:** Groq embeddings API or local vector search

```javascript
// GET /api/properties/recommendations
// Based on: user's viewed properties, saved properties, application history
// Algorithm: collaborative filtering or content-based (cosine similarity)
// "Because you liked X, you might like..." section in tenant dashboard
```

### Upgrade 5 — PDF Agreement Download
**Stack additions:** `puppeteer` or `pdfkit`

```javascript
// GET /api/agreements/:id/pdf
// Render agreement HTML → PDF with branding
// Include property images, signatures block, RentLux watermark
// Return as binary stream with Content-Type: application/pdf
```

### Upgrade 6 — Multi-Language Support
**Languages:** Telugu (primary South India), Tamil, Kannada, English

```javascript
// i18n middleware: detect Accept-Language header
// Property descriptions: store in English, translate on-demand via Groq
// UI strings: JSON locale files (en.json, te.json, ta.json, kn.json)
// URL: /api/properties?lang=te → descriptions in Telugu
```

### Upgrade 7 — Rent Payment Tracking
**Stack additions:** Razorpay or PhonePe gateway (India-specific)

```javascript
// New table: Payments (id, agreement_id, amount, status, payment_date, utr_number)
// POST /api/payments/initiate → create Razorpay order
// POST /api/payments/verify → webhook verification
// GET /api/payments/:agreement_id → payment history
// Auto-send receipt email via Nodemailer
```

### Upgrade 8 — Property Analytics for Owners
**New endpoints:**

```javascript
// GET /api/owner/analytics/:property_id
// Returns: view_count over time, application rate, avg response time,
//          comparable properties in area, price benchmark
// Visualized in owner dashboard with Chart.js (already included in admin)
```

### Upgrade 9 — Verified Listing Badge
**Process:**
```
Owner submits documents → Admin reviews → Mark is_verified=true
Verified badge shown on property card
Tenants can filter: ?verified=true
Increases tenant confidence in South India market
```

### Upgrade 10 — Mobile App API
**Stack additions:** React Native (separate project)

```javascript
// All existing endpoints already mobile-ready (JSON API)
// Add: Push notification support (FCM token per user)
// Add: Biometric auth endpoints
// Add: Location-based search: ?lat=17.38&lng=78.48&radius=5000
// Serve same backend, different frontend
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (`jest`)
```javascript
// utils/filter.test.js — Test all filter combinations
// utils/normalizer.test.js — Test data cleaning edge cases
// controllers/authController.test.js — Register/login flows
```

### Integration Tests (`supertest`)
```javascript
// Full API flow tests:
// test('Tenant can apply for property')
//   → register → login → GET properties → POST application → GET applications
// test('Owner accept/reject flow')
//   → register owner → create property → receive application → accept
// test('Agreement generation')
//   → accepted application → generate agreement → sign both sides
```

### Manual API Testing (Postman Collection)
```
Collection: RentLux API Tests
Environment variables: {{base_url}}, {{tenant_token}}, {{owner_token}}, {{admin_token}}
Folders: Auth, Properties, Tenant, Owner, Admin, Agreements, Chat
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Passwords hashed with bcrypt (salt rounds: 10)
- [ ] JWT secrets rotated per environment
- [ ] SQL injection: parameterized queries only (never string concatenation)
- [ ] XSS: Helmet sets security headers, input sanitized
- [ ] CSRF: Handled by JWT in Authorization header (not cookies)
- [ ] Rate limiting on auth endpoints
- [ ] Cascade deletes verified (no orphan records)
- [ ] Admin role cannot be registered via public endpoint
- [ ] Owner cannot modify other owners' properties
- [ ] Tenant cannot withdraw another tenant's application
- [ ] File uploads: MIME type validation, size limits, no executable files
- [ ] Error messages never expose stack traces in production
- [ ] Environment variables never committed to git

---

## 🗺️ SOUTH INDIA MARKET SPECIFICS

### Property Price Ranges (for filter defaults)
| City | Studio/1BHK | 2BHK | 3BHK | Villa |
|------|-------------|------|------|-------|
| Hyderabad | ₹8–15L | ₹15–35L | ₹35–80L | ₹80L–3Cr |
| Vijayawada | ₹5–12L | ₹12–25L | ₹25–55L | ₹55L–2Cr |
| Bangalore | ₹15–25L | ₹25–55L | ₹55L–1.5Cr | ₹1.5–5Cr |
| Chennai | ₹10–20L | ₹20–45L | ₹45L–1Cr | ₹1–4Cr |

### Popular Localities per City
```javascript
const POPULAR_AREAS = {
  Hyderabad: [
    'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Kondapur', 'Madhapur',
    'Hitech City', 'Kukatpally', 'Manikonda', 'Miyapur', 'Secunderabad',
    'Begumpet', 'Ameerpet', 'LB Nagar', 'Dilsukhnagar', 'Uppal'
  ],
  Vijayawada: [
    'Benz Circle', 'Moghalrajpuram', 'Governorpet', 'Siddhartha Nagar',
    'Labbipet', 'Patamata', 'Kanuru', 'Gunadala', 'Pinnamaneni Nagar'
  ],
  Bangalore: [
    'Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Marathahalli',
    'Electronic City', 'Sarjapur', 'JP Nagar', 'Hebbal', 'Yelahanka'
  ],
  Chennai: [
    'Velachery', 'Porur', 'OMR', 'Anna Nagar', 'T Nagar',
    'Adyar', 'Perungudi', 'Sholinganallur', 'Tambaram', 'Medavakkam'
  ]
};
```

### Indian Currency Display
```javascript
// utils/currency.js
function formatINR(amount) {
  const n = Number(amount);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}
```

### Agreement Legal Requirements (Indian Law)
```
- Lease period: 11 months (avoids mandatory registration for longer leases)
- Security deposit: typically 2–3 months rent in Hyderabad/Andhra
- Notice period: 30 days (either party)
- Stamp duty: applicable on agreements > 11 months
- Registration: required for agreements > 11 months (Section 17, Registration Act)
- TDS: applicable if annual rent > ₹2.4 lakhs (Section 194I)
```

---

## 📋 QUICK START COMMANDS

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your SQL Server credentials and Groq API key

# 3. Create database in SQL Server Management Studio
# CREATE DATABASE RentLux;

# 4. Start server (auto-creates tables + seeds admin)
node server.js

# OR with auto-reload during development
npm run dev  # uses nodemon

# 5. Test API health
curl http://localhost:5000/api/health

# 6. Open frontend
# Navigate to http://localhost:5000
# Admin login: admin@rentlux.com / Admin@123

# 7. Run tests
npm test
```

---

## 🤖 INSTRUCTIONS FOR OPUS

You are building the **backend** for RentLux, a South India property rental platform. The frontend is complete. Follow these instructions precisely:

1. **Build phase by phase** — do not skip phases. Each phase has a clear deliverable.
2. **Never modify frontend files** — only build in `backend/`
3. **Use parameterized queries exclusively** — no string concatenation in SQL
4. **The JSON dataset is read-only** — tenants browse it but cannot apply to JSON properties; applications only work for DB-listed (owner-posted) properties
5. **Always return consistent JSON** — `{ success: true/false, data: ..., message: ... }`
6. **Error handling** — every async function must have try/catch; never let unhandled rejections crash the server
7. **The normalizer is already written** — use `utils/normalizer.js` as provided; don't rewrite it
8. **Groq API is free** — always implement the template fallback for when `GROQ_API_KEY` is missing
9. **Respect role boundaries** — tenant routes 403 for owners/admins, owner routes 403 for tenants/admins, etc.
10. **Cascade deletes matter** — always delete child records before parents to avoid FK violations

When generating code, produce **complete, runnable files** — not snippets. Each file should be copy-paste ready.

Start with Phase 1. Ask for confirmation before proceeding to Phase 2.

---

*Document version: 1.0 | Generated for RentLux Backend Build | South India Property Platform*
