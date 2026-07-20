(function(){
  const INDEX_URL = '/scenarios/scenario-index.json';
  const SCENARIO_DIR = '/scenarios/';
  const STORAGE_KEY = 'fireopssim.dailyProgress.v1';
  const app = document.getElementById('dailyChallengeApp');
  const dateLabel = document.getElementById('dailyDate');
  const streakLabel = document.getElementById('dailyStreak');

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const number = (...values) => {
    for(const value of values){
      const parsed = Number(value);
      if(Number.isFinite(parsed)) return parsed;
    }
    return NaN;
  };
  const dateKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const todayKey = dateKey();

  function loadProgress(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch(e){ return {}; }
  }

  function saveProgress(progress){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch(e){ console.warn('Daily progress could not be saved.', e); }
  }

  function streak(progress){
    let total = 0;
    const cursor = new Date();
    cursor.setHours(12,0,0,0);
    if(!progress[dateKey(cursor)]?.correct) cursor.setDate(cursor.getDate()-1);
    while(progress[dateKey(cursor)]?.correct){
      total += 1;
      cursor.setDate(cursor.getDate()-1);
    }
    return total;
  }

  function dayNumber(){
    const now = new Date();
    const start = new Date(2026,0,1,12,0,0,0);
    const current = new Date(now.getFullYear(),now.getMonth(),now.getDate(),12,0,0,0);
    return Math.max(0, Math.floor((current-start)/86400000));
  }

  function getAnswer(problem, scenario){
    const answers = problem.answers || scenario.answers || {};
    const water = problem.waterSupplyAnswers || scenario.waterSupplyAnswers || {};
    const hydrant = problem.hydrantDropAnswers || scenario.hydrantDropAnswers || {};
    return number(problem.answerValue, problem.correctPP, answers.pumpPressure, answers.totalGpm, water.sustainedGpm, hydrant.additionalLines, scenario.answerValue, scenario.correctPP);
  }

  function details(scenario){
    const elements = scenario.sceneElements || {};
    const rows = [];
    (elements.hoses || []).forEach(h => {
      if(typeof h === 'string') rows.push(h);
      else rows.push([h.length || (h.lengthFt ? `${h.lengthFt}'` : ''), h.diameter || '', h.flowGpm ? `${h.flowGpm} GPM` : ''].filter(Boolean).join(' • '));
    });
    (elements.nozzles || []).forEach(n => {
      if(typeof n === 'string') rows.push(n);
      else rows.push([n.type || 'Nozzle', n.tip || '', n.flowGpm ? `${n.flowGpm} GPM` : '', n.nozzlePressure ? `@ ${n.nozzlePressure} PSI` : ''].filter(Boolean).join(' '));
    });
    (elements.appliances || []).forEach(a => rows.push(typeof a === 'string' ? a : (a.name || a.type || 'Appliance')));
    if(elements.elevation) rows.push(`Elevation: ${elements.elevation}`);
    return rows.filter(Boolean);
  }

  function overlays(list=[]){
    return list.map(item => `<span class="daily-overlay" style="--x:${number(item.x,50)}%;--y:${number(item.y,50)}%">${escapeHtml(item.text || item.label || '')}</span>`).join('');
  }

  function formatAnswer(value, unit){
    const rounded = Number.isInteger(value) ? value : Math.round(value*10)/10;
    return `${rounded}${unit ? ` ${unit}` : ''}`;
  }

  function updateSummary(progress){
    const count = streak(progress);
    dateLabel.textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date());
    streakLabel.textContent = `${count}-day streak`;
  }

  async function load(){
    try{
      const indexResponse = await fetch(INDEX_URL,{cache:'no-store'});
      if(!indexResponse.ok) throw new Error('Scenario index could not be loaded.');
      const indexData = await indexResponse.json();
      const items = Array.isArray(indexData) ? indexData : indexData.scenarios || [];
      if(!items.length) throw new Error('No daily challenge scenarios are available.');

      const day = dayNumber();
      const item = items[day % items.length];
      const scenarioResponse = await fetch(SCENARIO_DIR + item.file,{cache:'no-store'});
      if(!scenarioResponse.ok) throw new Error('Today’s scenario file could not be loaded.');
      const scenario = await scenarioResponse.json();
      const problems = Array.isArray(scenario.problems) && scenario.problems.length ? scenario.problems : [scenario];
      const problemNumber = Math.floor(day / items.length) % problems.length;
      const problem = problems[problemNumber];
      render(item,scenario,problem,problemNumber+1);
    } catch(error){
      app.innerHTML = `<div class="content-card"><h2>Challenge unavailable</h2><p>${escapeHtml(error.message)}</p><a class="button primary" href="/scenario-player.html">Open Scenario Player</a></div>`;
    }
  }

  function render(item,scenario,problem,problemNumber){
    const answer = getAnswer(problem,scenario);
    const tolerance = number(problem.tolerance,problem.answerTolerance,scenario.tolerance,5);
    const unit = problem.answerUnit || scenario.answerUnit || (String(scenario.category || '').includes('water') ? 'GPM' : 'PSI');
    const question = problem.question || problem.studentQuestion || scenario.question || scenario.scene?.description || 'Calculate the correct answer.';
    const formula = problem.formulaBreakdown || scenario.formulaBreakdown || [];
    const explanation = problem.instructorExplanation || scenario.instructorExplanation || '';
    const image = scenario.image ? SCENARIO_DIR + scenario.image : '';
    const progress = loadProgress();
    updateSummary(progress);

    app.innerHTML = `
      <article class="daily-scene-card">
        <div class="daily-scene-media">
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(problem.title || scenario.title || item.title)}" width="941" height="1672">${overlays(problem.overlays || scenario.overlays)}` : '<div class="daily-image-missing">Scenario image unavailable</div>'}
        </div>
      </article>
      <article class="daily-question-card">
        <div class="daily-chips"><span>${escapeHtml((item.difficulty || scenario.difficulty || 'practice').toUpperCase())}</span><span>Problem ${problemNumber}</span>${progress[todayKey]?.correct ? '<span class="complete-chip">✓ Completed</span>' : ''}</div>
        <h2>${escapeHtml(problem.title || scenario.title || item.title)}</h2>
        <p class="daily-question">${escapeHtml(question)}</p>
        <div class="daily-details">${(Array.isArray(problem.details) && problem.details.length ? problem.details : details(scenario)).map(row=>`<div>${escapeHtml(row)}</div>`).join('')}</div>
        <label for="dailyAnswer">${escapeHtml(problem.inputLabel || scenario.inputLabel || 'Your answer')}</label>
        <div class="daily-answer-row">
          <input id="dailyAnswer" type="number" inputmode="decimal" placeholder="${escapeHtml(problem.inputPlaceholder || scenario.inputPlaceholder || `Enter ${unit}`)}">
          <button id="checkDailyBtn" class="button primary" type="button">Check Answer</button>
        </div>
        <div class="daily-actions">
          <button id="showDailyBtn" class="button secondary" type="button">Show Answer</button>
          <a class="button secondary" href="/scenario-player.html?id=${encodeURIComponent(item.id || scenario.id)}&problem=${problemNumber}&daily=1&date=${todayKey}">Open Full Player</a>
        </div>
        <div id="dailyResult" class="daily-result" aria-live="polite"></div>
      </article>
    `;

    const input = document.getElementById('dailyAnswer');
    document.getElementById('checkDailyBtn').addEventListener('click',()=>showResult(false));
    document.getElementById('showDailyBtn').addEventListener('click',()=>showResult(true));
    input.addEventListener('keydown',event=>{ if(event.key==='Enter') showResult(false); });

    function showResult(force){
      const entered = Number(input.value);
      const answered = input.value !== '' && Number.isFinite(entered);
      const correct = answered && Number.isFinite(answer) && Math.abs(entered-answer) <= tolerance;
      const result = document.getElementById('dailyResult');
      const saved = loadProgress();

      if(!force && !answered){
        result.className='daily-result show bad';
        result.innerHTML='<strong>Enter an answer before checking.</strong>';
        return;
      }

      if(!force){
        const previous = saved[todayKey] || {attempts:0};
        saved[todayKey] = {...previous,attempts:(previous.attempts||0)+1,correct:Boolean(previous.correct || correct),scenario:item.id || scenario.id,problem:problemNumber,lastAttempt:new Date().toISOString()};
        saveProgress(saved);
        updateSummary(saved);
      }

      result.className=`daily-result show ${correct ? 'good' : 'bad'}`;
      const heading = force ? `Correct answer: ${formatAnswer(answer,unit)}` : (correct ? `Correct — ${formatAnswer(answer,unit)}` : `Not quite. Correct answer: ${formatAnswer(answer,unit)}`);
      result.innerHTML=`
        <h3>${escapeHtml(heading)}</h3>
        ${!force ? `<p>Your answer: <strong>${escapeHtml(formatAnswer(entered,unit))}</strong>${tolerance ? ` • tolerance ±${tolerance} ${escapeHtml(unit)}` : ''}</p>` : ''}
        ${explanation ? `<p>${escapeHtml(explanation)}</p>` : ''}
        <div class="daily-math">${formula.map(line=>`<div>${escapeHtml(line)}</div>`).join('')}</div>
        <div class="daily-actions"><button id="shareDailyBtn" class="button secondary" type="button">Share Challenge Result</button><span id="dailyShareStatus" aria-live="polite"></span></div>
      `;
      if(correct && !document.querySelector('.daily-chips .complete-chip')) document.querySelector('.daily-chips')?.insertAdjacentHTML('beforeend','<span class="complete-chip">✓ Completed</span>');
      document.getElementById('shareDailyBtn').addEventListener('click',async()=>{
        const outcome = force ? 'reviewed' : (correct ? 'answered correctly' : 'completed');
        const text=`I ${outcome} today’s FireOpsSim Daily Fire Pump Challenge. Try it at ${location.origin}/daily-challenge.html`;
        const status=document.getElementById('dailyShareStatus');
        try{
          if(navigator.share){ await navigator.share({title:'FireOpsSim Daily Challenge',text,url:`${location.origin}/daily-challenge.html`}); status.textContent='Shared'; }
          else { await navigator.clipboard.writeText(text); status.textContent='Result copied'; }
        } catch(error){ if(error?.name!=='AbortError') status.textContent='Unable to share'; }
      });
    }
  }

  updateSummary(loadProgress());
  load();
})();
