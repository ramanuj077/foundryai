-- Add new columns to users table for enhanced co-founder matching

-- Professional Background (NEW - Critical!)
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_status VARCHAR(50); -- Student, Working Professional, Entrepreneur, Freelancer

-- Role/Experience fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS startup_experience VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_roles TEXT[];

-- Co-founder matching preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for VARCHAR(100); -- What role they seek
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_commitment VARCHAR(50); -- Full-time, part-time, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[]; -- Industry interests: AI, FinTech, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS remote_preference VARCHAR(50); -- Same city, remote OK, etc.

-- Social/Professional links
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Additional helpful fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT; -- Days/times available
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Update the role column to have better options (already exists, but adding comment for reference)
-- Current: 'founder' - Update to support: Technical, Business, Designer, Marketing, etc.

COMMENT ON COLUMN users.professional_status IS 'Student, Working Professional, Entrepreneur, Freelancer';
COMMENT ON COLUMN users.looking_for IS 'What type of co-founder they are seeking: Technical, Business, Designer, Marketing, Domain Expert';
COMMENT ON COLUMN users.time_commitment IS 'Full-time, Part-time, Weekends, Flexible';
COMMENT ON COLUMN users.interests IS 'Array of industry interests: AI/ML, FinTech, EdTech, SaaS, etc.';
COMMENT ON COLUMN users.remote_preference IS 'Same City, Same Country, Remote OK';
COMMENT ON COLUMN users.years_experience IS '0-2, 3-5, 6-10, 10+';
COMMENT ON COLUMN users.startup_experience IS 'New to startups, Worked in startups (1-2), Founded before (serial entrepreneur)';
