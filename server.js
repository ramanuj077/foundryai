const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client (Auth operations)
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Admin Client (Database operations - Always uses Service Role to bypass RLS)
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

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing! Using ANON key (RLS will enforce rules).');
} else {
    console.log('✅ Service Role Key Loaded (Bypassing RLS)');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================
// AUTH ROUTES
// =====================================================

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ success: false, error: authError.message });
        }

        // Create user profile in users table (Use Admin Client!)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email,
                    name,
                    password_hash: await bcrypt.hash(password, 10),
                }
            ])
            .select()
            .single();

        if (userError) {
            return res.status(400).json({ success: false, error: userError.message });
        }

        // Initialize founder status
        await supabaseAdmin
            .from('founder_status')
            .insert([
                {
                    user_id: authData.user.id,
                    current_focus: 'Ideation',
                    blockers: 'None',
                    suggested_action: 'Submit your first idea',
                    stage_progress: 0
                }
            ]);

        res.json({
            success: true,
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Get user profile
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, name, role, stage, location')
            .eq('id', authData.user.id)
            .single();

        if (userError) {
            return res.status(400).json({ success: false, error: userError.message });
        }

        res.json({
            success: true,
            user: userData,
            session: authData.session,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Update user profile
app.put('/api/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Get all fields from body
        const updates = { ...req.body };

        // 2. Remove sensitive/immutable fields for safety
        delete updates.id;
        delete updates.email;
        delete updates.created_at;
        delete updates.password_hash;

        // 3. Update in database
        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select() // Select ALL columns to return fresh data
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, user: data });
    } catch (error) {
        console.error('Server error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// IDEAS ROUTES
// =====================================================

app.post('/api/ideas', async (req, res) => {
    try {
        const { userId, title, description, problem, solution, market } = req.body;

        const { data, error } = await supabaseAdmin
            .from('ideas')
            .insert([
                {
                    user_id: userId,
                    title,
                    description,
                    solution,
                    market,
                    media_url: req.body.mediaUrl, // Store video/PPT link
                    stage: 'ideation',
                    validation_score: 0,
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, idea: data });
    } catch (error) {
        console.error('Create idea error:', error);
        res.status(500).json({ success: false, error: 'Failed to create idea' });
    }
});

app.get('/api/ideas', async (req, res) => {
    try {
        const { userId } = req.query;

        let query = supabaseAdmin
            .from('ideas')
            .select('*, idea_validations(*)') // Fetch feedback with ideas
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, ideas: data });
    } catch (error) {
        console.error('Get ideas error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ideas' });
    }
});

// Validation Feed Route (Must be before :id)
app.get('/api/ideas/feed', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        // 1. Get list of ideas the user has already validated
        const { data: validations, error: validationError } = await supabaseAdmin
            .from('idea_validations')
            .select('idea_id')
            .eq('user_id', userId);

        if (validationError && validationError.code !== '42P01') { // Ignore "relation does not exist" if table missing
            console.error('Error fetching validations:', validationError);
            // Continue if table doesn't exist, treat as empty
        }

        const validatedIdeaIds = validations ? validations.map(v => v.idea_id) : [];

        // 2. Fetch ideas NOT created by user AND NOT validated by user
        let query = supabaseAdmin
            .from('ideas')
            .select('*, users(name, stage)')
            .neq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (validatedIdeaIds.length > 0) {
            query = query.not('id', 'in', `(${validatedIdeaIds.join(',')})`);
        }

        const { data: ideas, error: ideasError } = await query;

        if (ideasError) {
            return res.status(400).json({ success: false, error: ideasError.message });
        }

        res.json({ success: true, ideas });

    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/ideas/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('ideas')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) {
            return res.status(404).json({ success: false, error: 'Idea not found' });
        }

        res.json({ success: true, idea: data });
    } catch (error) {
        console.error('Get idea error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch idea' });
    }
});

// =====================================================
// FOUNDER STATUS ROUTES
// =====================================================

