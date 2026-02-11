-- =====================================================
-- COMPLETE USER PROFILE SCHEMA FOR CO-FOUNDER MATCHING
-- Production-Grade, Scalable Design
-- =====================================================

-- =====================================================
-- TIER 1: Basic Identity (Always Required)
-- =====================================================
-- Already in users table: id, email, name, password_hash, created_at

-- =====================================================
-- TIER 2: Basic Profile Fields
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_relocate VARCHAR(20); -- Yes, No, Depends

ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_status VARCHAR(50);
-- Student, Working Professional, Freelancer, Entrepreneur, Career Break

ALTER TABLE users ADD COLUMN IF NOT EXISTS current_primary_commitment_hours INTEGER; -- Hours per week

-- =====================================================
-- TIER 3: Co-Founder Matching Profile
-- =====================================================

-- A. Commitment & Availability
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_commit_20hrs_week BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_go_fulltime VARCHAR(50); -- Now, 3 months, 6 months, 1 year, Never
ALTER TABLE users ADD COLUMN IF NOT EXISTS okay_with_zero_salary BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_without_pay_duration VARCHAR(50); -- 3 months, 6 months, 1 year, 2+ years

-- B. What You're Looking For
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for VARCHAR(100); 
-- Technical, Business, Product, Designer, Marketing, Any
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_have_skills TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deal_breakers TEXT[]; 
-- Ego, Time mismatch, Location, No tech skills, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS remote_preference VARCHAR(50); 
-- Same City, Same Country, Fully Remote

-- C. Expertise & Skills
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_skill VARCHAR(100);
-- Engineering, Product, Business, Marketing, Operations
ALTER TABLE users ADD COLUMN IF NOT EXISTS tech_stack JSONB; 
-- {languages: [], frameworks: [], databases: [], cloud: [], ai_ml: []}
ALTER TABLE users ADD COLUMN IF NOT EXISTS proof_of_work JSONB;
-- {github: '', portfolio: '', live_products: [], demos: []}

-- D. Idea & Industry
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_idea VARCHAR(50); 
-- Yes, No, Multiple, Open to joining
ALTER TABLE users ADD COLUMN IF NOT EXISTS idea_stage VARCHAR(50);
-- Just an idea, Research done, MVP built, Has users/revenue
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_interests TEXT[];
-- AI, FinTech, EdTech, HealthTech, SaaS, Consumer, Web3, DevTools, Other
ALTER TABLE users ADD COLUMN IF NOT EXISTS open_to_pivot BOOLEAN;

-- E. Equity & Money Reality
ALTER TABLE users ADD COLUMN IF NOT EXISTS expected_equity VARCHAR(50);
-- Equal, Negotiable, Depends on contribution
ALTER TABLE users ADD COLUMN IF NOT EXISTS okay_with_vesting BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_invest_money BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_amount_range VARCHAR(50);
-- ₹0, ₹50k-1L, ₹1L-5L, ₹5L+

-- F. Working Style & Values
ALTER TABLE users ADD COLUMN IF NOT EXISTS decision_making_style VARCHAR(50);
-- Data-driven, Intuition, Consensus
ALTER TABLE users ADD COLUMN IF NOT EXISTS conflict_handling VARCHAR(50);
-- Direct discussion, Mediation, Time to cool down
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_style VARCHAR(50);
-- Structured, Flexible, Fast & chaotic
ALTER TABLE users ADD COLUMN IF NOT EXISTS core_values TEXT[];
-- Transparency, Speed, Quality, Ethics, Growth, Impact, Innovation
ALTER TABLE users ADD COLUMN IF NOT EXISTS feedback_style VARCHAR(50);
-- Direct, Soft, Written
ALTER TABLE users ADD COLUMN IF NOT EXISTS personality_type VARCHAR(50);
-- Introvert, Ambivert, Extrovert
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_time_preference VARCHAR(50);
-- Morning, Night, Flexible

-- G. Risk & Failure
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_built_before BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_failure_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quit_triggers TEXT; -- What would make them quit
ALTER TABLE users ADD COLUMN IF NOT EXISTS comfortable_with_uncertainty BOOLEAN;

-- H. Why & Vision
ALTER TABLE users ADD COLUMN IF NOT EXISTS why_startup TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS five_year_vision TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exit_vs_longterm VARCHAR(50); -- Exit, Long-term, Depends
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_priorities TEXT; -- Family, location, lifestyle

