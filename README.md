# 🎬 Raju Visuals - Portfolio Website

A modern, cinematic portfolio website for a video editor and motion graphics artist. Built with **React 19**, **TypeScript**, **Vite**, and features a **Python FastAPI** backend for email handling.

---

## 📁 Project Structure Overview

```
raju portfolio/
├── 📄 Core Application Files
│   ├── index.html          # Entry HTML file with Tailwind config & global styles
│   ├── index.tsx           # React app entry point (renders App.tsx)
│   ├── App.tsx             # Main app component with routing
│   ├── types.ts            # TypeScript interfaces and types
│   └── firebase.ts         # Firebase configuration and exports
│
├── 📁 pages/               # Main application pages
│   ├── Home.tsx            # Landing page with hero, projects, testimonials
│   ├── Work.tsx            # Portfolio/work showcase page
│   ├── Pricing.tsx         # Pricing tiers page
│   ├── Assets.tsx          # Digital assets page
│   └── Admin.tsx           # Full CMS admin panel (272KB!)
│
├── 📁 components/          # Reusable UI components
│   ├── Navbar.tsx          # Navigation bar
│   ├── Footer.tsx          # Site footer
│   ├── BackToTop.tsx       # Scroll-to-top button
│   ├── ContactForm.tsx     # Contact form with email integration
│   ├── LightRays.tsx       # Animated light rays decoration
│   ├── OrbitalWorkflow.tsx # Orbital animation component
│   ├── CardSwap.tsx        # Card swap animation
│   └── ScrollStack.tsx     # Scroll-based stacking animation
│
├── 📁 utils/               # Utility functions
│   └── cacheService.ts     # Data caching logic
│
├── 📄 app.py               # Python FastAPI backend (email API)
├── 📄 requirements.txt     # Python dependencies
├── 📄 .env                 # Environment variables (API keys)
│
├── 📄 package.json         # Node.js dependencies
├── 📄 vite.config.ts       # Vite build configuration
├── 📄 tsconfig.json        # TypeScript configuration
│
├── 📄 firebase.json        # Firebase hosting config
├── 📄 .firebaserc          # Firebase project settings
└── 📄 rv logo.png          # Site favicon/logo
```

---

