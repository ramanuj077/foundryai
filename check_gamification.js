const { createClient } = require('@supabase/supabase-js');
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

async function applyGamification() {
    try {
        console.log('🎮 Applying gamification schema...');

        // Since we can't run DDL via supabase-js, we'll check if columns exist
        // by trying to query them

        // 1. Test if 'points' column exists
        console.log('Testing points column...');
        const { error: pointsError } = await supabaseAdmin
            .from('users')
            .select('points')
            .limit(1);

        if (pointsError) {
            console.log('⚠️  Points column not found. Please run this SQL in Supabase SQL Editor:');
            console.log('-'.repeat(60));
            console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;');
            console.log('-'.repeat(60));
        } else {
            console.log('✅ Points column exists!');
        }

        // 2. Test if 'user_resources' table exists
        console.log('\nTesting user_resources table...');
        const { error: tableError } = await supabaseAdmin
            .from('user_resources')
            .select('id')
            .limit(1);

        if (tableError) {
            console.log('⚠️  user_resources table not found. Please run this SQL in Supabase SQL Editor:');
            console.log('-'.repeat(60));
            console.log(`CREATE TABLE IF NOT EXISTS user_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);`);
            console.log('-'.repeat(60));
        } else {
            console.log('✅ user_resources table exists!');
        }

        console.log('\n🎮 Gamification check complete!');
        console.log('If you saw SQL commands above, please run them in your Supabase Dashboard > SQL Editor');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

applyGamification();
