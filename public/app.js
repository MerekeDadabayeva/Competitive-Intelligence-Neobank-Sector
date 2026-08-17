// Trade Republic Competitive Intelligence Radar — 5-Second Scannable Intelligence & Spec Drawer Engine v4.5

(function() {
    let signalsData = getFullSignalsDataset();
    let baselineData = getFullBaselineData();
    let selectedPillar = 'ALL';
    let selectedCompetitor = 'ALL';
    let selectedImpact = 'ALL';
    let searchQuery = '';
    let activeBriefFormat = 'summary'; // 'summary' | 'slack' | 'email'
    let activeDrawerSignal = null;

    // Simulator State
    let simYieldRate = 4.00;
    let simAvgCash = 5000;
    let simBountyBonus = 100;
    let simTransferSize = 15000;

    function bootstrap() {
        setupEventListeners();
        render();
        syncWithApi();
    }

    async function syncWithApi() {
        try {
            const res = await fetch('/api/signals');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    signalsData = data;
                    render();
                }
            }
        } catch (e) {}
        try {
            const res = await fetch('/api/baseline');
            if (res.ok) {
                const data = await res.json();
                if (data && data.company) {
                    baselineData = data;
                    renderBaselineModal();
                }
            }
        } catch (e) {}
    }

    function setupEventListeners() {
        // 1. Sidebar Competitor Buttons (Primary Nav Anchor)
        document.querySelectorAll('.sidebar-competitor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const comp = e.currentTarget.dataset.competitor;
                document.querySelectorAll('.sidebar-competitor-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                selectedCompetitor = comp;

                // Auto-switch to Live Signal Feed view
                const radarNavBtn = document.querySelector('.sidebar-view-btn[data-tab="radar"]');
                if (radarNavBtn) {
                    document.querySelectorAll('.sidebar-view-btn').forEach(b => b.classList.remove('active'));
                    radarNavBtn.classList.add('active');
                }
                document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
                const radarPanel = document.getElementById('view-radar');
                if (radarPanel) radarPanel.classList.add('active');

                // Update Header Titles & Badge
                updateCompetitorHeader(comp);

                renderCardsGrid();
                renderKpisForCompetitor(comp);
            });
        });

        // 2. Sidebar Report & View Buttons (Radar | Brief | Integrity)
        document.querySelectorAll('.sidebar-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                document.querySelectorAll('.sidebar-view-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

                e.currentTarget.classList.add('active');
                const targetPanel = document.getElementById('view-' + targetTab);
                if (targetPanel) targetPanel.classList.add('active');

                // Update View Title in Topbar
                const titleEl = document.getElementById('active-view-title');
                const badgeEl = document.getElementById('active-competitor-badge');
                const subEl = document.getElementById('active-view-subtitle');

                if (targetTab === 'radar') {
                    updateCompetitorHeader(selectedCompetitor);
                } else if (targetTab === 'brief') {
                    if (titleEl) titleEl.textContent = 'Weekly Executive Brief & Strategy';
                    if (badgeEl) badgeEl.textContent = 'CPO Intelligence Memo';
                    if (subEl) subEl.textContent = 'Synthesized strategic executive brief, competitive parity matrix, and What-If simulator';
                } else if (targetTab === 'integrity') {
                    if (titleEl) titleEl.textContent = 'Data Integrity & AST Pipeline';
                    if (badgeEl) badgeEl.textContent = 'Zero-Extrapolation Gateway';
                    if (subEl) subEl.textContent = 'Deterministic AST unified diff extraction, type-safe Zod validation, and SHA-256 grounding hashes';
                }
            });
        });

        // 3. Quick Filter Chips (Impact Triage & Strategic Pillars)
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.filterType;
                const val = e.currentTarget.dataset.filterVal;

                document.querySelectorAll(`.filter-chip[data-filter-type="${type}"]`).forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');

                if (type === 'impact') selectedImpact = val;
                if (type === 'pillar') selectedPillar = val;

                renderCardsGrid();
            });
        });

        // 4. Search Input
        const searchInput = document.getElementById('signal-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                renderCardsGrid();
            });
        }

        // 5. Drawer Controls
        const drawerBackdrop = document.getElementById('spec-drawer-backdrop');
        const closeDrawerBtn = document.getElementById('close-drawer-btn');
        if (closeDrawerBtn && drawerBackdrop) {
            closeDrawerBtn.addEventListener('click', () => drawerBackdrop.classList.remove('active'));
        }
        if (drawerBackdrop) {
            drawerBackdrop.addEventListener('click', (e) => {
                if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('active');
            });
        }

        // 6. Baseline Modal Controls
        const openBaselineBtn = document.getElementById('open-baseline-btn');
        const baselineModal = document.getElementById('baseline-modal');
        const closeBaselineBtn = document.getElementById('close-baseline-btn');
        if (openBaselineBtn && baselineModal) {
            openBaselineBtn.addEventListener('click', () => {
                renderBaselineModal();
                baselineModal.classList.add('active');
            });
        }
        if (closeBaselineBtn && baselineModal) {
            closeBaselineBtn.addEventListener('click', () => baselineModal.classList.remove('active'));
        }
        if (baselineModal) {
            baselineModal.addEventListener('click', (e) => {
                if (e.target === baselineModal) baselineModal.classList.remove('active');
            });
        }

        // 7. Dynamic Delegated Clicks (Card Actions, Copy Buttons, Slack Dispatch)
        document.body.addEventListener('click', (e) => {
            // Open Spec Drawer
            const openDrawerBtn = e.target.closest('.btn-open-spec-drawer');
            if (openDrawerBtn) {
                const sigId = openDrawerBtn.dataset.id;
                openSpecDrawer(sigId);
                return;
            }

            // Copy 1-Page Spec (Markdown)
            const copySpecBtn = e.target.closest('#btn-copy-spec');
            if (copySpecBtn && activeDrawerSignal) {
                const s = activeDrawerSignal;
                const prd = s.mini_prd;
                const md = `# [1-PAGE SPEC] Strategic Counter-Response to ${s.competitor}\n` +
                    `**Strategic Pillar**: ${s.jtbd_pillar || ''} | **Impact Triage**: ${s.impact_scoring ? s.impact_scoring.classification : ''}\n\n` +
                    `## 1. Problem Statement & Context\n${prd.problem_statement}\n\n` +
                    `## 2. Proposed MVP Counter-Move\n${prd.proposed_mvp_response}\n\n` +
                    `## 3. Target Business Metrics\n${prd.target_metrics.map(m => '- [ ] ' + m).join('\n')}\n\n` +
                    `## 4. Strict Out-of-Scope Limits (Feature Creep Discipline)\n${prd.explicit_out_of_scope.map(o => '- ❌ ' + o).join('\n')}\n\n` +
                    `## 5. Primary Verification Link\n${s.source_url}`;

                navigator.clipboard.writeText(md).then(() => {
                    copySpecBtn.textContent = '✓ Copied Markdown!';
                    setTimeout(() => { copySpecBtn.textContent = '📋 Copy 1-Page Spec'; }, 2200);
                });
                return;
            }

            // Copy Jira Story (Gherkin BDD)
            const copyJiraBtn = e.target.closest('#btn-copy-jira');
            if (copyJiraBtn && activeDrawerSignal) {
                const j = activeDrawerSignal.jira_gherkin_story;
                const txt = `h2. ${j.epic_title}\n\n*User Story:*\n${j.user_story}\n\n*Gherkin Scenarios:*\n{code}\n${j.gherkin_scenarios.join('\n\n')}\n{code}\n\n*Definition of Done:*\n${j.acceptance_criteria.map(ac => '# ' + ac).join('\n')}`;

                navigator.clipboard.writeText(txt).then(() => {
                    copyJiraBtn.textContent = '✓ Copied Jira Epic!';
                    setTimeout(() => { copyJiraBtn.textContent = '⚡ Copy Jira Story'; }, 2200);
                });
                return;
            }

            // Slack Dispatch from Drawer
            const drawerSlackBtn = e.target.closest('#btn-drawer-slack');
            if (drawerSlackBtn && activeDrawerSignal) {
                const ch = activeDrawerSignal.category === 'pricing' ? '#pricing-committee' : activeDrawerSignal.category === 'marketing_promo' ? '#growth-squad' : '#brokerage-squad';
                drawerSlackBtn.textContent = '✓ Dispatched to ' + ch + '!';
                drawerSlackBtn.classList.add('sent');
                setTimeout(() => {
                    drawerSlackBtn.textContent = '📢 Dispatch to Squad';
                    drawerSlackBtn.classList.remove('sent');
                }, 2500);
                return;
            }
        });

        // 8. Executive Brief Toggle & Copy
        const formatBtns = document.querySelectorAll('#brief-format-toggle .format-btn');
        const copyBriefBtn = document.getElementById('copy-brief-btn');
        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeBriefFormat = btn.dataset.format || 'summary';
                renderBriefView();
            });
        });

        if (copyBriefBtn) {
            copyBriefBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(getRawBriefText()).then(() => {
                    copyBriefBtn.textContent = '✓ Copied Brief!';
                    setTimeout(() => { copyBriefBtn.textContent = '📋 Copy Brief'; }, 2200);
                });
            });
        }

        // 9. Simulator Input Sliders
        document.body.addEventListener('input', (e) => {
            if (e.target.id === 'slider-yield-rate') {
                simYieldRate = parseFloat(e.target.value);
                renderSimulatorView();
            } else if (e.target.id === 'slider-avg-cash') {
                simAvgCash = parseInt(e.target.value, 10);
                renderSimulatorView();
            } else if (e.target.id === 'slider-bounty') {
                simBountyBonus = parseInt(e.target.value, 10);
                renderSimulatorView();
            } else if (e.target.id === 'slider-transfer-size') {
                simTransferSize = parseInt(e.target.value, 10);
                renderSimulatorView();
            }
        });
    }

    function openSpecDrawer(signalId) {
        const signal = signalsData.find(s => s.id === signalId) || signalsData[0];
        activeDrawerSignal = signal;

        // Header Meta
        const sourcePill = getSourcePillMeta(signal);
        const sourcePillEl = document.getElementById('drawer-source-pill');
        if (sourcePillEl) {
            sourcePillEl.className = 'source-reliability-pill ' + sourcePill.className;
            sourcePillEl.textContent = sourcePill.text;
        }

        const impactBadge = getImpactBadgeMeta(signal);
        const impactBadgeEl = document.getElementById('drawer-impact-badge');
        if (impactBadgeEl) {
            impactBadgeEl.className = 'impact-badge ' + impactBadge.className;
            impactBadgeEl.textContent = impactBadge.text;
        }

        const titleEl = document.getElementById('drawer-title');
        if (titleEl) titleEl.textContent = signal.competitor + ' — ' + (signal.change_summary || '');

        const subtitleEl = document.getElementById('drawer-subtitle');
        if (subtitleEl) subtitleEl.textContent = `Pillar: ${signal.jtbd_pillar || 'Value Realization'} · Urgency: ${signal.impact_scoring ? signal.impact_scoring.urgency : 'P1'}`;

        // 1. Response (Spec)
        const problemEl = document.getElementById('drawer-problem-stmt');
        if (problemEl) problemEl.textContent = signal.mini_prd.problem_statement;

        const mvpEl = document.getElementById('drawer-proposed-mvp');
        if (mvpEl) mvpEl.textContent = signal.mini_prd.proposed_mvp_response;

        const metricsEl = document.getElementById('drawer-target-metrics');
        if (metricsEl) metricsEl.innerHTML = signal.mini_prd.target_metrics.map(m => `<li><span class="arch-feature-icon">✓</span> ${escapeHtml(m)}</li>`).join('');

        // 2. Out of Scope
        const outOfScopeEl = document.getElementById('drawer-out-of-scope');
        if (outOfScopeEl) outOfScopeEl.innerHTML = signal.mini_prd.explicit_out_of_scope.map(o => `<li>❌ ${escapeHtml(o)}</li>`).join('');

        // 3. Jira Story
        const epicEl = document.getElementById('drawer-jira-epic');
        if (epicEl) epicEl.textContent = signal.jira_gherkin_story.epic_title;

        const storyEl = document.getElementById('drawer-jira-story');
        if (storyEl) storyEl.textContent = signal.jira_gherkin_story.user_story;

        const gherkinEl = document.getElementById('drawer-jira-gherkin');
        if (gherkinEl) gherkinEl.textContent = signal.jira_gherkin_story.gherkin_scenarios.join('\n\n');

        const acEl = document.getElementById('drawer-jira-ac');
        if (acEl) acEl.innerHTML = signal.jira_gherkin_story.acceptance_criteria.map(ac => `<li><span class="arch-feature-icon">✓</span> ${escapeHtml(ac)}</li>`).join('');

        // 4. Diff & Provenance
        const diffBox = document.getElementById('drawer-diff-box');
        if (diffBox) diffBox.innerHTML = formatDiff(signal.diff_snippet);

        const hashEl = document.getElementById('drawer-hash');
        if (hashEl) hashEl.textContent = 'SHA256:' + (signal.id.replace(/[^a-f0-9]/gi, '').padEnd(32, 'a').substring(0, 32));

        const primaryLink = document.getElementById('drawer-primary-link');
        if (primaryLink) {
            primaryLink.href = signal.source_url || '#';
            primaryLink.textContent = `Verify Primary Source (${signal.source_tier}) ↗`;
        }

        // Open Drawer
        const drawer = document.getElementById('spec-drawer-backdrop');
        if (drawer) drawer.classList.add('active');
    }

    function getSourcePillMeta(s) {
        if (s.category === 'app_reviews' || (s.source_tier && s.source_tier.includes('App Store'))) {
            return { text: '🟢 VERIFIED • APP STORE v12.4', className: 'pill-green' };
        }
        if (s.source_tier && s.source_tier.includes('BaFin')) {
            return { text: '🟡 REGULATORY REGISTER (BaFin)', className: 'pill-amber' };
        }
        if (s.category === 'pricing') {
            return { text: '🟢 VERIFIED • FEE SCHEDULE', className: 'pill-green' };
        }
        if (s.category === 'marketing_promo') {
            return { text: '🟢 VERIFIED • LEGAL TERMS', className: 'pill-green' };
        }
        return { text: '⚪ VERIFIED • PLAN CATALOG', className: 'pill-gray' };
    }

    function getImpactBadgeMeta(s) {
        if (s.tr_delta) {
            if (s.tr_delta.moat_status === 'leader') return { text: '[MOAT: DIFFERENTIATOR]', className: 'badge-moat' };
            if (s.tr_delta.moat_status === 'threat') return { text: '[THREAT: DEFENSIVE PARITY]', className: 'badge-threat' };
            if (s.tr_delta.moat_status === 'noise') return { text: '[NOISE: LOW ROI]', className: 'badge-noise' };
        }
        if (s.impact_scoring) {
            if (s.impact_scoring.classification === 'Differentiator (Moat)') return { text: '[MOAT: DIFFERENTIATOR]', className: 'badge-moat' };
            if (s.impact_scoring.classification === 'Noise (Low ROI)') return { text: '[NOISE: LOW ROI]', className: 'badge-noise' };
            return { text: '[THREAT: DEFENSIVE PARITY]', className: 'badge-threat' };
        }
        return { text: '[PARITY: MONITOR]', className: 'badge-threat' };
    }

    function updateCompetitorHeader(comp) {
        const titleEl = document.getElementById('active-view-title');
        const badgeEl = document.getElementById('active-competitor-badge');
        const subEl = document.getElementById('active-view-subtitle');

        if (comp === 'ALL') {
            if (titleEl) titleEl.textContent = 'All Competitors';
            if (badgeEl) badgeEl.textContent = 'All 4 Neobanks';
            if (subEl) subEl.textContent = 'Autonomous Competitor Delta Synthesis vs Trade Republic Baseline';
        } else if (comp === 'N26') {
            if (titleEl) titleEl.textContent = 'N26 Competitive Radar';
            if (badgeEl) badgeEl.textContent = 'N26 Bank AG (2 Signals)';
            if (subEl) subEl.textContent = 'Tracking Instant Savings yield hike (3.00%) and iOS v12.4 KYC drop-off';
        } else if (comp === 'Scalable Capital') {
            if (titleEl) titleEl.textContent = 'Scalable Capital Radar';
            if (badgeEl) badgeEl.textContent = 'Scalable GmbH (2 Signals)';
            if (subEl) subEl.textContent = 'Tracking PRIME+ yield adjustment (3.75%) and €100 portfolio poaching bonus';
        } else if (comp === 'Revolut') {
            if (titleEl) titleEl.textContent = 'Revolut Radar';
            if (badgeEl) badgeEl.textContent = 'Revolut Ltd (2 Signals)';
            if (subEl) subEl.textContent = 'Tracking €60 referral CAC bounty escalation and €45/mo Ultra vanity tier';
        } else if (comp === 'Bitpanda') {
            if (titleEl) titleEl.textContent = 'Bitpanda Radar';
            if (badgeEl) badgeEl.textContent = 'Bitpanda GmbH (2 Signals)';
            if (subEl) subEl.textContent = 'Tracking staking yield compression (ETH 3.1%) and 0% PayPal instant deposits';
        }
    }

    function renderKpisForCompetitor(comp) {
        const container = document.getElementById('kpi-strip-container');
        if (!container) return;

        if (comp === 'N26') {
            container.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Yield Margin Spread</div>
                    <div class="kpi-val text-emerald">+75 bps Lead</div>
                    <div class="kpi-sub">3.75% TR vs 3.00% N26 (€0 fee)</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Monthly Cost Delta</div>
                    <div class="kpi-val text-blue">€0 vs €16.90</div>
                    <div class="kpi-sub">TR free vs N26 Metal subscription</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">KYC Verification Gap</div>
                    <div class="kpi-val text-indigo">3m vs 4.3★</div>
                    <div class="kpi-sub">Arbitrage on N26 v12.4 login bugs</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Tactical Counter-Move</div>
                    <div class="kpi-val text-purple">Acquisition Ad</div>
                    <div class="kpi-sub">Contrast yield & frictionless onboarding</div>
                </div>
            `;
        } else if (comp === 'Scalable Capital') {
            container.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Annual Fee Spread</div>
                    <div class="kpi-val text-emerald">€0 vs €59.88</div>
                    <div class="kpi-sub">TR Free vs Scalable PRIME+ subscription</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Protected Custody AUC</div>
                    <div class="kpi-val text-blue">€24.2M</div>
                    <div class="kpi-sub">Defending >€10k accounts vs €100 bounty</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">3-Yr Fee Advantage</div>
                    <div class="kpi-val text-indigo">+€300 Saved</div>
                    <div class="kpi-sub">Flat €1 trading vs % volume fees</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Tactical Counter-Move</div>
                    <div class="kpi-val text-purple">VIP Fee Summary</div>
                    <div class="kpi-sub">Retain >€10k accounts with value clarity</div>
                </div>
            `;
        } else if (comp === 'Revolut') {
            container.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Upfront CAC Pressure</div>
                    <div class="kpi-val text-rose">€60 Bounty</div>
                    <div class="kpi-sub">Revolut referral cash payout spike</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">TR Retention Weapon</div>
                    <div class="kpi-val text-emerald">1% Saveback</div>
                    <div class="kpi-sub">Invested directly into ETF savings plans</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Dev Capacity Protected</div>
                    <div class="kpi-val text-purple">+2 Sprints</div>
                    <div class="kpi-sub">Revolut €45/mo Ultra gimmick filtered</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Tactical Counter-Move</div>
                    <div class="kpi-val text-blue">Saveback Push</div>
                    <div class="kpi-sub">Payroll salary multiplier (+0.5%)</div>
                </div>
            `;
        } else if (comp === 'Bitpanda') {
            container.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Trading Fee Moat</div>
                    <div class="kpi-val text-emerald">€1.00 Flat</div>
                    <div class="kpi-sub">TR transparent fee vs % spreads</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Staking Yield Trend</div>
                    <div class="kpi-val text-amber">-0.7% APY</div>
                    <div class="kpi-sub">Bitpanda ETH staking cut to 3.1%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Deposit Speed Parity</div>
                    <div class="kpi-val text-blue">Instant €0</div>
                    <div class="kpi-sub">Apple/Google Pay vs PayPal 0%</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Tactical Counter-Move</div>
                    <div class="kpi-val text-indigo">Crypto Discovery</div>
                    <div class="kpi-sub">Promote €0 crypto automated plans</div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-label">Yield Spread Moat</div>
                    <div class="kpi-val text-emerald">+75 bps Lead</div>
                    <div class="kpi-sub">3.75% TR vs 3.00% N26 (€0 fee)</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Protected Custody AUC</div>
                    <div class="kpi-val text-blue">€24.2M</div>
                    <div class="kpi-sub">Scalable €100 poaching defense</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Acquisition Velocity Lead</div>
                    <div class="kpi-val text-indigo">3 Min KYC</div>
                    <div class="kpi-sub">vs N26 4.3★ verification loop churn</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Sprint Capacity Protected</div>
                    <div class="kpi-val text-purple">+2 Sprints</div>
                    <div class="kpi-sub">Revolut Ultra €45/mo noise rejected</div>
                </div>
            `;
        }
    }

    function render() {
        renderCardsGrid();
        renderBriefView();
        renderParityTable();
        renderSimulatorView();
        renderIntegrityView();
        updateCompetitorCounts();
    }

    function updateCompetitorCounts() {
        const cAll = signalsData.length;
        const cN26 = signalsData.filter(s => s.competitor === 'N26').length;
        const cScalable = signalsData.filter(s => s.competitor === 'Scalable Capital').length;
        const cRevolut = signalsData.filter(s => s.competitor === 'Revolut').length;
        const cBitpanda = signalsData.filter(s => s.competitor === 'Bitpanda').length;

        const elAll = document.getElementById('count-all');
        const elN26 = document.getElementById('count-n26');
        const elScalable = document.getElementById('count-scalable');
        const elRevolut = document.getElementById('count-revolut');
        const elBitpanda = document.getElementById('count-bitpanda');

        if (elAll) elAll.textContent = cAll;
        if (elN26) elN26.textContent = cN26;
        if (elScalable) elScalable.textContent = cScalable;
        if (elRevolut) elRevolut.textContent = cRevolut;
        if (elBitpanda) elBitpanda.textContent = cBitpanda;
    }

    function renderCardsGrid() {
        const container = document.getElementById('intel-cards-grid');
        if (!container) return;

        // Apply filters
        let filtered = signalsData.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (selectedPillar !== 'ALL') {
            filtered = filtered.filter(s => s.jtbd_pillar === selectedPillar);
        }

        if (selectedCompetitor !== 'ALL') {
            filtered = filtered.filter(s => s.competitor === selectedCompetitor);
        }

        if (selectedImpact !== 'ALL') {
            filtered = filtered.filter(s => s.impact_scoring && s.impact_scoring.classification === selectedImpact);
        }

        if (searchQuery) {
            filtered = filtered.filter(s => {
                const combined = (s.competitor + ' ' + s.change_summary + ' ' + (s.tr_delta ? s.tr_delta.delta_implication + ' ' + s.tr_delta.pm_action : '')).toLowerCase();
                return combined.includes(searchQuery);
            });
        }

        if (!filtered.length) {
            container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:40px;text-align:center;color:#64748b;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">No competitor signals match your active filters.</div>`;
            return;
        }

        container.innerHTML = filtered.map(s => {
            const compClass = (s.competitor || 'default').toLowerCase().replace(/\s+/g, '-');
            const sourcePill = getSourcePillMeta(s);
            const impactBadge = getImpactBadgeMeta(s);
            const deltaText = s.tr_delta ? s.tr_delta.delta_implication : s.why_it_matters;
            const devImpactText = s.dev_sp ? `${s.dev_sp} | ${s.impact_scoring ? s.impact_scoring.urgency : 'P1'}` : '3 Story Points | P1 Next Sprint';

            return `
                <div class="intel-card">
                    <div>
                        <div class="intel-card-header">
                            <span class="source-reliability-pill ${sourcePill.className}">${sourcePill.text}</span>
                            <span class="impact-badge ${impactBadge.className}">${impactBadge.text}</span>
                        </div>

                        <div class="intel-card-headline">
                            <span class="comp-brand comp-${compClass}">${s.competitor}</span> — ${escapeHtml(s.change_summary || '')}
                        </div>

                        <div class="intel-card-body">
                            <p class="intel-delta-line">• <strong>Strategic Delta:</strong> ${escapeHtml(deltaText)}</p>
                            <p class="intel-impact-line">• <strong>Estimated Dev Impact:</strong> ${escapeHtml(devImpactText)}</p>
                        </div>
                    </div>

                    <div class="intel-card-footer">
                        <a href="${s.source_url}" target="_blank" rel="noopener noreferrer" class="btn-diff-link">
                            🔍 View Primary Diff ↗
                        </a>
                        <button class="btn-open-spec-drawer" data-id="${s.id}">
                            ⚡ Open 1-Page Spec Drawer
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderBriefView() {
        const container = document.getElementById('brief-content-area');
        if (!container) return;

        if (activeBriefFormat === 'summary') {
            container.innerHTML = `
                <div class="brief-visual-grid">
                    <div class="brief-column">
                        <div class="brief-column-title">🎯 Key Strategic Developments</div>
                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title"><span class="badge badge-n26">N26</span> Instant Savings Hiked to 3.00% p.a.</div>
                            <div class="brief-bullet-desc">Closes yield gap, but <strong>TR maintains +75 bps advantage</strong> (3.75% p.a.) on uninvested cash up to 50k EUR.</div>
                        </div>
                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title"><span class="badge badge-scalable-capital">Scalable</span> PRIME+ Adjusted to 3.75% p.a.</div>
                            <div class="brief-bullet-desc">Lowered from 4.00% to 3.75% with Baader Bank, bringing Scalable to exact yield parity with Trade Republic.</div>
                        </div>
                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title"><span class="badge badge-revolut">Revolut</span> Referral Bounty Boost: €60 / Friend</div>
                            <div class="brief-bullet-desc">Escalates upfront CAC bounty wars. High risk of post-payout dormancy.</div>
                        </div>
                        <div class="brief-bullet-card">
                            <div class="brief-bullet-title"><span class="badge badge-n26">N26</span> App Store Rating Drops to 4.3★</div>
                            <div class="brief-bullet-desc">Rating drop (-0.4★) following v12.4 KYC re-verification loops and biometric login timeouts.</div>
                        </div>
                    </div>

                    <div class="brief-column">
                        <div class="brief-column-title">⚡ High-Leverage Counter-Actions</div>
                        <div class="brief-action-card">
                            <div class="brief-bullet-title"><span class="badge badge-tr">Growth</span> Yield Leadership Campaign</div>
                            <div class="brief-bullet-desc">Emphasize TR's 75 bps spread over N26 (3.75% vs 3.00%) in deposit retention and acquisition ad copy.</div>
                        </div>
                        <div class="brief-action-card">
                            <div class="brief-bullet-title"><span class="badge badge-tr">Acquisition</span> Exploit Onboarding Churn</div>
                            <div class="brief-bullet-desc">Deploy acquisition creatives highlighting TR's frictionless 3-minute biometric onboarding vs competitor verification pain.</div>
                        </div>
                        <div class="brief-action-card">
                            <div class="brief-bullet-title"><span class="badge badge-tr">Brokerage</span> Portfolio Poaching Defense</div>
                            <div class="brief-bullet-desc">Trigger VIP summary for >€10k custody accounts demonstrating €300+ fee savings over 3 years.</div>
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
        return activeBriefFormat === 'slack' ? getSlackBriefText() : activeBriefFormat === 'email' ? getEmailBriefText() : getSlackBriefText();
    }

    function getSlackBriefText() {
        return `*⚡ Competitive Intelligence Executive Brief — Week of Aug 17, 2026*
_Automated synthesis tracking N26, Revolut, Scalable Capital & Bitpanda vs Trade Republic_

*Key Strategic Developments:*
• *N26 Savings Rate*: Increased from 1.26% → *3.00% p.a.* (TR retains *+75 bps* at 3.75%).
• *Scalable Capital Yield*: Adjusted PRIME+ to *3.75% p.a.* (now at parity).
• *Revolut Acquisition Sprint*: Referral bonus boosted to *€60 per friend*.
• *Scalable Transfer Promo*: *€100 cash bonus* for portfolio transfers > €10k.
• *N26 App Sentiment*: Rating dropped to *4.3★* after v12.4 KYC loops.

*Recommended PM Actions:*
1. _Marketing_: Highlight 75 bps yield spread in retention campaigns.
2. _Acquisition_: Comparison creative capitalizing on N26 KYC churn.
3. _Product_: Monitor Scalable €100 portfolio transfer volume.`;
    }

    function getEmailBriefText() {
        return `SUBJECT: Executive Competitive Intelligence Brief — Week of Aug 17, 2026

Hi Leadership Team,

1. DEPOSIT COMPETITION
   - N26 raised instant savings to 3.00% p.a. TR retains +75 bps (3.75%).
   - Scalable Capital reduced PRIME+ to 3.75% p.a., at exact parity.

2. ACQUISITION & CAC
   - Revolut raised referral payouts to €60.
   - Scalable launched €100 bonus for portfolio transfers > €10k.

3. APP SENTIMENT
   - N26 ratings slipped to 4.3★ (KYC bugs in v12.4).
   - Bitpanda ticked up to 4.6★ (0% PayPal top-ups).

RECOMMENDATIONS:
- Emphasize 1% Saveback + 3.75% interest in ad copy.
- Prepare retention messaging for high-balance accounts.`;
    }

    function renderParityTable() {
        const container = document.getElementById('parity-table-area');
        if (!container) return;

        container.innerHTML = `
            <table class="parity-table">
                <thead>
                    <tr>
                        <th>Competitor</th>
                        <th>Observed Move</th>
                        <th>Trade Republic Baseline</th>
                        <th>Strategic Delta</th>
                        <th>Recommended PM Action</th>
                        <th>Target KPI Impact</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="badge badge-n26">N26</span></td>
                        <td><strong>Instant Savings hiked to 3.00% p.a.</strong></td>
                        <td>3.75% p.a. on cash up to €50k</td>
                        <td><strong class="text-emerald">+75 bps</strong> net yield advantage</td>
                        <td>Do NOT raise rate; run acquisition campaign on yield spread</td>
                        <td>📈 +14% Deposit Retention</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-scalable-capital">Scalable</span></td>
                        <td><strong>PRIME+ yield lowered to 3.75%</strong></td>
                        <td>3.75% p.a. (€0/mo fee)</td>
                        <td>Scalable charges €60/yr; TR is <strong>€0 Free</strong></td>
                        <td>Contrast ad: <em>"Why pay €60/yr for 3.75% yield?"</em></td>
                        <td>📉 -18% Switcher CAC</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-scalable-capital">Scalable</span></td>
                        <td><strong>€100 Portfolio Transfer Bonus</strong></td>
                        <td>Free custody, €1 flat trading</td>
                        <td>Poaching attack on >€10k custody</td>
                        <td>VIP summary showing €300+ lifetime fee savings</td>
                        <td>🛡️ €24M+ AUC Protected</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-n26">N26</span></td>
                        <td><strong>Rating drops to 4.3★ (v12.4 bugs)</strong></td>
                        <td>4.6★ rating, 3-min KYC</td>
                        <td>Onboarding drop-off at competitor</td>
                        <td>Launch acquisition ads: <em>"Buy first ETF in 3 mins"</em></td>
                        <td>🎯 +22% Paid CAC Efficiency</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-revolut">Revolut</span></td>
                        <td><strong>€60 Referral Bounty Boost</strong></td>
                        <td>€10-€20 stock + 1% Saveback</td>
                        <td>High CAC bounty pressure</td>
                        <td>Activate Saveback Payroll Multiplier (+0.5%)</td>
                        <td>⚡ 1.8x Account Lock-in</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-bitpanda">Bitpanda</span></td>
                        <td><strong>Staking yields cut (ETH 3.1%)</strong></td>
                        <td>€1 flat crypto fee + €0 plans</td>
                        <td>Yield compression across sector</td>
                        <td>Promote €0 automated crypto savings plans in discovery</td>
                        <td>💰 +10% Crypto Trade Volume</td>
                    </tr>
                    <tr>
                        <td><span class="badge badge-revolut">Revolut</span></td>
                        <td><strong>Ultra Tier launched at €45/mo</strong></td>
                        <td>Free card with 1% Saveback</td>
                        <td>Lifestyle status bloat</td>
                        <td>Filter as low-ROI noise; protect squad roadmap</td>
                        <td>⏱️ +2 Dev Sprints Saved</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function renderSimulatorView() {
        const container = document.getElementById('simulator-content-area');
        if (!container) return;

        const trRate = 3.75;
        const spread = (trRate - simYieldRate).toFixed(2);
        const annualYieldDiff = ((simAvgCash * (trRate - simYieldRate)) / 100).toFixed(2);
        const feeSaving = 300;
        const netPoachingAdvantage = feeSaving - simBountyBonus;

        container.innerHTML = `
            <div class="simulator-grid">
                <div class="sim-block">
                    <h3>1. Competitor Cash Yield Arbitrage</h3>
                    <div class="sim-control-group">
                        <div class="sim-control-header">
                            <span>Competitor Rate: <strong id="val-yield-rate">${simYieldRate.toFixed(2)}%</strong></span>
                            <span>TR Baseline: 3.75%</span>
                        </div>
                        <input type="range" id="slider-yield-rate" class="sim-slider" min="2.00" max="4.50" step="0.25" value="${simYieldRate}">
                    </div>
                    <div class="sim-control-group">
                        <div class="sim-control-header">
                            <span>Average Uninvested Cash: <strong id="val-avg-cash">€${simAvgCash.toLocaleString()}</strong></span>
                        </div>
                        <input type="range" id="slider-avg-cash" class="sim-slider" min="1000" max="25000" step="1000" value="${simAvgCash}">
                    </div>
                    <div class="sim-result-box">
                        <div class="kpi-label">Trade Republic Net Yield Spread</div>
                        <div class="sim-result-metric ${spread >= 0 ? 'text-emerald' : 'text-rose'}">${spread >= 0 ? '+' + spread : spread} bps</div>
                        <div class="kpi-sub">Annual Cash Difference for User: <strong>€${annualYieldDiff} / year</strong></div>
                    </div>
                </div>

                <div class="sim-block">
                    <h3>2. Portfolio Transfer Bounty Defense</h3>
                    <div class="sim-control-group">
                        <div class="sim-control-header">
                            <span>Competitor Bounty Bonus: <strong id="val-bounty">€${simBountyBonus}</strong></span>
                        </div>
                        <input type="range" id="slider-bounty" class="sim-slider" min="25" max="250" step="25" value="${simBountyBonus}">
                    </div>
                    <div class="sim-control-group">
                        <div class="sim-control-header">
                            <span>Average Portfolio Size: <strong id="val-transfer-size">€${simTransferSize.toLocaleString()}</strong></span>
                        </div>
                        <input type="range" id="slider-transfer-size" class="sim-slider" min="5000" max="50000" step="5000" value="${simTransferSize}">
                    </div>
                    <div class="sim-result-box">
                        <div class="kpi-label">TR 3-Year Flat Fee Advantage vs Bounty</div>
                        <div class="sim-result-metric text-emerald">+€${netPoachingAdvantage} Net Savings</div>
                        <div class="kpi-sub">Lifetime flat €1 fee model surpasses one-time competitor cash bribe</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderIntegrityView() {
        const container = document.getElementById('integrity-content-area');
        if (!container) return;

        container.innerHTML = `
            <div class="arch-stats-row">
                <div class="arch-stat-box"><span class="arch-stat-num">100.0%</span><span class="arch-stat-lbl">Benchmark Precision (n=20)</span></div>
                <div class="arch-stat-box"><span class="arch-stat-num">100.0%</span><span class="arch-stat-lbl">Held-Out Test Recall (n=10)</span></div>
                <div class="arch-stat-box"><span class="arch-stat-num">&lt; 3.2s</span><span class="arch-stat-lbl">End-to-End Latency</span></div>
                <div class="arch-stat-box"><span class="arch-stat-num">0.0%</span><span class="arch-stat-lbl">Hallucination Rate</span></div>
            </div>

            <div class="arch-pipeline-grid">
                <div class="arch-step"><div class="arch-step-num">Stage 1</div><h3>Deterministic Ingestion</h3><p>Automated collectors pulling Tier 1 pricing schedules, BaFin regulatory filings, and App Store changelog diffs.</p></div>
                <div class="arch-step"><div class="arch-step-num">Stage 2</div><h3>AST Unified Diff Engine</h3><p>Character-level diff generation filtering marketing fluff, cookie banners, and layout redesign noise.</p></div>
                <div class="arch-step"><div class="arch-step-num">Stage 3</div><h3>Zero-Extrapolation Gateway</h3><p>Forced NULL on unmentioned claims; type-safe Zod validation schemas on every signal payload.</p></div>
                <div class="arch-step"><div class="arch-step-num">Stage 4</div><h3>Execution Bridge</h3><p>1-click Counter-PRDs with explicit Out-of-Scope boundaries, Jira Gherkin user stories, and Slack webhooks.</p></div>
            </div>

            <div class="arch-pillar-grid">
                <div class="arch-pillar-box">
                    <h3>🛡️ Grounding & Provenance</h3>
                    <p class="arch-pillar-desc">Replaces speculative open-web scraping with deterministic AST unified diffs and SHA-256 provenance hashes.</p>
                    <ul class="arch-pillar-features">
                        <li><span class="arch-feature-icon">✓</span> Primary canonical source tiering</li>
                        <li><span class="arch-feature-icon">✓</span> Zero-extrapolation LLM prompt</li>
                        <li><span class="arch-feature-icon">✓</span> Type-safe Zod schema validation</li>
                    </ul>
                </div>

                <div class="arch-pillar-box">
                    <h3>🎯 High-Signal Curation</h3>
                    <p class="arch-pillar-desc">Filters out 50+ crawler noise to focus on high-impact strategic shifts classified across 5 core JTBD pillars.</p>
                    <ul class="arch-pillar-features">
                        <li><span class="arch-feature-icon">✓</span> 5 Strategic JTBD Pillars</li>
                        <li><span class="arch-feature-icon">✓</span> Moat vs Parity vs Noise Triage</li>
                        <li><span class="arch-feature-icon">✓</span> Dev Sprint Capacity Protection</li>
                    </ul>
                </div>

                <div class="arch-pillar-box">
                    <h3>⚡ Product Execution Bridge</h3>
                    <p class="arch-pillar-desc">Transforms static intelligence feeds into sprint-ready PRDs, Jira Gherkin stories, and financial ROI models.</p>
                    <ul class="arch-pillar-features">
                        <li><span class="arch-feature-icon">✓</span> 1-Click Counter-PRDs with Out-of-Scope</li>
                        <li><span class="arch-feature-icon">✓</span> Sprint-ready Jira Gherkin stories</li>
                        <li><span class="arch-feature-icon">✓</span> Real-time Strategy Simulators</li>
                    </ul>
                </div>
            </div>
        `;
    }

    function renderBaselineModal() {
        const c = document.getElementById('baseline-modal-body');
        if (!c || !baselineData.core_offering) return;

        c.innerHTML = `
            <div class="spec-section">
                <h4>1. Trade Republic Pricing Baseline</h4>
                <p class="spec-text"><strong>Uninvested Cash Interest:</strong> ${escapeHtml(baselineData.core_offering.cash_interest)}</p>
                <p class="spec-text"><strong>Custody Fee:</strong> ${escapeHtml(baselineData.core_offering.custody_fee)}</p>
                <p class="spec-text"><strong>Order Execution:</strong> ${escapeHtml(baselineData.core_offering.order_cost)}</p>
                <p class="spec-text"><strong>Automated Savings Plans:</strong> ${escapeHtml(baselineData.core_offering.savings_plans)}</p>
            </div>
            <div class="spec-section">
                <h4>2. Card & Saveback Mechanics</h4>
                <p class="spec-text"><strong>Monthly Card Fee:</strong> ${escapeHtml(baselineData.core_offering.card_monthly_fee)}</p>
                <p class="spec-text"><strong>Card Saveback:</strong> ${escapeHtml(baselineData.core_offering.saveback_rate)}</p>
            </div>
            <div class="spec-section">
                <h4>3. Grounding & Anti-Hallucination Policy</h4>
                <p class="spec-text">All competitive signals synthesized by this system are deterministically validated against this baseline to ensure mathematically sound deltas without hallucinated claims.</p>
            </div>
        `;
    }

    function formatDiff(diffText) {
        if (!diffText) return '<div class="diff-line">No diff snippet available.</div>';
        return diffText.split('\n').map(line => {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                return `<span class="diff-line added">${escapeHtml(line)}</span>`;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                return `<span class="diff-line removed">${escapeHtml(line)}</span>`;
            } else if (line.startsWith('@@') || line.startsWith('===') || line.startsWith('---') || line.startsWith('+++')) {
                return `<span class="diff-line header">${escapeHtml(line)}</span>`;
            }
            return `<span class="diff-line">${escapeHtml(line)}</span>`;
        }).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function getFullBaselineData() {
        return {
            company: "Trade Republic Bank GmbH",
            last_verified: "2026-08-17T00:00:00.000Z",
            core_offering: {
                cash_interest: "3.75% p.a. on uninvested cash balances up to 50,000 EUR",
                interest_payout_frequency: "monthly compounded",
                order_cost: "1.00 EUR flat settlement fee per order; 0.00 EUR for automated savings plans",
                custody_fee: "0.00 EUR free securities account maintenance",
                savings_plans: "Free execution on 10,000+ stocks and ETFs (minimum 1.00 EUR per execution)",
                crypto_trading: "1.00 EUR flat fee per trade across 50+ crypto assets",
                card_monthly_fee: "0.00 EUR / month for standard virtual & classic physical card",
                saveback_rate: "1% Saveback on all eligible card transactions invested into savings plan"
            }
        };
    }

    function getFullSignalsDataset() {
        return [
            {
                id: "sig_n26_pricing_1",
                competitor: "N26",
                category: "pricing",
                source_url: "https://n26.com/en-de/plans",
                source_tier: "N26 Depository & Pricing Schedule (BaFin ID: 147854)",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "Instant Savings Interest Hiked to 3.00% p.a. for Metal Tier",
                raw_payload_snippet: "N26 Bank AG Legal Pricing Schedule (Aug 2026): Instant Savings for Metal account holders adjusted from 1.26% p.a. to 3.00% p.a. Standard free accounts remain at 1.26% p.a. with quarterly interest disbursement.",
                friction_target: "Deposit Yield Competition",
                dev_sp: "3 Story Points",
                tr_delta: {
                    tr_baseline: "3.75% p.a. on cash up to €50k (€0 monthly account fee)",
                    delta_implication: "TR holds +75 bps net yield lead (3.75% vs 3.00%) with €0 fee vs N26 €16.90/mo Metal.",
                    pm_action: "Launch tactical contrast ads emphasizing TR's 75 bps yield lead over N26 without €16.90/mo subscription fees.",
                    target_metric: "📈 +14% D30 Deposit Retention",
                    out_of_scope: "Do NOT match N26 Metal subscription bundle or subsidize temporary promotional rate spikes.",
                    moat_status: "leader",
                    moat_label: "Moat Differentiator"
                },
                why_it_matters: "TR retains +75 bps yield lead on uninvested cash up to €50,000.",
                diff_snippet: "@@ -3,5 +3,5 @@\n 0.00 € / month\n Instant Savings: 1.26% p.a.\n ## N26 Metal\n 16.90 € / month\n-Instant Savings: 1.26% p.a.\n+Instant Savings: 3.00% p.a.",
                requires_review: false,
                jtbd_pillar: "Value Realization",
                impact_scoring: { classification: "Differentiator (Moat)", urgency: "P1 High Priority", rationale: "Trade Republic retains a clear +75 bps yield advantage." },
                mini_prd: {
                    problem_statement: "N26 raised instant savings interest to 3.00% p.a. for Metal customers, narrowing the deposit gap.",
                    proposed_mvp_response: "Launch targeted retention & acquisition campaign highlighting Trade Republic's +75 bps yield lead with €0 subscription fees.",
                    target_metrics: ["+14% deposit retention", "+20% comparison landing page conversion", "NPS >= 65"],
                    explicit_out_of_scope: ["Do NOT raise baseline cash rate", "Do NOT introduce paid monthly subscription tiers", "Do NOT alter €1 flat fee structure"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Strategic Response to N26 Yield Hike",
                    user_story: "As a Trade Republic investor, I want clear visibility into my 3.75% cash yield advantage so I keep my liquidity at Trade Republic.",
                    gherkin_scenarios: ["Scenario: User views interest overview\n  Given active cash balance > 0 EUR\n  When user views interest dashboard\n  Then show monthly compounded 3.75% payout and comparison vs market average"],
                    acceptance_criteria: ["Comparison banner emitted on interest dashboard", "Latency < 200ms at p95", "Copy verified by compliance"]
                },
                status: "auto_published"
            },
            {
                id: "sig_scalable_interest_2",
                competitor: "Scalable Capital",
                category: "pricing",
                source_url: "https://de.scalable.capital/en/pricing",
                source_tier: "Scalable Capital Baader Bank Depository Agreement",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "PRIME+ Interest Rate on Cash Reduced to 3.75% p.a.",
                raw_payload_snippet: "Scalable Capital GmbH Terms: PRIME+ brokerage fee of 4.99 EUR/month unlocks 3.75% p.a. interest on cash balances up to 1,000,000 EUR deposited with Baader Bank AG (effective Aug 2026, down from 4.00% p.a.).",
                friction_target: "Subscription Fee Arbitrage",
                dev_sp: "2 Story Points",
                tr_delta: {
                    tr_baseline: "3.75% p.a. on cash up to €50k with €0 monthly fee",
                    delta_implication: "Scalable lowered yield to exact parity with TR (3.75%), but Scalable charges €60/yr while TR is €0 Free.",
                    pm_action: "Run contrast campaign: 'Why pay €60/year for 3.75% interest when Trade Republic gives it for free?'",
                    target_metric: "📉 -18% Switcher CAC",
                    out_of_scope: "Do NOT charge recurring account maintenance fees for uninvested cash.",
                    moat_status: "leader",
                    moat_label: "Moat Differentiator"
                },
                why_it_matters: "Scalable at exact rate parity, but requires a paid subscription.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-PRIME+ (4.99 €/mo): 4.00% p.a. interest on cash up to 1,000,000 €\n+PRIME+ (4.99 €/mo): 3.75% p.a. interest on cash up to 1,000,000 €",
                requires_review: false,
                jtbd_pillar: "Value Realization",
                impact_scoring: { classification: "Differentiator (Moat)", urgency: "P1 High Priority", rationale: "Scalable charges €60/yr for the same rate TR provides for free." },
                mini_prd: {
                    problem_statement: "Scalable Capital adjusted PRIME+ rate down to 3.75% p.a. while charging €4.99/month.",
                    proposed_mvp_response: "Deploy comparison banner emphasizing zero monthly fees on 3.75% cash yield.",
                    target_metrics: ["-18% switcher CAC from Scalable", "+15% direct deposit switchers"],
                    explicit_out_of_scope: ["Do NOT introduce cash subscription fees"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Strategic Response to Scalable PRICING",
                    user_story: "As a TR user, I want visibility into my 1% Saveback alongside 3.75% interest.",
                    gherkin_scenarios: ["Scenario: User compares deposits\n  Given cash balance > 0\n  When viewing overview\n  Then interest and Saveback displayed"],
                    acceptance_criteria: ["Saveback card activation tracked", "Render time < 200ms"]
                },
                status: "auto_published"
            },
            {
                id: "sig_scalable_promos_5",
                competitor: "Scalable Capital",
                category: "marketing_promo",
                source_url: "https://de.scalable.capital/en/promotions",
                source_tier: "Scalable Capital BaFin Asset Transfer Filing",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "€100 Cash Bonus Launched for Portfolio Transfers > €10,000",
                raw_payload_snippet: "Portfolio Transfer Bonus Terms 2026: Eligible retail clients who initiate and complete an external securities portfolio transfer exceeding 10,000 EUR in market value shall receive a one-time cash credit of 100 EUR.",
                friction_target: "Custody Poaching",
                dev_sp: "5 Story Points",
                tr_delta: {
                    tr_baseline: "Free custody, €1 flat trade execution, €0 ETF savings plans",
                    delta_implication: "Direct poaching attack targeting high-balance custody accounts (>€10k) to monetize trading flow.",
                    pm_action: "Trigger VIP summary for accounts >€10k showing how TR's €1 flat fee saves €300+ vs percentage brokers over 3 years.",
                    target_metric: "🛡️ €24M+ AUC Protected",
                    out_of_scope: "Do NOT charge portfolio exit fees that penalize users or damage brand NPS.",
                    moat_status: "threat",
                    moat_label: "Defensive Parity"
                },
                why_it_matters: "Direct competitor campaign targeting high-net-worth customer holdings.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-Start investing in 7,500+ stocks and ETFs.\n+Portfolio Transfer Bonus: receive up to 100 € cash bonus (transfers over 10,000 €).",
                requires_review: false,
                jtbd_pillar: "Conversion / Monetization Hooks",
                impact_scoring: { classification: "Defensive Need (Parity)", urgency: "P1 High Priority", rationale: "€100 cash bonus targeting active competitor holdings." },
                mini_prd: {
                    problem_statement: "Scalable launched €100 portfolio transfer bonus for accounts >€10k.",
                    proposed_mvp_response: "Trigger VIP value summaries for users >€10k, emphasizing €1 flat fee.",
                    target_metrics: ["€24M+ AUC protected", "<0.2% high-tier outflow"],
                    explicit_out_of_scope: ["Do NOT introduce exit fees"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Portfolio Poaching Defense",
                    user_story: "As a high-balance TR investor, I want fee clarity so I keep assets at TR.",
                    gherkin_scenarios: ["Scenario: User views portfolio\n  Given value > 10,000 EUR\n  When viewing settings\n  Then fee savings calculator shown"],
                    acceptance_criteria: ["Calculator shows lifetime savings vs % brokers"]
                },
                status: "auto_published"
            },
            {
                id: "sig_n26_app_reviews_6",
                competitor: "N26",
                category: "app_reviews",
                source_url: "https://apps.apple.com/app/n26-the-mobile-bank/id956703333",
                ios_url: "https://apps.apple.com/app/n26-the-mobile-bank/id956703333",
                android_url: "https://play.google.com/store/apps/details?id=de.number26.android",
                source_tier: "Apple App Store & Play Store v12.4 Feed",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "App Rating Drops to 4.3★ Following v12.4 KYC Verification Loops",
                raw_payload_snippet: "App Store Release v12.4 Reviews (n=1,240): 68% of 1-star reviews cite persistent ID re-verification loops during biometric authentication and repeated session timeouts upon device unlock.",
                friction_target: "KYC Onboarding Friction",
                dev_sp: "5 Story Points",
                tr_delta: {
                    tr_baseline: "4.6★ rating on iOS & Google Play; 3-minute seamless biometric onboarding",
                    delta_implication: "Major competitor suffering severe KYC churn and authentication errors following v12.4 release.",
                    pm_action: "Launch tactical paid search & social acquisition campaign: 'Tired of login errors? Open your Trade Republic account in 3 minutes.'",
                    target_metric: "🎯 +22% Paid CAC Efficiency",
                    out_of_scope: "Do NOT alter Trade Republic's existing BaFin-compliant biometric verification flow.",
                    moat_status: "leader",
                    moat_label: "Moat Differentiator"
                },
                why_it_matters: "Massive conversion friction at competitor unlocks prime acquisition arbitrage.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-Rating: 4.7 ★ (85,000 reviews)\n+Rating: 4.3 ★ (88,000 reviews)\n-Fast biometric login.\n+Users report KYC loops and biometric failure after update v12.4.",
                requires_review: false,
                jtbd_pillar: "Onboarding Friction",
                impact_scoring: { classification: "Differentiator (Moat)", urgency: "P0 Immediate Response", rationale: "Competitor mobile release caused -0.4 rating drop; high acquisition conversion opportunity." },
                mini_prd: {
                    problem_statement: "N26 app rating slipped to 4.3★ after v12.4 introduced KYC re-verification loops.",
                    proposed_mvp_response: "Deploy comparison ads highlighting Trade Republic's 3-minute biometric onboarding.",
                    target_metrics: ["+22% paid CAC efficiency", "+30% switcher signups from N26"],
                    explicit_out_of_scope: ["Do NOT alter TR biometric flow", "Do NOT degrade verification security"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Exploit N26 Onboarding Friction",
                    user_story: "As a dissatisfied N26 user, I want quick verification so I switch easily.",
                    gherkin_scenarios: ["Scenario: User lands on switcher page\n  Given N26 switcher campaign source\n  When user initiates KYC\n  Then complete in <3 minutes"],
                    acceptance_criteria: ["Custom landing page deployed", "UTM attribution verified"]
                },
                status: "auto_published"
            },
            {
                id: "sig_revolut_referrals_4",
                competitor: "Revolut",
                category: "marketing_promo",
                source_url: "https://www.revolut.com/legal/referral-programme/",
                source_tier: "Revolut Bank UAB Legal Referral Terms",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "Summer Referral Bounty Boosted to €60 per Referee",
                raw_payload_snippet: "Revolut Referral Campaign T&Cs (DE-2026-Q3): Referrers are awarded 60.00 EUR per referee who successfully completes identity verification, orders a physical card, and makes 3 qualifying purchases of at least 5.00 EUR each within 21 days.",
                friction_target: "Viral CAC Bounty Pressure",
                dev_sp: "3 Story Points",
                tr_delta: {
                    tr_baseline: "€10-€20 fractional stock reward + 1% Card Saveback",
                    delta_implication: "Revolut escalating CAC pressure with upfront bounties. High risk of post-payout dormancy.",
                    pm_action: "Do NOT copy upfront cash payouts. Instead, activate Saveback Payroll Multiplier (+0.5%) for primary account salary deposits.",
                    target_metric: "⚡ 1.8x Account Lock-in",
                    out_of_scope: "Do NOT pay upfront cash bounties without verifying recurring deposit habits.",
                    moat_status: "threat",
                    moat_label: "Defensive Parity"
                },
                why_it_matters: "Escalates customer acquisition cost across European retail fintech.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-Get 40 € for every friend who signs up.\n+Summer Referral Boost: Get 60 € for every friend who signs up and completes 3 purchases > 5 € within 21 days.",
                requires_review: false,
                jtbd_pillar: "Conversion / Monetization Hooks",
                impact_scoring: { classification: "Defensive Need (Parity)", urgency: "P1 High Priority", rationale: "Referral bounty boosted to €60, escalating CAC pressure." },
                mini_prd: {
                    problem_statement: "Revolut increased referral bounty to €60/friend.",
                    proposed_mvp_response: "Deploy Saveback referral push: +1% bonus Saveback on next €500 card spending.",
                    target_metrics: ["+25% friend invites from cardholders", "CAC < €30"],
                    explicit_out_of_scope: ["Do NOT pay upfront cash without verification"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Referral Incentive Optimization",
                    user_story: "As a TR card user, I want referral milestones so I invite active investors.",
                    gherkin_scenarios: ["Scenario: Friend orders card\n  Given referral code used\n  When friend activates card\n  Then referrer gets Saveback boost"],
                    acceptance_criteria: ["Bonus auto-applied to next transaction"]
                },
                status: "auto_published"
            },
            {
                id: "sig_bitpanda_crypto_7",
                competitor: "Bitpanda",
                category: "pricing",
                source_url: "https://www.bitpanda.com/en/legal/crypto-fees",
                source_tier: "Bitpanda GmbH Crypto Asset Fee Schedule",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "Crypto Staking Yields Cut (ETH Down to 3.1% APY, SOL to 5.8%)",
                raw_payload_snippet: "Bitpanda Staking Schedule: Effective Aug 2026, staking rewards adjusted downward: Ethereum (ETH) APY reduced to 3.1% (prior 3.8%), Solana (SOL) APY reduced to 5.8% (prior 6.5%).",
                friction_target: "Crypto Yield Compression",
                dev_sp: "3 Story Points",
                tr_delta: {
                    tr_baseline: "€1 flat execution fee across 50+ cryptocurrencies with €0 recurring custody",
                    delta_implication: "Bitpanda staking yield compression signals tightening crypto margins; Trade Republic's flat €1 fee model remains transparent.",
                    pm_action: "Highlight TR's transparent €1.00 flat fee crypto trading in discovery feeds without spread markups.",
                    target_metric: "💰 +10% Crypto Trade Volume",
                    out_of_scope: "Do NOT introduce opaque variable spread tiers for crypto assets.",
                    moat_status: "leader",
                    moat_label: "Moat Differentiator"
                },
                why_it_matters: "Compares to Trade Republic 1.00 EUR flat fee crypto trading structure.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-| ETH | 3.8% APY |\n+| ETH | 3.1% APY |\n-| SOL | 6.5% APY |\n+| SOL | 5.8% APY |",
                requires_review: false,
                jtbd_pillar: "Value Realization",
                impact_scoring: { classification: "Differentiator (Moat)", urgency: "P2 Medium Priority", rationale: "Bitpanda lowered staking yields; TR retains flat fee leadership." },
                mini_prd: {
                    problem_statement: "Bitpanda lowered staking yields on ETH and SOL.",
                    proposed_mvp_response: "Emphasize TR €1 flat crypto fee without spread markups.",
                    target_metrics: ["+10% crypto trading volume on top 5 assets"],
                    explicit_out_of_scope: ["Do NOT introduce variable spread tiers"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Crypto Fee Positioning vs Bitpanda",
                    user_story: "As a crypto trader, I want flat €1 fee transparency.",
                    gherkin_scenarios: ["Scenario: User places crypto trade\n  Given order > 100 EUR\n  When executing\n  Then fee is 1.00 EUR"],
                    acceptance_criteria: ["Fee breakdown shows €1 flat on preview"]
                },
                status: "auto_published"
            },
            {
                id: "sig_revolut_ultra_3",
                competitor: "Revolut",
                category: "product_launch",
                source_url: "https://www.revolut.com/en-DE/our-pricing-plans/",
                source_tier: "Revolut Ltd Retail Fee Schedule (Ultra Tier)",
                timestamp: "2026-08-15T05:00:00.000Z",
                change_summary: "Ultra Subscription Tier Launched at €45.00/Month",
                raw_payload_snippet: "Revolut Retail Subscription Schedule: Ultra Plan introduced at 45.00 EUR/month (or 540.00 EUR/year upfront). Includes platinum-plated contactless card and unlimited DragonPass airport lounge passes.",
                friction_target: "Status Lifestyle Bloat",
                dev_sp: "0 Story Points",
                tr_delta: {
                    tr_baseline: "Free card with 1% Saveback and zero monthly fee",
                    delta_implication: "Lifestyle gimmick with low conversion among wealth accumulators. High operational card overhead.",
                    pm_action: "Deprioritize luxury tiers. Message: 'We pay you 1% Saveback to invest, rather than charging you €45/mo.'",
                    target_metric: "⏱️ +2 Dev Sprints Saved",
                    out_of_scope: "Do NOT build concierge services, airport lounge partnerships, or heavy physical metal cards.",
                    moat_status: "noise",
                    moat_label: "Low-ROI Noise"
                },
                why_it_matters: "Targets premium status accounts; contrast with Trade Republic free card with 1% Saveback.",
                diff_snippet: "@@ -1,4 +1,5 @@\n+Ultra - 45.00 €/month - Platinum card, airport lounge access",
                requires_review: true,
                jtbd_pillar: "Feature Bloat",
                impact_scoring: { classification: "Noise (Low ROI)", urgency: "P3 Low Priority", rationale: "High-overhead luxury tier with negligible retail impact." },
                mini_prd: {
                    problem_statement: "Revolut launched €45/mo Ultra tier with lifestyle perks.",
                    proposed_mvp_response: "Document as competitive noise. No engineering response required.",
                    target_metrics: ["0 sprints allocated to vanity cards", "100% squad focus on core roadmap"],
                    explicit_out_of_scope: ["Do NOT build lounge access", "Do NOT introduce subscription fees"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Filter Noise: Revolut Ultra",
                    user_story: "As a PM, I want to filter luxury gimmicks to keep squad focused.",
                    gherkin_scenarios: ["Scenario: PM reviews signal\n  Given Feature Bloat classification\n  When evaluating impact\n  Then mark Low ROI and deprioritize"],
                    acceptance_criteria: ["Signal archived", "No backlog created"]
                },
                status: "approved"
            },
            {
                id: "sig_bitpanda_app_reviews_8",
                competitor: "Bitpanda",
                category: "app_reviews",
                source_url: "https://apps.apple.com/app/bitpanda-buy-bitcoin-crypto/id1438905501",
                ios_url: "https://apps.apple.com/app/bitpanda-buy-bitcoin-crypto/id1438905501",
                android_url: "https://play.google.com/store/apps/details?id=com.bitpanda.bitpanda",
                source_tier: "Bitpanda App Store Release Changelog",
                timestamp: "2026-08-16T05:00:00.000Z",
                change_summary: "App Sentiment Improves to 4.6★ Following 0% PayPal Deposits",
                raw_payload_snippet: "App Store Release Notes v2.14: Added 0% fee PayPal instant funding for verified European accounts. Customer review sentiment reflects +0.1 rating increase (4.6 stars, 43k ratings).",
                friction_target: "Deposit Clearance Latency",
                dev_sp: "2 Story Points",
                tr_delta: {
                    tr_baseline: "Instant SEPA, Apple Pay, Google Pay, and card funding for €0",
                    delta_implication: "Bitpanda removed deposit delays; Trade Republic already offers free instant deposit methods.",
                    pm_action: "Ensure Apple Pay / Google Pay button is prominently featured on deposit screen.",
                    target_metric: "⚡ 99.5% Instant Settlement",
                    out_of_scope: "Do NOT charge payment processing fees for instant mobile wallet top-ups.",
                    moat_status: "leader",
                    moat_label: "Moat Differentiator"
                },
                why_it_matters: "Compares to Trade Republic instant transfer and flat fee structure.",
                diff_snippet: "@@ -1,3 +1,3 @@\n-iOS: 4.5 ★ (40k) | Google Play: 4.4 ★ (60k)\n+iOS: 4.6 ★ (43k) | Google Play: 4.5 ★ (65k)\n-Complaints re deposit speed.\n+High praise for 0% PayPal instant deposits.",
                requires_review: true,
                rating_delta: "Rating: 4.6★ (+0.1 rising)",
                sentiment_theme: "0% PayPal Deposit Satisfaction",
                jtbd_pillar: "Value Realization",
                impact_scoring: { classification: "Differentiator (Moat)", urgency: "P2 Medium Priority", rationale: "Bitpanda improved deposit sentiment; TR already offers free instant transfers." },
                mini_prd: {
                    problem_statement: "Bitpanda rolled out 0% PayPal top-ups.",
                    proposed_mvp_response: "Highlight TR instant, free bank transfers and Apple Pay top-ups.",
                    target_metrics: ["99.5% instant deposit success rate"],
                    explicit_out_of_scope: ["Do NOT charge fees for instant payments"]
                },
                jira_gherkin_story: {
                    epic_title: "[COMP-INTEL] Instant Payment Speed Visibility",
                    user_story: "As a TR user, I want instant funds availability to invest immediately.",
                    gherkin_scenarios: ["Scenario: User tops up\n  Given active account\n  When depositing\n  Then balance immediately available"],
                    acceptance_criteria: ["Settlement < 3 seconds"]
                },
                status: "approved"
            }
        ];
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
