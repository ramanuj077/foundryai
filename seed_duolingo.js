const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const resourceContent = `# 🎯 What "Duolingo of Entrepreneurship" REALLY Means

Duolingo is **not**:
* Just videos
* Just lessons
* Just streaks

Duolingo is:
> **A habit-forming learning OS with tight feedback loops**

For entrepreneurship, that means:
* Learning → Applying → Feedback → Progress → Motivation

---

# 🧠 CORE PRINCIPLES (NON-NEGOTIABLE)

If you skip these, it becomes another Udemy.

### 1️⃣ Learning must be **Action-linked**
No lesson ends without:
* A real-world task
* Or applying to *their own startup*

### 2️⃣ Progress must feel **earned**
No skipping without mastery.

### 3️⃣ Feedback must be **instant**
AI + peer + system feedback.

### 4️⃣ Motivation must be **identity-based**
“I am becoming a founder” not “I finished a course”.

---

# 🧱 SYSTEM ARCHITECTURE (HIGH LEVEL)

\`\`\`
Learning Engine
│
├── Curriculum Graph (not linear)
├── Lesson Engine
├── Video Engine
├── Practice Engine
├── AI Feedback Engine
├── Gamification Engine
└── Progress Intelligence
\`\`\`

---

# 📚 CURRICULUM DESIGN (NOT COURSES)

### ❌ Wrong
* Course 1: Ideation
* Course 2: Market Research

### ✅ Right (Duolingo-style SKILLS)
Think in **skills**, not topics.

Example Skill Tree:
\`\`\`
Entrepreneurship Basics
├── Problem Clarity
├── Customer Interviews
├── Market Sizing
├── Pricing Logic
├── MVP Thinking
├── Storytelling
├── Fundraising Basics
\`\`\`

Each **skill** has:
* Levels (Beginner → Intermediate → Advanced)
* Unlock rules
* XP weight

---

# 🎥 VIDEO SYSTEM (IMPORTANT)

### How Duolingo would do video (if it did)
Videos are **supporting material**, not the main experience.

### Video Rules:
* Max 5–8 minutes
* Always followed by interaction
* Never passive

### Video Types:
1. **Concept Explainers**
2. **Founder Stories (India-focused)**
3. **Failure Breakdowns**
4. **Investor POV Clips**

### After every video:
* 1 quiz
* 1 application task
* 1 reflection question

---

# 🧪 PRACTICE ENGINE (MOST IMPORTANT)

Every lesson must include at least ONE:

### Practice Types
* Multiple choice (fast feedback)
* Scenario decision (“What would you do?”)
* Short written response
* Apply-to-your-startup task

Example:
> “Write the ONE sentence problem statement for your startup.”

AI checks:
* Clarity
* Vagueness
* Assumptions

---

# 🤖 AI FEEDBACK ENGINE

This is where you **beat every course platform**.

### AI roles:
* Coach (asks questions)
* Critic (points flaws)
* Validator (checks logic)

### Example Flow:
User submits:
> “My startup helps everyone save time.”

AI responds:
* “Who specifically?”
* “Doing what task?”
* “Compared to what?”

No progress until fixed.

---

# 🎮 GAMIFICATION (DO THIS CAREFULLY)

### XP System
* Watching video: +10 XP
* Passing quiz: +30 XP
* Applying to own startup: +50 XP
* Weekly consistency bonus: +100 XP

### Streaks
* Daily: 1 lesson/day
* Weekly: 5 lessons/week
* Break streak? Lose momentum, not all progress.

### Levels (Identity-based)
* Explorer
* Builder
* Founder
* Operator
* Entrepreneur

### Unlockables
* Co-founder visibility boost
* Investor visibility
* Advanced AI features
* Certificates

---

# 📊 PROGRESS INTELLIGENCE (THIS IS ADVANCED)

Track:
* Skills mastered
* Weak areas
* Avoided topics
* Time spent vs outcome

Then:
> “You avoid pricing modules. That’s risky. Want help?”

This makes it feel **alive**.

---

# 🧭 USER FLOW (FIRST 7 DAYS)

### Day 1
* Skill assessment
* First win (easy lesson)
* XP + streak started

### Day 2–3
* Problem clarity
* Customer thinking

### Day 4–5
* Validation basics
* Real task assigned

### Day 6
* Reflection
* Progress summary

### Day 7
* Skill checkpoint
* Level-up moment

---

# 🧑💻 TECH STACK (REALISTIC MVP)

### Frontend
* Next.js
* Video player (Mux / Cloudflare Stream)
* Progress UI

### Backend
* Supabase (auth + DB)
* Skill graph tables
* XP engine

### AI
* LLM (Claude / GPT)
* Prompt templates per skill
* Rubric-based evaluation

---

# 🚫 WHAT NOT TO DO

* ❌ Long videos
* ❌ Certificates without mastery
* ❌ Passive learning
* ❌ “Entrepreneur motivation” fluff
* ❌ Too many features in v1

---

# 🧠 MVP VERSION (90-DAY BUILD)

### v1 Scope:
* 1 skill tree (Idea → Validation)
* 20 lessons
* 10 videos
* Basic XP + streaks
* AI feedback on text answers

That’s enough to test product-market fit.

---

# FINAL TRUTH (IMPORTANT)

If your platform makes users say:
> “I feel smarter after every lesson”
You failed.

If they say:
> “I finally understand what to do next”
You’re winning.`;

async function seed() {
    try {
        console.log('Seeding resource...');
        const { data, error } = await supabaseAdmin
            .from('resources')
            .insert([{
                title: 'Foundry Academy: The Gamified Learning OS',
                description: resourceContent, // Storing full markdown here as TEXT supports it
                type: 'guide',
                url: '', // Internal content
                tags: ['learning', 'gamification', 'mvp', 'startup'],
                difficulty: 'advanced',
                duration: '15 min read'
            }])
            .select();

        if (error) {
            console.error('Error seeding:', error);
        } else {
            console.log('Done! Resource added:', data[0].title);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

seed();