## 🔗 How Everything Connects

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              index.html                                      │
│  • Loads Tailwind CSS, Google Fonts (Inter)                                 │
│  • Defines global styles, custom animations, color scheme                   │
│  • Imports index.tsx as module                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              index.tsx                                       │
│  • Creates React root                                                        │
│  • Renders <App /> component                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               App.tsx (ROUTER)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Hash-based routing (#home, #work, #pricing, #assets, #admin)       │    │
│  │                                                                      │    │
│  │   currentPage === 'home'    →  <Home />                             │    │
│  │   currentPage === 'work'    →  <Work />                             │    │
│  │   currentPage === 'pricing' →  <Pricing />                          │    │
│  │   currentPage === 'assets'  →  <Assets />                           │    │
│  │   currentPage === 'admin'   →  <Admin />                            │    │
│  │                                                                      │    │
│  │   + <Navbar /> (hidden on admin)                                    │    │
│  │   + <Footer /> (hidden on admin)                                    │    │
│  │   + <BackToTop />                                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
     ┌──────────┐              ┌──────────┐              ┌──────────────┐
     │ Firebase │              │  Pages   │              │ Python API   │
     │ Firestore│ ◀────────▶   │ (Data)   │   ────────▶  │ (Emails)     │
     │   Auth   │              │          │              │              │
     └──────────┘              └──────────┘              └──────────────┘
```

---

## 📂 Detailed File Descriptions

### Core Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point. Contains Tailwind configuration, global CSS styles, custom animations (shimmer, pulse, float), color themes, and font imports. |
| `index.tsx` | React entry. Mounts the main `<App />` component to the DOM. |
| `App.tsx` | **Main router.** Uses hash-based routing to switch between pages. Manages state for current page and provides navigation functions. |
| `types.ts` | **TypeScript definitions.** Defines interfaces for `Project`, `FeaturedProject`, `PageRoute`, `NavItem`, `WorkItem`, `AssetItem`, and `PricingTier`. |
| `firebase.ts` | **Firebase setup.** Initializes Firebase app, exports `db` (Firestore) and `auth` (Authentication). |

---

### Pages (`pages/`)

| File | Size | Description |
|------|------|-------------|
| `Home.tsx` | 48KB | **Main landing page.** Contains hero section, featured projects carousel, brand ticker, workflow section, testimonials, and contact form. Fetches all content from Firebase. |
| `Work.tsx` | 26KB | **Portfolio page.** Displays all projects with filtering by category. Data comes from Firebase `projects` collection. |
| `Pricing.tsx` | 8KB | **Pricing page.** Shows pricing tiers and packages. |
| `Assets.tsx` | 13KB | **Assets page.** Displays free/premium digital assets for download. |
| `Admin.tsx` | 272KB | **Full CMS Admin Panel.** Massive dashboard with authentication, project management, content editing, email settings, contact submissions viewer, cache management, and more. |

---

### Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Top navigation bar with page links and mobile menu |
| `Footer.tsx` | Site footer with social links and contact info (editable via CMS) |
| `BackToTop.tsx` | Floating button to scroll back to top |
| `ContactForm.tsx` | **Contact form** that saves to Firebase AND sends emails via Python backend |
| `LightRays.tsx` | Decorative animated light rays effect |
| `OrbitalWorkflow.tsx` | Orbital animation showing workflow/skills |
| `CardSwap.tsx` | Interactive card swap animation |
| `ScrollStack.tsx` | Scroll-triggered stacking cards animation |

---

### Backend (`app.py`)

The Python FastAPI backend handles email sending:

```
┌─────────────────────────────────────────────────────────────────┐
│                     app.py (FastAPI Server)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ENDPOINTS:                                                      │
│  ─────────                                                       │
│  GET  /              → Health check                              │
│  POST /api/contact   → Send contact form emails                  │
│                                                                  │
│  FLOW:                                                           │
│  ─────                                                           │
│  1. User submits contact form (ContactForm.tsx)                  │
│  2. Form data saved to Firebase (client-side)                    │
│  3. POST request to /api/contact with form data                  │
│  4. If email_enabled = true:                                     │
│     a. Send confirmation email TO user                           │
│     b. Send notification email TO admin (contact@rajuvisuals.com)│
│  5. Return success/failure response                              │
│                                                                  │
│  USES:                                                           │
│  ─────                                                           │
│  • Resend API for email delivery                                 │
│  • Beautiful HTML email templates (inline CSS)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Utilities (`utils/`)

| File | Purpose |
|------|---------|
| `cacheService.ts` | Local caching service to reduce Firebase reads. Caches project data for configurable duration. |

---

## 🗄️ Firebase Database Structure

```
Firebase Firestore
│
├── 📁 projects/              # Work page projects
│   └── {documentId}
│       ├── id: string
│       ├── type: string      (e.g., "Video Editing", "Motion Graphics")
│       ├── title: string
│       ├── description: string
│       ├── link: string      (video URL)
│       ├── tools: string[]   (e.g., ["After Effects", "Premiere Pro"])
│       ├── order: number
│       └── autoPlay: boolean
│
├── 📁 featuredProjects/      # Home page featured carousel
│   └── {documentId}
│       ├── id: string
│       ├── type: string
│       ├── src: string       (media URL)
│       ├── category: string
│       ├── title: string
│       ├── aspect: string    (e.g., "square", "portrait")
│       └── order: number
│
├── 📁 contactSubmissions/    # Contact form submissions
│   └── {documentId}
│       ├── name: string
│       ├── email: string
│       ├── message: string
│       ├── selectedServices: string[]
│       ├── submittedAt: Timestamp
│       ├── status: "sent" | "failed" | "skipped" | "pending"
│       └── apiResponse: object
│
├── 📁 content/               # CMS editable content
│   └── siteContent           # Single document with all page content
│       ├── home: { hero, about, portfolio, workflow, testimonials, contact }
│       ├── work: { header }
│       ├── footer: { links, social, etc. }
│       └── orbitalWorkflow: { title, subtitle, items[] }
│
├── 📁 typeOrders/            # Project category ordering/visibility
│   └── {documentId}
│       ├── typeName: string
│       ├── order: number
│       └── visible: boolean
│
├── 📁 settings/              # App settings
│   ├── cache/
│   │   ├── cacheEnabled: boolean
│   │   ├── cacheDurationHours: number
│   │   └── showCardContent: boolean
│   │
│   └── email/
│       ├── emailEnabled: boolean
│       └── emailApiUrl: string
│
└── 📁 users/                 # Auth users (if applicable)
```

---

## 🎨 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI framework |
| TypeScript | 5.8.2 | Type safety |
| Vite | 6.2.0 | Build tool & dev server |
| Tailwind CSS | CDN | Utility-first styling |
| Framer Motion | 11.0.0 | Animations |
| GSAP | 3.14.1 | Advanced animations |
| Lenis | 1.3.15 | Smooth scrolling |
| Lucide React | 0.556.0 | Icon library |

### Backend

| Technology | Purpose |
|------------|---------|
| FastAPI | Python web framework |
| Resend | Email API service |
| Uvicorn | ASGI server |
| Pydantic | Data validation |

### Services

| Service | Purpose |
|---------|---------|
| Firebase Firestore | Database (NoSQL) |
| Firebase Auth | Admin authentication |
| Firebase Hosting | Static site hosting |
| PythonAnywhere | Backend hosting (production) |

---

## 🚀 Running The Project

### Frontend (Development)

```bash
# Install dependencies
pnpm install    # or npm install

# Start dev server
pnpm run dev    # Runs on http://localhost:3000
```

### Backend (Development)

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set environment variable
# Create .env file with: RESEND_API_KEY=your_api_key

# Start server
uvicorn app:app --reload    # Runs on http://localhost:8000
```

### Build for Production

```bash
pnpm run build     # Creates dist/ folder
```

---

## 🔐 Environment Variables

### `.env` file

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx    # Resend API key for emails
GEMINI_API_KEY=xxxxx               # Optional: for AI features
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐     ┌───────────────┐     ┌─────────────────┐
│   User       │     │   Firebase    │     │  Python API     │
│   Browser    │     │   Firestore   │     │  (app.py)       │
└──────┬───────┘     └───────┬───────┘     └────────┬────────┘
       │                     │                      │
       │  1. Load page       │                      │
       │ ─────────────────▶  │                      │
       │                     │                      │
       │  2. Fetch content   │                      │
       │ ─────────────────▶  │                      │
       │                     │                      │
       │  3. Return data     │                      │
       │ ◀─────────────────  │                      │
       │                     │                      │
       │  4. Submit contact  │                      │
       │   form              │                      │
       │ ─────────────────▶  │                      │
       │   (save to DB)      │                      │
       │                     │                      │
       │  5. Send email      │                      │
       │ ─────────────────────────────────────────▶ │
       │                     │                      │
       │  6. Email sent via  │                      │
       │     Resend API      │                      │
       │ ◀───────────────────────────────────────── │
       │                     │                      │
```

---

## 📱 Page Routes

| Route | URL | Page |
|-------|-----|------|
| Home | `/#` or `/#home` | Landing page |
| Work | `/#work` | Portfolio gallery |
| Pricing | `/#pricing` | Pricing information |
| Assets | `/#assets` | Digital downloads |
| Admin | `/#admin` | CMS dashboard (requires login) |

---

## 🛠️ Admin Panel Features

The Admin panel (`Admin.tsx`) provides complete CMS functionality:

1. **🔐 Authentication** - Email/password login via Firebase Auth
2. **📽️ Projects Management** - Add, edit, delete, reorder projects
3. **⭐ Featured Projects** - Manage homepage carousel
4. **📝 Content Editor** - Edit all text content across pages
5. **📧 Email Settings** - Enable/disable emails, set API URL
6. **💬 Messages** - View all contact form submissions
7. **⚙️ Settings** - Cache controls, card content toggle
8. **📊 Type Ordering** - Control project category order and visibility

---

## 📝 Key Interfaces

```typescript
// Page routing
type PageRoute = 'home' | 'work' | 'pricing' | 'assets' | 'admin';

// Project data structure
interface Project {
  id: string;
  type: string;
  link: string;
  title: string;
  description: string;
  tools: string[];
  order: number;
  aspect?: string;
  autoPlay?: boolean;
}

// Featured project for homepage
interface FeaturedProject {
  id: string;
  type: string;
  src: string;
  category: string;
  title: string;
  aspect: string;
  order: number;
}
```

---

## 🌐 Deployment

### Frontend (Firebase Hosting)

```bash
firebase deploy
```

### Backend (PythonAnywhere)

- API URL: `https://rajuvisuals.pythonanywhere.com/api/contact`
- Configure in Admin Settings

---

## 🎯 Quick Reference

| What do you want to do? | Where to look |
|------------------------|---------------|
| Change page content | `Admin.tsx` → Content tab, or edit in CMS |
| Add new project | CMS → Projects tab |
| Modify homepage layout | `pages/Home.tsx` |
| Update navigation | `components/Navbar.tsx` |
| Change styling/colors | `index.html` (Tailwind config) |
| Edit email templates | `app.py` → HTML template functions |
| Add new route/page | `App.tsx` + create new page in `pages/` |
| Modify data types | `types.ts` |
| Configure Firebase | `firebase.ts` |

---

## 📞 Contact

**Raju Dalai** - Video Editor & Motion Graphics Artist

- Website: [rajuvisuals.com](https://rajuvisuals.com)
- Email: <contact@rajuvisuals.com>
