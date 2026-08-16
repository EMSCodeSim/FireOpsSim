(() => {
  'use strict';

  const VERSION = '2026.08.16.1';
  const STYLE_HREF = `/vitals/scenario-assessment-mode-ux.css?v=${VERSION}`;
  const ONBOARD_KEY = caseId => `emscodesim_assessment_onboard_${caseId}`;
  const PROMPT_COOLDOWN_MS = 75000;
  const INACTIVITY_MS = 75000;

  /** Case-specific interactive regions + action progress targets. Generalizable per scenario. */
  const CASE_CONFIG = {
    horse_crush: {
      hotspots: [
        { id: 'head', examKey: 'head_exam', label: 'Head', left: '40%', top: '6%', width: '20%', height: '11%' },
        { id: 'cspine', examKey: 'neck_back', label: 'C-spine', left: '36%', top: '16%', width: '28%', height: '9%' },
        { id: 'chest', examKey: 'chest_assessment', label: 'Chest', left: '34%', top: '26%', width: '32%', height: '12%' },
        { id: 'abdomen', examKey: 'abdominal_assessment', label: 'Abdomen', left: '35%', top: '38%', width: '30%', height: '10%' },
        { id: 'pelvis', examKey: 'pelvis_hip', label: 'Pelvis', left: '34%', top: '47%', width: '32%', height: '10%' },
        { id: 'left_hip', examKey: 'left_leg', label: 'Left hip / leg', left: '18%', top: '52%', width: '24%', height: '18%' },
        { id: 'distal', examKey: 'distal_csm', label: 'Distal CMS', left: '14%', top: '72%', width: '28%', height: '14%' },
        { id: 'upper', examKey: 'upper_extremities', label: 'Arms', left: '62%', top: '30%', width: '22%', height: '16%' }
      ],
      primarySurveyKeys: ['airway', 'breathing', 'perfusion'],
      assessmentKeys: ['airway', 'breathing', 'perfusion', 'head_exam', 'neck_back', 'chest_assessment', 'abdominal_assessment', 'pelvis_hip', 'upper_extremities', 'left_leg', 'distal_csm'],
      vitalKeys: ['blood_pressure', 'pulse', 'respirations', 'spo2'],
      historyKeys: ['pain', 'sample', 'opqrst', 'events'],
      historyTarget: 4,
      primarySurveyToast: 'Primary survey complete – airway patent, breathing adequate, circulation intact with isolated left-hip injury.',
      vitalsToast: 'Vitals documented – use them with your exam findings for packaging and destination decisions.',
      historyToast: 'History progressing – pain, mechanism, and SAMPLE details strengthen your clinical decisions.',
      decisions: [
        {
          id: 'pre_move',
          title: 'Packaging / move decision',
          unlockRationale: 'You now have enough information to decide on packaging and movement.',
          requirements: [
            { id: 'left_leg', label: 'Left hip / lower-extremity exam', keys: ['left_leg'] },
            { id: 'distal_csm', label: 'Distal circulation, sensation, movement', keys: ['distal_csm'] },
            { id: 'pelvis', label: 'Pelvis / hip stability assessment', keys: ['pelvis_hip', 'trauma_assessment'], any: true }
          ]
        },
        {
          id: 'position',
          title: 'Position / pain management',
          unlockRationale: 'You now have enough information to decide on pain management and protected positioning.',
          requirements: [
            { id: 'left_leg', label: 'Inability / refusal to straighten or bear weight', keys: ['left_leg'] },
            { id: 'pain', label: 'Pain assessment or comfort language documented', keys: ['pain'], orText: /straighten|lower the leg|position of comfort|pain/i }
          ]
        },
        {
          id: 'recheck',
          title: 'Reassessment after treatment',
          unlockRationale: 'You now have enough information to decide how to reassess after intervention.',
          requirements: [
            { id: 'intervention', label: 'Treatment or movement step performed', check: r => (r?.treatments?.length || 0) > 0 || (r?.reassessments?.length || 0) > 0 }
          ]
        }
      ]
    }
  };

  const GENERIC_DECISIONS = [
    {
      id: 'first',
      title: 'First clinical decision',
      unlockRationale: 'You now have enough information for the next clinical decision.',
      requirements: [
        { id: 'abc', label: 'Primary survey (ABC)', keys: ['airway', 'breathing', 'perfusion'] },
        { id: 'vitals', label: 'Core vitals', keys: ['blood_pressure', 'pulse', 'respirations'], any: false }
      ]
    }
  ];

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function caseId() {
    return new URLSearchParams(location.search).get('case')
      || window.EMSCodeSimPatientRecord?.active?.()?.scenarioId
      || '';
  }

  function record() {
    const id = caseId();
    return window.EMSCodeSimScenarioSession?.active?.(id)
      || window.EMSCodeSimPatientRecord?.active?.()
      || {};
  }

  function trainingMode() {
    return new URLSearchParams(location.search).get('training')
      || record()?.documentation?.trainingMode
      || 'learning';
  }

  function assessmentMode() {
    return trainingMode() === 'assessment';
  }

  function config() {
    return CASE_CONFIG[caseId()] || null;
  }

  function hasFinding(r, key) {
    return Boolean(r?.findings?.[key]);
  }

  function recordText(r) {
    try {
      return JSON.stringify({
        findings: r?.findings || {},
        history: r?.history || {},
        careLog: r?.careLog || [],
        treatments: r?.treatments || []
      });
    } catch {
      return '';
    }
  }

  function requirementMet(r, req) {
    if (typeof req.check === 'function') return Boolean(req.check(r));
    if (req.orText && req.orText.test(recordText(r))) return true;
    const keys = req.keys || [];
    if (!keys.length) return false;
    if (req.any) return keys.some(key => hasFinding(r, key));
    return keys.every(key => hasFinding(r, key));
  }

  function decisionUnlocked(r, decision) {
    return (decision.requirements || []).every(req => requirementMet(r, req));
  }

  function injectStyles() {
    if (document.querySelector('link[data-assessment-mode-ux]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    link.dataset.assessmentModeUx = VERSION;
    document.head.appendChild(link);
  }

  function openPanel(panelId) {
    const button = document.querySelector(`.bottom-nav button[data-panel="${panelId}"]`);
    if (button) button.click();
  }

  /* ---------- Onboarding banner + flow rail ---------- */

  function ensureBanner() {
    if (!assessmentMode() || $('assessmentModeBanner')) return;
    const host = document.querySelector('.patient-control-column')
      || document.querySelector('.vp-shell')
      || document.body;
    const banner = document.createElement('section');
    banner.id = 'assessmentModeBanner';
    banner.className = 'assessment-mode-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Assessment Mode start guide');
    banner.innerHTML = `
      <div class="assessment-mode-banner-head">
        <div>
          <small>ASSESSMENT MODE</small>
          <strong>Start here → Assessment → Vitals → History</strong>
        </div>
        <button type="button" class="assessment-mode-banner-dismiss" data-dismiss-onboard aria-label="Dismiss guide">Got it</button>
      </div>
      <div class="assessment-mode-banner-steps">
        <span><b>1. Assessment</b> (primary survey)</span>
        <span class="step-arrow" aria-hidden="true">→</span>
        <span><b>2. Vitals</b></span>
        <span class="step-arrow" aria-hidden="true">→</span>
        <span><b>3. History</b></span>
        <span class="step-arrow" aria-hidden="true">→</span>
        <span>then <b>Clinical Decisions</b> unlock</span>
      </div>`;
    banner.querySelector('[data-dismiss-onboard]')?.addEventListener('click', () => {
      banner.hidden = true;
      try { localStorage.setItem(ONBOARD_KEY(caseId()), '1'); } catch {}
    });
    const info = $('infoUpdateWindow');
    if (info?.parentNode) info.insertAdjacentElement('beforebegin', banner);
    else host.prepend(banner);
    try {
      if (localStorage.getItem(ONBOARD_KEY(caseId())) === '1') banner.hidden = true;
    } catch {}
  }

  function ensureFlowRail() {
    if ($('assessmentFlowRail')) return;
    const cue = $('reasoningDiscoveryCue');
    const rail = document.createElement('nav');
    rail.id = 'assessmentFlowRail';
    rail.className = 'assessment-flow-rail';
    rail.setAttribute('aria-label', 'Clinical workflow steps');
    rail.innerHTML = ['Discover', 'Decide', 'Treat', 'Reassess'].map((label, index) => `
      <button type="button" class="assessment-flow-step" data-flow-step="${index}" aria-current="false">
        <small>STEP ${index + 1}</small>
        <strong>${label}</strong>
      </button>`).join('');
    if (cue?.parentNode) cue.insertAdjacentElement('afterend', rail);
    else {
      const info = $('infoUpdateWindow');
      if (info?.parentNode) info.insertAdjacentElement('afterend', rail);
      else document.querySelector('.patient-control-column')?.prepend(rail);
    }
    if (cue) {
      cue.innerHTML = '<strong>Discover → Decide → Treat → Reassess</strong><span>Follow the highlighted step. Decisions unlock as you discover required information.</span>';
    }
    rail.addEventListener('click', event => {
      const step = event.target.closest?.('[data-flow-step]');
      if (!step) return;
      const index = Number(step.dataset.flowStep);
      if (index === 0) openPanel('assessmentPanel');
      else if (index === 1) {
        const board = $('clinicalReasoningBoard') || $('assessmentDecisionProgress');
        board?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        openPanel('findingsPanel');
      } else if (index === 2) openPanel('treatmentPanel');
      else openPanel('assessmentPanel');
    });
  }

  function currentFlowStep(r) {
    const cfg = config();
    const decisions = cfg?.decisions || GENERIC_DECISIONS;
    const unlockedCount = decisions.filter(d => decisionUnlocked(r, d)).length;
    const decidedCount = Object.keys(r?.documentation?.reasoningDecisions || {}).length;
    const treated = (r?.treatments?.length || 0) > 0;
    const reassessed = (r?.reassessments?.length || 0) > 0;
    if (reassessed || (treated && decidedCount >= Math.min(2, decisions.length))) return 3;
    if (treated || decidedCount > 0) return 2;
    if (unlockedCount > 0) return 1;
    return 0;
  }

  function refreshFlowRail(r) {
    const rail = $('assessmentFlowRail');
    if (!rail) return;
    const current = currentFlowStep(r);
    rail.querySelectorAll('[data-flow-step]').forEach(button => {
      const index = Number(button.dataset.flowStep);
      button.classList.toggle('is-current', index === current);
      button.classList.toggle('is-done', index < current);
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
    });
  }

  /* ---------- Patient hotspots ---------- */

  function ensureHotspotLayer() {
    const cfg = config();
    const stage = document.querySelector('.patient-stage');
    if (!cfg?.hotspots?.length || !stage) return null;
    let layer = $('patientHotspotLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'patientHotspotLayer';
      layer.className = 'patient-hotspot-layer';
      layer.setAttribute('aria-label', 'Interactive patient exam regions');
      stage.appendChild(layer);
    }
    let chips = $('patientFindingChips');
    if (!chips) {
      chips = document.createElement('div');
      chips.id = 'patientFindingChips';
      chips.className = 'patient-hotspot-chip-row';
      chips.setAttribute('aria-live', 'polite');
      stage.appendChild(chips);
    }
    return layer;
  }

  function performHotspotExam(examKey) {
    const horse = window.EMSCodeSimHorseCrush;
    if (horse?.performExam && CASE_CONFIG[caseId()]) {
      return horse.performExam(examKey);
    }
    const button = document.querySelector(`[data-assessment-item="${CSS.escape(examKey)}"], [data-horse-deep-key="${CSS.escape(examKey)}"]`);
    if (button) {
      button.click();
      return true;
    }
    return false;
  }

  function refreshHotspots(r) {
    const cfg = config();
    const layer = ensureHotspotLayer();
    if (!cfg || !layer) return;
    const existing = new Map([...layer.querySelectorAll('[data-hotspot-id]')].map(node => [node.dataset.hotspotId, node]));
    cfg.hotspots.forEach(spot => {
      let button = existing.get(spot.id);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'patient-hotspot';
        button.dataset.hotspotId = spot.id;
        button.dataset.examKey = spot.examKey;
        button.dataset.label = spot.label;
        button.setAttribute('aria-label', `Assess ${spot.label}`);
        button.style.left = spot.left;
        button.style.top = spot.top;
        button.style.width = spot.width;
        button.style.height = spot.height;
        const activate = event => {
          event.preventDefault();
          event.stopPropagation();
          button.classList.add('is-active');
          window.setTimeout(() => button.classList.remove('is-active'), 280);
          const result = performHotspotExam(spot.examKey);
          if (result) {
            showMiniResult('Focused exam', spot.label, typeof result === 'object' && result.finding
              ? String(result.finding).slice(0, 140)
              : `${spot.label} assessed — finding added to the care record.`);
            highlightLatestFinding();
          }
          markActivity();
        };
        button.addEventListener('click', activate);
        layer.appendChild(button);
      }
      const assessed = hasFinding(r, spot.examKey);
      button.classList.toggle('is-assessed', assessed);
    });
    refreshFindingChips(r, cfg);
  }

  function refreshFindingChips(r, cfg) {
    const chips = $('patientFindingChips');
    if (!chips || !cfg) return;
    const assessed = cfg.hotspots.filter(spot => hasFinding(r, spot.examKey));
    const abnormal = assessed.filter(spot => {
      const finding = r?.findings?.[spot.examKey];
      return finding?.normality === 'not-normal' || finding?.status === 'abnormal';
    });
    chips.innerHTML = assessed.slice(-4).map(spot => {
      const finding = r?.findings?.[spot.examKey];
      const isAbnormal = finding?.normality === 'not-normal' || finding?.status === 'abnormal';
      return `<span class="patient-finding-chip${isAbnormal ? ' abnormal' : ''}">✓ ${esc(spot.label)}</span>`;
    }).join('');
    if (abnormal.length && !chips.dataset.seeded) chips.dataset.seeded = '1';
  }

  /* ---------- Decision progress checklist ---------- */

  function ensureDecisionProgress() {
    if ($('assessmentDecisionProgress')) return;
    const board = $('clinicalReasoningBoard');
    const host = document.createElement('section');
    host.id = 'assessmentDecisionProgress';
    host.className = 'assessment-decision-progress';
    host.setAttribute('aria-label', 'Decision discovery progress');
    if (board?.parentNode) board.insertAdjacentElement('beforebegin', host);
    else document.querySelector('.patient-control-column')?.appendChild(host);
  }

  function discoveredSummary(r, cfg) {
    const labels = [];
    (cfg?.hotspots || []).forEach(spot => {
      if (hasFinding(r, spot.examKey)) labels.push(spot.label);
    });
    (cfg?.primarySurveyKeys || []).forEach(key => {
      if (hasFinding(r, key)) labels.push(key.replace(/_/g, ' '));
    });
    (cfg?.vitalKeys || []).forEach(key => {
      if (hasFinding(r, key)) labels.push(key.replace(/_/g, ' '));
    });
    if (!labels.length) return 'Nothing clinical discovered yet beyond arrival. Start with Assessment, then Vitals and History.';
    return `Discovered so far: ${labels.slice(0, 8).join(' · ')}${labels.length > 8 ? '…' : ''}`;
  }

  function nextLockedDecision(r, decisions) {
    return decisions.find(decision => !decisionUnlocked(r, decision) && !r?.documentation?.reasoningDecisions?.[decision.id]) || null;
  }

  function refreshDecisionProgress(r) {
    ensureDecisionProgress();
    const host = $('assessmentDecisionProgress');
    if (!host) return;
    const cfg = config();
    const decisions = cfg?.decisions || (assessmentMode() ? GENERIC_DECISIONS : null);
    if (!decisions) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    const next = nextLockedDecision(r, decisions) || decisions.find(d => decisionUnlocked(r, d) && !r?.documentation?.reasoningDecisions?.[d.id]) || decisions[decisions.length - 1];
    const unlockedCount = decisions.filter(d => decisionUnlocked(r, d)).length;
    const reqs = next?.requirements || [];
    const showHints = !assessmentMode() || Boolean(host.dataset.forceHints === '1') || basicSurveyComplete(r, cfg);
    host.innerHTML = `
      <header>
        <div>
          <small>DECISION PROGRESS</small>
          <strong>${esc(next?.title || 'Clinical decisions')}</strong>
        </div>
        <span>${unlockedCount}/${decisions.length}</span>
      </header>
      <p class="assessment-discovered-summary"><b>Discovered so far</b><br>${esc(discoveredSummary(r, cfg))}</p>
      ${showHints ? `<ul class="assessment-req-list">${reqs.map(req => {
        const done = requirementMet(r, req);
        return `<li class="${done ? 'done' : ''}"><mark>${done ? '✓' : '○'}</mark><span>${esc(req.label)}</span></li>`;
      }).join('')}</ul>` : `<p class="assessment-discovered-summary">Complete Assessment and Vitals to reveal the required-finding checklist for the next decision.</p>`}
      ${assessmentMode() && basicSurveyComplete(r, cfg) ? `<div class="assessment-soft-prompt-actions" style="margin-top:8px"><button type="button" data-show-required-findings>Show required findings for next decision</button></div>` : ''}`;
    host.querySelector('[data-show-required-findings]')?.addEventListener('click', () => {
      host.dataset.forceHints = '1';
      refreshDecisionProgress(record());
      markActivity();
    });
  }

  function basicSurveyComplete(r, cfg) {
    if (!cfg) return false;
    const primaryDone = (cfg.primarySurveyKeys || []).every(key => hasFinding(r, key))
      || (cfg.assessmentKeys || []).filter(key => hasFinding(r, key)).length >= 3;
    const vitalsDone = (cfg.vitalKeys || []).filter(key => hasFinding(r, key)).length >= 1;
    return primaryDone && vitalsDone;
  }

  /* ---------- Unlock toast ---------- */

  function ensureUnlockToast() {
    if ($('assessmentUnlockToast')) return;
    const toast = document.createElement('div');
    toast.id = 'assessmentUnlockToast';
    toast.className = 'assessment-decision-unlock-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }

  function showUnlockToast(decision) {
    ensureUnlockToast();
    const toast = $('assessmentUnlockToast');
    if (!toast || !decision) return;
    toast.innerHTML = `<small>DECISION UNLOCKED</small><strong>${esc(decision.title)}</strong><p>${esc(decision.unlockRationale || 'You now have enough information to decide.')}</p>`;
    toast.classList.add('is-visible');
    clearTimeout(showUnlockToast.timer);
    showUnlockToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
    const card = document.querySelector(`[data-reasoning-card="${CSS.escape(decision.id)}"]`);
    if (card) {
      card.classList.add('just-unlocked');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      window.setTimeout(() => card.classList.remove('just-unlocked'), 900);
    }
  }

  function trackUnlocks(r) {
    const cfg = config();
    const decisions = cfg?.decisions || [];
    if (!trackUnlocks.prev) trackUnlocks.prev = {};
    decisions.forEach(decision => {
      const unlocked = decisionUnlocked(r, decision);
      if (unlocked && !trackUnlocks.prev[decision.id]) {
        if (trackUnlocks.ready) showUnlockToast(decision);
      }
      trackUnlocks.prev[decision.id] = unlocked;
    });
    trackUnlocks.ready = true;
  }

  /* ---------- Action bar progress + mini results ---------- */

  function countDone(r, keys) {
    return (keys || []).filter(key => hasFinding(r, key)).length;
  }

  function historyDoneCount(r, cfg) {
    const keyCount = countDone(r, cfg?.historyKeys || []);
    const asked = Array.isArray(r?.documentation?.askedInterviewQuestions)
      ? r.documentation.askedInterviewQuestions.length
      : Array.isArray(r?.interview?.asked) ? r.interview.asked.length : 0;
    return Math.max(keyCount, asked);
  }

  function ensureNavProgress() {
    document.querySelectorAll('.bottom-nav button[data-panel]').forEach(button => {
      if (button.querySelector('.nav-progress')) return;
      const span = document.createElement('em');
      span.className = 'nav-progress';
      span.hidden = true;
      button.appendChild(span);
    });
  }

  function refreshNavProgress(r) {
    ensureNavProgress();
    const cfg = config();
    if (!cfg) return;
    const map = {
      assessmentPanel: { done: countDone(r, cfg.assessmentKeys), total: cfg.assessmentKeys.length },
      vitalsPanel: { done: countDone(r, cfg.vitalKeys), total: cfg.vitalKeys.length },
      historyPanel: { done: Math.min(historyDoneCount(r, cfg), cfg.historyTarget), total: cfg.historyTarget }
    };
    Object.entries(map).forEach(([panel, stats]) => {
      const button = document.querySelector(`.bottom-nav button[data-panel="${panel}"]`);
      const badge = button?.querySelector('.nav-progress');
      if (!button || !badge) return;
      badge.hidden = false;
      badge.textContent = `${stats.done}/${stats.total}`;
      const complete = stats.done >= stats.total && stats.total > 0;
      badge.classList.toggle('is-complete', complete);
      button.classList.toggle('is-complete-action', complete);
      if (complete) button.title = 'Completed — tap to re-assess if needed';
    });
  }

  function ensureMiniResult() {
    if ($('actionMiniResult')) return;
    const node = document.createElement('div');
    node.id = 'actionMiniResult';
    node.className = 'action-mini-result';
    node.setAttribute('role', 'status');
    document.body.appendChild(node);
  }

  function showMiniResult(type, title, text) {
    ensureMiniResult();
    const node = $('actionMiniResult');
    if (!node) return;
    node.innerHTML = `<small>${esc(type)}</small><strong>${esc(title)}</strong><p>${esc(text)}</p>`;
    node.classList.add('is-visible');
    clearTimeout(showMiniResult.timer);
    showMiniResult.timer = setTimeout(() => node.classList.remove('is-visible'), 3600);
  }

  function primarySurveyJustCompleted(r, prev) {
    const cfg = config();
    if (!cfg) return false;
    const now = (cfg.primarySurveyKeys || []).every(key => hasFinding(r, key));
    const before = (cfg.primarySurveyKeys || []).every(key => hasFinding(prev, key));
    return now && !before;
  }

  function maybeActionFeedback(r, prev) {
    const cfg = config();
    if (!cfg || !prev) return;
    if (primarySurveyJustCompleted(r, prev)) {
      showMiniResult('Assessment', 'Primary survey complete', cfg.primarySurveyToast);
      return;
    }
    const vitalsNow = countDone(r, cfg.vitalKeys);
    const vitalsPrev = countDone(prev, cfg.vitalKeys);
    if (vitalsNow >= cfg.vitalKeys.length && vitalsPrev < cfg.vitalKeys.length) {
      showMiniResult('Vitals', 'Vitals complete', cfg.vitalsToast);
      return;
    }
    if (vitalsNow > vitalsPrev && vitalsNow > 0) {
      showMiniResult('Vitals', `Vitals ${vitalsNow}/${cfg.vitalKeys.length}`, 'Vital sign recorded and added to the care log.');
      return;
    }
    const histNow = historyDoneCount(r, cfg);
    const histPrev = historyDoneCount(prev, cfg);
    if (histNow > histPrev) {
      showMiniResult('History', `History ${Math.min(histNow, cfg.historyTarget)}/${cfg.historyTarget}`, cfg.historyToast);
    }
  }

  /* ---------- Soft prompts ---------- */

  function ensureSoftPrompt() {
    if ($('assessmentSoftPrompt')) return;
    const host = document.createElement('aside');
    host.id = 'assessmentSoftPrompt';
    host.className = 'assessment-soft-prompt';
    host.hidden = true;
    host.setAttribute('aria-live', 'polite');
    const progress = $('assessmentDecisionProgress');
    if (progress?.parentNode) progress.insertAdjacentElement('afterend', host);
    else document.querySelector('.patient-control-column')?.appendChild(host);
  }

  function hideSoftPrompt() {
    const node = $('assessmentSoftPrompt');
    if (node) node.hidden = true;
  }

  function showSoftPrompt(kind) {
    if (!assessmentMode()) return;
    ensureSoftPrompt();
    const node = $('assessmentSoftPrompt');
    const cfg = config();
    const r = record();
    if (!node || !cfg) return;
    const next = nextLockedDecision(r, cfg.decisions || []);
    const missing = (next?.requirements || []).filter(req => !requirementMet(r, req)).map(req => req.label);
    if (kind === 'required' && !basicSurveyComplete(r, cfg)) {
      node.hidden = false;
      node.innerHTML = `
        <small>SOFT PROMPT</small>
        <strong>Complete the basics first</strong>
        <p>Finish primary Assessment and at least one set of Vitals before revealing the next decision checklist.</p>
        <div class="assessment-soft-prompt-actions">
          <button type="button" data-soft-open="assessmentPanel">Open Assessment</button>
          <button type="button" class="secondary" data-soft-dismiss>Dismiss</button>
        </div>`;
    } else {
      node.hidden = false;
      node.innerHTML = `
        <small>WHAT AM I MISSING?</small>
        <strong>${esc(next ? next.title : 'Keep gathering information')}</strong>
        <p>${missing.length
          ? `Still needed for the next decision: ${esc(missing.join(' · '))}.`
          : 'Required discoveries for the next decision look complete — open Clinical Reasoning to decide.'}</p>
        <div class="assessment-soft-prompt-actions">
          <button type="button" data-soft-open="assessmentPanel">Continue assessment</button>
          ${basicSurveyComplete(r, cfg) ? '<button type="button" data-soft-show-required>Show required findings</button>' : ''}
          <button type="button" class="secondary" data-soft-dismiss>Dismiss</button>
        </div>`;
    }
    node.querySelector('[data-soft-dismiss]')?.addEventListener('click', hideSoftPrompt);
    node.querySelector('[data-soft-open]')?.addEventListener('click', event => {
      openPanel(event.currentTarget.dataset.softOpen);
      hideSoftPrompt();
    });
    node.querySelector('[data-soft-show-required]')?.addEventListener('click', () => {
      const progress = $('assessmentDecisionProgress');
      if (progress) progress.dataset.forceHints = '1';
      refreshDecisionProgress(record());
      hideSoftPrompt();
      progress?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    lastPromptAt = Date.now();
  }

  let lastActivityAt = Date.now();
  let lastPromptAt = 0;
  let actionsSinceUnlock = 0;

  function markActivity() {
    lastActivityAt = Date.now();
    actionsSinceUnlock += 1;
    const r = record();
    const cfg = config();
    if (!assessmentMode() || !cfg) return;
    const next = nextLockedDecision(r, cfg.decisions || []);
    if (next && actionsSinceUnlock >= 3 && Date.now() - lastPromptAt > PROMPT_COOLDOWN_MS) {
      actionsSinceUnlock = 0;
      showSoftPrompt('missing');
    }
  }

  function checkInactivity() {
    if (!assessmentMode()) return;
    if (Date.now() - lastActivityAt < INACTIVITY_MS) return;
    if (Date.now() - lastPromptAt < PROMPT_COOLDOWN_MS) return;
    const r = record();
    const cfg = config();
    if (!cfg) return;
    if (nextLockedDecision(r, cfg.decisions || [])) showSoftPrompt('missing');
  }

  /* ---------- Findings highlight + clock pause + reset ---------- */

  function highlightLatestFinding() {
    const selectors = [
      '#findingsList .care-log-entry',
      '#findingsList article',
      '#findingsList li',
      '#findingsPanel .log-entry',
      '#desktopConcernList .desktop-concern-item',
      '#infoUpdateWindow'
    ];
    let target = null;
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length) {
        target = nodes[nodes.length - 1];
        break;
      }
    }
    if (!target) target = $('infoUpdateWindow');
    if (!target) return;
    target.classList.add('is-highlighted');
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.setTimeout(() => target.classList.remove('is-highlighted'), 1400);
  }

  let pauseStartedAt = 0;
  let pausedAccumMs = 0;
  let clockPaused = false;

  function setClockPaused(paused) {
    const timerBox = document.querySelector('.vp-timer');
    if (!timerBox) return;
    let label = timerBox.querySelector('.clock-pause-label');
    if (!label) {
      label = document.createElement('span');
      label.className = 'clock-pause-label';
      label.textContent = 'Paused while reading';
      timerBox.appendChild(label);
    }
    timerBox.classList.toggle('is-paused', paused);
    if (paused && !clockPaused) {
      pauseStartedAt = Date.now();
      clockPaused = true;
      document.body.dataset.clockPaused = '1';
    } else if (!paused && clockPaused) {
      pausedAccumMs += Math.max(0, Date.now() - pauseStartedAt);
      clockPaused = false;
      delete document.body.dataset.clockPaused;
      const api = window.EMSCodeSimPatientRecord;
      api?.setDocumentation?.({ clockPausedMs: pausedAccumMs, clockPauseUpdatedAt: new Date().toISOString() });
    }
  }

  function installClockPauseHooks() {
    const info = $('infoUpdateWindow');
    if (!info || info.dataset.clockPauseBound === '1') return;
    info.dataset.clockPauseBound = '1';
    const maybePause = () => {
      const text = info.querySelector('p');
      const long = (text?.textContent || '').length > 160 || info.classList.contains('is-expanded');
      const open = info.dataset.collapsed !== 'true' && !info.hidden;
      setClockPaused(Boolean(open && long));
    };
    info.addEventListener('click', () => window.setTimeout(maybePause, 0));
    const observer = new MutationObserver(maybePause);
    observer.observe(info, { attributes: true, childList: true, subtree: true, characterData: true });
  }

  function syncPausedClockDisplay() {
    if (!clockPaused) return;
    const timer = $('timer');
    const status = $('patientClockStatus');
    if (status) status.textContent = 'Patient clock • paused while reading';
    if (timer && !timer.dataset.baseWhilePaused) timer.dataset.baseWhilePaused = timer.textContent;
  }

  function resetAssessmentProgress() {
    const api = window.EMSCodeSimPatientRecord;
    const current = api?.active?.() || record() || {};
    const keep = new Set(['arrival_parking', 'bls_handoff']);
    const nextFindings = {};
    Object.entries(current.findings || {}).forEach(([key, value]) => {
      if (keep.has(key)) nextFindings[key] = value;
    });
    if (typeof api?.update === 'function') {
      api.update(existing => {
        const base = existing || current;
        const careLog = (base.careLog || []).filter(event => {
          const key = event?.key || event?.assessment || '';
          if (!key) return event?.type === 'scene' || event?.source === 'scenario-start' || event?.source === 'bls-handoff';
          return keep.has(key);
        });
        return {
          ...base,
          findings: nextFindings,
          treatments: [],
          reassessments: [],
          careLog,
          documentation: {
            ...(base.documentation || {}),
            reasoningDecisions: {},
            assessmentProgressResetAt: new Date().toISOString(),
            askedInterviewQuestions: []
          }
        };
      });
    } else {
      Object.keys(current.findings || {}).forEach(key => {
        if (!keep.has(key)) api?.setFinding?.(key, null);
      });
      api?.setDocumentation?.({
        reasoningDecisions: {},
        assessmentProgressResetAt: new Date().toISOString(),
        askedInterviewQuestions: []
      });
    }
    try {
      localStorage.removeItem(ONBOARD_KEY(caseId()));
    } catch {}
    trackUnlocks.prev = {};
    actionsSinceUnlock = 0;
    const banner = $('assessmentModeBanner');
    if (banner) banner.hidden = false;
    const progress = $('assessmentDecisionProgress');
    if (progress) delete progress.dataset.forceHints;
    showMiniResult('Progress', 'Assessment progress reset', 'Findings and clinical decisions were cleared. Arrival context remains. Restart Assessment → Vitals → History.');
    window.setTimeout(() => refreshAll(true), 80);
  }

  function ensureResetControl() {
    const dialog = $('scenarioControlDialog');
    if (!dialog || $('resetAssessmentProgress')) return;
    const button = document.createElement('button');
    button.id = 'resetAssessmentProgress';
    button.type = 'button';
    button.className = 'assessment-reset-progress';
    button.innerHTML = `<strong>Reset assessment progress</strong><small>Clear exams, vitals, history answers, and clinical decisions without a full scenario restart.</small>`;
    button.addEventListener('click', () => {
      resetAssessmentProgress();
      dialog.hidden = true;
      const backdrop = $('scenarioControlBackdrop');
      if (backdrop) backdrop.hidden = true;
    });
    const fullReset = $('resetScenario');
    if (fullReset?.parentNode) fullReset.insertAdjacentElement('beforebegin', button);
    else dialog.appendChild(button);
  }

  /* Learning-upgrade already renders discovery checklists on locked cards. */
  function enhanceLockedReasoningCards() {
    return;
  }

  /* ---------- Render loop ---------- */

  let prevSignature = '';
  let prevRecordSnapshot = null;

  function snapshotForFeedback(r) {
    return {
      findings: { ...(r?.findings || {}) },
      treatments: [...(r?.treatments || [])],
      reassessments: [...(r?.reassessments || [])],
      documentation: {
        askedInterviewQuestions: [...(r?.documentation?.askedInterviewQuestions || [])],
        reasoningDecisions: { ...(r?.documentation?.reasoningDecisions || {}) }
      },
      interview: r?.interview ? { asked: [...(r.interview.asked || [])] } : undefined
    };
  }

  function refreshAll(force = false) {
    if (!document.body) return;
    const id = caseId();
    if (!id) return;
    const r = record();
    const signature = [
      Object.keys(r?.findings || {}).sort().join('|'),
      (r?.treatments || []).length,
      (r?.reassessments || []).length,
      Object.keys(r?.documentation?.reasoningDecisions || {}).sort().join('|'),
      historyDoneCount(r, config()),
      trainingMode(),
      document.body.classList.contains('mobile-simulator-v3') ? 'm' : 'd'
    ].join('::');
    if (!force && signature === prevSignature) return;

    if (assessmentMode()) {
      document.body.classList.add('assessment-mode-ux');
      document.body.dataset.trainingMode = 'assessment';
      ensureBanner();
      ensureFlowRail();
      ensureDecisionProgress();
      ensureSoftPrompt();
      ensureResetControl();
      installClockPauseHooks();
    } else {
      document.body.classList.add('assessment-mode-ux');
      ensureFlowRail();
      if (config()) {
        ensureDecisionProgress();
      }
    }

    refreshFlowRail(r);
    refreshHotspots(r);
    refreshDecisionProgress(r);
    refreshNavProgress(r);
    enhanceLockedReasoningCards(r);
    trackUnlocks(r);
    if (prevRecordSnapshot) maybeActionFeedback(r, prevRecordSnapshot);
    prevRecordSnapshot = snapshotForFeedback(r);
    prevSignature = signature;
  }

  function onUserAction(event) {
    if (event.target.closest?.('.bottom-nav button, .patient-hotspot, .horse-exam-button, [data-assessment-item], .history-category-list button, .tool-actions button, .tool-actions a')) {
      markActivity();
    }
  }

  function start() {
    injectStyles();
    refreshAll(true);
    document.addEventListener('click', onUserAction, true);
    window.setInterval(() => {
      refreshAll(false);
      checkInactivity();
      syncPausedClockDisplay();
    }, 700);
    ['emscodesim:scenario-updated', 'emscodesim:scenario-finding-saved', 'emscodesim:assessment-saved', 'emscodesim:treatment-saved', 'emscodesim:patient-record-updated', 'ems-scenario-rendered'].forEach(name => {
      window.addEventListener(name, () => {
        markActivity();
        window.setTimeout(() => {
          refreshAll(true);
          highlightLatestFinding();
        }, 40);
      });
    });
  }

  window.EMSCodeSimAssessmentModeUx = Object.freeze({
    version: VERSION,
    caseConfig: CASE_CONFIG,
    refresh: () => refreshAll(true),
    showSoftPrompt,
    resetAssessmentProgress,
    showMiniResult
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
