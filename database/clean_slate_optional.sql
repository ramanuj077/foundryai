-- =====================================================
-- CLEAN SLATE - DELETE OLD USER DATA (OPTIONAL)
-- Run this if you want to start fresh with the new system
-- =====================================================

-- WARNING: This will delete ALL users and related data!
-- Only run this if you're sure you want a clean start.

-- Delete all user-related data
DELETE FROM user_resources;
DELETE FROM copilot_conversations;
DELETE FROM cofounder_matches;
DELETE FROM founder_status;
DELETE FROM validations;
DELETE FROM ideas;
DELETE FROM users;

-- Reset sequences if needed
-- (PostgreSQL will auto-handle this, but good to be explicit)

-- Verify everything is clean
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'ideas', COUNT(*) FROM ideas
UNION ALL
SELECT 'cofounder_matches', COUNT(*) FROM cofounder_matches;

-- If all counts are 0, you're good to go! ✅
