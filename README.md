# Magneto 🧲✈️

> **Turn your travel dreams into destinations.**  
> A tactile travel savings and trip planning web application featuring a realistic virtual refrigerator with collectible souvenir destination magnets.

---

## 🌟 Overview & Core Principles

Magneto replaces scattered travel spreadsheets and messy notes with a visual, rewarding travel fridge.
Users collect travel destinations as realistic souvenir magnets, set target budgets in INR, record savings deposits in minor units (paise) with mathematical accuracy, automatically unlock magnet states (*Dreaming* → *Saving* → *Ready to Go!*), and organize their travel itinerary and departure checklist.

### Core Loop
1. **Dream:** Browse collectible souvenir magnets and add your dream destinations.
2. **Collect:** Stick tactile souvenir magnets onto your brushed stainless-steel refrigerator.
3. **Save:** Record deposits in INR towards each trip.
4. **Unlock:** Watch magnets transition automatically to "Saving" and "Ready to Go!" (100% funded).
5. **Plan:** Organize day-by-day itineraries and departure checklist tasks.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 8, TypeScript 6
- **Styling:** Tailwind CSS v4, Lucide React
- **Routing:** React Router DOM v7
- **Forms & Validation:** React Hook Form + Zod
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security, Supabase Auth)
- **Unit Testing:** Vitest

---

## 🎨 Design & Brand Identity

- **Centerpiece Visual:** High-fidelity brushed stainless-steel refrigerator with realistic metallic gradients, chrome split trims, handles, and authentic magnetic surface aesthetics.
- **Collectible Souvenir Magnets:** Bespoke illustrated vector magnets with embossed rims, tactile drop shadows, and responsive states:
  - 🇫🇷 **Paris:** Miniature Eiffel Tower souvenir enamel badge with French tricolor banner
  - 🇯🇵 **Japan:** Mount Fuji & Red Torii gate lacquer plate
  - 🌴 **Goa:** Coastal sunset, palm trees & surfboard shield
  - 🇨🇭 **Switzerland:** Alpine snow peaks & Swiss cross wooden plaque
  - 🇬🇧 **London:** Big Ben clock tower vintage postage stamp souvenir
  - 🌺 **Bali:** Tropical Candi Bentar split temple gate & frangipani flower
- **Automatic Magnet States:**
  - 💤 **Dreaming:** Saved = 0 (Resting souvenir badge)
  - ⏳ **Saving:** 0 < Saved < Target (Progress pill and percentage badge)
  - ✈️ **Ready to Go:** Saved ≥ Target (Golden halo, 100% funded celebration stamp)

---

## 💰 Financial Precision (INR & Paise)

All financial figures are strictly calculated and stored in **Paise** (`bigint` in PostgreSQL):
- `₹1.00 = 100 paise`
- Storage columns: `target_budget_minor`, `amount_minor`
- `totalSaved = sum(deposits)`
- `amountRemaining = max(0, targetBudget - totalSaved)`
- `progressPercentage = min(100, (totalSaved / targetBudget) * 100)`
- Storing minor units completely eliminates floating-point rounding errors.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Installation
```bash
git clone <repo-url>
cd Magneto_01
npm install
```

### 3. Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the migration script located at:
   ```
   supabase/migrations/20261013000000_init_magneto.sql
   ```
3. Copy your project API credentials from **Project Settings → API**.
4. In the root directory, create/update `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Never expose `service_role` secrets in frontend code. Row Level Security policies enforce user isolation using `auth.uid()`.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Running Tests & Production Build
```bash
# Run unit test suite (16 tests verifying financial rules and form validation)
npm test

# Run TypeScript compile and production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
Magneto_01/
├── src/
│   ├── components/
│   │   ├── fridge/
│   │   │   ├── MagnetGraphic.tsx      # Collectible souvenir vector artwork & states
│   │   │   └── VirtualFridge.tsx      # Brushed stainless-steel refrigerator
│   │   ├── layout/
│   │   │   └── ProtectedRoute.tsx     # Route guard for authenticated views
│   │   ├── planning/
│   │   │   ├── ChecklistSection.tsx   # Preparation tasks & progress
│   │   │   └── ItinerarySection.tsx   # Day-by-day activities
│   │   ├── savings/
│   │   │   ├── AddDepositModal.tsx    # Live deposit modal with unlock preview
│   │   │   └── SavingsTracker.tsx     # Financial metrics & transaction history
│   │   ├── trips/
│   │   │   ├── AddTripModal.tsx       # Destination creation with magnet selector
│   │   │   └── EditTripModal.tsx      # Trip updating
│   │   └── ui/
│   │       ├── Modal.tsx              # Reusable accessible dialog
│   │       ├── Navbar.tsx             # Brand header & user navigation
│   │       └── SupabaseSetupModal.tsx # Friendly in-app database setup guide
│   ├── context/
│   │   └── AuthContext.tsx            # Session persistence & Supabase auth
│   ├── lib/
│   │   ├── supabase.ts                # Client singleton & configuration checks
│   │   ├── utils.ts                   # Financial calculations & INR formatting
│   │   └── validation.ts              # Zod validation schemas
│   ├── pages/
│   │   ├── DashboardPage.tsx          # Metrics bar & virtual fridge
│   │   ├── LandingPage.tsx            # Hero, fridge showcase, how it works
│   │   ├── LoginPage.tsx              # Sign in
│   │   ├── SignupPage.tsx             # Account creation
│   │   └── TripDetailPage.tsx         # Overview, savings, itinerary, checklist
│   ├── services/
│   │   ├── checklistService.ts        # Tasks CRUD
│   │   ├── itineraryService.ts        # Activities CRUD
│   │   ├── savingsService.ts          # Deposits CRUD
│   │   └── tripService.ts             # Trips CRUD & financial aggregation
│   └── types/
│       ├── database.ts                # Supabase PostgreSQL schema types
│       ├── planning.ts                # Itinerary & checklist types
│       ├── savings.ts                 # Savings types
│       └── trip.ts                    # Trip & magnet types
├── supabase/
│   ├── migrations/
│   │   └── 20261013000000_init_magneto.sql # Full DDL, RLS policies & triggers
│   └── seed.sql
├── .env.example
├── package.json
└── vite.config.ts
```

---

## 🛡️ Database Security & Isolation

Every user-owned table has Row Level Security (RLS) enabled:
- `profiles`: accessible only by `auth.uid() = id`.
- `trips`: accessible only by `auth.uid() = user_id`.
- `savings_transactions`: user must own both the transaction and the linked trip.
- `itinerary_items`: user must own both the item and the linked trip.
- `checklist_items`: user must own both the task and the linked trip.
- Cascading deletes ensure deleting a trip safely removes all associated transactions, itinerary items, and checklist tasks without orphaned records.
