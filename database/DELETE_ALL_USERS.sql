-- =====================================================
-- DELETE ALL USERS AND RELATED DATA (FIXED)
-- Clean slate for testing new profile system
-- =====================================================

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = 'replica';

-- Delete all user-related data in correct order
-- Note: 'connections' table was removed as it doesn't exist (handled by cofounder_matches)

DELETE FROM cofounder_matches;
DELETE FROM messages;
DELETE FROM idea_validations;
DELETE FROM ideas;
DELETE FROM founder_status;
DELETE FROM user_resources;

-- Delete all users (this will also delete from auth.users due to CASCADE)
DELETE FROM public.users;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify cleanup
SELECT 
    'users' as table_name, 
    COUNT(*) as remaining_rows 
FROM public.users
UNION ALL
SELECT 'ideas', COUNT(*) FROM ideas
UNION ALL
SELECT 'founder_status', COUNT(*) FROM founder_status
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'cofounder_matches', COUNT(*) FROM cofounder_matches;

-- Success message
SELECT '✅ All users and related data deleted! Ready for fresh signups.' as status;
