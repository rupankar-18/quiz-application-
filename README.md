# QuizPulse Full-Stack App (Vite + React + Supabase)

QuizPulse is a gamified, interactive quiz platform featuring dynamic categories, timer modes, lifelines, score calculation, leaderboards, and persistent account profiles backed by **Supabase (PostgreSQL)** with instant local storage fallback.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system
- **Backend**: Node.js, Express
- **Database**: **Supabase** (PostgreSQL) replacing MongoDB Atlas
- **Authentication**: Bcrypt password hashing, session tokens, guest & admin modes

---

## 🚀 Setting Up Supabase Database

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose a project name (e.g. `quizpulse`) and database password.

### Step 2: Run the Database Schema Script
1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open `supabase-schema.sql` from this project folder, copy its contents, paste them into the SQL Editor, and click **Run**.
4. This creates:
   - The `users` table with username, email, stats, and quiz history.
   - Row Level Security (RLS) policies.
   - Fast lookup indexes on `username` and `email`.
   - Administrator accounts provisioned dynamically via `.env`.

### Step 3: Add Your Credentials to `.env`
1. In your Supabase dashboard, navigate to **Project Settings** -> **API**.
2. Copy your **Project URL** and **Project API Key** (`anon` or `service_role`).
3. Open `.env` in the project root and fill them in:
```env
PORT=5000

# Backend Supabase configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key

# Client-side Supabase configuration (for Vite)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🏃 Running the Application

### Option A: One-Click Startup (Windows)
Double-click `start-app.bat` to launch both backend server (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`).

### Option B: Command Line
```bash
# Run both Backend & Frontend concurrently
npm run dev

# Or run separately:
npm run server       # Starts backend on http://localhost:5000
npm run dev:client  # Starts Vite frontend on http://localhost:5173
```

## 🛡️ Admin Portal (`/admin`)

Administrators have access to candidate registries, feedback moderation, certificates, and metrics.
Admin accounts are configured **exclusively in your `.env` file**.

### Single Admin Configuration:
```env
ADMIN_USERNAME=rup
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_EMAIL=rpodder2019@gmail.com

VITE_ADMIN_USERNAME=rup
VITE_ADMIN_PASSWORD=replace-with-a-strong-password
VITE_ADMIN_EMAIL=rpodder2019@gmail.com
```

### Multiple Admins Configuration:
You can configure multiple administrators using numbered variables:
```env
# Admin 1
ADMIN_USERNAME=rup
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_EMAIL=rpodder2019@gmail.com
VITE_ADMIN_USERNAME=rup
VITE_ADMIN_PASSWORD=replace-with-a-strong-password
VITE_ADMIN_EMAIL=rpodder2019@gmail.com

# Admin 2
ADMIN_2_USERNAME=alex
ADMIN_2_PASSWORD=replace-with-a-strong-password
ADMIN_2_EMAIL=alex@quizpulse.com
VITE_ADMIN_2_USERNAME=alex
VITE_ADMIN_2_PASSWORD=replace-with-a-strong-password
VITE_ADMIN_2_EMAIL=alex@quizpulse.com

# Admin 3
ADMIN_3_USERNAME=sarah
ADMIN_3_PASSWORD=replace-with-a-strong-password
ADMIN_3_EMAIL=sarah@quizpulse.com
VITE_ADMIN_3_USERNAME=sarah
VITE_ADMIN_3_PASSWORD=replace-with-a-strong-password
VITE_ADMIN_3_EMAIL=sarah@quizpulse.com
```
*Alternatively, you can also use `ADMIN_ACCOUNTS="user1:pass1:email1, user2:pass2:email2"`.*

- Navigate to `/admin` to log in with any configured administrator account.
- Administrator accounts are strictly blocked from normal candidate login (`/login`).
