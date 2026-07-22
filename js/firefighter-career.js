(() => {
  'use strict';

  const init = () => {

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
  };

  // Candidate readiness tracker
  const checklist = document.querySelectorAll('[data-readiness]');
  const readinessBar = document.getElementById('readinessBar');
  const readinessPercent = document.getElementById('readinessPercent');
  const readinessMessage = document.getElementById('readinessMessage');
  const savedReadiness = storage.get('fireopsCandidateReadiness', {});

  const updateReadiness = () => {
    const state = {};
    checklist.forEach((box) => { state[box.dataset.readiness] = box.checked; });
    storage.set('fireopsCandidateReadiness', state);
    const complete = Object.values(state).filter(Boolean).length;
    const percent = Math.round((complete / checklist.length) * 100) || 0;
    if (readinessBar) readinessBar.style.width = `${percent}%`;
    if (readinessPercent) readinessPercent.textContent = `${percent}%`;
    if (readinessMessage) {
      if (percent === 100) readinessMessage.textContent = 'Your preparation system is in place. Keep it current and tailor it to each posting.';
      else if (percent >= 70) readinessMessage.textContent = 'Strong progress. Focus next on the unchecked items and department-specific details.';
      else if (percent >= 40) readinessMessage.textContent = 'You have momentum. Add a weekly routine for fitness, testing, and job checks.';
      else readinessMessage.textContent = 'Start by researching two departments you may want to serve.';
    }
  };

  checklist.forEach((box) => {
    box.checked = Boolean(savedReadiness[box.dataset.readiness]);
    box.addEventListener('change', updateReadiness);
  });
  updateReadiness();

  document.getElementById('resetReadiness')?.addEventListener('click', () => {
    checklist.forEach((box) => { box.checked = false; });
    storage.remove('fireopsCandidateReadiness');
    updateReadiness();
  });

  // Original candidate practice quiz
  const questions = [
    {
      type: 'Applied math',
      question: 'A crew rotates a physically demanding assignment every 2 minutes. How many complete work periods occur in 12 minutes?',
      options: ['4', '5', '6', '8'], answer: 2,
      explanation: '12 minutes ÷ 2 minutes per period = 6 complete periods.'
    },
    {
      type: 'Reading comprehension',
      question: 'An instruction says: “Inspect the tool before use, remove it from service if damaged, and report the defect.” What should happen first?',
      options: ['Report the defect', 'Inspect the tool', 'Use the tool carefully', 'Remove every tool from service'], answer: 1,
      explanation: 'The stated sequence begins with inspecting the tool before use.'
    },
    {
      type: 'Mechanical reasoning',
      question: 'Two external gears are touching. If the first gear turns clockwise, which direction does the second gear turn?',
      options: ['Clockwise', 'Counterclockwise', 'It does not move', 'The direction cannot be known'], answer: 1,
      explanation: 'Two meshed external gears rotate in opposite directions.'
    },
    {
      type: 'Applied math',
      question: 'A 40-pound item is divided evenly between two carriers. Ignoring the weight of the carrier device, how much load does each person support?',
      options: ['10 pounds', '20 pounds', '30 pounds', '40 pounds'], answer: 1,
      explanation: '40 pounds ÷ 2 carriers = 20 pounds each.'
    },
    {
      type: 'Situational judgment',
      question: 'During training, you notice a teammate is about to use equipment in a way that could injure someone. What is the best immediate response?',
      options: ['Say nothing unless an injury occurs', 'Stop the unsafe action and alert the instructor', 'Wait until the end of training', 'Record it privately but do not intervene'], answer: 1,
      explanation: 'Immediate, respectful intervention protects the team and allows the instructor to correct the hazard.'
    },
    {
      type: 'Observation',
      question: 'A sequence is listed as: gloves, helmet, coat, boots. Which item is third?',
      options: ['Gloves', 'Helmet', 'Coat', 'Boots'], answer: 2,
      explanation: 'The third item in the sequence is coat.'
    },
    {
      type: 'Applied math',
      question: 'A candidate completes 18 of 24 practice questions correctly. What percentage is correct?',
      options: ['65%', '70%', '75%', '80%'], answer: 2,
      explanation: '18 ÷ 24 = 0.75, or 75%.'
    },
    {
      type: 'Workplace judgment',
      question: 'You make an error in a team assignment that creates extra work but causes no injury. What is the strongest response?',
      options: ['Hide the error and quietly fix what you can', 'Blame unclear instructions', 'Own the error, notify the team, help correct it, and explain how you will prevent it', 'Wait to see whether anyone notices'], answer: 2,
      explanation: 'Accountability includes prompt disclosure, correction, and a prevention plan.'
    }
  ];

  let quizIndex = 0;
  let quizScore = 0;
  let answered = false;
  const quizType = document.getElementById('quizType');
  const quizQuestion = document.getElementById('quizQuestion');
  const quizOptions = document.getElementById('quizOptions');
  const quizFeedback = document.getElementById('quizFeedback');
  const quizProgress = document.getElementById('quizProgress');
  const quizNext = document.getElementById('quizNext');
  const quizArea = document.getElementById('quizQuestionArea');
  const quizResults = document.getElementById('quizResults');

  const renderQuestion = () => {
    answered = false;
    const item = questions[quizIndex];
    if (!item || !quizOptions) return;
    quizProgress.textContent = `Question ${quizIndex + 1} of ${questions.length}`;
    quizType.textContent = item.type;
    quizQuestion.textContent = item.question;
    quizFeedback.textContent = '';
    quizFeedback.className = 'quiz-feedback';
    quizNext.disabled = true;
    quizNext.textContent = quizIndex === questions.length - 1 ? 'See results' : 'Next question';
    quizOptions.innerHTML = '';
    item.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-option';
      button.textContent = option;
      button.addEventListener('click', () => answerQuestion(index, button));
      quizOptions.appendChild(button);
    });
  };

  const answerQuestion = (choice, selectedButton) => {
    if (answered) return;
    answered = true;
    const item = questions[quizIndex];
    const optionButtons = [...quizOptions.querySelectorAll('button')];
    optionButtons.forEach((button, index) => {
      button.disabled = true;
      if (index === item.answer) button.classList.add('correct');
    });
    if (choice === item.answer) {
      quizScore += 1;
      selectedButton.classList.add('correct');
      quizFeedback.textContent = `Correct. ${item.explanation}`;
      quizFeedback.classList.add('good');
    } else {
      selectedButton.classList.add('incorrect');
      quizFeedback.textContent = `Review: ${item.explanation}`;
      quizFeedback.classList.add('bad');
    }
    quizNext.disabled = false;
  };

  const showResults = () => {
    quizArea.hidden = true;
    quizResults.hidden = false;
    document.getElementById('quizScore').textContent = `${quizScore}/${questions.length}`;
    const message = quizScore >= 7
      ? 'Strong general-practice result. Keep working with the exact guide for your assigned exam.'
      : quizScore >= 5
        ? 'Good foundation. Review the explanations and practice the areas that slowed you down.'
        : 'Use this as a baseline. Build reading, math, mechanical, and judgment practice into your weekly routine.';
    document.getElementById('quizResultMessage').textContent = message;
  };

  quizNext?.addEventListener('click', () => {
    if (!answered) return;
    if (quizIndex < questions.length - 1) {
      quizIndex += 1;
      renderQuestion();
    } else {
      showResults();
    }
  });

  document.getElementById('quizRestart')?.addEventListener('click', () => {
    quizIndex = 0;
    quizScore = 0;
    quizResults.hidden = true;
    quizArea.hidden = false;
    renderQuestion();
  });
  renderQuestion();

  // Interview question generator and STAR planner
  const interviewQuestions = [
    { text: 'Why do you want to be a firefighter with this department?', tags: ['Motivation', 'Department fit'] },
    { text: 'Tell us about a time you received difficult feedback. What did you do with it?', tags: ['Growth', 'Accountability'] },
    { text: 'Describe a conflict with a teammate and how you handled it.', tags: ['Teamwork', 'Communication'] },
    { text: 'Tell us about a mistake you made that affected others.', tags: ['Integrity', 'Learning'] },
    { text: 'Describe a time you stayed effective during a stressful situation.', tags: ['Composure', 'Judgment'] },
    { text: 'What have you done during the past year to prepare for this career?', tags: ['Preparation', 'Commitment'] },
    { text: 'How would you respond if a senior member asked you to do something you believed was unsafe?', tags: ['Safety', 'Communication'] },
    { text: 'Tell us about a time you served someone whose background or perspective differed from yours.', tags: ['Service', 'Respect'] },
    { text: 'Describe a time you had to learn a difficult skill.', tags: ['Learning', 'Persistence'] },
    { text: 'What does integrity look like when no one is watching?', tags: ['Integrity', 'Character'] },
    { text: 'Tell us about a time the team chose a plan you disagreed with.', tags: ['Teamwork', 'Adaptability'] },
    { text: 'What is one weakness you are actively improving, and what is your plan?', tags: ['Self-awareness', 'Growth'] },
    { text: 'How would you earn trust during your probationary year?', tags: ['Probation', 'Work ethic'] },
    { text: 'Describe a time you recognized a safety problem before others did.', tags: ['Situational awareness', 'Safety'] },
    { text: 'What role does EMS play in the modern fire service?', tags: ['Fire service awareness', 'EMS'] },
    { text: 'How would you handle a frustrated member of the public who is speaking angrily to you?', tags: ['Customer service', 'Composure'] },
    { text: 'Tell us about a long-term goal that required consistent effort.', tags: ['Discipline', 'Resilience'] },
    { text: 'What did you learn about our community and department while preparing for this interview?', tags: ['Research', 'Department fit'] }
  ];
  let lastInterviewIndex = 0;
  const interviewQuestion = document.getElementById('interviewQuestion');
  const interviewTags = document.getElementById('interviewTags');
  document.getElementById('newInterviewQuestion')?.addEventListener('click', () => {
    let next = lastInterviewIndex;
    while (next === lastInterviewIndex && interviewQuestions.length > 1) next = Math.floor(Math.random() * interviewQuestions.length);
    lastInterviewIndex = next;
    const item = interviewQuestions[next];
    interviewQuestion.textContent = item.text;
    interviewTags.innerHTML = item.tags.map((tag) => `<span>${tag}</span>`).join('');
  });

  const starFields = ['starSituation', 'starTask', 'starAction', 'starResult'];
  const savedStar = storage.get('fireopsStarPlanner', {});
  starFields.forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    field.value = savedStar[id] || '';
    field.addEventListener('input', () => {
      const data = {};
      starFields.forEach((fieldId) => { data[fieldId] = document.getElementById(fieldId)?.value || ''; });
      storage.set('fireopsStarPlanner', data);
      const status = document.getElementById('starSaveStatus');
      if (status) {
        status.textContent = 'Saved locally';
        status.classList.add('saved-pulse');
        window.setTimeout(() => status.classList.remove('saved-pulse'), 400);
      }
    });
  });
  document.getElementById('clearStar')?.addEventListener('click', () => {
    starFields.forEach((id) => { const field = document.getElementById(id); if (field) field.value = ''; });
    storage.remove('fireopsStarPlanner');
  });

  // Location-based department and job search links
  const departmentInput = document.getElementById('departmentLocation');
  const jobInput = document.getElementById('jobLocation');
  const savedLocation = storage.get('fireopsCandidateLocation', '');
  if (departmentInput) departmentInput.value = savedLocation;
  if (jobInput) jobInput.value = savedLocation;

  const rememberLocation = (value) => {
    const clean = value.trim();
    if (clean) storage.set('fireopsCandidateLocation', clean);
    return clean;
  };
  const openSearch = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  const requireLocation = (input) => {
    const value = rememberLocation(input?.value || '');
    if (!value) {
      input?.focus();
      input?.setCustomValidity('Enter a city, state, ZIP code, or county.');
      input?.reportValidity();
      input?.setCustomValidity('');
      return '';
    }
    return value;
  };

  document.getElementById('departmentLocatorForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const location = requireLocation(departmentInput);
    if (!location) return;
    openSearch(`https://www.google.com/maps/search/${encodeURIComponent(`fire departments near ${location}`)}`);
    if (jobInput && !jobInput.value) jobInput.value = location;
  });

  document.getElementById('departmentCareerSearch')?.addEventListener('click', () => {
    const location = requireLocation(departmentInput);
    if (!location) return;
    openSearch(`https://www.google.com/search?q=${encodeURIComponent(`site:.gov fire department firefighter careers hiring ${location}`)}`);
  });

  document.getElementById('volunteerSearch')?.addEventListener('click', () => {
    const location = requireLocation(departmentInput);
    if (!location) return;
    openSearch(`https://www.google.com/search?q=${encodeURIComponent(`volunteer firefighter opportunities ${location}`)}`);
  });

  const updateJobLinks = () => {
    const location = rememberLocation(jobInput?.value || departmentInput?.value || '');
    const role = document.getElementById('jobRole')?.value || 'firefighter';
    const gov = document.getElementById('governmentJobsLink');
    const usa = document.getElementById('usaJobsLink');
    const official = document.getElementById('officialCareerLink');
    if (gov) gov.href = `https://www.governmentjobs.com/jobs?keyword=${encodeURIComponent(role)}${location ? `&location=${encodeURIComponent(location)}` : ''}`;
    if (usa) usa.href = `https://www.usajobs.gov/Search/Results?k=${encodeURIComponent(role)}${location ? `&l=${encodeURIComponent(location)}` : ''}`;
    if (official) official.href = `https://www.google.com/search?q=${encodeURIComponent(`site:.gov ${role} careers hiring ${location}`)}`;
  };
  jobInput?.addEventListener('input', updateJobLinks);
  document.getElementById('jobRole')?.addEventListener('change', updateJobLinks);
  updateJobLinks();

  document.getElementById('jobSearchForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const location = requireLocation(jobInput);
    if (!location) return;
    const role = document.getElementById('jobRole')?.value || 'firefighter';
    if (departmentInput && !departmentInput.value) departmentInput.value = location;
    updateJobLinks();
    openSearch(`https://www.google.com/search?q=${encodeURIComponent(`${role} jobs hiring ${location}`)}`);
  });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
