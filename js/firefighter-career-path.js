(() => {
  const result = document.getElementById('careerStageResult');
  if (!result) return;
  const title = document.getElementById('careerStageTitle');
  const summary = document.getElementById('careerStageSummary');
  const priorities = document.getElementById('careerStagePriorities');
  const actions = document.getElementById('careerStageActions');
  const buttons = [...document.querySelectorAll('[data-career-stage]')];

  const stages = {
    candidate: {
      title: 'Candidate / exploring the fire service',
      summary: 'Learn what departments expect, build job-specific fitness, prepare for testing and interviews, and start building the EMS knowledge many departments need.',
      priorities: ['Department research and minimum qualifications', 'Fitness and testing preparation', 'Interview examples and application readiness'],
      actions: [['/become-a-firefighter.html','Candidate center'], ['https://emscodesim.com/','EMS preparation']]
    },
    academy: {
      title: 'Fire academy / Firefighter I & II',
      summary: 'Build repeatable fundamentals. Use checklists and focused tools to reinforce manipulative skills without replacing your academy curriculum or instructors.',
      priorities: ['SCBA, ladders, hose, search, ventilation, ropes and safety', 'Know your skill sheets and practice weak stations', 'Connect fire behavior and tactics to hands-on actions'],
      actions: [['/firefighter-1-2-tools.html','FF I/II tools'], ['/firefighter-skills-checklist.html','Skills checklist']]
    },
    probation: {
      title: 'Probationary firefighter',
      summary: 'Turn academy skills into dependable station and fireground performance. Practice small pieces often and learn your department’s equipment, expectations, and communication style.',
      priorities: ['Daily fundamentals and apparatus familiarization', 'Company procedures, radio habits and situational awareness', 'Recovery, sleep and sustainable work habits'],
      actions: [['/daily-challenge.html','Start a daily drill'], ['/training.html','Training center']]
    },
    firefighter: {
      title: 'Firefighter / company member',
      summary: 'Maintain broad operational competence while developing deeper strengths in engine, truck, rescue, HazMat, EMS, prevention, or training.',
      priorities: ['Company operations and tactical decision-making', 'Keep core skills current through short drills', 'Choose one or two areas for deeper development'],
      actions: [['/fireground-tools.html','Fireground tools'], ['/training.html','Company training']]
    },
    driver: {
      title: 'Driver / operator / engineer',
      summary: 'Develop apparatus placement, pump operations, hydraulics, water supply, and the judgment to move from a formula to a safe operational decision.',
      priorities: ['Pump pressure and friction-loss fluency', 'Water supply, FDC, relay and tender operations', 'Repeated scenario practice under realistic constraints'],
      actions: [['/driver-operator-practice.html','Driver/operator practice'], ['https://fireopscalc.com/','Open FireOpsCalc']]
    },
    officer: {
      title: 'Company officer',
      summary: 'Shift from performing tasks to setting priorities, communicating intent, developing firefighters, and building a company that performs consistently.',
      priorities: ['Size-up, command communication and crew accountability', 'Company training and member development', 'Preplans, documentation and after-action learning'],
      actions: [['/company-officer-tools.html','Officer tools'], ['/firefighter-drill-builder.html','Build a drill']]
    },
    instructor: {
      title: 'Instructor / training officer',
      summary: 'Build training that is practical, measurable, and easy for crews to use. Start with a clear objective, then add practice, feedback, and remediation.',
      priorities: ['Short structured company drills', 'Skills checkoffs and remediation', 'Scenario and printable material that instructors can reuse'],
      actions: [['/instructor-packs.html','Instructor resources'], ['/printable-scenarios.html','Printable drills']]
    },
    specialty: {
      title: 'Specialty / prevention / HazMat track',
      summary: 'Use FireOpsSim as a quick working toolbox while you build deeper specialty qualifications through your department and recognized training programs.',
      priorities: ['HazMat size-up, isolation and decon support', 'Inspection, occupancy and pre-incident planning', 'Role-specific continuing education and department procedures'],
      actions: [['/hazmat-tools.html','HazMat tools'], ['/fire-inspector-tools.html','Inspection tools']]
    },
    senior: {
      title: 'Senior firefighter / mentor / late-career member',
      summary: 'Keep your knowledge useful, protect career longevity, and pass experience to the next generation without letting years on the job replace continued learning.',
      priorities: ['Mentor and teach without taking over', 'Maintain health, mobility, sleep and recovery', 'Capture lessons through drills, preplans and instructor work'],
      actions: [['/firefighter-wellness.html','Wellness center'], ['/instructor-packs.html','Teach & mentor']]
    }
  };

  const render = (key, shouldScroll = false) => {
    const stage = stages[key] || stages.candidate;
    title.textContent = stage.title;
    summary.textContent = stage.summary;
    priorities.innerHTML = stage.priorities.map(item => `<li>${item}</li>`).join('');
    actions.innerHTML = stage.actions.map((item, index) => `<a class="button ${index === 0 ? 'primary' : 'secondary'}" href="${item[0]}">${item[1]}</a>`).join('');
    buttons.forEach(button => {
      const active = button.dataset.careerStage === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    try { localStorage.setItem('fireopsCareerStage', key); } catch (e) {}
    if (shouldScroll && window.matchMedia('(max-width: 640px)').matches) result.scrollIntoView({behavior:'smooth', block:'nearest'});
  };

  buttons.forEach(button => button.addEventListener('click', () => render(button.dataset.careerStage, true)));
  let saved = 'candidate';
  try { saved = localStorage.getItem('fireopsCareerStage') || 'candidate'; } catch (e) {}
  render(saved);
})();
