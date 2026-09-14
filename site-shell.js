(function () {
  const GOOGLE_TAG_ID = 'G-ZG119QK9M2';

  function initGoogleAnalytics() {
    if (window.__fireOpsGoogleAnalyticsLoaded) return;
    window.__fireOpsGoogleAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_TAG_ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    document.head.appendChild(script);
  }

  initGoogleAnalytics();
  const STAGE_KEY = 'fos-career-stage-v1';
  const PROMPT_KEY = 'fos-stage-prompt-seen-v1';
  const stages = [
    ['explore', 'Exploring fire / EMS'],
    ['emt_school', 'EMT student'],
    ['new_emt', 'New EMT'],
    ['medic_school', 'Paramedic student'],
    ['new_paramedic', 'New paramedic'],
    ['academy', 'Fire academy / probation'],
    ['firefighter', 'Working firefighter'],
    ['driver', 'Driver / Operator'],
    ['officer', 'Officer / Acting Officer'],
    ['specialty', 'Specialty / advanced role'],
    ['late', 'Late career / transition']
  ];
  const stageLabels = Object.fromEntries(stages);
  const navItems = [
    ['Stages', '/career-stages.html'],
    ['Study', '/study-center.html'],
    ['Sims', '/fireground-decision-sim.html'],
    ['Drills', '/focus-drills.html'],
    ['Tools', '/tools.html'],
    ['My Career', '/my-fire-career.html']
  ];

  function readStage() {
    try {
      const saved = JSON.parse(localStorage.getItem(STAGE_KEY));
      return saved && stageLabels[saved.stage] ? saved.stage : '';
    } catch (_) { return ''; }
  }

  function writeStage(stage) {
    try {
      localStorage.setItem(STAGE_KEY, JSON.stringify({ stage, updated: new Date().toISOString() }));
      localStorage.setItem(PROMPT_KEY, '1');
    } catch (_) {}
  }

  function promptWasSeen() {
    try { return localStorage.getItem(PROMPT_KEY) === '1'; }
    catch (_) { return true; }
  }

  function normalizedPath(value) {
    return (value || '/').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }

  function buildHeader() {
    const header = document.createElement('header');
    header.className = 'global-site-header';
    header.id = 'top';
    header.innerHTML = `
      <nav class="global-nav" aria-label="Main navigation">
        <a class="global-brand" href="/" aria-label="FireOpsSim home">
          <span class="global-brand-mark" aria-hidden="true">FOS</span>
          <span>FireOpsSim</span>
        </a>
        <button class="global-stage-button" type="button" aria-haspopup="dialog" aria-controls="careerStageDialog">
          <span>Current stage</span><strong data-current-stage>Choose stage</strong>
        </button>
        <button class="global-menu-button" type="button" aria-expanded="false" aria-controls="globalNavLinks">
          <span class="global-menu-label">Menu</span><span class="global-menu-icon" aria-hidden="true"></span>
        </button>
        <div class="global-nav-links" id="globalNavLinks">
          ${navItems.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}
        </div>
      </nav>`;
    const currentPath = normalizedPath(location.pathname);
    header.querySelectorAll('.global-nav-links a').forEach((link) => {
      if (normalizedPath(new URL(link.href, location.origin).pathname) === currentPath) link.setAttribute('aria-current', 'page');
    });
    return header;
  }

  function buildStageDialog() {
    const dialog = document.createElement('dialog');
    dialog.className = 'career-stage-dialog';
    dialog.id = 'careerStageDialog';
    dialog.setAttribute('aria-labelledby', 'careerStageTitle');
    dialog.innerHTML = `
      <form method="dialog" class="career-stage-card">
        <p class="career-stage-kicker">Personalize FireOpsSim</p>
        <h2 id="careerStageTitle">Where are you in your career?</h2>
        <p>Choose the stage that best fits today. FireOpsSim saves it only on this device and uses it to start you in the most useful study and training areas.</p>
        <div class="career-stage-options">
          ${stages.map(([key, label]) => `<button type="button" data-stage-choice="${key}">${label}</button>`).join('')}
        </div>
        <div class="career-stage-footer">
          <a href="/career-stages.html">See what each stage includes</a>
          <button class="career-stage-skip" type="button" data-stage-skip>Skip for now</button>
        </div>
      </form>`;
    dialog.insertAdjacentHTML('beforeend', '<button class="career-stage-close" type="button" data-stage-close aria-label="Close stage selector">×</button>');
    return dialog;
  }

  function safeRoadmapReturn(value) {
    if (!value) return '';
    try {
      const url = new URL(value, location.origin);
      if (['http:', 'https:', 'responderroadmap:'].includes(url.protocol)) return url.href;
    } catch (_) {}
    return '';
  }

  function initRoadmapAssignmentMode() {
    if (!/\/focus-drills(?:\.html)?\/?$/.test(location.pathname)) return;
    const params = new URLSearchParams(location.search);
    if ((params.get('source') || '').toLowerCase() !== 'roadmap') return;

    const topic = params.get('topic') || params.get('competency') || 'assigned competency';
    const goal = params.get('goal') || params.get('target') || '';
    const task = params.get('task') || params.get('task_id') || '';
    const returnUrl = safeRoadmapReturn(params.get('return') || params.get('return_url') || '');

    document.body.classList.add('roadmap-assignment-mode');
    const style = document.createElement('style');
    style.textContent = `
      body.roadmap-assignment-mode .fd-hero,
      body.roadmap-assignment-mode .fd-levels,
      body.roadmap-assignment-mode .fd-best,
      body.roadmap-assignment-mode #drills,
      body.roadmap-assignment-mode .fd-wheel{display:none!important}
      .rr-assignment-banner{margin:1rem auto 0;max-width:1180px;background:#fff7f6;border:1px solid #e8c2be;border-left:6px solid #c9362b;border-radius:16px;padding:1rem 1.1rem}
      .rr-assignment-banner h1{font-size:clamp(1.35rem,3vw,2rem);margin:.25rem 0}
      .rr-assignment-banner p{margin:.35rem 0;color:#526068}
      .rr-deep-module{margin-top:1rem;background:#111820;color:#fff;border-radius:16px;padding:1rem}
      .rr-deep-module p{color:#dbe4e8}
      .rr-deep-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
      .rr-deep-card{background:#182630;border:1px solid #31434d;border-radius:12px;padding:.85rem}
      .rr-deep-card h3{margin:.1rem 0 .45rem}
      .rr-deep-card ul{margin:.25rem 0;padding-left:1.2rem}
      .rr-deep-card li{margin:.35rem 0}
      @media(max-width:800px){.rr-deep-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const main = document.querySelector('main');
    if (main) {
      const banner = document.createElement('section');
      banner.className = 'rr-assignment-banner';
      banner.innerHTML = `<span class="fd-badge">Responder Roadmap Assignment</span><h1>${escapeHtml(topic)}</h1><p>${goal ? `Task-book goal: <strong>${escapeHtml(goal)}</strong>. ` : ''}FireOpsSim matched this assignment to the closest hands-on training. Start below; you do not need to browse the drill library first.</p>${task ? `<p class="small">Assignment ID: ${escapeHtml(task)}</p>` : ''}`;
      main.prepend(banner);
    }

    const contextBadge = document.querySelector('#contextBox .fd-badge');
    if (contextBadge) contextBadge.textContent = 'Responder Roadmap Assignment';

    let attempts = 0;
    const openMatchedDrill = () => {
      attempts += 1;
      const useBest = document.getElementById('useBest');
      const bestTitle = document.getElementById('bestTitle');
      if (useBest && bestTitle && bestTitle.textContent.trim()) {
        useBest.click();
        setTimeout(() => {
          enhanceOpenDrill(topic, goal, returnUrl);
          const runner = document.getElementById('runDrill');
          if (runner) runner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return;
      }
      if (attempts < 40) setTimeout(openMatchedDrill, 100);
    };
    setTimeout(openMatchedDrill, 50);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function moduleFor(text) {
    const hay = String(text || '').toLowerCase();
    const modules = [
      {
        keys:['attack line','hose','nozzle','advancement'],
        why:'Fast, controlled line placement reduces delay to effective water application and keeps the crew moving as a unit.',
        scenario:'First-due engine to a single-story residence with smoke showing from Division 1. The officer orders an interior attack through Side Alpha toward a reported rear-bedroom fire.',
        injects:['Hose catches at a doorway or exterior corner.','A significant kink reduces flow.','A simulated victim is encountered during advancement.','The nozzle firefighter reports low air or a water-supply interruption occurs.'],
        coaching:['Stage enough hose before entry.','Make the water call clear and confirm a usable stream.','Manage corners and pinch points before they stop the nozzle team.','Correct loss of flow, crew separation, or unsafe conditions immediately.'],
        second:'Run again with a different entry point, one additional turn or stair, and introduce the complication earlier.'
      },
      {
        keys:['primary search','search'],
        why:'A disciplined search combines speed, orientation, victim priorities, air management, communication, and survivability awareness.',
        scenario:'Working residential fire with one occupant unaccounted for. Search team enters from Side Alpha while the attack crew advances toward the reported fire area.',
        injects:['Closed bedroom door with changing heat/smoke conditions.','Victim found in a low-visibility room.','Search member loses contact with the wall/anchor point.','Command reports a changing fire location.'],
        coaching:['State search pattern and team roles before entry.','Maintain orientation and communicate landmarks.','Prioritize likely victim areas while monitoring conditions.','Package and move a victim without losing team integrity.'],
        second:'Repeat with a different floor plan or victim location and require a radio update before removal.'
      },
      {
        keys:['ground ladder','ladder'],
        why:'Ladder work must be fast, accurate, coordinated, and placed for the actual objective without creating avoidable hazards.',
        scenario:'Crew is assigned to place a ground ladder for second-floor rescue or firefighter egress on Side C.',
        injects:['Initial placement is blocked by an obstacle.','The objective changes from roof access to rescue.','Limited staffing requires a modified raise.','Uneven ground forces repositioning.'],
        coaching:['Confirm ladder length and objective before removing it.','Use clear commands and controlled carries/raises.','Check climbing angle, tip placement, footing, and overhead hazards.','Reposition promptly when conditions make the first location ineffective.'],
        second:'Repeat with reduced staffing or a different ladder/objective.'
      },
      {
        keys:['forcible entry','force entry'],
        why:'Good forcible entry balances speed, tool control, door assessment, firefighter positioning, and coordination with interior operations.',
        scenario:'Engine company needs access through a secured inward- or outward-swinging door while smoke conditions are worsening.',
        injects:['Tool placement slips on the first attempt.','Door construction differs from the initial assumption.','Command orders the door controlled after entry.','Limited space changes firefighter positions.'],
        coaching:['Read hinges, lock area, swing, and construction first.','Assign tool roles and verbal commands.','Control the door once defeated.','Stop and change technique instead of repeating ineffective strikes.'],
        second:'Change door type or require the crew to explain tool choice before starting.'
      },
      {
        keys:['ventilation','vent'],
        why:'Ventilation has to support the fire attack and must be coordinated with water application and fire conditions.',
        scenario:'Interior crew is advancing toward a bedroom fire with worsening heat and visibility. Command assigns your crew to coordinate ventilation.',
        injects:['Attack crew is delayed.','Wind direction creates an unfavorable opening.','The planned opening is inaccessible.','Conditions improve or worsen immediately after the ventilation action.'],
        coaching:['Confirm objective and timing with command/attack crew.','Identify flow-path consequences before opening.','Use the smallest effective action that meets the objective.','Reassess conditions immediately after ventilation.'],
        second:'Repeat with a changed wind direction or delayed attack line.'
      },
      {
        keys:['hydrant','water supply','supply line'],
        why:'A reliable water supply depends on apparatus placement, hydrant connection, hose management, communication, and anticipating demand.',
        scenario:'First-due engine is operating on tank water at a working residential fire. Your assignment is to establish a sustained hydrant supply.',
        injects:['Hydrant is partially obstructed.','Supply hose develops a kink.','Hydrant flow is weaker than expected.','A second line increases demand.'],
        coaching:['Plan the connection before committing apparatus/crew.','Communicate when water is ready.','Check the entire supply path for restrictions.','Recognize when available supply will not meet expected fire flow.'],
        second:'Repeat using a different hydrant position or higher demand.'
      },
      {
        keys:['pump discharge','pump operations','pump','pdp'],
        why:'Pump operations require correct initial pressure, continuous monitoring, and rapid recognition of intake, discharge, or water-supply problems.',
        scenario:'Engine is supplying an attack line at a working structure fire. Establish the correct pump discharge pressure and maintain the line as conditions change.',
        injects:['Nozzle/line configuration changes.','Intake pressure drops.','A second discharge is opened.','Crew reports inadequate stream or excessive pressure.'],
        coaching:['State the pressure calculation before setting the pump.','Confirm line/nozzle assumptions.','Watch intake and discharge gauges as demand changes.','Correct the cause rather than chasing the gauge alone.'],
        second:'Repeat with an added appliance, elevation change, or second line.'
      },
      {
        keys:['standpipe'],
        why:'Standpipe operations combine hose selection, floor positioning, pressure needs, connection discipline, and high-rise communication.',
        scenario:'Crew is assigned to advance from a standpipe for a reported fire above grade. Establish the line from the department-approved connection point and prepare to advance.',
        injects:['Outlet cap is difficult to remove.','Pressure is inadequate.','Debris or a damaged outlet affects connection.','Fire location changes one floor.'],
        coaching:['Use department hose/nozzle package and approved connection floor.','Flush/check outlet as procedure requires.','Keep hose deployment organized before charging.','Communicate pressure or outlet problems early.'],
        second:'Repeat with a different floor layout or simulated low-pressure problem.'
      },
      {
        keys:['mayday','rit','rapid intervention'],
        why:'Mayday/RIT performance depends on early recognition, clear radio traffic, disciplined self-survival actions, and coordinated rescue priorities.',
        scenario:'A firefighter becomes disoriented, trapped, or separated during interior operations. Run the mayday communication and initial rescue response according to department procedure.',
        injects:['Radio traffic is congested.','Location information is incomplete.','Air supply is rapidly decreasing.','Conditions force a change in rescue access.'],
        coaching:['Declare the emergency early.','Transmit location/unit/name/problem/resources using department format.','Control breathing and preserve orientation.','RIT confirms assignment, tools, access, and progress to command.'],
        second:'Repeat with less location information and a different access point.'
      },
      {
        keys:['officer','size up','initial company','command'],
        why:'Early company-officer decisions set strategy, priorities, communications, and the risk profile for the first operational period.',
        scenario:'You arrive first-due to a working structure fire with incomplete occupant information and visible smoke/fire conditions. Give the initial report, establish priorities, and assign the first arriving resources.',
        injects:['Occupant reports someone trapped.','Water supply is delayed.','Fire conditions change after the first assignment.','A second hazard or exposure appears.'],
        coaching:['Give a concise arrival report and declare command mode.','Match strategy to conditions, resources, and life hazard.','Assign tasks with clear objectives.','Reassess after every meaningful change.'],
        second:'Repeat with fewer initial resources or a conflicting life-safety report.'
      }
    ];
    return modules.find((m) => m.keys.some((key) => hay.includes(key))) || null;
  }

  function enhanceOpenDrill(topic, goal, returnUrl) {
    const runner = document.getElementById('runDrill');
    if (!runner) return;
    const title = (document.getElementById('runTitle') || {}).textContent || '';
    const module = moduleFor(`${topic} ${goal} ${title}`);
    if (module && !runner.querySelector('.rr-deep-module')) {
      const section = document.createElement('section');
      section.className = 'rr-deep-module';
      section.innerHTML = `
        <p class="section-kicker">Roadmap-linked depth module</p>
        <h2>Train the competency, not just the checklist.</h2>
        <div class="rr-deep-grid">
          <div class="rr-deep-card"><h3>Why this matters</h3><p>${escapeHtml(module.why)}</p></div>
          <div class="rr-deep-card"><h3>Scenario</h3><p>${escapeHtml(module.scenario)}</p></div>
          <div class="rr-deep-card"><h3>Instructor injects</h3><ul>${module.injects.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
          <div class="rr-deep-card"><h3>Coaching points</h3><ul>${module.coaching.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
          <div class="rr-deep-card"><h3>Second rep</h3><p>${escapeHtml(module.second)}</p></div>
          <div class="rr-deep-card"><h3>Evaluation boundary</h3><p>Use this as practice and preparation. Official task-book completion still requires the evaluator/department process in Responder Roadmap.</p></div>
        </div>`;
      const actions = runner.querySelector('.fd-actions');
      if (actions) actions.before(section); else runner.appendChild(section);
    }

    const returnButton = document.getElementById('returnToRoadmap');
    if (returnButton) {
      returnButton.textContent = 'Ready for Evaluation → Roadmap';
      if (returnUrl) returnButton.href = returnUrl;
    }
    const completeText = document.querySelector('#completeMessage strong');
    if (completeText) completeText.textContent = 'Practice complete — return to Roadmap for evaluation.';
  }

  function init() {
    const oldHeaders = Array.from(document.querySelectorAll('body > .site-header, body > header.site-header, body > header.top'));
    const header = buildHeader();
    if (oldHeaders.length) {
      oldHeaders[0].replaceWith(header);
      oldHeaders.slice(1).forEach((item) => item.remove());
    } else {
      const firstContent = document.querySelector('body > .skip-link, body > main, body > section');
      if (firstContent && firstContent.classList.contains('skip-link')) firstContent.after(header);
      else if (firstContent) firstContent.before(header);
      else document.body.prepend(header);
    }

    const dialog = buildStageDialog();
    document.body.appendChild(dialog);
    const stageText = header.querySelector('[data-current-stage]');
    const stageButton = header.querySelector('.global-stage-button');
    const menuButton = header.querySelector('.global-menu-button');
    const navLinks = header.querySelector('.global-nav-links');

    function syncStage() {
      const stage = readStage();
      stageText.textContent = stage ? stageLabels[stage] : 'Choose stage';
      dialog.querySelectorAll('[data-stage-choice]').forEach((button) => {
        button.classList.toggle('is-selected', button.dataset.stageChoice === stage);
        button.setAttribute('aria-pressed', String(button.dataset.stageChoice === stage));
      });
    }

    function openDialog() {
      syncStage();
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      requestAnimationFrame(() => (dialog.querySelector('.is-selected') || dialog.querySelector('[data-stage-choice]') || dialog).focus());
    }

    function closeDialog() {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }

    stageButton.addEventListener('click', openDialog);
    dialog.querySelector('[data-stage-close]').addEventListener('click', closeDialog);
    dialog.querySelector('[data-stage-skip]').addEventListener('click', () => {
      try { localStorage.setItem(PROMPT_KEY, '1'); } catch (_) {}
      closeDialog();
    });
    dialog.querySelectorAll('[data-stage-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        writeStage(button.dataset.stageChoice);
        syncStage();
        closeDialog();
        stageButton.focus();
        window.dispatchEvent(new CustomEvent('fireopssim:stage-change', { detail: { stage: button.dataset.stageChoice } }));
      });
    });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      navLinks.classList.toggle('is-open', open);
    });
    navLinks.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
    });

    syncStage();
    if (!readStage() && !promptWasSeen()) openDialog();
    initRoadmapAssignmentMode();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
