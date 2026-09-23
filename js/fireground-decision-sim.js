/**
 * Fireground Decision Sim — case data, timed injects, CAN debrief.
 * Training tabletop only. Completing a case never marks a Roadmap task complete.
 */
(function (global) {
  const CASES = {
    residential: {
      title: 'Single-Family Fire',
      image: '/scenarios/single_line_preconnect_001.webp',
      brief: 'Two-story residence, first-floor fire showing, possible occupant inside, and first-arriving Engine 181 ahead of later companies.',
      steps: [
        {
          prompt: 'Approaching the scene, what should shape the initial plan?',
          choices: [
            'Visible flame color only',
            'Occupancy/life hazard, fire location/extent, building, access, water and arriving resources',
            'Choose the interior route before arrival'
          ],
          correct: 1,
          debrief: 'Build a usable picture before committing; keep the plan open to revision.'
        },
        {
          prompt: 'Front door is closed and smoke is pushing around it while the line is being stretched. Best mindset?',
          choices: [
            'Open and prop it immediately',
            'Coordinate access with water readiness, read conditions and control the opening when possible',
            'Vent every window first'
          ],
          correct: 1,
          debrief: 'Changing an opening changes ventilation; coordinate it with suppression/search.'
        },
        {
          prompt: 'After water application, conditions improve but smoke remains upstairs. Next?',
          choices: [
            'Assume the fire is out',
            'Reassess extension, search, structure, air, staffing and ventilation; communicate progress/needs',
            'Stop radio updates'
          ],
          correct: 1,
          debrief: 'Improvement should trigger reassessment, not autopilot.'
        }
      ],
      injects: []
    },
    apartment: {
      title: 'Garden Apartment',
      image: '/scenarios/wye_residential_split_001.webp',
      brief: 'Three-story apartment, second-floor fire, people visible on balconies, additional callers inside, narrow access lane.',
      timed: true,
      steps: [
        {
          prompt: 'What makes this more than a single-room problem?',
          choices: [
            'Nothing',
            'Multiple life hazards, shared spaces/voids, access, extension potential, rescue/attack/water coordination',
            'Only the hydrant'
          ],
          correct: 1,
          debrief: 'Multi-family occupancy expands both life safety and coordination demands.'
        },
        {
          prompt: 'What should guide first-engine placement?',
          choices: [
            'Stop at the exact address no matter what',
            'Hose stretch, rescue/aerial access, collapse/exposure space, water and later units',
            'Park at the hydrant regardless of layout'
          ],
          correct: 1,
          debrief: 'Good placement preserves later tactical options.'
        },
        {
          prompt: 'Smoke begins pushing from third-floor eaves above the fire unit. Best response?',
          choices: [
            'Ignore it until flame appears',
            'Communicate it as a possible extension clue and investigate/reassess resources',
            'Assume definite attic involvement and abandon every interior action'
          ],
          correct: 1,
          debrief: 'Treat it as meaningful information without claiming more than you know.'
        }
      ],
      injects: [
        {
          id: 'apt-balcony-radio',
          kind: 'radio',
          afterMs: 8000,
          from: 'Dispatch',
          title: 'Additional callers',
          body: 'First-due, additional callers: occupants visible on the B-side second-floor balconies. Multiple apartments reporting smoke inside.'
        },
        {
          id: 'apt-residual-radio',
          kind: 'radio',
          afterMs: 22000,
          afterStep: 1,
          from: 'Engine 181 pump',
          title: 'Water / stretch',
          body: 'Residual is dropping. Hydrant is a long stretch down this lane — if we nose into the address we may block later units.'
        },
        {
          id: 'apt-eaves',
          kind: 'conditions',
          atStep: 1,
          from: 'Your view',
          title: 'Conditions change',
          body: 'Smoke is now pushing from the third-floor eaves above the fire unit. No flame visible from here.'
        }
      ]
    },
    commercial: {
      title: 'Strip-Mall Smoke Showing',
      image: '/scenarios/advanced_portable_monitor_dual_supply.webp',
      brief: 'Closed strip mall at 03:07, dark smoke from rear of a restaurant, security gates, multiple alarm activations, no confirmed occupants.',
      steps: [
        {
          prompt: 'What should drive the first minute?',
          choices: [
            'Assume closed means empty',
            'Construction/roof, occupancy/contents, fire location, access, exposures, life hazard, water and resources',
            'Only the alarm panel'
          ],
          correct: 1,
          debrief: 'Commercial buildings can conceal extension and structural hazards.'
        },
        {
          prompt: 'Rear smoke increases around the roofline near HVAC. Best response?',
          choices: [
            'Assume it is HVAC smoke',
            'Communicate the change, consider concealed/roof involvement and reassess risk/resources',
            'Send one firefighter alone to the roof'
          ],
          correct: 1,
          debrief: 'Changing roofline conditions matter to the incident plan.'
        },
        {
          prompt: 'Interior progress is slow and heat is increasing above the ceiling. Officer decision point?',
          choices: [
            'Continue indefinitely because crews are already inside',
            'Recompare life-safety benefit, structure/fire, crew position, water, progress and resources; change the plan if needed',
            'Open the roof automatically'
          ],
          correct: 1,
          debrief: 'Commitment should never prevent strategy reassessment.'
        }
      ],
      injects: []
    },
    basement: {
      title: 'Basement Fire',
      image: '/scenarios/single_line_heavy_003.webp',
      brief: 'One-story home over basement, heavier smoke from a rear basement window, occupants report everyone out, interior and exterior basement access.',
      steps: [
        {
          prompt: 'What is the key information gap?',
          choices: [
            'Door color',
            'Fire location/extent, stair/flow-path conditions, structural involvement and reliability of occupant status',
            'Nothing; all basement fires are the same'
          ],
          correct: 1,
          debrief: 'Basement access and structural conditions can be challenging and variable.'
        },
        {
          prompt: 'Opening the interior basement door creates what concern?',
          choices: [
            'None if occupants are out',
            'A new air path and potentially difficult stair conditions; coordinate access with suppression',
            'It automatically extinguishes the fire'
          ],
          correct: 1,
          debrief: 'Door position can affect the flow path and crew environment.'
        },
        {
          prompt: 'After knockdown, the floor above feels abnormal and structural members were involved. Next?',
          choices: [
            'Assume knockdown removes collapse risk',
            'Communicate the concern, limit unnecessary loading and reassess overhaul/search needs',
            'Remove SCBA immediately'
          ],
          correct: 1,
          debrief: 'Post-knockdown structural and atmospheric hazards remain.'
        }
      ],
      injects: []
    }
  };

  function parseCaseParam(search) {
    let raw = '';
    if (typeof search === 'string') {
      const q = search.charAt(0) === '?' ? search.slice(1) : search;
      raw = new URLSearchParams(q).get('case') || '';
    } else if (search && typeof search.get === 'function') {
      raw = search.get('case') || '';
    }
    const id = String(raw).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return CASES[id] ? id : '';
  }

  function defaultCaseId(search) {
    return parseCaseParam(search) || 'residential';
  }

  function injectsFor(caseId) {
    const pack = CASES[caseId];
    return (pack && Array.isArray(pack.injects)) ? pack.injects.slice() : [];
  }

  function dueInjects(caseId, state) {
    const shown = new Set((state && state.shownIds) || []);
    const elapsed = ((state && state.nowMs) || 0) - ((state && state.startedAtMs) || 0);
    const step = (state && state.step) || 0;
    const answered = (state && state.answeredCount) || 0;
    return injectsFor(caseId).filter((inj) => {
      if (!inj || !inj.id || shown.has(inj.id)) return false;
      const timeDue = typeof inj.afterMs === 'number' && elapsed >= inj.afterMs;
      const afterStepDue = typeof inj.afterStep === 'number' && answered >= inj.afterStep;
      const atStepDue = typeof inj.atStep === 'number' && step === inj.atStep;
      if (typeof inj.afterMs === 'number' || typeof inj.afterStep === 'number') {
        return timeDue || afterStepDue;
      }
      return atStepDue;
    });
  }

  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(Number(ms) / 1000) || 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? (m + ':' + String(s).padStart(2, '0')) : (s + 's');
  }

  function formatCan(can) {
    const src = can && typeof can === 'object' ? can : {};
    const conditions = String(src.conditions || '').trim();
    const actions = String(src.actions || '').trim();
    const needs = String(src.needs || '').trim();
    if (!conditions && !actions && !needs) return '';
    return 'Conditions: ' + (conditions || '(blank)') +
      '\nActions: ' + (actions || '(blank)') +
      '\nNeeds: ' + (needs || '(blank)');
  }

  function buildDebriefModel(input) {
    const src = input || {};
    const caseId = src.caseId || '';
    const pack = CASES[caseId] || {};
    const injects = injectsFor(caseId);
    const log = Array.isArray(src.injectLog) ? src.injectLog : [];
    const acked = new Set(log.filter((row) => row && row.acked).map((row) => row.id));
    const shown = new Set(log.map((row) => row && row.id).filter(Boolean));
    const missed = injects.filter((inj) => !shown.has(inj.id));
    return {
      caseId,
      title: pack.title || caseId,
      score: src.score || 0,
      max: src.max || 0,
      elapsedLabel: formatElapsed(src.elapsedMs || 0),
      hist: Array.isArray(src.hist) ? src.hist : [],
      injectLog: log,
      missed,
      canText: formatCan(src.can),
      timed: !!pack.timed
    };
  }

  function track(eventName, props) {
    try {
      if (global.FireOpsAnalytics && typeof global.FireOpsAnalytics.track === 'function') {
        global.FireOpsAnalytics.track(eventName, props);
      }
    } catch {
      /* analytics is optional */
    }
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"]/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[ch]));
  }

  function boot(doc, loc) {
    if (!doc || !doc.getElementById) return null;
    const grid = doc.getElementById('caseGrid');
    const choices = doc.getElementById('choices');
    const fb = doc.getElementById('feedback');
    const next = doc.getElementById('next');
    const debriefPanel = doc.getElementById('debriefPanel');
    const overlay = doc.getElementById('injectOverlay');
    const injectLogEl = doc.getElementById('injectLog');
    const canPanel = doc.getElementById('canPanel');
    const clockEl = doc.getElementById('simClock');
    if (!grid || !choices || !fb || !next || !debriefPanel) return null;

    let active = defaultCaseId(loc && loc.search);
    let step = 0;
    let score = 0;
    let hist = [];
    let answered = false;
    let answeredCount = 0;
    let startedAt = Date.now();
    let shownIds = [];
    let injectLog = [];
    let queue = [];
    let overlayOpen = false;
    let finished = false;
    let timer = null;

    function syncUrl(caseId) {
      if (!loc || !global.history || typeof global.history.replaceState !== 'function') return;
      try {
        const url = new URL(loc.href);
        url.searchParams.set('case', caseId);
        global.history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString() + url.hash);
      } catch {
        /* ignore */
      }
    }

    function readCan() {
      return {
        conditions: (doc.getElementById('canConditions') || {}).value || '',
        actions: (doc.getElementById('canActions') || {}).value || '',
        needs: (doc.getElementById('canNeeds') || {}).value || ''
      };
    }

    function clearCan() {
      ['canConditions', 'canActions', 'canNeeds'].forEach((id) => {
        const el = doc.getElementById(id);
        if (el) el.value = '';
      });
    }

    function setTimedChrome(on) {
      if (canPanel) canPanel.hidden = !on;
      if (injectLogEl) injectLogEl.hidden = !on;
      if (clockEl) clockEl.hidden = !on;
    }

    function renderClock() {
      if (!clockEl || clockEl.hidden) return;
      clockEl.textContent = 'Elapsed ' + formatElapsed(Date.now() - startedAt);
    }

    function renderInjectLog() {
      if (!injectLogEl) return;
      if (!injectLog.length) {
        injectLogEl.innerHTML = '<p class="section-kicker">Injects</p><p class="muted">Timed radio and condition traffic will land on this case. Acknowledge each one.</p>';
        return;
      }
      injectLogEl.innerHTML = '<p class="section-kicker">Heard</p><ul>' + injectLog.map((row) => (
        '<li><strong>' + esc(formatElapsed(row.atMs)) + ' · ' + esc(row.from) + '</strong> — ' + esc(row.title) +
        (row.acked ? '' : ' <em>(not acknowledged)</em>') + '</li>'
      )).join('') + '</ul>';
    }

    function hideOverlay() {
      overlayOpen = false;
      if (overlay) {
        overlay.hidden = true;
        overlay.innerHTML = '';
      }
    }

    function showOverlay(inj) {
      if (!overlay) return;
      overlayOpen = true;
      overlay.hidden = false;
      const kindLabel = inj.kind === 'radio' ? 'Radio traffic' : 'Conditions change';
      overlay.innerHTML =
        '<div class="inject-card" role="dialog" aria-modal="true" aria-labelledby="injectTitle">' +
          '<p class="section-kicker">' + esc(kindLabel) + '</p>' +
          '<h2 id="injectTitle">' + esc(inj.from) + ' — ' + esc(inj.title) + '</h2>' +
          '<p>' + esc(inj.body) + '</p>' +
          '<button type="button" class="button primary" id="injectAck">Heard / copy</button>' +
        '</div>';
      const btn = doc.getElementById('injectAck');
      if (btn) {
        btn.onclick = () => ackInject(inj.id);
        btn.focus();
      }
    }

    function ackInject(id) {
      const row = injectLog.find((item) => item.id === id);
      if (row) row.acked = true;
      track('fireground_ack', { case: active, inject: id });
      hideOverlay();
      renderInjectLog();
      if (queue.length) showOverlay(queue.shift());
    }

    function enqueue(inj) {
      if (!inj || shownIds.indexOf(inj.id) !== -1) return;
      shownIds.push(inj.id);
      injectLog.push({
        id: inj.id,
        kind: inj.kind,
        from: inj.from,
        title: inj.title,
        body: inj.body,
        atMs: Date.now() - startedAt,
        acked: false
      });
      track('fireground_inject', { case: active, inject: inj.id, kind: inj.kind });
      if (overlayOpen) queue.push(inj);
      else showOverlay(inj);
      renderInjectLog();
    }

    function pollInjects() {
      if (finished) return;
      renderClock();
      dueInjects(active, {
        startedAtMs: startedAt,
        nowMs: Date.now(),
        step,
        answeredCount,
        shownIds
      }).forEach(enqueue);
    }

    function renderCases() {
      grid.innerHTML = Object.entries(CASES).map(([key, pack]) => (
        '<button type="button" class="case ' + (key === active ? 'active' : '') + '" data-k="' + esc(key) + '">' +
          '<img src="' + esc(pack.image) + '" alt="' + esc(pack.title) + '">' +
          '<div><strong>' + esc(pack.title) + '</strong>' +
          '<small>' + pack.steps.length + ' decisions' + (pack.timed ? ' · timed injects' : '') + '</small></div>' +
        '</button>'
      )).join('');
      grid.querySelectorAll('button').forEach((btn) => {
        btn.onclick = () => start(btn.dataset.k);
      });
    }

    function render() {
      const pack = CASES[active];
      const current = pack.steps[step];
      const photo = doc.getElementById('photo');
      if (photo) {
        photo.src = pack.image;
        photo.alt = pack.title;
      }
      const title = doc.getElementById('title');
      const brief = doc.getElementById('brief');
      const prompt = doc.getElementById('prompt');
      const stepEl = doc.getElementById('step');
      const scoreEl = doc.getElementById('score');
      if (title) title.textContent = pack.title;
      if (brief) brief.textContent = pack.brief;
      if (prompt) prompt.textContent = current.prompt;
      if (stepEl) stepEl.textContent = 'Decision ' + (step + 1) + '/' + pack.steps.length;
      if (scoreEl) scoreEl.textContent = 'Score ' + score + '/' + (pack.steps.length * 3);
      choices.innerHTML = current.choices.map((choice, i) => (
        '<button type="button" class="choice" data-i="' + i + '">' + esc(choice) + '</button>'
      )).join('');
      choices.querySelectorAll('button').forEach((btn) => {
        btn.onclick = () => choose(+btn.dataset.i);
      });
      fb.hidden = true;
      next.disabled = true;
      next.textContent = step === pack.steps.length - 1 ? 'Finish' : 'Next';
      answered = false;
      pollInjects();
    }

    function choose(index) {
      if (answered || overlayOpen) return;
      answered = true;
      const current = CASES[active].steps[step];
      const good = index === current.correct;
      if (good) score += 3;
      hist.push({
        prompt: current.prompt,
        choice: current.choices[index],
        debrief: current.debrief,
        good
      });
      answeredCount += 1;
      choices.querySelectorAll('button').forEach((btn, i) => {
        btn.disabled = true;
        if (i === index) btn.classList.add('selected');
      });
      fb.hidden = false;
      fb.innerHTML = '<strong>' + (good ? 'Strong reasoning' : 'Debrief this choice') + '</strong><p>' + esc(current.debrief) + '</p>';
      const scoreEl = doc.getElementById('score');
      if (scoreEl) scoreEl.textContent = 'Score ' + score + '/' + (CASES[active].steps.length * 3);
      next.disabled = false;
      pollInjects();
    }

    function finish() {
      finished = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      hideOverlay();
      queue = [];
      const model = buildDebriefModel({
        caseId: active,
        score,
        max: CASES[active].steps.length * 3,
        hist,
        injectLog,
        can: readCan(),
        elapsedMs: Date.now() - startedAt
      });
      const debrief = doc.getElementById('debrief');
      if (debrief) {
        const articles = model.hist.map((row, i) => (
          '<article><strong>' + (i + 1) + '. ' + esc(row.prompt) + '</strong>' +
          '<p><b>Your choice:</b> ' + esc(row.choice) + '</p><p>' + esc(row.debrief) + '</p></article>'
        )).join('');
        const injectBlock = model.timed ? (
          '<article class="print-block"><strong>Injects</strong>' +
          (model.injectLog.length
            ? '<ul>' + model.injectLog.map((row) => (
              '<li>' + esc(formatElapsed(row.atMs)) + ' · ' + esc(row.from) + ' — ' + esc(row.title) +
              (row.acked ? ' (copy)' : ' (shown, not acknowledged)') + '</li>'
            )).join('') + '</ul>'
            : '<p>No timed traffic landed before you finished.</p>') +
          (model.missed.length
            ? '<p><b>Missed:</b> ' + esc(model.missed.map((inj) => inj.title).join('; ')) + '</p>'
            : '') +
          '</article>'
        ) : '';
        const canBlock = model.timed ? (
          '<article class="print-block"><strong>CAN report</strong>' +
          (model.canText
            ? '<pre>' + esc(model.canText) + '</pre>'
            : '<p>No CAN written. Practice saying conditions, actions, and needs out loud next time.</p>') +
          '</article>'
        ) : '';
        const links = model.timed ? (
          '<article class="print-block no-print"><strong>Keep training this scene</strong>' +
          '<p><a href="/skill-support.html?cert=driver_operator_pumper&amp;task=do_pumper_apparatus_placement">Apparatus placement session</a> · ' +
          '<a href="/skill-support.html?cert=fire_officer_1&amp;task=fo1_initial_radio_report">Initial radio report session</a></p>' +
          '<p class="muted">Completing this tabletop never marks a Roadmap task complete.</p></article>'
        ) : '';
        debrief.innerHTML =
          '<p class="print-meta"><strong>' + esc(model.title) + '</strong> · Score ' + model.score + '/' + model.max +
          ' · ' + esc(model.elapsedLabel) + '</p>' +
          articles + injectBlock + canBlock + links;
      }
      debriefPanel.hidden = false;
      debriefPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('fireground_finish', { case: active, score, injects: injectLog.length });
      try {
        const prior = JSON.parse(global.localStorage.getItem('fos-fire-sim-history-v1') || '[]');
        prior.unshift({
          case: active,
          score,
          max: CASES[active].steps.length * 3,
          injects: injectLog.length,
          date: new Date().toISOString()
        });
        global.localStorage.setItem('fos-fire-sim-history-v1', JSON.stringify(prior.slice(0, 25)));
      } catch {
        /* private mode */
      }
    }

    function start(caseId) {
      if (!CASES[caseId]) return;
      active = caseId;
      step = 0;
      score = 0;
      hist = [];
      answered = false;
      answeredCount = 0;
      startedAt = Date.now();
      shownIds = [];
      injectLog = [];
      queue = [];
      finished = false;
      hideOverlay();
      clearCan();
      debriefPanel.hidden = true;
      const debrief = doc.getElementById('debrief');
      if (debrief) debrief.innerHTML = '';
      setTimedChrome(!!CASES[active].timed);
      renderInjectLog();
      renderClock();
      syncUrl(active);
      renderCases();
      render();
      if (timer) clearInterval(timer);
      timer = CASES[active].timed ? setInterval(pollInjects, 250) : null;
      track('fireground_start', { case: active, timed: !!CASES[active].timed });
    }

    next.onclick = () => {
      if (overlayOpen) return;
      if (step < CASES[active].steps.length - 1) {
        step += 1;
        render();
      } else {
        finish();
      }
    };
    const restart = doc.getElementById('restart');
    if (restart) restart.onclick = () => start(active);
    const printBtn = doc.getElementById('print');
    if (printBtn) printBtn.onclick = () => global.print();

    start(active);
    return { start, getState: () => ({ active, step, score, shownIds, finished }) };
  }

  const api = {
    CASES,
    parseCaseParam,
    defaultCaseId,
    injectsFor,
    dueInjects,
    formatElapsed,
    formatCan,
    buildDebriefModel,
    boot
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FireOpsFireground = api;

  if (typeof document !== 'undefined' && !global.__FOS_FIREGROUND_NOBOOT) {
    const startBoot = () => boot(document, global.location);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startBoot);
    else startBoot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
