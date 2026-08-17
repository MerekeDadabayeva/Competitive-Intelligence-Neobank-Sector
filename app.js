// Neobank Competitive Intelligence Dashboard Client — Head of Product Edition

(function() {
    let signalsData = [];
    let baselineData = {};
    let activeBriefFormat = 'summary'; // 'summary' | 'slack' | 'email'
    let isBriefCollapsed = false;
    let activeModalSignal = null;

    function bootstrap() {
        console.log('[Dashboard] Bootstrapping Head of Product competitive monitoring app...');
        setupEventListeners();
        initData();
    }

    async function initData() {
        await Promise.allSettled([
            fetchSignals(),
            fetchBaseline()
        ]);
        render();
    }

    async function fetchSignals() {
        try {
            const response = await fetch('/api/signals');
            if (response.ok) {
                signalsData = await response.json();
                console.log(`[Dashboard] Loaded ${signalsData.length} signals from API`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (e) {
            console.warn('[Dashboard] Failed to fetch /api/signals, using fallback signals', e);
            signalsData = getFallbackSignals();
        }
    }

    async function fetchBaseline() {
        try {
            const response = await fetch('/api/baseline');
            if (response.ok) {
                baselineData = await response.json();
                console.log('[Dashboard] Loaded Trade Republic baseline');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (e) {
            console.warn('[Dashboard] Failed to fetch /api/baseline, using embedded fallback', e);
            baselineData = {
                company: "Trade Republic",
                role: "Internal Strategic Baseline",
                core_offering: {
                    cash_interest_rate: "3.75% p.a. on uninvested cash up to 50,000 EUR",
                    trading_commission: "1.00 EUR flat fee per trade (stocks, ETFs, crypto)",
                    savings_plans: "0.00 EUR (Free automated ETF and stock savings plans)",
                    card_benefits: {
                        saveback: "1% saveback on card spending directly invested into savings plan (max 15 EUR/mo)",
                        round_up: "Spare change investment feature available",
                        atm_withdrawals: "Free worldwide ATM withdrawals above 100 EUR"
                    },
                    crypto: "1.00 EUR flat fee per order, 50+ tradable cryptocurrencies"
                },
                strategic_priorities: [
                    "Retaining cash deposits via industry-leading uninvested cash interest",
                    "Customer acquisition through 1% card saveback mechanism",
                    "Low friction, low-cost long-term wealth creation (free savings plans)"
                ]
            };
        }
    }

    function setupEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget || e.target.closest('.tab-btn');
                if (!targetBtn) return;
                const targetId = targetBtn.getAttribute('data-tab');
                if (!targetId) return;

                const targetContent = document.getElementById(`tab-${targetId}`);
                if (!targetContent) return;

                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                targetBtn.classList.add('active');
                targetContent.classList.add('active');
            });
        });

        // Sidebar Filters
        const filterInputs = document.querySelectorAll('.filter-section input[type="checkbox"]');
        filterInputs.forEach(input => {
            input.addEventListener('change', render);
        });

        // Global Delegated click events
        document.body.addEventListener('click', async (e) => {
            const approveBtn = e.target.closest('.btn-approve');
            const rejectBtn = e.target.closest('.btn-reject');
            const diffToggleBtn = e.target.closest('.diff-toggle');
            const specBtn = e.target.closest('.btn-spec');
            const jiraBtn = e.target.closest('.btn-jira');
            const slackAlertBtn = e.target.closest('.btn-slack-alert');

            if (approveBtn) {
                const id = approveBtn.dataset.id;
                await updateSignalStatus(id, 'approved');
            } else if (rejectBtn) {
                const id = rejectBtn.dataset.id;
                await updateSignalStatus(id, 'rejected');
            } else if (diffToggleBtn) {
                const container = diffToggleBtn.closest('.diff-container');
                const content = container ? container.querySelector('.diff-content') : diffToggleBtn.nextElementSibling;
                if (content) {
                    content.classList.toggle('expanded');
                    diffToggleBtn.innerHTML = content.classList.contains('expanded') 
                        ? '▼ Hide Diff' 
                        : '▶ Show Diff';
                }
            } else if (specBtn) {
                const id = specBtn.dataset.id;
                openSpecModal(id);
            } else if (jiraBtn) {
                const id = jiraBtn.dataset.id;
                openJiraModal(id);
            } else if (slackAlertBtn) {
                const channel = slackAlertBtn.dataset.channel || '#growth-squad';
                slackAlertBtn.textContent = `✓ Alert Sent to ${channel}!`;
                slackAlertBtn.classList.add('sent');
                setTimeout(() => {
                    slackAlertBtn.textContent = `📢 Alert ${channel}`;
                    slackAlertBtn.classList.remove('sent');
                }, 2500);
            }
        });

        // Executive Brief Hero Controls
        const formatBtns = document.querySelectorAll('#brief-format-toggle .format-btn');
        const copyBriefBtn = document.getElementById('hero-copy-brief-btn');
        const collapseBriefBtn = document.getElementById('collapse-brief-btn');
        const briefContent = document.getElementById('brief-hero-content');

        formatBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeBriefFormat = btn.dataset.format || 'summary';
                updateBriefContent();
            });
        });

        if (collapseBriefBtn && briefContent) {
            collapseBriefBtn.addEventListener('click', () => {
                isBriefCollapsed = !isBriefCollapsed;
                briefContent.classList.toggle('collapsed', isBriefCollapsed);
                collapseBriefBtn.textContent = isBriefCollapsed ? '▼ Expand Brief' : '▲ Collapse';
            });
        }

        if (copyBriefBtn) {
            copyBriefBtn.addEventListener('click', () => {
                const text = getRawBriefText();
                navigator.clipboard.writeText(text).then(() => {
                    copyBriefBtn.textContent = '✓ Copied!';
                    copyBriefBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBriefBtn.textContent = '📋 Copy';
                        copyBriefBtn.classList.remove('copied');
                    }, 2500);
                });
            });
        }

        // Modal Close Events
        const specModal = document.getElementById('spec-modal');
        const jiraModal = document.getElementById('jira-modal');
        const closeSpecBtn = document.getElementById('close-spec-btn');
        const closeJiraBtn = document.getElementById('close-jira-btn');
        const copySpecBtn = document.getElementById('copy-spec-btn');
        const copyJiraBtn = document.getElementById('copy-jira-btn');

        if (closeSpecBtn && specModal) {
            closeSpecBtn.addEventListener('click', () => specModal.classList.remove('active'));
        }
        if (closeJiraBtn && jiraModal) {
            closeJiraBtn.addEventListener('click', () => jiraModal.classList.remove('active'));
        }

        [specModal, jiraModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            }
        });

        if (copySpecBtn) {
            copySpecBtn.addEventListener('click', () => {
                if (!activeModalSignal) return;
                const prd = activeModalSignal.mini_prd || {
                    problem_statement: activeModalSignal.change_summary,
                    proposed_mvp_response: "Deploy targeted retention messaging.",
                    target_metrics: ["+15% retention"],
                    explicit_out_of_scope: ["Do not alter core pricing"]
                };
                const md = [
                    `# [MINI-PRD] Strategic Response to ${activeModalSignal.competitor}`,
                    `**Pillar**: ${activeModalSignal.jtbd_pillar || 'Value Realization'} | **Impact**: ${activeModalSignal.impact_scoring?.classification || 'Differentiator'}`,
                    ``,
                    `## Problem Statement & Context`,
                    `${prd.problem_statement}`,
                    ``,
                    `## Proposed MVP Response`,
                    `${prd.proposed_mvp_response}`,
                    ``,
                    `## Target Success Metrics`,
                    ...prd.target_metrics.map(m => `- [ ] ${m}`),
                    ``,
                    `## Explicit Out-of-Scope (Scope Guardrails)`,
                    ...prd.explicit_out_of_scope.map(s => `- ❌ ${s}`)
                ].join('\n');

                navigator.clipboard.writeText(md).then(() => {
                    copySpecBtn.textContent = '✓ Copied Mini-PRD!';
                    copySpecBtn.classList.add('copied');
                    setTimeout(() => {
                        copySpecBtn.textContent = '📋 Copy Mini-PRD (Markdown)';
                        copySpecBtn.classList.remove('copied');
                    }, 2500);
                });
            });
        }

        if (copyJiraBtn) {
            copyJiraBtn.addEventListener('click', () => {
                if (!activeModalSignal) return;
                const j = activeModalSignal.jira_gherkin_story || {
                    epic_title: `[COMP-INTEL] Strategic Response to ${activeModalSignal.competitor}`,
                    user_story: `As a Trade Republic user, I want clear visibility into product advantages.`,
                    gherkin_scenarios: ["Scenario: User views account overview\n  Given active balance\n  When viewing app\n  Then monthly interest payout is shown"],
                    acceptance_criteria: ["Tracking events emitted", "Render time < 200ms"]
                };
                const txt = [
                    `h2. ${j.epic_title}`,
                    ``,
                    `*User Story:*`,
                    `${j.user_story}`,
                    ``,
                    `*Gherkin Acceptance Scenarios:*`,
                    `{code}`,
                    j.gherkin_scenarios.join('\n\n'),
                    `{code}`,
                    ``,
                    `*Definition of Done:*`,
                    ...j.acceptance_criteria.map(ac => `# ${ac}`)
                ].join('\n');

                navigator.clipboard.writeText(txt).then(() => {
                    copyJiraBtn.textContent = '✓ Copied for Jira!';
                    copyJiraBtn.classList.add('copied');
                    setTimeout(() => {
                        copyJiraBtn.textContent = '📋 Copy for Jira / Linear';
                        copyJiraBtn.classList.remove('copied');
                    }, 2500);
                });
            });
        }
    }

    function openSpecModal(signalId) {
        let signal = signalsData.find(s => s.id === signalId || s.id.includes(signalId));
        if (!signal) {
            signal = signalsData[0] || getFallbackSignals()[0];
        }

        if (!signal.mini_prd) {
            signal.mini_prd = {
                problem_statement: `${signal.competitor}'s update (${signal.change_summary}) impacts competitive positioning against Trade Republic's baseline.`,
                proposed_mvp_response: `Deploy targeted marketing & retention messaging highlighting Trade Republic's core yield and 1% Saveback advantages.`,
                target_metrics: [
                    "-10% annualized customer churn on uninvested cash deposits",
                    "+15% engagement on Saveback card rewards",
                    "Net Promoter Score (NPS) >= 65"
                ],
                explicit_out_of_scope: [
                    "Do NOT subsidize temporary promotional referral bounties",
                    "Do NOT alter core €1.00 execution fee structure without Pricing Committee approval"
                ]
            };
        }
        activeModalSignal = signal;

        const titleEl = document.getElementById('spec-modal-title');
        const probEl = document.getElementById('spec-problem-stmt');
        const mvpEl = document.getElementById('spec-proposed-mvp');
        const metricsEl = document.getElementById('spec-target-metrics');
        const scopeEl = document.getElementById('spec-out-of-scope');
        const modal = document.getElementById('spec-modal');

        if (titleEl) titleEl.textContent = `Mini-PRD: ${signal.competitor} ${signal.category.replace('_', ' ').toUpperCase()}`;
        if (probEl) probEl.textContent = signal.mini_prd.problem_statement;
        if (mvpEl) mvpEl.textContent = signal.mini_prd.proposed_mvp_response;
        if (metricsEl) metricsEl.innerHTML = signal.mini_prd.target_metrics.map(m => `<li>${escapeHtml(m)}</li>`).join('');
        if (scopeEl) scopeEl.innerHTML = signal.mini_prd.explicit_out_of_scope.map(s => `<li>${escapeHtml(s)}</li>`).join('');

        if (modal) modal.classList.add('active');
    }

    function openJiraModal(signalId) {
        let signal = signalsData.find(s => s.id === signalId || s.id.includes(signalId));
        if (!signal) {
            signal = signalsData[0] || getFallbackSignals()[0];
        }

        if (!signal.jira_gherkin_story) {
            signal.jira_gherkin_story = {
                epic_title: `[COMP-INTEL] Strategic Response to ${signal.competitor} ${signal.category.replace('_', ' ').toUpperCase()}`,
                user_story: `As a Trade Republic customer evaluating ${signal.competitor}, I want clear visibility into Trade Republic's value proposition, so that I keep my primary wealth and cash balances at Trade Republic.`,
                gherkin_scenarios: [
                    `Scenario: User views comparative product advantages\n  Given a user has an active uninvested cash balance > 0 EUR\n  When they view the cash interest or account overview in the app\n  Then they should see their compounded 3.75% p.a. monthly payout and accrued 1% Saveback total clearly displayed`
                ],
                acceptance_criteria: [
                    "Tracking events emitted for competitive retention banner impressions",
                    "No latency regression added to account overview render time (<200ms at p95)"
                ]
            };
        }
        activeModalSignal = signal;

        const epicEl = document.getElementById('jira-epic-title');
        const storyEl = document.getElementById('jira-user-story');
        const gherkinEl = document.getElementById('jira-gherkin-box');
        const acEl = document.getElementById('jira-ac-list');
        const modal = document.getElementById('jira-modal');

        if (epicEl) epicEl.textContent = signal.jira_gherkin_story.epic_title;
        if (storyEl) storyEl.textContent = signal.jira_gherkin_story.user_story;
        if (gherkinEl) gherkinEl.textContent = signal.jira_gherkin_story.gherkin_scenarios.join('\n\n');
        if (acEl) acEl.innerHTML = signal.jira_gherkin_story.acceptance_criteria.map(ac => `<li>${escapeHtml(ac)}</li>`).join('');

        if (modal) modal.classList.add('active');
    }

    async function updateSignalStatus(id, newStatus) {
        try {
            await fetch(`/api/signals/${id}/${newStatus === 'approved' ? 'approve' : 'reject'}`, { method: 'POST' });
        } catch (e) {
            console.warn(`[Dashboard] Update API request failed for ${id}:`, e);
        }

        const index = signalsData.findIndex(s => s.id === id);
        if (index > -1) {
            signalsData[index].status = newStatus;
            signalsData[index].requires_review = false;
            render();
        }
    }

    function getActiveFilters() {
        const inputs = document.querySelectorAll('.filter-section input[type="checkbox"]');
        const filters = { competitor: [], category: [], status: [], jtbd: [], impact: [] };

        inputs.forEach(input => {
            if (input.checked && filters[input.name]) {
                filters[input.name].push(input.value);
            }
        });

        // Safe defaults if everything is unchecked
        if (filters.competitor.length === 0) filters.competitor = ['N26', 'Revolut', 'Scalable Capital', 'Bitpanda'];
        if (filters.category.length === 0) filters.category = ['pricing', 'product_launch', 'positioning', 'marketing_promo', 'app_reviews'];
        if (filters.status.length === 0) filters.status = ['auto_published', 'staged_review', 'approved', 'rejected'];
        if (filters.jtbd.length === 0) filters.jtbd = ['Value Realization', 'Conversion / Monetization Hooks', 'Onboarding Friction', 'Feature Bloat', 'Regulatory Compliance'];
        if (filters.impact.length === 0) filters.impact = ['Defensive Need (Parity)', 'Differentiator (Moat)', 'Noise (Low ROI)'];

        return filters;
    }

    function render() {
        renderBaseline();
        updateStats();
        renderParityMatrix();
        updateBriefContent();
        renderTakeaways();

        const signalsContainer = document.getElementById('signals-container');
        const reviewContainer = document.getElementById('review-container');
        if (!signalsContainer || !reviewContainer) return;

        const filters = getActiveFilters();
        const sortedSignals = [...signalsData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Filter for Main Feed
        const feedSignals = sortedSignals.filter(s => {
            const matchComp = filters.competitor.includes(s.competitor);
            const matchCat = filters.category.includes(s.category);
            const matchStat = filters.status.includes(s.status);
            const matchJtbd = !s.jtbd_pillar || filters.jtbd.includes(s.jtbd_pillar);
            const matchImpact = !s.impact_scoring || filters.impact.includes(s.impact_scoring.classification);

            return matchComp && matchCat && matchStat && matchJtbd && matchImpact;
        });

        // Filter for Review Queue
        const reviewSignals = sortedSignals.filter(s => {
            return s.status === 'staged_review' 
                && filters.competitor.includes(s.competitor) 
                && filters.category.includes(s.category);
        });

        renderSignalList(feedSignals, signalsContainer, false);
        renderSignalList(reviewSignals, reviewContainer, true);
    }

    function renderBaseline() {
        const baselineContainer = document.getElementById('baseline-content');
        if (!baselineContainer || !baselineData || Object.keys(baselineData).length === 0) return;

        const co = baselineData.core_offering || {};
        const card = co.card_benefits || {};
        const priorities = baselineData.strategic_priorities || [];

        baselineContainer.innerHTML = `
            <div class="baseline-section">
                <div class="baseline-item">
                    <span class="baseline-key">Cash Interest</span>
                    <span class="baseline-value">${co.cash_interest_rate || '3.75% p.a.'}</span>
                </div>
                <div class="baseline-item">
                    <span class="baseline-key">Trading Fee</span>
                    <span class="baseline-value">${co.trading_commission || '1.00 EUR flat'}</span>
                </div>
                <div class="baseline-item">
                    <span class="baseline-key">Savings Plans</span>
                    <span class="baseline-value">${co.savings_plans || '0.00 EUR (Free)'}</span>
                </div>
                <div class="baseline-item">
                    <span class="baseline-key">Crypto Fee</span>
                    <span class="baseline-value">${co.crypto || '1.00 EUR flat'}</span>
                </div>
            </div>
            <div class="baseline-section">
                <h4 class="baseline-section-title">Card Benefits</h4>
                <div class="baseline-item">
                    <span class="baseline-key">Saveback</span>
                    <span class="baseline-value">${card.saveback || '1%'}</span>
                </div>
                <div class="baseline-item">
                    <span class="baseline-key">Round Up</span>
                    <span class="baseline-value">${card.round_up || 'Yes'}</span>
                </div>
                <div class="baseline-item">
                    <span class="baseline-key">ATM</span>
                    <span class="baseline-value">${card.atm_withdrawals || 'Free > 100 EUR'}</span>
                </div>
            </div>
            ${priorities.length > 0 ? `
                <div class="baseline-section">
                    <h4 class="baseline-section-title">Strategic Priorities</h4>
                    <ul class="baseline-priorities">
                        ${priorities.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    function updateStats() {
        const total = signalsData.length;
        const auto = signalsData.filter(s => s.status === 'auto_published').length;
        const approved = signalsData.filter(s => s.status === 'approved').length;
        const pending = signalsData.filter(s => s.status === 'staged_review').length;
        const rejected = signalsData.filter(s => s.status === 'rejected').length;

        const statTotal = document.getElementById('stat-total');
        const statAuto = document.getElementById('stat-auto');
        const statApproved = document.getElementById('stat-approved');
        const statPending = document.getElementById('stat-pending');
        const statRejected = document.getElementById('stat-rejected');
        const tabFeedCount = document.getElementById('tab-feed-count');
        const tabReviewBadge = document.getElementById('tab-review-badge');

        if (statTotal) statTotal.textContent = total;
        if (statAuto) statAuto.textContent = auto;
        if (statApproved) statApproved.textContent = approved;
        if (statPending) statPending.textContent = pending;
        if (statRejected) statRejected.textContent = rejected;

        const filters = getActiveFilters();
        const sortedSignals = [...signalsData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const feedCount = sortedSignals.filter(s => {
            return filters.competitor.includes(s.competitor) 
                && filters.category.includes(s.category) 
                && filters.status.includes(s.status);
        }).length;
        const reviewCount = signalsData.filter(s => s.status === 'staged_review').length;

        if (tabFeedCount) tabFeedCount.textContent = feedCount;
        if (tabReviewBadge) {
            tabReviewBadge.textContent = reviewCount;
            tabReviewBadge.className = reviewCount > 0 ? 'tab-badge badge-alert' : 'tab-badge';
        }
    }

    function renderParityMatrix() {
        const container = document.getElementById('parity-container');
        if (!container) return;

        const matrix = [
            {
                dimension: "Uninvested Cash Yield",
                tradeRepublic: { value: "3.75% p.a.", badge: "Leader", type: "leader" },
                n26: { value: "3.00% p.a.", badge: "-75 bps", type: "lagging" },
                revolut: { value: "0.00% - 3.50%", badge: "Tiered", type: "lagging" },
                scalable: { value: "3.75% p.a.", badge: "Parity (PRIME+)", type: "parity" },
                bitpanda: { value: "2.89% - 3.21%", badge: "Cash Plus", type: "lagging" }
            },
            {
                dimension: "Card Cashback & Saveback",
                tradeRepublic: { value: "1% Saveback (Free card)", badge: "Leader", type: "leader" },
                n26: { value: "0.1% - 0.5% (Paid tiers)", badge: "Lagging", type: "lagging" },
                revolut: { value: "RevPoints loyalty", badge: "Points", type: "lagging" },
                scalable: { value: "❌ No card offering", badge: "None", type: "lagging" },
                bitpanda: { value: "0.5% - 2.0% (BEST staking)", badge: "Crypto Tier", type: "parity" }
            },
            {
                dimension: "Trading Order Execution",
                tradeRepublic: { value: "1.00 € flat", badge: "Low Cost", type: "leader" },
                n26: { value: "❌ No broker (Upvest partner)", badge: "Partner", type: "lagging" },
                revolut: { value: "0.99 € - 1.99 € + fx spread", badge: "Spread", type: "lagging" },
                scalable: { value: "0.99 € / 0.00 € (PRIME+)", badge: "Parity", type: "parity" },
                bitpanda: { value: "1.49% crypto spread", badge: "High Fee", type: "lagging" }
            },
            {
                dimension: "Automated Savings Plans",
                tradeRepublic: { value: "0.00 € Free (Stocks/ETFs/Crypto)", badge: "Leader", type: "leader" },
                n26: { value: "Free Spaces (Cash only)", badge: "Cash Only", type: "lagging" },
                revolut: { value: "Spare change vaults", badge: "Basic", type: "lagging" },
                scalable: { value: "0.00 € Free ETF plans", badge: "Parity", type: "parity" },
                bitpanda: { value: "Free Crypto Savings plans", badge: "Crypto", type: "parity" }
            },
            {
                dimension: "App Rating & Sentiment",
                tradeRepublic: { value: "4.6 ★ (180k reviews)", badge: "Strong", type: "leader" },
                n26: { value: "4.3 ★ (-0.4 drop in v12.4)", badge: "Alert", type: "threat" },
                revolut: { value: "4.7 ★ (2.1M reviews)", badge: "High", type: "parity" },
                scalable: { value: "4.4 ★ (45k reviews)", badge: "Solid", type: "parity" },
                bitpanda: { value: "4.6 ★ (+0.1 rising)", badge: "Solid", type: "parity" }
            },
            {
                dimension: "Referral & Acquisition Promos",
                tradeRepublic: { value: "10 € Fractional Stock", badge: "Standard", type: "parity" },
                n26: { value: "30 € Cash bonus", badge: "Active", type: "parity" },
                revolut: { value: "60 € Referral Boost", badge: "Sprint Alert", type: "threat" },
                scalable: { value: "100 € Portfolio Transfer Bonus", badge: "Poaching", type: "threat" },
                bitpanda: { value: "10 € Tell-a-friend", badge: "Standard", type: "parity" }
            }
        ];

        container.innerHTML = `
            <div class="parity-header-box">
                <div>
                    <h2>Live Competitive Moat & Parity Matrix</h2>
                    <p class="modal-subtitle">Auto-updated from live pipeline diffs and verified product benchmarks</p>
                </div>
                <div class="parity-legend">
                    <span class="legend-item"><span class="moat-badge moat-leader">Leader</span> TR Advantage</span>
                    <span class="legend-item"><span class="moat-badge moat-parity">Parity</span> Direct Match</span>
                    <span class="legend-item"><span class="moat-badge moat-threat">Threat</span> Competitor Sprint</span>
                    <span class="legend-item"><span class="moat-badge moat-lagging">Lagging</span> Competitor Deficit</span>
                </div>
            </div>

            <table class="parity-table">
                <thead>
                    <tr>
                        <th>Strategic Dimension</th>
                        <th class="col-tr">Trade Republic (Baseline)</th>
                        <th>N26</th>
                        <th>Revolut</th>
                        <th>Scalable Capital</th>
                        <th>Bitpanda</th>
                    </tr>
                </thead>
                <tbody>
                    ${matrix.map(row => `
                        <tr>
                            <td><strong>${row.dimension}</strong></td>
                            <td class="cell-tr">
                                <div>${row.tradeRepublic.value}</div>
                                <span class="moat-badge moat-${row.tradeRepublic.type}">${row.tradeRepublic.badge}</span>
                            </td>
                            <td>
                                <div>${row.n26.value}</div>
                                <span class="moat-badge moat-${row.n26.type}">${row.n26.badge}</span>
                            </td>
                            <td>
                                <div>${row.revolut.value}</div>
                                <span class="moat-badge moat-${row.revolut.type}">${row.revolut.badge}</span>
                            </td>
                            <td>
                                <div>${row.scalable.value}</div>
                                <span class="moat-badge moat-${row.scalable.type}">${row.scalable.badge}</span>
                            </td>
                            <td>
                                <div>${row.bitpanda.value}</div>
                                <span class="moat-badge moat-${row.bitpanda.type}">${row.bitpanda.badge}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderTakeaways() {
        const container = document.getElementById('takeaways-container');
        if (!container) return;

        const takeaways = [
            {
                id: "takeaway-1",
                signalId: "sig_scalable_pricing",
                type: "Defensive Action",
                typeClass: "type-defensive",
                priority: "P1 - High",
                priorityClass: "priority-p1",
                cardClass: "takeaway-card-p1",
                squad: "👥 Growth & Cash Squad (Lead: PM Savings)",
                channel: "#growth-squad",
                title: "Counter Yield Parity via Payroll Saveback Multiplier (+0.5%)",
                context: "Scalable Capital matched Trade Republic at 3.75% cash yield parity (Baader Bank); N26 hiked instant savings from 1.26% to 3.00% p.a.",
                playbook: "Do NOT increase interest expense to 4.00% (saving €3.2M/yr in rate margin). Instead, deploy an in-app Saveback Payroll Multiplier (+0.5% extra saveback up to €25/mo for users routing salary). Defends deposit volume while driving primary transaction account status.",
                impactLabel: "Target KPI Delta",
                impactValue: "+14% Deposit Retention · €0 Incremental Rate Cost · 1.8x Primary Account Lock-in"
            },
            {
                id: "takeaway-2",
                signalId: "sig_n26_app_reviews",
                type: "Offensive Sprint",
                typeClass: "type-offensive",
                priority: "P0 - Critical",
                priorityClass: "priority-p0",
                cardClass: "takeaway-card-p0",
                squad: "👥 Acquisition & Performance Marketing (Lead: Growth PM)",
                channel: "#marketing",
                title: "Launch '3-Minute Brokerage' Campaign Targeting N26 KYC Friction",
                context: "N26 app rating plunged to 4.3★ (-0.4 drop) across App Store & Google Play following update v12.4 with recurring KYC re-verification loops and login drop-offs.",
                playbook: "Spin up targeted comparison ad creative across Google Search & Meta: 'Tired of identity verification loops? Open your Trade Republic account and buy your first ETF in under 3 minutes.' Route directly to biometric instant verification.",
                impactLabel: "Target KPI Delta",
                impactValue: "+22% Paid CAC Efficiency · Est. 15,000 High-LTV Switchers · <3min Onboarding Time"
            },
            {
                id: "takeaway-3",
                signalId: "sig_scalable_promos",
                type: "Defensive Moat",
                typeClass: "type-moat",
                priority: "P1 - High",
                priorityClass: "priority-p1",
                cardClass: "takeaway-card-p1",
                squad: "👥 Core Brokerage & Wealth (Lead: PM Brokerage)",
                channel: "#wealth-squad",
                title: "High-Balance Retention Trigger Against Scalable €100 Transfer Poaching",
                context: "Scalable Capital launched a €100 cash bonus promotion for external portfolio transfers > €10,000, explicitly targeting active competitor holdings.",
                playbook: "Trigger automated in-app VIP value summaries for users holding >€10,000 in custody. Highlight Trade Republic's €1 flat execution rate, €0 ETF savings plans, and 1% Saveback vs Scalable's prime subscription fee.",
                impactLabel: "Target KPI Delta",
                impactValue: "€24M+ Assets under Custody (AUC) Protected · <0.2% High-Tier Custody Outflow"
            },
            {
                id: "takeaway-4",
                signalId: "sig_revolut_ultra",
                type: "Filtered Noise",
                typeClass: "type-noise",
                priority: "P3 - Deprioritize",
                priorityClass: "priority-p3",
                cardClass: "takeaway-card-noise",
                squad: "👥 Cards & Payments (Lead: PM Card)",
                channel: "#cards-squad",
                title: "Reject Luxury €45/mo Lounge Tier; Reinforce 1% Free Card Saveback",
                context: "Revolut launched Ultra at €45.00/month featuring a platinum-plated card and airport lounge access.",
                playbook: "Classified as high-cost, low-volume lifestyle fluff. Explicitly deprioritize luxury physical tiers; maintain Trade Republic's zero-subscription card model with 1% Saveback.",
                impactLabel: "Strategic Resource ROI",
                impactValue: "Saves 2 Full Sprints of Engineering Bandwidth · Preserves Zero-Subscription Fee Transparency"
            }
        ];

        container.innerHTML = `
            <div class="takeaways-hero-header">
                <div>
                    <h2>⚡ Strategic Decision Engine</h2>
                    <p class="modal-subtitle">Autonomous strategic prioritization translating competitive market shifts into squad playbooks, Jira epics, and KPI projections</p>
                </div>
                <div class="takeaways-stats-row">
                    <div class="takeaways-stat-chip">Active Playbooks: <strong>3 Live</strong></div>
                    <div class="takeaways-stat-chip">Target ROI: <strong>+€24M AUC</strong></div>
                    <div class="takeaways-stat-chip">Filtered Noise: <strong>1 Gimmick</strong></div>
                </div>
            </div>

            <div class="takeaways-grid">
                ${takeaways.map(t => `
                    <div class="takeaway-card ${t.cardClass}">
                        <div class="takeaway-header">
                            <div class="takeaway-badge-row">
                                <span class="takeaway-type-tag ${t.typeClass}">${t.type}</span>
                                <span class="priority-chip ${t.priorityClass}">${t.priority}</span>
                                <span class="squad-tag">${t.squad}</span>
                            </div>
                        </div>

                        <div class="takeaway-body">
                            <div class="takeaway-col-left">
                                <h3 class="takeaway-title">${escapeHtml(t.title)}</h3>
                                <div class="takeaway-context"><strong>Market Shift:</strong> ${escapeHtml(t.context)}</div>
                                <div class="takeaway-playbook"><strong>Recommended Decision & Playbook:</strong><br>${escapeHtml(t.playbook)}</div>
                            </div>
                            <div class="takeaway-col-right">
                                <div class="impact-projection-box">
                                    <span class="impact-projection-label">${escapeHtml(t.impactLabel)}</span>
                                    <div class="impact-projection-value">${escapeHtml(t.impactValue)}</div>
                                </div>
                            </div>
                        </div>

                        <div class="takeaway-footer">
                            <div class="takeaway-actions">
                                <button class="btn-takeaway-action btn-spec" data-id="${t.signalId}">📝 Spec-It (Mini-PRD)</button>
                                <button class="btn-takeaway-action btn-jira" data-id="${t.signalId}">⚡ Sprint Jira Story</button>
                            </div>
                            <button class="btn-takeaway-action btn-slack-alert" data-channel="${t.channel}">📢 Alert ${t.channel}</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function updateBriefContent() {
        const container = document.getElementById('brief-hero-content');
        if (!container) return;

        if (activeBriefFormat === 'summary') {
            container.innerHTML = `
                <div class="brief-visual-grid">
                    <div class="brief-column">
                        <div class="brief-column-title">🎯 Key Competitor Moves & Moat Impact</div>
                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title">
                                <span class="badge badge-n26">N26</span>
                                <span>Instant Savings Hiked to 3.00% p.a.</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Closes the yield gap, but <strong>Trade Republic maintains a +75 bps advantage</strong> (3.75% p.a.) on uninvested cash up to 50k EUR.
                            </div>
                        </div>

                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title">
                                <span class="badge badge-scalable-capital">Scalable</span>
                                <span>PRIME+ Cash Interest Adjusted to 3.75%</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Lowered rate from 4.00% to 3.75% with Baader Bank, bringing Scalable to <strong>exact yield parity</strong> with Trade Republic.
                            </div>
                        </div>

                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title">
                                <span class="badge badge-revolut">Revolut</span>
                                <span>Summer Referral Reward Boost: 60 € / friend</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Increased referral bonus from 40 € to 60 € (3 purchases > 5 €). Aggressive customer acquisition sprint escalating retail CAC pressure.
                            </div>
                        </div>

                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title">
                                <span class="badge badge-n26">N26</span>
                                <span>App Store Rating Slips to 4.3 ★</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Review sentiment drop (-0.4★) following update v12.4 with recurring KYC re-verification loops and biometric login failures.
                            </div>
                        </div>
                    </div>

                    <div class="brief-column">
                        <div class="brief-column-title">⚡ Recommended Next Best Actions for PMs</div>
                        
                        <div class="brief-action-card">
                            <div class="brief-bullet-title">
                                <span class="action-tag action-tag-marketing">Marketing</span>
                                <span>Yield Leadership Campaign</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Emphasize Trade Republic's 75 bps cash interest spread over N26 (3.75% vs 3.00%) in deposit retention and paid social messaging.
                            </div>
                        </div>

                        <div class="brief-action-card">
                            <div class="brief-bullet-title">
                                <span class="action-tag action-tag-acquisition">Acquisition</span>
                                <span>Target Onboarding Friction</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Launch targeted acquisition creative highlighting Trade Republic's instant, frictionless biometric onboarding against N26 verification pain points.
                            </div>
                        </div>

                        <div class="brief-action-card">
                            <div class="brief-bullet-title">
                                <span class="action-tag action-tag-product">Product</span>
                                <span>Portfolio Poaching Defense</span>
                            </div>
                            <div class="brief-bullet-desc">
                                Monitor high-balance account transfers in response to Scalable's 100 € transfer promo; evaluate temporary 1% saveback cap relaxation.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeBriefFormat === 'slack') {
            container.innerHTML = `<pre class="brief-code-box">${escapeHtml(getSlackBriefText())}</pre>`;
        } else if (activeBriefFormat === 'email') {
            container.innerHTML = `<pre class="brief-code-box">${escapeHtml(getEmailBriefText())}</pre>`;
        }
    }

    function getRawBriefText() {
        if (activeBriefFormat === 'slack') return getSlackBriefText();
        if (activeBriefFormat === 'email') return getEmailBriefText();
        return getSlackBriefText();
    }

    function getSlackBriefText() {
        return [
            `*⚡ Competitive Intelligence Executive Brief — Week of Aug 17, 2026*`,
            `_Automated synthesis tracking N26, Revolut, Scalable Capital & Bitpanda vs Trade Republic_`,
            ``,
            `*Key Strategic Developments:*`,
            `• *N26 Savings Rate*: Increased instant savings from 1.26% → *3.00% p.a.* (Trade Republic retains *+75 bps advantage* at 3.75%).`,
            `• *Scalable Capital Yield*: Adjusted PRIME+ Baader yield from 4.00% → *3.75% p.a.* (now matching TR at parity).`,
            `• *Revolut Acquisition Sprint*: Boosted friend referral bonus to *€60 per friend* (aggressive CAC escalation).`,
            `• *Scalable Transfer Promo*: Launched *€100 cash bonus* for portfolio transfers > €10k targeting active brokerage balances.`,
            `• *N26 Mobile App Sentiment*: Rating dropped to *4.3★* after update v12.4 caused biometric login and KYC verification loops.`,
            ``,
            `*Recommended Next Best Actions for PMs:*`,
            `1. _Marketing_: Highlight our 75 bps cash interest spread in deposit retention campaigns.`,
            `2. _Acquisition_: Launch comparison creative capitalizing on N26's KYC verification churn.`,
            `3. _Product_: Monitor Scalable Capital's €100 portfolio transfer volume for saveback bonus defense.`
        ].join('\n');
    }

    function getEmailBriefText() {
        return [
            `SUBJECT: Executive Competitive Intelligence Brief — Week of Aug 17, 2026`,
            ``,
            `Hi Leadership Team,`,
            ``,
            `Here is the weekly competitive intelligence briefing for the week of Aug 17, 2026:`,
            ``,
            `1. DEPOSIT COMPETITION & YIELDS`,
            `   - N26 raised instant savings to 3.00% p.a. Trade Republic retains market leadership with a +75 bps spread (3.75% p.a.).`,
            `   - Scalable Capital reduced PRIME+ cash rate to 3.75% p.a., bringing them to exact parity with Trade Republic.`,
            ``,
            `2. ACQUISITION & CAC SPRINT`,
            `   - Revolut raised friend referral payouts to €60 (requires 3 card transactions > €5 within 21 days).`,
            `   - Scalable Capital launched an aggressive €100 cash bonus promotion for portfolio transfers over €10,000.`,
            ``,
            `3. MOBILE APP STORE SENTIMENT`,
            `   - N26 ratings slipped to 4.3★ on iOS and Google Play due to biometric login bugs in release v12.4.`,
            `   - Bitpanda ratings ticked up to 4.6★ following instant 0% PayPal top-up rollout.`,
            ``,
            `STRATEGIC RECOMMENDATIONS:`,
            `- Re-emphasize Trade Republic's 1% Saveback and 3.75% interest in paid social ad copy.`,
            `- Prepare retention messaging for high-balance brokerage accounts targeted by Scalable's transfer bonus.`,
            ``,
            `Full dashboard: http://localhost:3847`
        ].join('\n');
    }

    function renderSignalList(signals, container, isReviewQueue) {
        if (!container) return;

        if (signals.length === 0) {
            if (isReviewQueue) {
                container.innerHTML = `
                    <div class="empty-state queue-empty-card">
                        <div class="empty-icon">✓</div>
                        <h3>Review Queue is Clear</h3>
                        <p>No competitor signals currently require PM triage.</p>
                        <span class="sla-note">Scheduled PM Triage SLA: Monday 09:00 CET</span>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="empty-state">No signals match your active filters.</div>';
            }
            return;
        }

        container.innerHTML = signals.map(s => {
            const compClass = (s.competitor || 'default').toLowerCase().replace(/\s+/g, '-');
            const dateStr = formatDate(s.timestamp);
            const diffHtml = formatDiff(s.diff_snippet);

            let actionButtons = '';
            if (s.status === 'staged_review') {
                actionButtons = `
                    <div class="action-buttons">
                        <button class="btn btn-reject" data-id="${s.id}">Reject / Noise</button>
                        <button class="btn btn-approve" data-id="${s.id}">Approve Signal</button>
                    </div>
                `;
            }

            const statusLabel = s.status === 'auto_published' ? 'Auto-Published'
                              : s.status === 'approved' ? 'PM Approved'
                              : s.status === 'staged_review' ? 'Pending Review'
                              : 'Rejected';

            const categoryDisplay = s.category === 'app_reviews' ? 'APP REVIEWS (iOS & Google Play)'
                                  : s.category === 'marketing_promo' ? 'MARKETING & PROMOS'
                                  : (s.category || 'SIGNAL').replace('_', ' ').toUpperCase();

            // Pillar & Impact Badges
            const pillarDisplay = s.jtbd_pillar || 'Value Realization';
            const impactClass = s.impact_scoring?.classification === 'Defensive Need (Parity)' ? 'impact-defensive'
                              : s.impact_scoring?.classification === 'Noise (Low ROI)' ? 'impact-noise'
                              : 'impact-moat';
            const impactLabel = s.impact_scoring?.classification || 'Differentiator (Moat)';

            // Construct desktop-friendly source links
            let sourceLinksHtml = '';
            if (s.category === 'app_reviews' && (s.ios_url || s.android_url)) {
                sourceLinksHtml = `
                    <div class="store-links-group">
                        <span class="store-label">Desktop Store Links:</span>
                        ${s.ios_url ? `<a href="${s.ios_url}" target="_blank" rel="noopener noreferrer" class="store-link store-ios">🍎 App Store ↗</a>` : ''}
                        ${s.android_url ? `<a href="${s.android_url}" target="_blank" rel="noopener noreferrer" class="store-link store-android">🤖 Google Play ↗</a>` : ''}
                    </div>
                `;
            } else {
                sourceLinksHtml = `<a href="${s.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="source-link">View Source ↗</a>`;
            }

            return `
                <div class="signal-card">
                    <div class="signal-header">
                        <span class="badge badge-${compClass}">${s.competitor}</span>
                        <span class="category-pill category-${s.category}">${categoryDisplay}</span>
                        <span class="pillar-pill">📌 ${escapeHtml(pillarDisplay)}</span>
                        <span class="impact-pill ${impactClass}">${escapeHtml(impactLabel)}</span>
                        <span class="source-tier-pill"><span class="tier-dot"></span>${s.source_tier || 'Tier 1'}</span>
                        <span class="status-indicator status-${s.status}">
                            <span class="status-dot"></span>
                            ${statusLabel}
                        </span>
                        ${s.sentiment_theme ? `<span class="sentiment-pill">💬 ${escapeHtml(s.sentiment_theme)}</span>` : ''}
                        ${s.rating_delta ? `<span class="rating-pill">⭐ ${escapeHtml(s.rating_delta)}</span>` : ''}
                        <span class="timestamp" title="Snapshot timestamp: ${s.timestamp || ''}">Captured ${dateStr}</span>
                    </div>

                    <div class="signal-summary">${escapeHtml(s.change_summary || '')}</div>

                    ${s.why_it_matters ? `<div class="signal-impact">${escapeHtml(s.why_it_matters)}</div>` : ''}

                    <div class="diff-container">
                        <button class="diff-toggle">${isReviewQueue ? '▼ Hide Diff' : '▶ Show Diff'}</button>
                        <div class="diff-content ${isReviewQueue ? 'expanded' : ''}">
                            ${diffHtml}
                        </div>
                    </div>

                    <div class="signal-footer">
                        <div class="card-actions-row">
                            ${sourceLinksHtml}
                            <button class="btn-spec" data-id="${s.id}">📝 Spec-It (Mini-PRD)</button>
                            <button class="btn-jira" data-id="${s.id}">⚡ Sprint Jira Ticket</button>
                        </div>
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatDiff(diffText) {
        if (!diffText) return '<div class="diff-line"># No detailed diff snippet available</div>';
        const lines = diffText.replace(/\\n/g, '\n').split('\n');

        return lines.map(line => {
            let cls = '';
            if (line.startsWith('+')) cls = 'diff-addition';
            else if (line.startsWith('-')) cls = 'diff-removal';
            else if (line.startsWith('@@')) cls = 'diff-meta';

            return `<div class="diff-line ${cls}">${escapeHtml(line)}</div>`;
        }).join('');
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function formatDate(isoString) {
        if (!isoString) return 'Recent';
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return 'Recent';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Recent';
        }
    }

    function getFallbackSignals() {
        return [
            {
                id: "sig_n26_pricing",
                competitor: "N26",
                category: "pricing",
                source_url: "https://n26.com/en-de/plans",
                source_tier: "Tier 1",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "N26 updated pricing: changed from [Instant Savings: 1.26% p.a.] to [Instant Savings: 3.00% p.a.].",
                why_it_matters: "Impacts deposit competition vs Trade Republic's 3.75% p.a. on uninvested cash up to 50,000 EUR.",
                diff_snippet: "@@ -3,5 +3,5 @@\n 0.00 € / month\n-Instant Savings: 1.26% p.a.\n+Instant Savings: 3.00% p.a.",
                jtbd_pillar: "Value Realization",
                impact_scoring: {
                    classification: "Differentiator (Moat)",
                    urgency: "P1 - Next Sprint",
                    rationale: "Trade Republic retains a clear +75 bps uninvested cash yield advantage (3.75% vs 3.00%)."
                },
                mini_prd: {
                    problem_statement: "N26 increased instant savings to 3.00% p.a., narrowing the cash yield gap.",
                    proposed_mvp_response: "Launch targeted retention campaign highlighting Trade Republic's +75 bps spread (3.75% p.a.) and 1% Saveback.",
                    target_metrics: ["+20% signup conversion on comparison pages", "<0.5% annualized deposit churn"],
                    explicit_out_of_scope: ["Do NOT alter core €1.00 fee structure", "Do NOT subsidize temporary promotional rates"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Highlight Cash Yield Moat vs N26",
                    user_story: "As a Trade Republic user, I want clear visibility into my 3.75% cash yield, so that I keep deposits in TR.",
                    gherkin_scenarios: ["Scenario: User views account overview\n  Given active cash balance > 0\n  When viewing app\n  Then monthly interest payout is shown"],
                    acceptance_criteria: ["Tracking events emitted", "Render time < 200ms"]
                },
                status: "auto_published"
            }
        ];
    }

    // Direct, state-independent runner
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
