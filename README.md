# SalonixPro - Professional Salon Management

A complete, professional salon management system built with Next.js 14, TypeScript, Tailwind CSS, and Prisma.

![SalonixPro Dashboard](https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200)

## Features

### 🏪 Staff Portal (Dashboard)
- **Dashboard** - Real-time stats, appointments, orders overview
- **Appointments** - Calendar view, booking management, status workflow
- **Clients** - CRM with contact info, visit history, loyalty tracking
- **Services** - Service catalog with categories and pricing
- **Stylists** - Staff profiles, schedules, service assignments
- **Store** - Product management, inventory, pricing, promotions
- **Orders** - Order management, pickup tracking, fulfillment
- **Reports** - Revenue analytics, top products, client insights

### 🛍️ Customer Shop
- Product browsing with categories
- Shopping cart
- Online checkout
- Appointment booking
- Mobile-first design

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **Animations:** Framer Motion
- **Charts:** Recharts
- **State:** Zustand

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone or extract the project:**
   ```bash
   cd salonixpro-next
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database URL and secrets.

4. **Set up database:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Demo Credentials

- **Username:** admin
- **Password:** Admin@123

## Project Structure

```
salonixpro-next/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Staff dashboard pages
│   │   ├── appointments/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── stylists/
│   │   ├── store/
│   │   ├── orders/
│   │   ├── reports/
│   │   └── settings/
│   ├── (shop)/            # Customer-facing pages
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── book/
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Dashboard-specific components
│   ├── shop/              # Shop-specific components
│   └── forms/             # Form components
├── lib/                   # Utilities and helpers
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript types
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works with any Node.js hosting:
- Railway
- Render
- DigitalOcean
- AWS

## Database

Using PostgreSQL with Prisma ORM. 

For development, you can use:
- **Local PostgreSQL**
- **Supabase** (free tier available)
- **Railway** (free tier available)
- **Neon** (free tier available)

## License

MIT License - Free for personal and commercial use.

---

Built with ❤️ for salon professionals.