app.get('/api/founder-status/:userId', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('founder_status')
            .select('*')
            .eq('user_id', req.params.userId)
            .single();

        if (error && error.code !== 'PGRST116') { // Not found error
            return res.status(400).json({ success: false, error: error.message });
        }

        // If no status exists, create one
        if (!data) {
            const { data: newData, error: createError } = await supabaseAdmin
                .from('founder_status')
                .insert([
                    {
                        user_id: req.params.userId,
                        current_focus: 'Validation',
                        blockers: 'Co-founder, MVP scope',
                        suggested_action: 'Activate co-founder matching',
                        stage_progress: 0
                    }
                ])
                .select()
                .single();

            if (createError) {
                return res.status(400).json({ success: false, error: createError.message });
            }

            return res.json({ success: true, status: newData });
        }

        res.json({ success: true, status: data });
    } catch (error) {
        console.error('Get founder status error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch status' });
    }
});

app.put('/api/founder-status/:userId', async (req, res) => {
    try {
        const { current_focus, blockers, suggested_action, stage_progress } = req.body;

        const { data, error } = await supabaseAdmin
            .from('founder_status')
            .update({
                current_focus,
                blockers,
                suggested_action,
                stage_progress,
            })
            .eq('user_id', req.params.userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, status: data });
    } catch (error) {
        console.error('Update founder status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

// =====================================================
// CO-FOUNDER MATCHING ROUTES
// =====================================================

app.get('/api/matches', async (req, res) => {
    try {
        const { userId } = req.query;

        // 1. Fetch Current User Profile
        const { data: userA, error: errA } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (errA) return res.status(400).json({ success: false, error: 'User not found' });
        if (!userA) return res.status(404).json({ success: false, error: 'User not found' });

        // 2. Fetch Potential Matches (exclude self)
        const { data: candidates, error: errB } = await supabaseAdmin
            .from('users')
            .select('*')
            .neq('id', userId)
            .limit(50); // Analyze top 50 candidates

        if (errB) return res.status(400).json({ success: false, error: errB.message });

        // 3. Get existing connection statuses
        const { data: connections } = await supabaseAdmin
            .from('cofounder_matches')
            .select('matched_user_id, status')
            .eq('user_id', userId)
            .in('matched_user_id', candidates.map(u => u.id));

        const connectionMap = {};
        if (connections) {
            connections.forEach(c => { connectionMap[c.matched_user_id] = c.status; });
        }

        // 4. Calculate Advanced Match Scores
        const matches = candidates.map(userB => {
            let score = 0;
            let maxScore = 0;

            // --- A. SKILLS & ROLE (35 Points) ---
            const userASkills = userA.skills || [];
            const userBSkills = userB.skills || [];
            const commonSkills = userBSkills.filter(s => userASkills.some(as => as.toLowerCase() === s.toLowerCase()));

            // Helper to infer role from primary skill
            const getRole = (skill) => {
                if (!skill) return 'Other';
                skill = skill.toLowerCase();
                if (['engineering', 'ai/ml', 'data science', 'development', 'full stack', 'backend', 'frontend'].some(s => skill.includes(s))) return 'Technical';
                if (['business', 'marketing', 'sales', 'operations', 'finance', 'legal', 'strategy'].some(s => skill.includes(s))) return 'Business';
                if (['product', 'design', 'ux'].some(s => skill.includes(s))) return 'Product';
                return 'Other';
            };

            const userBRole = userB.role || getRole(userB.primary_skill);

            // Skill Synergy: Check if User B matches what User A is looking for
            const lookingForMatch =
                (userA.looking_for === 'Any') ||
                (userA.looking_for === 'Technical' && userBRole === 'Technical') ||
                (userA.looking_for === 'Business' && userBRole === 'Business') ||
                (userA.looking_for === 'Product' && userBRole === 'Product') ||
                (userA.looking_for === userB.primary_skill); // Direct match

            if (lookingForMatch) score += 20;
            maxScore += 20;

            // Shared Skills (Small bonus for understanding each other, but not too much - we want complementary)
            score += Math.min(10, commonSkills.length * 2);
            maxScore += 10;

            // --- B. COMMITMENT (25 Points) ---
            if (userA.can_commit_20hrs_week === userB.can_commit_20hrs_week) score += 10;
            maxScore += 10;

            if (userA.can_go_fulltime === userB.can_go_fulltime) score += 10;
            maxScore += 10;

            if (userA.okay_with_zero_salary === userB.okay_with_zero_salary) score += 5;
            maxScore += 5;

            // --- C. VALUES & WORKING STYLE (25 Points) ---
            const userAValues = userA.core_values || [];
            const userBValues = userB.core_values || [];
            const commonValues = userBValues.filter(v => userAValues.includes(v));

            score += (commonValues.length * 5); // Up to 15 points
            maxScore += 15;

            if (userA.decision_making_style === userB.decision_making_style) score += 10;
            maxScore += 10;

            // --- D. LOGISTICS (15 Points) ---
            if (userA.location === userB.location || userA.city === userB.city) {
                score += 15;
            } else if (userA.remote_preference === 'Fully Remote' && userB.remote_preference === 'Fully Remote') {
                score += 15;
            }
            maxScore += 15;

            // Normalize to 100
            let finalScore = Math.round((score / maxScore) * 100);

            // Random jitter to make it feel organic (avoid everyone being 70%)
            // and act as a tie-breaker
            finalScore = Math.min(98, Math.max(40, finalScore + Math.floor(Math.random() * 5)));

            return {
                ...userB,
                match_score: finalScore,
                connection_status: connectionMap[userB.id] || null
            };
        }).sort((a, b) => b.match_score - a.match_score);

        res.json({ success: true, matches });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch matches' });
    }
});

app.get('/api/matches/requests', async (req, res) => {
    try {
        const { userId } = req.query;

        // Fetch Incoming (Received)
        const { data: incoming, error: inError } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`
                id,
                status,
                sender:users!user_id (id, name, stage, role, skills, location)
            `)
            .eq('matched_user_id', userId)
            .eq('status', 'pending');

        if (inError) throw inError;

        // Fetch Outgoing (Sent)
        const { data: outgoing, error: outError } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`
                id,
                status,
                receiver:users!matched_user_id (id, name, stage, role, skills, location)
            `)
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (outError) throw outError;

        res.json({ success: true, requests: incoming, sent: outgoing });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
});

app.get('/api/connections', async (req, res) => {
    try {
        const { userId } = req.query;

        // We use explicit embedding to avoid ambiguity
        // If users!matched_user_id doesn't work, we might need to rely on the fact that we've set up correct FKs

        const { data: asSender, error: err1 } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`id, status, partner:users!matched_user_id(id, name, role)`)
            .eq('user_id', userId)
            .eq('status', 'accepted');

        const { data: asReceiver, error: err2 } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`id, status, partner:users!user_id(id, name, role)`)
            .eq('matched_user_id', userId)
            .eq('status', 'accepted');

        if (err1) console.error('Error fetching connections (sender):', err1);
        if (err2) console.error('Error fetching connections (receiver):', err2);

        if (err1 || err2) throw err1 || err2;

        const allConnections = [...(asSender || []), ...(asReceiver || [])];

        // Deduplicate by partner ID
        const uniqueConnections = [];
        const seenIds = new Set();

        allConnections.forEach(c => {
            // Check if partner exists (sometimes join fails if user deleted)
            if (c.partner && !seenIds.has(c.partner.id)) {
                seenIds.add(c.partner.id);
                // Standardize partner object for frontend
                uniqueConnections.push({
                    id: c.id, // match id
                    status: c.status,
                    partner: c.partner
                });
            }
        });

        res.json({ success: true, connections: uniqueConnections });
    } catch (error) {
        console.error('Get connections error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch connections' });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const { connectionId } = req.query;
        const { data, error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('connection_id', connectionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ success: true, messages: data });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { connectionId, senderId, content } = req.body;
        const { data, error } = await supabaseAdmin
            .from('messages')
            .insert([{ sender_id: senderId, content, connection_id: connectionId }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: data });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
    }
});

