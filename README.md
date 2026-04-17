# 🏡 RentLux Backend — Setup Guide

## Quick Start (3 Steps)

### Step 1 — Install dependencies
```bash
cd backend
npm install
```

### Step 2 — Start the server
```bash
node server.js
```
You should see:
```
╔══════════════════════════════════════╗
║   RentLux API running on port 5000   ║
╚══════════════════════════════════════╝
```

### Step 3 — Open the frontend
Open `rentlux-integrated.html` in your browser (double-click or use Live Server in VS Code).

---

## Project Structure
```
backend/
├── server.js                  ← Entry point (run this)
├── .env                       ← PORT, JWT_SECRET
├── package.json
├── rentlux-integrated.html    ← Your frontend (fully wired to API)
│
├── routes/
│   ├── properties.js          ← GET /api/properties (+ filters)
│   ├── auth.js                ← POST /api/auth/login, /register
│   └── users.js               ← GET /api/users/dashboard-stats
│
├── controllers/
│   ├── propertyController.js
│   ├── authController.js
│   └── userController.js
│
├── utils/
│   ├── dataStore.js           ← Loads + caches JSON data
│   ├── normalizer.js          ← Cleans raw Apify data
│   └── filter.js              ← Search, filter, paginate
│
├── middleware/
│   └── auth.js                ← JWT protect middleware
│
└── data/
    ├── hyderabad.json         ← Raw Apify data
    ├── vijayawada.json        ← Raw Apify data
    └── users.json             ← Created automatically on first register
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/properties` | List all (with filters) |
| GET | `/api/properties/:id` | Single property |
| GET | `/api/properties/similar/:id` | Similar properties |
| GET | `/api/properties/stats` | City/type breakdown |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/google` | Google auth (demo) |
| GET | `/api/users/dashboard-stats` | Dashboard numbers |

### Filter Examples
```
GET /api/properties?city=Hyderabad
GET /api/properties?city=Vijayawada&bhk=2
GET /api/properties?search=2 BHK Hyderabad
GET /api/properties?minPrice=2000000&maxPrice=6000000
GET /api/properties?city=Hyderabad&page=2&limit=12
```

---

## Notes
- Data loads once at startup and is cached in memory — fast response
- City filter is STRICT: Hyderabad data never appears in Vijayawada results
- Smart search: "2 BHK Hyderabad" extracts city + BHK automatically
- Auth tokens expire in 7 days
- users.json is auto-created in /data/ on first registration
