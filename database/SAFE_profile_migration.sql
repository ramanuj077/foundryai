-- =====================================================
-- SAFE RE-RUNNABLE PROFILE SCHEMA MIGRATION
-- Drops existing objects first, then recreates everything
-- =====================================================

-- Drop existing trigger and function (if they exist)
DROP TRIGGER IF EXISTS update_profile_completion ON users;
DROP FUNCTION IF EXISTS calculate_profile_completion();

-- Add all the new profile columns (IF NOT EXISTS for safety)
-- Tier 2: Basic Profile (30%)
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Tier 3: Co-Founder Matching (80%)
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_commit_20hrs_week BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_go_fulltime TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS okay_with_zero_salary BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_without_pay_duration TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_have_skills TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deal_breakers TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS remote_preference TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_skill TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_idea TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS idea_stage TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_interests TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS open_to_pivot BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expected_equity TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS okay_with_vesting BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_invest_money BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_amount_range TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS decision_making_style TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS conflict_handling TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_style TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS core_values TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_built_before BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_failure_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quit_triggers TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS comfortable_with_uncertainty BOOLEAN;

-- Tier 4: Premium Signals (100%)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_project_willing BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS why_10_10_cofounder TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_sign_agreements BOOLEAN;

-- Profile completion tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_2_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_3_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_4_complete BOOLEAN DEFAULT FALSE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    tier_2_fields INTEGER := 0;
    tier_3_fields INTEGER := 0;
    tier_4_fields INTEGER := 0;
    completion INTEGER := 5; -- Base 5% for tier 1 (email verified)
BEGIN
    -- Tier 2: Basic Profile (25% = 30% total)
    IF NEW.professional_status IS NOT NULL THEN tier_2_fields := tier_2_fields + 1; END IF;
    IF NEW.city IS NOT NULL THEN tier_2_fields := tier_2_fields + 1; END IF;
    IF NEW.linkedin_url IS NOT NULL THEN tier_2_fields := tier_2_fields + 1; END IF;
    IF NEW.stage IS NOT NULL THEN tier_2_fields := tier_2_fields + 1; END IF;
    IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN tier_2_fields := tier_2_fields + 1; END IF;
    IF NEW.bio IS NOT NULL AND length(NEW.bio) > 10 THEN tier_2_fields := tier_2_fields + 1; END IF;
    
    IF tier_2_fields >= 6 THEN
        NEW.tier_2_complete := TRUE;
        completion := completion + 25;
    ELSE
        NEW.tier_2_complete := FALSE;
    END IF;
    
    -- Tier 3: Co-Founder Matching (50% = 80% total)
    IF NEW.can_commit_20hrs_week IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.can_go_fulltime IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.okay_with_zero_salary IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.looking_for IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.remote_preference IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.primary_skill IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.has_idea IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.industry_interests IS NOT NULL AND array_length(NEW.industry_interests, 1) > 0 THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.expected_equity IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.decision_making_style IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.core_values IS NOT NULL AND array_length(NEW.core_values, 1) > 0 THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.has_built_before IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    IF NEW.comfortable_with_uncertainty IS NOT NULL THEN tier_3_fields := tier_3_fields + 1; END IF;
    
    IF tier_3_fields >= 10 AND NEW.tier_2_complete THEN
        NEW.tier_3_complete := TRUE;
        completion := completion + 50;
    ELSE
        NEW.tier_3_complete := FALSE;
    END IF;
    
    -- Tier 4: Premium Signals (20% = 100% total)
    IF NEW.trial_project_willing IS NOT NULL THEN tier_4_fields := tier_4_fields + 1; END IF;
    IF NEW.why_10_10_cofounder IS NOT NULL AND length(NEW.why_10_10_cofounder) > 50 THEN tier_4_fields := tier_4_fields + 1; END IF;
    
    IF tier_4_fields >= 2 AND NEW.tier_3_complete THEN
        NEW.tier_4_complete := TRUE;
        completion := completion + 20;
    ELSE
        NEW.tier_4_complete := FALSE;
    END IF;
    
    NEW.profile_completion_percentage := completion;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_profile_completion
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_profile_completion();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_completion ON users(profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_users_tier_3 ON users(tier_3_complete);
CREATE INDEX IF NOT EXISTS idx_users_primary_skill ON users(primary_skill);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Success message
COMMENT ON COLUMN users.profile_completion_percentage IS 'Auto-calculated: 5% (Tier 1) + 25% (Tier 2) + 50% (Tier 3) + 20% (Tier 4)';

SELECT 'Migration completed successfully! All columns and triggers are ready.' as status;