app.post('/api/matches/:id/respond', async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'
        const { error } = await supabaseAdmin
            .from('cofounder_matches')
            .update({ status })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Respond match error:', error);
        res.status(500).json({ success: false, error: 'Failed to respond' });
    }
});

// Original Create Match Route (unchanged but context)
app.post('/api/matches', async (req, res) => {
    try {
        const { userId, matchedUserId } = req.body;

        const { data, error } = await supabaseAdmin
            .from('cofounder_matches')
            .insert([
                {
                    user_id: userId,
                    matched_user_id: matchedUserId,
                    match_score: 85, // Default score
                    status: 'pending',
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.json({ success: false, error: 'Request already sent!' }); // Unique constraint
            throw error;
        }

        res.json({ success: true, match: data });
    } catch (error) {
        console.error('Create match error:', error);
        res.status(500).json({ success: false, error: 'Failed to create match' });
    }
});

// =====================================================
// RESOURCES ROUTES
// =====================================================

app.get('/api/resources', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, resources: data });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch resources' });
    }
});

// =====================================================
// AI COPILOT ROUTES
// =====================================================

app.post('/api/copilot/chat', async (req, res) => {
    try {
        const { userId, ideaId, message } = req.body;

        // Simulate AI response (replace with actual AI API)
        const aiResponses = [
            "That's an interesting idea! Have you validated this problem with potential users yet?",
            "Great question. Let's break this down: What's your unfair advantage in this space?",
            "I'd recommend starting with a smaller, specific problem. Who exactly are your first 10 customers?",
            "Have you calculated the TAM (Total Addressable Market) for this solution?",
            "What would make a customer switch from their current solution to yours?",
        ];

        const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

        // Store conversation
        const messages = [
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
        ];

        const { data, error } = await supabaseAdmin
            .from('copilot_conversations')
            .insert([
                {
                    user_id: userId,
                    idea_id: ideaId,
                    messages,
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, response: aiResponse });
    } catch (error) {
        console.error('Copilot chat error:', error);
        res.status(500).json({ success: false, error: 'Failed to get AI response' });
    }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabase: !!process.env.SUPABASE_URL,
    });
});