-- I. Social Links (already partially covered, adding missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS intro_video_url TEXT; -- Loom/YouTube 60s intro

-- =====================================================
-- TIER 4: Premium Signals
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_project_willing BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathon_experience TEXT; -- Description
ALTER TABLE users ADD COLUMN IF NOT EXISTS founder_references JSONB;
-- [{name: '', linkedin: '', relationship: ''}]
ALTER TABLE users ADD COLUMN IF NOT EXISTS why_10_10_cofounder TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_ip_conflicts BOOLEAN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_sign_agreements BOOLEAN; -- NDA, Founder Agreement, IP Assignment
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_issues TEXT; -- Any ongoing legal issues

-- =====================================================
-- PROFILE COMPLETION TRACKING
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_1_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_2_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_3_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_4_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- AVAILABILITY & COMMUNICATION
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_for_intro_call BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS best_time_slots TEXT[]; -- Morning, Afternoon, Evening, Weekend
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_communication VARCHAR(50); -- Slack, WhatsApp, Email, Discord

-- =====================================================
-- FREE TEXT & FINAL NOTES
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_notes TEXT; -- Anything else potential co-founder should know

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_professional_status ON users(professional_status);
CREATE INDEX IF NOT EXISTS idx_users_looking_for ON users(looking_for);
CREATE INDEX IF NOT EXISTS idx_users_primary_skill ON users(primary_skill);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_profile_completion ON users(profile_completion_percentage);
CREATE INDEX IF NOT EXISTS idx_users_tier_3_complete ON users(tier_3_complete);
CREATE INDEX IF NOT EXISTS idx_users_industry_interests ON users USING GIN (industry_interests);
CREATE INDEX IF NOT EXISTS idx_users_core_values ON users USING GIN (core_values);

-- =====================================================
-- TRIGGER TO AUTO-CALCULATE PROFILE COMPLETION
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion INT := 0;
    tier1 BOOLEAN := FALSE;
    tier2 BOOLEAN := FALSE;
    tier3 BOOLEAN := FALSE;
    tier4 BOOLEAN := FALSE;
BEGIN
    -- TIER 1: Always complete after signup (5%)
    tier1 := TRUE;
    completion := 5;
    
    -- TIER 2: Basic Profile (25% additional = 30% total)
    IF NEW.professional_status IS NOT NULL 
       AND NEW.city IS NOT NULL 
       AND NEW.stage IS NOT NULL 
       AND NEW.linkedin_url IS NOT NULL 
       AND NEW.skills IS NOT NULL 
       AND NEW.bio IS NOT NULL 
    THEN
        tier2 := TRUE;
        completion := completion + 25;
    END IF;
    
    -- TIER 3: Co-Founder Matching Profile (50% additional = 80% total)
    IF NEW.can_commit_20hrs_week IS NOT NULL
       AND NEW.okay_with_zero_salary IS NOT NULL
       AND NEW.looking_for IS NOT NULL
       AND NEW.primary_skill IS NOT NULL
       AND NEW.has_idea IS NOT NULL
       AND NEW.industry_interests IS NOT NULL
       AND NEW.expected_equity IS NOT NULL
       AND NEW.decision_making_style IS NOT NULL
       AND NEW.has_built_before IS NOT NULL
    THEN
        tier3 := TRUE;
        completion := completion + 50;
    END IF;
    
    -- TIER 4: Premium Signals (20% additional = 100% total)
    IF NEW.trial_project_willing IS NOT NULL
       AND NEW.why_10_10_cofounder IS NOT NULL
       AND NEW.willing_to_sign_agreements IS NOT NULL
    THEN
        tier4 := TRUE;
        completion := completion + 20;
    END IF;
    
    NEW.profile_completion_percentage := completion;
    NEW.tier_1_complete := tier1;
    NEW.tier_2_complete := tier2;
    NEW.tier_3_complete := tier3;
    NEW.tier_4_complete := tier4;
    NEW.last_profile_update := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_completion
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION calculate_profile_completion();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON COLUMN users.profile_completion_percentage IS 'Auto-calculated: 5% (Tier 1) + 25% (Tier 2) + 50% (Tier 3) + 20% (Tier 4)';
COMMENT ON COLUMN users.tier_3_complete IS 'Required to access Co-Founder Matching';
COMMENT ON COLUMN users.professional_status IS 'Student, Working Professional, Freelancer, Entrepreneur, Career Break';
COMMENT ON COLUMN users.looking_for IS 'Technical, Business, Product, Designer, Marketing, Any';
COMMENT ON COLUMN users.remote_preference IS 'Same City, Same Country, Fully Remote';
