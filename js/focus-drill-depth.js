(function(){
  if(!/\/focus-drills(?:\.html)?\/?$/.test(location.pathname)) return;

  const esc=(v)=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const deepModules=[
    {
      keys:['attack line','hose','nozzle','advancement'],
      label:'Attack Line Deployment & Advancement',
      objective:'Deploy, charge, advance and operate an attack line while maintaining crew integrity, communication, hose management and nozzle control.',
      setup:['Engine or hosebed with department attack line and nozzle','PPE/SCBA and radios as appropriate','Mark an entry point and create at least one turn, doorway or hose pinch point','Assign nozzle, backup/door and officer/instructor roles'],
      safety:['Use department-approved hose/nozzle practices and training pressure','Establish stop signal before charging or moving the line','No live-fire component unless conducted under the department’s approved live-fire program'],
      scenario:'First-due engine to a single-story residence with smoke showing from Division 1. The officer orders an interior attack through Side Alpha toward a reported rear-bedroom fire.',
      evolution:['Estimate stretch and pull enough hose for the objective.','Stage the line to minimize piles, sharp turns and pinch points.','Communicate readiness, request water and confirm a usable stream.','Advance as a crew while managing corners and hose behind the nozzle.','Flow/move according to department procedure and conditions.','Stop, communicate and correct loss of water, crew separation or an unsafe condition.'],
      injects:['Hose catches at a doorway or exterior corner.','A significant kink reduces flow.','A simulated victim is encountered during advancement.','Nozzle firefighter reports low air or a water-supply interruption occurs.'],
      evaluate:['Stretch matched the objective','Water call and communications were clear','Kinks/pinch points were identified and corrected','Nozzle remained controlled during movement','Crew integrity was maintained','Inject was recognized and handled appropriately'],
      misses:['Pulling too little hose','Charging before excess hose is positioned','Ignoring hose behind the nozzle team','Continuing advancement after loss of effective flow'],
      aar:['Where did the stretch lose time?','Where did the hose bind or become difficult to move?','Did the crew anticipate problems or only react to them?','What one change will make the next rep cleaner?'],
      second:'Change the entry point, add a stair/turn/door obstacle and introduce the complication earlier.'
    },
    {
      keys:['primary search','search'],label:'Primary Search',
      objective:'Conduct a fast, oriented primary search while maintaining crew integrity, communications, air awareness and victim priorities.',
      setup:['Darkened or obscured training area','Search rope/thermal imager only if used by department','Victim manikin or marked victim location','Radio traffic plan and clear stop signal'],
      safety:['Use non-toxic visibility reduction only','Identify stairs, holes, sharp edges and entanglement hazards before starting','Maintain instructor access to stop the evolution immediately'],
      scenario:'Working residential fire with one occupant unaccounted for. Search team enters from Side Alpha while the attack crew advances toward the reported fire area.',
      evolution:['State team roles, search method and orientation plan.','Enter and maintain a reliable reference/orientation method.','Search likely victim areas efficiently while monitoring conditions.','Communicate meaningful landmarks and progress.','Locate, package and remove the victim while maintaining team integrity.','Transmit result and exit status.'],
      injects:['Closed bedroom door with changing heat/smoke conditions.','Victim found in a low-visibility room.','Search member loses contact with the anchor/reference.','Command reports a changing fire location.'],
      evaluate:['Orientation maintained','Likely victim spaces prioritized','Communications were concise and useful','Victim handling was controlled','Air/condition awareness was demonstrated','Crew exited together'],
      misses:['Searching without a clear orientation method','Skipping behind doors/bed areas','Poor progress reports','Losing team contact during victim removal'],
      aar:['Where was orientation most likely to fail?','What clue changed your victim priority?','Was the search systematic without becoming slow?','What radio report would command actually need?'],
      second:'Change the floor plan or victim location and require a radio update before removal.'
    },
    {
      keys:['ground ladder','ladder'],label:'Ground Ladder Operations',
      objective:'Select, carry, raise, place and secure the correct ladder for the assigned objective using coordinated commands and safe positioning.',
      setup:['Department ground ladder(s)','Marked target window/roof edge','Defined carry path and apparatus start point','Spotter/instructor'],
      safety:['Check overhead electrical hazards and footing','Use department lifting/raising practices','Keep non-participants clear of fall and swing zones'],
      scenario:'Crew is assigned to place a ground ladder for second-floor rescue or firefighter egress on Side C.',
      evolution:['Confirm objective and choose ladder length/type.','Remove and carry using clear crew commands.','Position butt and identify overhead/ground hazards.','Raise and extend under control.','Set climbing angle and tip placement for the objective.','Secure/foot as required and report ready.'],
      injects:['Initial placement is blocked by an obstacle.','Objective changes from roof access to rescue.','Reduced staffing requires a modified raise.','Uneven ground forces repositioning.'],
      evaluate:['Correct ladder selected','Commands were clear','Overhead hazards checked','Raise remained controlled','Angle and tip placement matched objective','Crew adapted without unsafe shortcuts'],
      misses:['Choosing ladder before confirming objective','Failing to look overhead','Poor heel control','Using rescue placement for roof access or vice versa'],
      aar:['Was the first ladder choice correct?','Where did communication break down?','Would the placement work under smoke/fire conditions?','What made the raise slower than it needed to be?'],
      second:'Repeat with reduced staffing or a different ladder/objective.'
    },
    {
      keys:['forcible entry','force entry'],label:'Forcible Entry',
      objective:'Assess a secured door, select an appropriate technique, force entry efficiently and control the door for interior operations.',
      setup:['Approved forcible-entry prop','Halligan/flat-head axe or department tools','PPE and eye protection','Assigned irons positions'],
      safety:['Use only approved training props','Maintain striking-tool spacing and eye protection','Stop for damaged tools, unsafe footing or uncontrolled rebound'],
      scenario:'Engine company needs access through a secured door while smoke conditions are worsening and the attack crew is waiting for entry.',
      evolution:['Read door swing, hinges, lock area and construction.','Select technique and assign tool positions.','Gap/set/force or use the department-approved method.','Communicate each striking/forcing action.','Defeat the lock/door and maintain control of the opening.','Transition tools and report access.'],
      injects:['Tool placement slips on the first attempt.','Door construction differs from the initial assumption.','Command orders the door controlled after entry.','Limited space changes firefighter positions.'],
      evaluate:['Door was read before forcing','Technique matched construction','Tool placement was effective','Strikes were coordinated','Door was controlled after defeat','Crew changed tactics when first method failed'],
      misses:['Blindly attacking the lock area','Poor tool angle','Standing in the striking arc','Forcing the door then abandoning control'],
      aar:['What did the door tell you before the first strike?','When should you abandon the first technique?','Did body position help or hurt tool effectiveness?','How did door control affect interior conditions?'],
      second:'Change door type or require the crew to explain tool choice before starting.'
    },
    {
      keys:['ventilation','vent'],label:'Coordinated Ventilation',
      objective:'Select and execute a ventilation action that supports the tactical objective and is coordinated with fire attack.',
      setup:['Building/roof/window prop or tabletop layout','Radio communications with simulated attack crew','Wind direction indicator or instructor cue','Department ventilation tools as appropriate'],
      safety:['No roof operations unless conducted under department training policy','Identify collapse/fall/glass hazards','Ventilation action must be coordinated, not automatic'],
      scenario:'Interior crew is advancing toward a bedroom fire with worsening heat and visibility. Command assigns your crew to coordinate ventilation.',
      evolution:['Identify the tactical ventilation objective.','Read wind, fire location, openings and likely flow path.','Confirm timing with command/attack crew.','Choose the opening/action that best supports the objective.','Execute while maintaining safe position.','Immediately reassess effects and communicate results.'],
      injects:['Attack crew is delayed.','Wind direction becomes unfavorable.','Planned opening is inaccessible.','Conditions worsen immediately after opening.'],
      evaluate:['Ventilation objective stated','Flow-path effects considered','Timing coordinated with attack','Opening/action matched objective','Crew reassessed after ventilation','Change in conditions was communicated'],
      misses:['Ventilating because “that is what we do”','Opening too early','Ignoring wind','Failing to evaluate the result'],
      aar:['What was the objective of the opening?','What would happen if the attack line were delayed?','Did wind change the preferred opening?','What condition would make you stop or reverse the plan?'],
      second:'Repeat with changed wind direction or delayed water application.'
    },
    {
      keys:['hydrant','water supply','supply line'],label:'Hydrant & Water Supply',
      objective:'Establish and maintain a reliable water supply while communicating readiness, limitations and changing demand.',
      setup:['Hydrant or approved training connection','Supply hose and adapters carried by department','Engine/operator and hydrant member roles','Simulated initial tank-water operation'],
      safety:['Control hose movement and traffic exposure','Use department hydrant/valve procedures','Do not exceed equipment or system pressure limits'],
      scenario:'First-due engine is operating on tank water at a working residential fire. Your assignment is to establish a sustained hydrant supply.',
      evolution:['Identify hydrant and plan apparatus/hose placement.','Deploy and connect supply line with required adapters.','Prepare hydrant and confirm communication with pump operator.','Charge supply using department procedure.','Check supply path, intake and leaks/kinks.','Communicate available supply and adjust as demand changes.'],
      injects:['Hydrant is partially obstructed.','Supply hose develops a kink.','Hydrant flow is weaker than expected.','A second attack line increases demand.'],
      evaluate:['Connection was efficient','Hydrant opened/operated correctly','Communication was clear','Restrictions identified','Operator recognized supply limitations','Crew adapted to higher demand'],
      misses:['Opening before operator is ready','Ignoring kinked/soft supply','Assuming hydrant can meet any demand','Poor apparatus positioning'],
      aar:['How long were crews dependent on tank water?','What indicated a weak supply?','What changes when a second line is added?','Where could the supply line become vulnerable?'],
      second:'Repeat with a different hydrant location or higher simulated demand.'
    },
    {
      keys:['pump discharge','pump operations','pump','pdp'],label:'Pump Operations / PDP',
      objective:'Calculate, set and maintain appropriate pump discharge pressure while recognizing changes in intake, discharge and fire-flow demand.',
      setup:['Engine/pump panel or approved simulator','Department hose/nozzle configuration','Known friction-loss/elevation/appliance values','Operator and attack-crew communication'],
      safety:['Use department pump operating procedures','Avoid rapid pressure changes','Stay within hose/nozzle/apparatus pressure limits'],
      scenario:'Engine is supplying an attack line at a working structure fire. Establish the correct pump discharge pressure and maintain the line as conditions change.',
      evolution:['Identify nozzle pressure, hose length/diameter, flow and appliances/elevation.','State the PDP calculation before setting the pump.','Engage/set pump and slowly establish target pressure.','Confirm stream/crew feedback.','Monitor intake/discharge as demand changes.','Diagnose and correct the cause of abnormal pressure/flow.'],
      injects:['Nozzle or line configuration changes.','Intake pressure drops.','A second discharge opens.','Crew reports inadequate stream or excessive pressure.'],
      evaluate:['Initial calculation was correct','Pressure established smoothly','Intake monitored','Change in demand recognized','Problem was diagnosed rather than guessed','Crew communication was effective'],
      misses:['Memorizing a pressure without checking configuration','Chasing discharge gauge only','Ignoring falling intake','Making abrupt throttle changes'],
      aar:['What part of the PDP changed during the evolution?','What clue distinguished supply problem from discharge problem?','What would the nozzle team feel?','What should be communicated before changing pressure?'],
      second:'Repeat with an appliance, elevation change or second line.'
    },
    {
      keys:['standpipe'],label:'Standpipe Operations',
      objective:'Establish a standpipe hose line from the department-approved connection point and prepare for a controlled advance with correct pressure and hose deployment.',
      setup:['Standpipe prop/outlet or tabletop mockup','Department high-rise hose/nozzle package','Adapters, gate valve, pressure gauge as carried','Stairwell/floor layout'],
      safety:['Follow department standpipe connection policy','Control charged hose on stairs/landings','Do not use unverified building systems for live flow training without approval'],
      scenario:'Crew is assigned to advance from a standpipe for a reported fire above grade. Establish the line and prepare to advance.',
      evolution:['Confirm fire floor and department connection-floor policy.','Inspect outlet and remove cap safely.','Flush/check outlet if procedure requires.','Attach valve/gauge/hose package.','Flake hose on landing/stairwell for advancement.','Request water, confirm pressure/stream and communicate problems.'],
      injects:['Outlet cap is difficult to remove.','Pressure is inadequate.','Debris/damaged outlet affects connection.','Fire location changes one floor.'],
      evaluate:['Correct connection point selected','Outlet checked appropriately','Hose deployed without blocking stairs','Pressure problem recognized','Communication with command/operator was clear','Crew adapted to changed fire location'],
      misses:['Connecting on wrong floor','Failing to inspect outlet','Charging before hose is positioned','Ignoring inadequate pressure'],
      aar:['Why was that connection floor chosen?','What indicates an unreliable outlet?','Where should excess hose be staged?','What is your action if pressure remains inadequate?'],
      second:'Repeat with a different floor layout or simulated low-pressure problem.'
    },
    {
      keys:['mayday','rit','rapid intervention'],label:'Mayday / RIT',
      objective:'Recognize a firefighter emergency early, transmit a clear mayday and perform disciplined initial self-survival/RIT actions.',
      setup:['Radios on training channel','SCBA/PPE as appropriate','Simple obscured/entanglement or tabletop scenario','RIT tool cache or representative tools'],
      safety:['Use breakaway/non-hazardous entanglement props only','Instructor maintains immediate access to participant','No breath-hold or panic-inducing drills'],
      scenario:'A firefighter becomes disoriented, trapped or separated during interior operations. Run the mayday communication and initial rescue response according to department procedure.',
      evolution:['Recognize and declare the emergency early.','Transmit location/unit/name/problem/resources using department format.','Activate emergency alert if department procedure calls for it.','Control breathing, maintain orientation and attempt appropriate self-rescue.','RIT receives assignment, confirms tools/access and deploys.','Provide progress updates and coordinate removal.'],
      injects:['Radio traffic is congested.','Location information is incomplete.','Air supply is rapidly decreasing.','Conditions force a different rescue access point.'],
      evaluate:['Mayday declared without delay','Message contained usable location/problem info','Self-survival actions were disciplined','Command/RIT communication remained clear','RIT chose appropriate access/tools','Rescue progress was reported'],
      misses:['Waiting too long to call mayday','Giving a long, unusable radio message','Moving without preserving orientation','RIT entering without a defined assignment'],
      aar:['What was the first cue that should trigger a mayday?','What information mattered most to rescuers?','What action conserved the most air/time?','What would make RIT change access?'],
      second:'Repeat with less location information and a different access point.'
    },
    {
      keys:['officer','size up','initial company','command'],label:'Initial Company Officer Operations',
      objective:'Deliver a concise arrival report, select an initial strategy, establish priorities and assign arriving resources while continuously reassessing conditions.',
      setup:['Photo/video/building diagram or tabletop scenario','Radio or verbal command channel','Resource cards for arriving companies','Instructor inject list'],
      safety:['Tabletop/decision drill unless conducted under an approved practical evolution','Use local command terminology and SOP/SOGs','Clearly separate training decisions from actual incident policy'],
      scenario:'You arrive first-due to a working structure fire with incomplete occupant information and visible smoke/fire conditions. Give the initial report, establish priorities and assign the first arriving resources.',
      evolution:['Give arrival report with conditions/building/obvious life hazard.','Declare command mode and initial strategy.','State the first tactical objective.','Assign first-arriving companies with clear task/location/objective.','Identify water supply and additional-resource needs.','Reassess after each inject and communicate strategy changes.'],
      injects:['Occupant reports someone trapped.','Water supply is delayed.','Fire conditions worsen after first assignment.','An exposure or second hazard appears.'],
      evaluate:['Arrival report was concise','Strategy matched conditions/resources','Assignments had clear objectives','Life hazard was prioritized','Resource needs anticipated','Strategy changed when conditions required'],
      misses:['Giving a long windshield report','Assigning tasks without locations/objectives','Failing to reserve resources for predictable needs','Sticking with original plan after conditions change'],
      aar:['What was your first decision and why?','What information was missing but important?','Which assignment had the highest leverage?','What inject should have changed your strategy?'],
      second:'Repeat with fewer initial resources or conflicting life-safety information.'
    }
  ];

  function matchModule(text){
    const hay=String(text||'').toLowerCase();
    return deepModules.find(m=>m.keys.some(k=>hay.includes(k)))||null;
  }

  function installStyles(){
    if(document.getElementById('fosDeepDrillStyles')) return;
    const style=document.createElement('style'); style.id='fosDeepDrillStyles';
    style.textContent=`
      .deep-training-module{margin:1rem 0;background:#111820;color:#fff;border-radius:16px;padding:1rem}
      .deep-training-module p{color:#dce5e9}
      .deep-training-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
      .deep-training-card{background:#182630;border:1px solid #31434d;border-radius:12px;padding:.9rem}
      .deep-training-card h3{margin:.1rem 0 .5rem;color:#fff}
      .deep-training-card ul,.deep-training-card ol{margin:.25rem 0;padding-left:1.25rem}
      .deep-training-card li{margin:.35rem 0;color:#edf3f5}
      .deep-training-tag{display:inline-flex;align-items:center;border-radius:999px;background:#c9362b;color:#fff;font-size:.75rem;font-weight:900;padding:.3rem .55rem;text-transform:uppercase}
      .deep-training-wide{grid-column:1/-1}
      @media(max-width:800px){.deep-training-grid{grid-template-columns:1fr}.deep-training-wide{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function list(items,ordered){return `<${ordered?'ol':'ul'}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${ordered?'ol':'ul'}>`}

  function renderDepth(){
    const runner=document.getElementById('runDrill');
    const titleEl=document.getElementById('runTitle');
    if(!runner||!titleEl||!titleEl.textContent.trim()) return;
    const title=titleEl.textContent.trim();
    const mod=matchModule(title);
    const existing=runner.querySelector('.deep-training-module');
    if(!mod){ if(existing) existing.remove(); return; }
    if(existing&&existing.dataset.module===mod.label) return;
    if(existing) existing.remove();
    const section=document.createElement('section');
    section.className='deep-training-module'; section.dataset.module=mod.label;
    section.innerHTML=`
      <span class="deep-training-tag">Expanded training module</span>
      <h2>${esc(mod.label)}</h2>
      <p><strong>Objective:</strong> ${esc(mod.objective)}</p>
      <div class="deep-training-grid">
        <div class="deep-training-card"><h3>Equipment & setup</h3>${list(mod.setup)}</div>
        <div class="deep-training-card"><h3>Safety / stop conditions</h3>${list(mod.safety)}</div>
        <div class="deep-training-card deep-training-wide"><h3>Scenario</h3><p>${esc(mod.scenario)}</p></div>
        <div class="deep-training-card"><h3>Run the evolution</h3>${list(mod.evolution,true)}</div>
        <div class="deep-training-card"><h3>Instructor injects</h3>${list(mod.injects)}</div>
        <div class="deep-training-card"><h3>Evaluator checklist</h3>${list(mod.evaluate)}</div>
        <div class="deep-training-card"><h3>Common misses / coaching</h3>${list(mod.misses)}</div>
        <div class="deep-training-card"><h3>AAR questions</h3>${list(mod.aar)}</div>
        <div class="deep-training-card"><h3>Second rep — make it harder</h3><p>${esc(mod.second)}</p></div>
      </div>`;
    const actions=runner.querySelector('.fd-actions');
    if(actions) actions.before(section); else runner.appendChild(section);
  }

  function tagCards(){
    document.querySelectorAll('.fd-drill').forEach(card=>{
      if(card.querySelector('.deep-training-tag')) return;
      const text=card.textContent||'';
      if(matchModule(text)){
        const tag=document.createElement('span'); tag.className='deep-training-tag'; tag.textContent='Deep drill';
        const meta=card.querySelector('.fd-meta');
        if(meta) meta.appendChild(tag); else card.prepend(tag);
      }
    });
  }

  installStyles();
  const observer=new MutationObserver(()=>{renderDepth();tagCards()});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  document.addEventListener('click',()=>setTimeout(renderDepth,60));
  setTimeout(()=>{renderDepth();tagCards()},250);
})();