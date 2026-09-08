(function () {
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
    } catch (_) {
      return '';
    }
  }

  function writeStage(stage) {
    try {
      localStorage.setItem(STAGE_KEY, JSON.stringify({ stage, updated: new Date().toISOString() }));
      localStorage.setItem(PROMPT_KEY, '1');
    } catch (_) {}
  }

  function promptWasSeen() {
    try {
      return localStorage.getItem(PROMPT_KEY) === '1';
    } catch (_) {
      return true;
    }
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
      if (normalizedPath(new URL(link.href, location.origin).pathname) === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
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
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog();
    });

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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
