// =====================================================
// REMAINING STEPS 4-10 FOR ENHANCED PROFILE SETUP
// Add these to the EnhancedProfileSetup component
// =====================================================

// STEP 4: What You're Looking For
function Step4LookingFor() {
    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>What You're Looking For</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Help us find your perfect co-founder match</p>

            <div className="form-group">
                <label className="form-label">What type of co-founder are you looking for? *</label>
                <select
                    className="form-input"
                    value={formData.looking_for}
                    onChange={(e) => updateField('looking_for', e.target.value)}
                >
                    <option value="">Select type</option>
                    <option value="Technical">Technical Co-Founder (Developer/Engineer)</option>
                    <option value="Business">Business Co-Founder (Operations/Strategy)</option>
                    <option value="Product">Product Co-Founder (Product Manager/Designer)</option>
                    <option value="Marketing">Marketing Co-Founder (Growth/Marketing)</option>
                    <option value="Domain Expert">Domain Expert (Industry-specific)</option>
                    <option value="Any">Open to any strong builder</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Must-have skills in your co-founder</label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Full-stack development, UX design, Sales experience"
                    value={formData.must_have_skills}
                    onChange={(e) => updateField('must_have_skills', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Deal breakers (select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                    {['Ego issues', 'Time commitment mismatch', 'Location constraints', 'No technical skills', 'No business skills', 'Different values', 'Poor communication', 'Lack of commitment'].map(dealbreaker => (
                        <label key={dealbreaker} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.deal_breakers?.includes(dealbreaker)}
                                onChange={(e) => {
                                    const current = formData.deal_breakers || [];
                                    updateField('deal_breakers', e.target.checked
                                        ? [...current, dealbreaker]
                                        : current.filter(d => d !== dealbreaker)
                                    );
                                }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>{dealbreaker}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Co-founder location preference *</label>
                <select
                    className="form-input"
                    value={formData.remote_preference}
                    onChange={(e) => updateField('remote_preference', e.target.value)}
                >
                    <option value="">Select preference</option>
                    <option value="Same City">Must be in my city (for in-person collaboration)</option>
                    <option value="Same Country">Same country (India)</option>
                    <option value="Fully Remote">Fully Remote (location doesn't matter)</option>
                </select>
            </div>
        </div>
    );
}

// STEP 5: Your Expertise
function Step5Expertise() {
    const [showTechStack, setShowTechStack] = useState(false);

    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>Your Expertise</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Show off your skills and experience</p>

            <div className="form-group">
                <label className="form-label">Primary Skill (choose ONE) *</label>
                <select
                    className="form-input"
                    value={formData.primary_skill}
                    onChange={(e) => {
                        updateField('primary_skill', e.target.value);
                        setShowTechStack(e.target.value === 'Engineering');
                    }}
                >
                    <option value="">Select primary skill</option>
                    <option value="Engineering">Engineering (Backend/Frontend/Mobile/AI)</option>
                    <option value="Product">Product (Product Manager/UX Designer)</option>
                    <option value="Business">Business (Strategy/Operations/Finance)</option>
                    <option value="Marketing">Marketing (Growth/Content/SEO)</option>
                    <option value="Operations">Operations (Supply Chain/Logistics)</option>
                    <option value="Sales">Sales (B2B/B2C)</option>
                    <option value="Design">Design (UI/UX/Graphic)</option>
                </select>
            </div>

            {showTechStack && (
                <div className="form-group">
                    <label className="form-label">Tech Stack (for technical founders)</label>
                    <div style={{ marginTop: '12px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Languages: e.g., Python, JavaScript, Go"
                            style={{ marginBottom: '8px' }}
                            onChange={(e) => updateField('tech_stack', { ...formData.tech_stack, languages: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Frameworks: e.g., React, Node.js, Django"
                            style={{ marginBottom: '8px' }}
                            onChange={(e) => updateField('tech_stack', { ...formData.tech_stack, frameworks: e.target.value.split(',').map(s => s.trim()) })}
                        />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Cloud/DevOps: e.g., AWS, Docker, Kubernetes"
                            onChange={(e) => updateField('tech_stack', { ...formData.tech_stack, cloud: e.target.value.split(',').map(s => s.trim()) })}
                        />
                    </div>
                </div>
            )}

            <div className="form-group">
                <label className="form-label">GitHub Profile (optional but recommended)</label>
                <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/yourusername"
                    value={formData.github_url}
                    onChange={(e) => updateField('github_url', e.target.value)}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Portfolio/Website URL (optional)</label>
                <input
                    type="url"
                    className="form-input"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url}
                    onChange={(e) => updateField('portfolio_url', e.target.value)}
                />
            </div>
        </div>
    );
}

// STEP 6: Idea & Industry
function Step6IdeaIndustry() {
    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>Idea & Industry Interests</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>What are you building or interested in?</p>

            <div className="form-group">
                <label className="form-label">Do you currently have an idea? *</label>
                <select
                    className="form-input"
                    value={formData.has_idea}
                    onChange={(e) => updateField('has_idea', e.target.value)}
                >
                    <option value="">Select option</option>
                    <option value="Yes">Yes - I have a clear idea</option>
                    <option value="Multiple">Multiple ideas to explore</option>
                    <option value="No">No - Looking to join as co-founder</option>
                    <option value="Open">Open to both</option>
                </select>
            </div>

            {(formData.has_idea === 'Yes' || formData.has_idea === 'Multiple') && (
                <div className="form-group">
                    <label className="form-label">What stage is your idea at?</label>
                    <select
                        className="form-input"
                        value={formData.idea_stage}
                        onChange={(e) => updateField('idea_stage', e.target.value)}
                    >
                        <option value="">Select stage</option>
                        <option value="Just an idea">Just an idea</option>
                        <option value="Research done">Research done</option>
                        <option value="MVP built">MVP built</option>
                        <option value="Has users">Has users/revenue</option>
                    </select>
                </div>
            )}

            <div className="form-group">
                <label className="form-label">Industry interests (select all that apply) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                    {['AI/ML', 'FinTech', 'EdTech', 'HealthTech', 'SaaS', 'E-commerce', 'CleanTech', 'Web3/Crypto', 'DevTools', 'Consumer Apps', 'B2B Software', 'Marketplace'].map(industry => (
                        <label key={industry} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: formData.industry_interests?.includes(industry) ? 'var(--brand-primary)' : 'var(--bg-tertiary)', color: formData.industry_interests?.includes(industry) ? '#fff' : 'inherit', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input
                                type="checkbox"
                                checked={formData.industry_interests?.includes(industry)}
                                onChange={(e) => {
                                    const current = formData.industry_interests || [];
                                    updateField('industry_interests', e.target.checked
                                        ? [...current, industry]
                                        : current.filter(i => i !== industry)
                                    );
                                }}
                                style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{industry}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Open to pivoting ideas?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.open_to_pivot === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('open_to_pivot', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.open_to_pivot === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('open_to_pivot', false)}
                    >
                        No - Committed to current idea
                    </button>
                </div>
            </div>
        </div>
    );
}

// STEP 7: Equity & Money
function Step7EquityMoney() {
    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>Equity & Money Expectations</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Let's talk about the business side</p>

            <div className="form-group">
                <label className="form-label">Expected equity as co-founder *</label>
                <select
                    className="form-input"
                    value={formData.expected_equity}
                    onChange={(e) => updateField('expected_equity', e.target.value)}
                >
                    <option value="">Select expectation</option>
                    <option value="Equal">Equal split (50/50)</option>
                    <option value="Negotiable">Negotiable based on contribution</option>
                    <option value="Depends">Depends on the situation</option>
                    <option value="Minority">Comfortable with minority stake (&#60;50%)</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Okay with standard vesting (4 years, 1-year cliff)?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.okay_with_vesting === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('okay_with_vesting', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.okay_with_vesting === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('okay_with_vesting', false)}
                    >
                        No
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Standard startup practice: Your equity vests over 4 years, with a 1-year cliff
                </p>
            </div>

            <div className="form-group">
                <label className="form-label">Willing to invest personal money if needed?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.willing_to_invest_money === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('willing_to_invest_money', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.willing_to_invest_money === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('willing_to_invest_money', false)}
                    >
                        No
                    </button>
                </div>
            </div>

            {formData.willing_to_invest_money && (
                <div className="form-group">
                    <label className="form-label">Investment range you're comfortable with</label>
                    <select
                        className="form-input"
                        value={formData.investment_amount_range}
                        onChange={(e) => updateField('investment_amount_range', e.target.value)}
                    >
                        <option value="">Select range</option>
                        <option value="₹0">₹0 (Sweat equity only)</option>
                        <option value="₹50k-1L">₹50,000 - ₹1 Lakh</option>
                        <option value="₹1L-5L">₹1 Lakh - ₹5 Lakhs</option>
                        <option value="₹5L-10L">₹5 Lakhs - ₹10 Lakhs</option>
                        <option value="₹10L+">₹10 Lakhs+</option>
                    </select>
                </div>
            )}
        </div>
    );
}

// STEP 8: Working Style & Values
function Step8WorkingStyle() {
    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>Working Style & Values</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>How do you like to work?</p>

            <div className="form-group">
                <label className="form-label">Decision-making style *</label>
                <select
                    className="form-input"
                    value={formData.decision_making_style}
                    onChange={(e) => updateField('decision_making_style', e.target.value)}
                >
                    <option value="">Select style</option>
                    <option value="Data-driven">Data-driven (analyze before deciding)</option>
                    <option value="Intuition">Intuition (trust gut feeling)</option>
                    <option value="Consensus">Consensus (discuss with team)</option>
                    <option value="Hybrid">Hybrid approach</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Conflict handling style</label>
                <select
                    className="form-input"
                    value={formData.conflict_handling}
                    onChange={(e) => updateField('conflict_handling', e.target.value)}
                >
                    <option value="">Select style</option>
                    <option value="Direct discussion">Direct discussion (address immediately)</option>
                    <option value="Mediation">Mediation (involve third party)</option>
                    <option value="Time to cool down">Time to cool down (reflect first)</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Work style preference</label>
                <select
                    className="form-input"
                    value={formData.work_style}
                    onChange={(e) => updateField('work_style', e.target.value)}
                >
                    <option value="">Select style</option>
                    <option value="Structured">Structured (clear processes & schedules)</option>
                    <option value="Flexible">Flexible (adapt as we go)</option>
                    <option value="Fast & chaotic">Fast & chaotic (move fast, break things)</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Core values (select your top 3) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '12px' }}>
                    {['Transparency', 'Speed', 'Quality', 'Ethics', 'Growth', 'Impact', 'Innovation', 'Work-Life Balance', 'Customer First'].map(value => (
                        <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: formData.core_values?.includes(value) ? 'var(--brand-primary)' : 'var(--bg-tertiary)', color: formData.core_values?.includes(value) ? '#fff' : 'inherit', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', opacity: formData.core_values?.length >= 3 && !formData.core_values?.includes(value) ? 0.5 : 1 }}>
                            <input
                                type="checkbox"
                                checked={formData.core_values?.includes(value)}
                                onChange={(e) => {
                                    const current = formData.core_values || [];
                                    if (e.target.checked && current.length >= 3) return;
                                    updateField('core_values', e.target.checked
                                        ? [...current, value]
                                        : current.filter(v => v !== value)
                                    );
                                }}
                                disabled={formData.core_values?.length >= 3 && !formData.core_values?.includes(value)}
                                style={{ display: 'none' }}
                            />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
                        </label>
                    ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Selected: {formData.core_values?.length || 0}/3
                </p>
            </div>
        </div>
    );
}

// STEP 9: Risk & Experience
function Step9RiskFailure() {
    return (
        <div>
            <h2 style={{ marginBottom: '8px' }}>Risk & Experience</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your entrepreneurial journey</p>

            <div className="form-group">
                <label className="form-label">Have you tried building something before? *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.has_built_before === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('has_built_before', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.has_built_before === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('has_built_before', false)}
                    >
                        No - First time!
                    </button>
                </div>
            </div>

            {formData.has_built_before && (
                <div className="form-group">
                    <label className="form-label">What was the biggest reason it didn't work out?</label>
                    <textarea
                        className="form-input"
                        rows="3"
                        placeholder="Be honest - we all learn from failures..."
                        value={formData.previous_failure_reason}
                        onChange={(e) => updateField('previous_failure_reason', e.target.value)}
                        maxLength="500"
                    />
                </div>
            )}

            <div className="form-group">
                <label className="form-label">What would make you quit a startup?</label>
                <textarea
                    className="form-input"
                    rows="2"
                    placeholder="e.g., No traction after 2 years, co-founder conflicts, personal reasons..."
                    value={formData.quit_triggers}
                    onChange={(e) => updateField('quit_triggers', e.target.value)}
                    maxLength="300"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Comfortable with uncertainty for 2-3 years?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.comfortable_with_uncertainty === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('comfortable_with_uncertainty', true)}
                    >
                        Yes - I'm ready
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.comfortable_with_uncertainty === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('comfortable_with_uncertainty', false)}
                    >
                        Not sure
                    </button>
                </div>
            </div>
        </div>
    );
}

// STEP 10: Premium Signals
function Step10Premium() {
    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                <h2 style={{ marginBottom: '8px' }}>Premium Signals (Optional)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>These questions are optional but dramatically improve your match quality!</p>
            </div>

            <div className="form-group">
                <label className="form-label">Willing to do a 2-week trial project with potential co-founder?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.trial_project_willing === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('trial_project_willing', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.trial_project_willing === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('trial_project_willing', false)}
                    >
                        No
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    Best way to test compatibility before committing!
                </p>
            </div>

            <div className="form-group">
                <label className="form-label">Why are you a 10/10 co-founder? (2-3 sentences)</label>
                <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Sell yourself! What makes you exceptional?"
                    value={formData.why_10_10_cofounder}
                    onChange={(e) => updateField('why_10_10_cofounder', e.target.value)}
                    maxLength="500"
                />
            </div>

            <div className="form-group">
                <label className="form-label">60-second intro video URL (Loom/YouTube)</label>
                <input
                    type="url"
                    className="form-input"
                    placeholder="https://loom.com/share/... or https://youtube.com/watch?v=..."
                    value={formData.intro_video_url}
                    onChange={(e) => updateField('intro_video_url', e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                    💡 Pro tip: A short video intro increases connection rate by 300%!
                </p>
            </div>

            <div className="form-group">
                <label className="form-label">Willing to sign standard agreements? (NDA, Founder Agreement, IP Assignment)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="button"
                        className={`btn ${formData.willing_to_sign_agreements === true ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('willing_to_sign_agreements', true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.willing_to_sign_agreements === false ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('willing_to_sign_agreements', false)}
                    >
                        No
                    </button>
                    <button
                        type="button"
                        className={`btn ${formData.willing_to_sign_agreements === null ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => updateField('willing_to_sign_agreements', null)}
                    >
                        Not sure yet
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '40px', padding: '20px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-hover))', borderRadius: '12px', color: '#fff', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>🎉 You're All Set!</h3>
                <p style={{ fontSize: '0.9375rem', opacity: 0.95 }}>
                    Click "Complete Profile" below to start finding amazing co-founders!
                </p>
            </div>
        </div>
    );
}
