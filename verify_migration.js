// Verify database columns exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifySchema() {
    console.log('🔍 Checking if columns exist...\n');

    try {
        // Try a simple insert with minimal data to see what happens
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, email, name, linkedin_url, professional_status, city, profile_completion_percentage')
            .limit(1);

        if (error) {
            console.error('❌ Column check failed:', error.message);
            console.log('\n💡 This confirms the columns do NOT exist in the database!');
            console.log('🔧 You need to run the migration in Supabase SQL Editor.');
            return;
        }

        console.log('✅ Columns exist! Sample data:', data);
        console.log('\n🤔 If columns exist but signup fails, the issue is in the trigger logic.');

    } catch (e) {
        console.error('Fatal error:', e.message);
    }
}

verifySchema();
