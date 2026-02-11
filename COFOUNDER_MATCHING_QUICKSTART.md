# 🚀 CO-FOUNDER MATCHING - QUICK START GUIDE

## Step 1: Update Database Schema

### Run this SQL in Supabase Dashboard → SQL Editor:

1. Go to https://supabase.com
2. Open your FoundryAI project
3. Click "SQL Editor" in sidebar
4. Click "New query"
5. Copy the ENTIRE contents of `database/complete_user_profile_schema.sql`
6. Paste and click "Run"
7. You should see "Success" ✅

This adds ~40 new columns to the `users` table and creates the auto-completion trigger.

---

## Step 2: What I'm Building Next

### 🔧 Backend API (server.js)
I'll add these endpoints:
- `PUT /api/users/:id/profile` - Save profile fields
- `GET /api/users/:id/profile` - Get profile
- `GET /api/matches?userId=X` - Get potential matches
- `POST /api/matches` - Send connection request
- `GET /api/matches/requests?userId=X` - Get requests
- `POST /api/matches/:id/respond` - Accept/reject

### 🎨 Frontend Components
1. **Enhanced Profile Wizard** (10-step form with auto-save)
2. **Progress Bar** (in header)
3. **Feature Gate Cards** (locked features)
4. **Matches Dashboard** (with filters)
5. **Match Score Display** (visual percentage)

### 🧠 Matching Algorithm
Smart scoring based on:
- Complementary skills (25 pts)
- Industry alignment (15 pts)
- Commitment match (20 pts)
- Location (15 pts)
- Stage alignment (10 pts)
- Values (10 pts)
- Profile completion bonus (5 pts)

---

## Step 3: Timeline

**TODAY:** Database + Backend API  
**TOMORROW:** Profile Wizard + UX  
**DAY 3:** Matching System + Testing

---

## 📁 Files Created

1. ✅ `database/complete_user_profile_schema.sql` - Full schema
2. ✅ `COFOUNDER_MATCHING_PLAN.md` - Detailed implementation plan
3. ✅ `COFOUNDER_MATCHING_QUICKSTART.md` - This file

---

## ⚡ Your Action Items

1. **Run the SQL migration** (Step 1 above)
2. **Let me know when done** - I'll build the rest!

---

**Questions?** Just ask! Let's build the best co-founder matching platform! 🎉