// =====================================================
// RESOURCE GAMIFICATION
// =====================================================

app.post('/api/resources/:id/complete', async (req, res) => {
    try {
        const resourceId = req.params.id;
        const { userId, duration } = req.body; // duration format like "45 min"

        if (!userId || !resourceId) {
            return res.status(400).json({ success: false, error: 'User ID and Resource ID are required' });
        }

        // Check if already completed
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('user_resources')
            .select('id')
            .eq('user_id', userId)
            .eq('resource_id', resourceId)
            .single();

        if (existing) {
            return res.json({ success: true, message: 'Already completed', points: 0 });
        }

        // Calculate points (10 pts per minute, default 10 if unknown)
        let points = 10;
        if (duration) {
            const minutes = parseInt(duration.split(' ')[0]) || 1;
            points = minutes * 10;
        }

        // 1. Record completion
        const { error: insertError } = await supabaseAdmin
            .from('user_resources')
            .insert([{ user_id: userId, resource_id: resourceId, completed_at: new Date() }]);

        if (insertError) {
            // Ignore duplicate key error if race condition
            if (insertError.code !== '23505') {
                console.error('Error logging resource completion:', insertError);
                return res.status(500).json({ success: false, error: 'Failed to complete resource' });
            }
        }

        // 2. Award Points
        // Fetch current points first (or increment via RPC if available, but simple update for MVP)
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user points:', userError);
            return res.status(500).json({ success: false, error: 'Failed to update points' });
        }

        const newPoints = (user.points || 0) + points;

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ points: newPoints })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user points:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to update points' });
        }

        res.json({ success: true, points: newPoints, awarded: points });

    } catch (error) {
        console.error('Complete resource error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});




// =====================================================
// VALIDATION FEED ROUTES
// =====================================================

// Get ideas feed for validation (exclude own ideas and already validated ones)
app.get('/api/ideas/feed', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const { data: validations, error: validationError } = await supabaseAdmin
            .from('idea_validations')
            .select('idea_id')
            .eq('user_id', userId);

        if (validationError && validationError.code !== '42P01') { // Ignore "relation does not exist" if table missing
            console.error('Error fetching validations:', validationError);
            // Continue if table doesn't exist, treat as empty
        }

        const validatedIdeaIds = validations ? validations.map(v => v.idea_id) : [];

        // 2. Fetch ideas NOT created by user AND NOT validated by user
        let query = supabaseAdmin
            .from('ideas')
            .select('*, users(name, stage)')
            .neq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (validatedIdeaIds.length > 0) {
            query = query.not('id', 'in', `(${validatedIdeaIds.join(',')})`);
        }

        const { data: ideas, error: ideasError } = await query;

        if (ideasError) {
            return res.status(400).json({ success: false, error: ideasError.message });
        }

        res.json({ success: true, ideas });

    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit Validation (Tick/Cross)
app.post('/api/ideas/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, voteType, feedback } = req.body; // voteType: 'tick' or 'cross'

        if (!['tick', 'cross'].includes(voteType)) {
            return res.status(400).json({ success: false, error: 'Invalid vote type' });
        }
        if (!feedback || feedback.trim().length < 5) {
            return res.status(400).json({ success: false, error: 'Feedback is required (min 5 chars)' });
        }

        // 1. Record validation
        const { error: insertError } = await supabaseAdmin
            .from('idea_validations')
            .insert({
                idea_id: id,
                user_id: userId,
                vote_type: voteType,
                feedback
            });

        if (insertError) {
            // Check for duplicate vote
            if (insertError.code === '23505') { // Unique violation
                return res.json({ success: false, error: 'You have already validated this idea' });
            }
            throw insertError;
        }

        // 2. Update Idea Validation Score
        // Fetch current votes
        const { data: allVotes } = await supabaseAdmin
            .from('idea_validations')
            .select('vote_type')
            .eq('idea_id', id);

        if (allVotes) {
            const total = allVotes.length;
            const ticks = allVotes.filter(v => v.vote_type === 'tick').length;
            const score = Math.round((ticks / total) * 100);

            await supabaseAdmin
                .from('ideas')
                .update({ validation_score: score })
                .eq('id', id);
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// RESOURCES ROUTES (Videos)
// =====================================================

// Get all resources (videos)
app.get('/api/resources', async (req, res) => {
    try {
        const { data: resources, error } = await supabaseAdmin
            .from('resources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Resources fetch error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, resources });
    } catch (error) {
        console.error('Resources error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Complete a resource (video) - Award points
app.post('/api/resources/:id/complete', async (req, res) => {
    try {
        const resourceId = req.params.id;
        const { userId, duration } = req.body; // duration format like "45 min"

        if (!userId || !resourceId) {
            return res.status(400).json({ success: false, error: 'User ID and Resource ID are required' });
        }

        // Check if already completed
        const { data: existing, error: existingError } = await supabaseAdmin
            .from('user_resources')
            .select('id')
            .eq('user_id', userId)
            .eq('resource_id', resourceId)
            .single();

        if (existing) {
            return res.json({ success: true, message: 'Already completed', points: 0 });
        }

        // Calculate points (10 pts per minute, default 10 if unknown)
        let points = 10;
        if (duration) {
            const minutes = parseInt(duration.split(' ')[0]) || 1;
            points = minutes * 10;
        }

        // 1. Record completion
        const { error: insertError } = await supabaseAdmin
            .from('user_resources')
            .insert([{ user_id: userId, resource_id: resourceId, completed_at: new Date() }]);

        if (insertError) {
            // Ignore duplicate key error if race condition
            if (insertError.code !== '23505') {
                console.error('Error logging resource completion:', insertError);
                return res.status(500).json({ success: false, error: 'Failed to complete resource' });
            }
        }

        // 2. Award Points - Fetch current points first
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user points:', userError);
            return res.status(500).json({ success: false, error: 'Failed to update points' });
        }

        const newPoints = (user.points || 0) + points;

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ points: newPoints })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user points:', updateError);
            return res.status(500).json({ success: false, error: 'Failed to update points' });
        }

        res.json({ success: true, points: newPoints, awarded: points });

    } catch (error) {
        console.error('Complete resource error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// =====================================================
// CO-FOUNDER MATCHING & PROFILE ROUTES
// =====================================================

// Update User Profile (Auto-save friendly - accepts partial updates)
app.put('/api/users/:id/profile', async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body; // Accept any profile fields

        // Remove fields that shouldn't be updated via this endpoint
        delete updates.id;
        delete updates.email;
        delete updates.password_hash;
        delete updates.created_at;

        // Update user profile
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Profile update error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({
            success: true,
            user,
            profile_completion_percentage: user.profile_completion_percentage || 0
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get User Profile (with completion status)
app.get('/api/users/:id/profile', async (req, res) => {
    try {
        const userId = req.params.id;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user,
            tiers: {
                tier_1: user.tier_1_complete || false,
                tier_2: user.tier_2_complete || false,
                tier_3: user.tier_3_complete || false,
                tier_4: user.tier_4_complete || false
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================================
// CO-FOUNDER MATCHING ALGORITHM
// =====================================================

// Helper function to calculate match score
function calculateMatchScore(user1, user2) {
    let score = 0;

    // 1. Complementary Skills (25 points) - HIGHEST WEIGHT
    if (user1.looking_for && user2.primary_skill) {
        if (user1.looking_for.toLowerCase().includes(user2.primary_skill.toLowerCase())) {
            score += 15;
        }
    }
    if (user2.looking_for && user1.primary_skill) {
        if (user2.looking_for.toLowerCase().includes(user1.primary_skill.toLowerCase())) {
            score += 10;
        }
    }

    // 2. Industry Alignment (15 points)
    if (user1.industry_interests && user2.industry_interests) {
        const commonInterests = user1.industry_interests.filter(i =>
            user2.industry_interests.includes(i)
        );
        score += Math.min(commonInterests.length * 5, 15);
    }

    // 3. Commitment Level Match (20 points)
    if (user1.can_commit_20hrs_week === user2.can_commit_20hrs_week) {
        score += 10;
    }
    if (user1.can_go_fulltime === user2.can_go_fulltime) {
        score += 10;
    }

    // 4. Location/Remote Preference (15 points)
    if (user1.city && user2.city && user1.city === user2.city) {
        score += 10;
    }
    if (user1.remote_preference === 'Fully Remote' || user2.remote_preference === 'Fully Remote') {
        score += 5;
    }

    // 5. Stage Alignment (10 points)
    if (user1.stage === user2.stage) {
        score += 10;
    }

    // 6. Values Alignment (10 points)
    if (user1.core_values && user2.core_values) {
        const commonValues = user1.core_values.filter(v =>
            user2.core_values.includes(v)
        );
        score += Math.min(commonValues.length * 3, 10);
    }

    // 7. Profile Completion Bonus (5 points)
    if (user1.tier_3_complete && user2.tier_3_complete) {
        score += 5;
    }

    return Math.min(Math.round(score), 100);
}

// Get Potential Matches
app.get('/api/matches', async (req, res) => {
    try {
        const { userId, minScore = 50, limit = 20 } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        // Get current user
        const { data: currentUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !currentUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // User must have tier 3 complete to access matching
        if (!currentUser.tier_3_complete) {
            return res.json({
                success: false,
                error: 'Complete your profile (Tier 3) to access co-founder matching',
                tier_required: 3,
                current_completion: currentUser.profile_completion_percentage
            });
        }

        // Get all users except current user, with tier 3 complete
        const { data: potentialMatches, error: matchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .neq('id', userId)
            .eq('tier_3_complete', true);

        if (matchError) {
            console.error('Match fetch error:', matchError);
            return res.status(400).json({ success: false, error: matchError.message });
        }

        // Get existing connections/requests to exclude
        const { data: existingConnections } = await supabaseAdmin
            .from('cofounder_matches')
            .select('matched_user_id')
            .eq('user_id', userId);

        const { data: receivedRequests } = await supabaseAdmin
            .from('cofounder_matches')
            .select('user_id')
            .eq('matched_user_id', userId);

        const excludeIds = new Set([
            ...(existingConnections || []).map(c => c.matched_user_id),
            ...(receivedRequests || []).map(c => c.user_id)
        ]);

        // Calculate match scores and filter
        const matches = potentialMatches
            .filter(user => !excludeIds.has(user.id))
            .map(user => ({
                ...user,
                match_score: calculateMatchScore(currentUser, user),
                mutual_interests: currentUser.industry_interests?.filter(i =>
                    user.industry_interests?.includes(i)
                ) || [],
                mutual_values: currentUser.core_values?.filter(v =>
                    user.core_values?.includes(v)
                ) || []
            }))
            .filter(user => user.match_score >= parseInt(minScore))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            matches,
            total: matches.length
        });

    } catch (error) {
        console.error('Matches error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Connection Request
app.post('/api/matches', async (req, res) => {
    try {
        const { userId, matchedUserId } = req.body;

        if (!userId || !matchedUserId) {
            return res.status(400).json({ success: false, error: 'userId and matchedUserId are required' });
        }

        // Check if request already exists
        const { data: existing } = await supabaseAdmin
            .from('cofounder_matches')
            .select('id')
            .eq('user_id', userId)
            .eq('matched_user_id', matchedUserId)
            .single();

        if (existing) {
            return res.json({ success: false, error: 'Connection request already sent' });
        }

        // Create connection request
        const { data, error } = await supabaseAdmin
            .from('cofounder_matches')
            .insert([{
                user_id: userId,
                matched_user_id: matchedUserId,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Create match error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, match: data });

    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Connection Requests (Incoming & Sent)
app.get('/api/matches/requests', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        // Get incoming requests (where user is matched_user_id)
        const { data: incomingRequests, error: inError } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`
                id,
                status,
                matched_at,
                sender:users!cofounder_matches_user_id_fkey(
                    id, name, role, bio, location, 
                    primary_skill, industry_interests, profile_completion_percentage
                )
            `)
            .eq('matched_user_id', userId)
            .eq('status', 'pending');

        // Get sent requests (where user is user_id)
        const { data: sentRequests, error: sentError } = await supabaseAdmin
            .from('cofounder_matches')
            .select(`
                id,
                status,
                matched_at,
                recipient:users!cofounder_matches_matched_user_id_fkey(
                    id, name, role, bio, location,
                    primary_skill, industry_interests, profile_completion_percentage
                )
            `)
            .eq('user_id', userId);

        if (inError || sentError) {
            console.error('Requests fetch error:', inError || sentError);
            return res.status(400).json({ success: false, error: (inError || sentError).message });
        }

        res.json({
            success: true,
            requests: incomingRequests || [],
            sent: sentRequests || []
        });

    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Respond to Connection Request (Accept/Reject)
app.post('/api/matches/:id/respond', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Status must be accepted or rejected' });
        }

        const { data, error } = await supabaseAdmin
            .from('cofounder_matches')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Respond error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, match: data });

    } catch (error) {
        console.error('Respond to request error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// SERVE INDEX.HTML FOR SPA (MUST BE LAST)
// =====================================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// START SERVER
// =====================================================

// Only start server if run directly (not imported as Vercel function)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 FoundryAI server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🗄️  Database: ${process.env.SUPABASE_URL ? 'Supabase Connected' : 'No Supabase configured'}`);
    });
}

module.exports = app;
