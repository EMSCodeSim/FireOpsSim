(() => {
  'use strict';

  const storageKey = 'fireopsDailyWellness';
  const today = new Date().toLocaleDateString('en-CA');
  const boxes = [...document.querySelectorAll('[data-wellness]')];
  const bar = document.getElementById('wellnessBar');
  const percentLabel = document.getElementById('wellnessPercent');
  const message = document.getElementById('wellnessMessage');

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved.date === today && saved.items ? saved.items : {};
    } catch (_) {
      return {};
    }
  };

  const writeState = (items) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ date: today, items }));
    } catch (_) {}
  };

  const update = () => {
    const items = {};
    boxes.forEach((box) => { items[box.dataset.wellness] = box.checked; });
    writeState(items);
    const completed = Object.values(items).filter(Boolean).length;
    const percent = boxes.length ? Math.round((completed / boxes.length) * 100) : 0;
    if (bar) bar.style.width = `${percent}%`;
    if (percentLabel) percentLabel.textContent = `${percent}%`;
    if (message) {
      if (percent === 100) message.textContent = 'You completed all seven actions. Protect the routines that made this possible.';
      else if (percent >= 70) message.textContent = 'Strong day. Choose one remaining action that supports recovery.';
      else if (percent >= 40) message.textContent = 'Good progress. Small repeatable actions matter more than a perfect day.';
      else message.textContent = 'Choose one realistic action to begin.';
    }
  };

  const saved = readState();
  boxes.forEach((box) => {
    box.checked = Boolean(saved[box.dataset.wellness]);
    box.addEventListener('change', update);
  });

  document.getElementById('resetWellness')?.addEventListener('click', () => {
    boxes.forEach((box) => { box.checked = false; });
    update();
  });

  update();
})();
