# AIUB Portal Client

A modern web client for American International University-Bangladesh (AIUB) student portal. Access grades, course schedules, registration info, and financial records with an enhanced UI.

## Features

### Authentication
- Secure login with CAPTCHA verification
- Session management with auto-logout

### Dashboard
- Student information overview
- Today's class schedule with live countdown timers
- Quick navigation to all portal sections

### Grade Report
- Semester-wise grade breakdown
- CGPA calculation and tracking
- Visual analytics with charts (Line, Bar, Pie, Radar charts)
- Grade trend analysis
- Export grade report as image

### Course Schedule Planner
- Browse all available courses
- Search and filter courses
- View course sections with time slots
- Build custom routines by selecting sections

### Auto Routine Generator
- Automatically generate conflict-free schedules
- Filter by preferred days and time slots
- Set minimum seat availability requirements
- Configure maximum gap between classes

### Registration Info
- View current semester registration details
- Course enrollment status
- Credit breakdown and fee information

### Finance
- Transaction history (debits/credits)
- Filter and search transactions
- Financial summary with balance tracking

### My Routine
- View selected course schedule
- Calendar view for weekly routine

## Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI/Animations:** Framer Motion
- **Charts:** Recharts
- **Calendar:** React Big Calendar
- **Icons:** React Icons
- **Alerts:** SweetAlert2
- **Image Export:** html-to-image, html2canvas
- **Date Handling:** Moment.js

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/mdrijoanmaruf/AIUB_Portal_Client.git
cd AIUB_Portal_Client

# Install dependencies
npm install

# Set up environment variables
# Create .env.local and add:
NEXT_PUBLIC_API_BASE_URL=<your-api-url>

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── course-routine/     # Course routine pages
│   ├── courses/            # Course planner & auto-generator
│   ├── finance/            # Financial records
│   ├── grade-report/       # Grade report & analytics
│   ├── home/               # Dashboard
│   ├── profile/            # User profile
│   └── registration/       # Registration info
├── components/             # Reusable components
│   ├── auto-course/        # Auto routine generator components
│   ├── course-schedule/    # Course scheduling components
│   ├── Footer/
│   ├── Navbar/
│   └── skeletons/          # Loading skeletons
└── lib/                    # Utilities & helpers
    ├── cacheManager.ts     # Client-side caching
    ├── courseCache.ts      # Course data caching
    ├── courseUtils.ts      # Course helper functions
    └── prefetch.ts         # Data prefetching
```

## Repository

[GitHub - AIUB Portal Client](https://github.com/mdrijoanmaruf/AIUB_Portal_Client)

## Author

**Md Rijoan Maruf** - [rijoan.com](https://rijoan.com)
