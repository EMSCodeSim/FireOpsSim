(function(){
  const fmt = n => Number.isFinite(n) ? Math.round(n).toLocaleString() : '—';
  const fixed = (n, d=1) => Number.isFinite(n) ? Number(n).toFixed(d) : '—';
  const num = (box, name, fallback=0) => {
    const el = box.querySelector(`[data-field="${name}"]`);
    const v = el ? parseFloat(el.value) : fallback;
    return Number.isFinite(v) ? v : fallback;
  };
  const val = (box, name, fallback='') => {
    const el = box.querySelector(`[data-field="${name}"]`);
    return el ? el.value : fallback;
  };
  function result(out, headline, details=[], note=''){
    const detailHtml = details.length ? `<ul class="result-details">${details.map(d=>`<li>${d}</li>`).join('')}</ul>` : '';
    const noteHtml = note ? `<small class="result-note">${note}</small>` : '';
    out.innerHTML = `<strong>${headline}</strong>${detailHtml}${noteHtml}`;
  }
  function update(box){
    const type = box.dataset.calc;
    const out = box.querySelector('[data-output]');
    if(!out) return;
    if(type === 'pdp'){
      const np=num(box,'np',50), gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',200), elev=num(box,'elev',0), app=num(box,'app',0);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      const pdp = np + fl + elev + app;
      result(out, `${fmt(pdp)} PSI PDP`, [`FL/100 = ${c} × (${fmt(gpm)}/100)² = ${fmt(fl100)} PSI`, `Total FL = ${fmt(fl100)} × ${(len/100).toFixed(1)} = ${fmt(fl)} PSI`, `Formula: ${fmt(np)} NP + ${fmt(fl)} FL + ${fmt(elev)} elevation + ${fmt(app)} appliance`], 'Training estimate only. Confirm with department SOPs and instructor guidance.');
    }
    if(type === 'friction'){
      const gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',200);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      result(out, `${fmt(fl)} PSI total friction loss`, [`FL/100 = ${c} × (${fmt(gpm)}/100)² = ${fmt(fl100)} PSI`, `Length factor = ${fmt(len)} ft ÷ 100 = ${(len/100).toFixed(1)}`, `Total FL = ${fmt(fl100)} × ${(len/100).toFixed(1)} = ${fmt(fl)} PSI`]);
    }
    if(type === 'hydrant'){
      const s=num(box,'static',80), r=num(box,'residual',60), f=num(box,'flow',1000), target=num(box,'target',20);
      const drop = s - r;
      const remaining = s - target;
      const q = drop > 0 && remaining > 0 ? f * Math.pow(remaining/drop,0.54) : NaN;
      result(out, `Approx. ${fmt(q)} GPM available`, [`Static: ${fmt(s)} PSI`, `Residual while flowing ${fmt(f)} GPM: ${fmt(r)} PSI`, `Target residual: ${fmt(target)} PSI`], 'Hydrant estimates depend on test quality, system condition, and local water authority data.');
    }
    if(type === 'nozzle'){
      const select = box.querySelector('[data-field="type"]');
      const kind = select ? select.value : 'fog';
      const gpm=num(box,'gpm',185), np=num(box,'np',50), d=num(box,'diam',0.875);
      const nr = kind === 'smooth' ? 1.57 * d * d * np : 0.0505 * gpm * Math.sqrt(np);
      const formula = kind === 'smooth' ? `Smooth bore: 1.57 × ${d}² × ${fmt(np)}` : `Fog: 0.0505 × ${fmt(gpm)} × √${fmt(np)}`;
      result(out, `${fmt(nr)} lb nozzle reaction`, [formula, `Nozzle type: ${kind}`]);
    }
    if(type === 'relay'){
      const gpm=num(box,'gpm',1000), c=num(box,'c',0.08), len=num(box,'length',2000), drop=num(box,'drop',80);
      const fl100 = c * Math.pow(gpm/100,2);
      const perSegment = drop > 0 && fl100 > 0 ? (drop / fl100) * 100 : NaN;
      const segments = perSegment > 0 ? Math.ceil(len / perSegment) : NaN;
      const relayEngines = Number.isFinite(segments) ? Math.max(0, segments - 1) : NaN;
      result(out, `${fmt(segments)} segment(s), ${fmt(relayEngines)} relay engine(s)`, [`FL/100 at ${fmt(gpm)} GPM = ${fmt(fl100)} PSI`, `Approx. max spacing per segment = ${fmt(perSegment)} ft`, `Total lay = ${fmt(len)} ft`]);
    }
    if(type === 'tender'){
      const tank=num(box,'tank',3000), fill=num(box,'fill',5), dump=num(box,'dump',4), travel=num(box,'travel',12), count=num(box,'count',2);
      const cycle = fill + dump + travel;
      const gpm = cycle > 0 ? (tank * count) / cycle : NaN;
      result(out, `Approx. ${fmt(gpm)} GPM sustained`, [`Cycle time = fill ${fmt(fill)} + dump ${fmt(dump)} + travel ${fmt(travel)} = ${fmt(cycle)} min`, `Water moved per cycle = ${fmt(tank)} gal × ${fmt(count)} tender(s)`]);
    }
    if(type === 'standpipe'){
      const np=num(box,'np',50), fl=num(box,'fl',25), system=num(box,'system',25), floors=num(box,'floors',3), perfloor=num(box,'perfloor',5), app=num(box,'app',0);
      const elev = floors * perfloor;
      const pdp = np + fl + system + elev + app;
      result(out, `${fmt(pdp)} PSI estimated FDC pressure`, [`${fmt(np)} NP + ${fmt(fl)} hose FL + ${fmt(system)} system loss + ${fmt(elev)} elevation + ${fmt(app)} appliance`, `Elevation estimate = ${fmt(floors)} floors × ${fmt(perfloor)} PSI/floor`]);
    }
    if(type === 'master'){
      const gpm=num(box,'gpm',500), np=num(box,'np',80), lines=Math.max(1,num(box,'lines',2)), c=num(box,'c',2), len=num(box,'length',200), app=num(box,'app',0);
      const perLine = gpm / lines;
      const fl100 = c * Math.pow(perLine/100,2);
      const fl = fl100 * (len/100);
      const pdp = np + fl + app;
      result(out, `${fmt(pdp)} PSI PDP`, [`Total flow ${fmt(gpm)} ÷ ${fmt(lines)} line(s) = ${fmt(perLine)} GPM per line`, `FL per line = ${fmt(fl)} PSI`, `PDP = ${fmt(np)} NP + ${fmt(fl)} FL + ${fmt(app)} appliance`]);
    }
    if(type === 'wye'){
      const mainfl=num(box,'mainfl',20), app=num(box,'app',10), npa=num(box,'npa',50), fla=num(box,'fla',30), npb=num(box,'npb',50), flb=num(box,'flb',45), elev=num(box,'elev',0);
      const a = npa + fla;
      const b = npb + flb;
      const govern = Math.max(a,b);
      const pdp = mainfl + app + govern + elev;
      const branch = a >= b ? 'Branch A controls' : 'Branch B controls';
      result(out, `${fmt(pdp)} PSI PDP`, [`Branch A requirement = ${fmt(a)} PSI`, `Branch B requirement = ${fmt(b)} PSI`, `${branch}; add main line FL ${fmt(mainfl)}, appliance ${fmt(app)}, elevation ${fmt(elev)}`]);
    }
    if(type === 'deck'){
      const gpm=num(box,'gpm',500), np=num(box,'np',80), app=num(box,'app',0);
      const pdp = np + app;
      const nr = 0.0505 * gpm * Math.sqrt(np);
      result(out, `${fmt(pdp)} PSI pump target`, [`Nozzle reaction estimate = ${fmt(nr)} lb`, `PDP = ${fmt(np)} NP + ${fmt(app)} internal/appliance loss`]);
    }
    if(type === 'foam'){
      const eductor=num(box,'eductor',200), gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',50), elev=num(box,'elev',0);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      const pdp = eductor + fl + elev;
      result(out, `${fmt(pdp)} PSI engine PDP`, [`Target at eductor = ${fmt(eductor)} PSI`, `Engine-to-eductor FL = ${fmt(fl)} PSI`, `PDP = ${fmt(eductor)} + ${fmt(fl)} + ${fmt(elev)} elevation`], 'Eductor-to-nozzle layout must follow eductor/nozzle manufacturer limits and SOPs.');
    }
    if(type === 'setup'){
      result(out, `${val(box,'apparatus')} pump card line`, [`${val(box,'line')}: ${val(box,'length')} ft ${val(box,'hose')}`, `Nozzle: ${val(box,'nozzle')}`, `Training C-value: ${val(box,'c')}`]);
    }
    if(type === 'fltable'){
      const gpm=num(box,'gpm',185), c1=num(box,'c1',15.5), c2=num(box,'c2',2), c3=num(box,'c3',0.08);
      const rows = [['1¾ in.',c1],['2½ in.',c2],['LDH / supply',c3]];
      const tbody = box.querySelector('[data-table-output]');
      if(tbody){
        tbody.innerHTML = rows.map(([label,c])=>{
          const fl100 = c * Math.pow(gpm/100,2);
          return `<tr><td>${label}</td><td>${c}</td><td>${fmt(fl100)} PSI</td><td>${fmt(fl100*2)} PSI</td><td>${fmt(fl100*3)} PSI</td></tr>`;
        }).join('');
      }
      result(out, `Table generated at ${fmt(gpm)} GPM`, rows.map(([label,c])=>`${label}: ${fmt(c * Math.pow(gpm/100,2))} PSI/100 ft`));
    }
    if(type === 'layout'){
      result(out, `${val(box,'type')} layout summary`, [`Flow: ${val(box,'gpm')} GPM`, `Hose: ${val(box,'length')} ft ${val(box,'hose')}`, `Target nozzle/device pressure: ${val(box,'np')} PSI`, `Notes: ${val(box,'notes')}`]);
    }
    if(type === 'spill'){
      const length=num(box,'length',20), width=num(box,'width',12), depth=num(box,'depth',0.5), factor=num(box,'factor',25);
      const cubicFeet = length * width * (depth/12);
      const gallons = cubicFeet * 7.48052;
      const adjusted = gallons * (1 + factor/100);
      result(out, `${fmt(gallons)} gal visible spill`, [`${fixed(gallons*3.78541,1)} L visible`, `${fmt(adjusted)} gal with ${fmt(factor)}% safety/planning factor`, `Area ${fmt(length)} ft × ${fmt(width)} ft × ${fixed(depth,2)} in depth`], 'For training/preplanning only. Identify product, exposure, containment, and official HazMat guidance.');
    }
    if(type === 'hazisolate'){
      const radius=num(box,'radius',150), downwind=num(box,'downwind',1000), width=num(box,'width',300), density=num(box,'density',10);
      const circleArea = Math.PI * radius * radius;
      const downwindArea = downwind * width;
      const totalSqFt = circleArea + downwindArea;
      const acres = totalSqFt / 43560;
      const people = acres * density;
      result(out, `${fixed(acres,1)} acres planning area`, [`Initial isolation circle: ${fmt(radius)} ft radius`, `Downwind rectangle: ${fmt(downwind)} ft × ${fmt(width)} ft`, `Estimated people affected: ${fmt(people)} at ${fmt(density)}/acre`], 'Use current ERG, dispatch info, weather, and department HazMat SOPs for real incidents.');
    }
    if(type === 'decon'){
      const lanes=Math.max(1,num(box,'lanes',2)), minutes=Math.max(0.1,num(box,'minutes',4)), people=num(box,'people',12), gpm=num(box,'gpm',15);
      const perHour = lanes * (60/minutes);
      const totalTime = (people / perHour) * 60;
      const water = lanes * gpm * totalTime;
      result(out, `${fmt(perHour)} people/hour throughput`, [`Estimated time for ${fmt(people)} people: ${fmt(totalTime)} min`, `Water estimate: ${fmt(water)} gal`, `${fmt(lanes)} lane(s) at ${fixed(minutes,1)} min/person`]);
    }
    if(type === 'haznotes'){
      result(out, `HazMat note summary`, [`Product: ${val(box,'product')}`, `Container: ${val(box,'container')}`, `Weather: ${val(box,'weather')}`, `Actions: ${val(box,'actions')}`]);
    }
    if(type === 'scba'){
      const start=num(box,'start',4500), reserve=num(box,'reserve',1575), rate=Math.max(1,num(box,'rate',150)), factor=num(box,'factor',20);
      const usable = Math.max(0, start - reserve);
      const raw = usable / rate;
      const adjusted = raw * (1 - factor/100);
      const turn = start - (usable/2);
      result(out, `${fmt(adjusted)} min estimated work time`, [`Usable pressure = ${fmt(start)} - ${fmt(reserve)} = ${fmt(usable)} PSI`, `Raw time = ${fmt(usable)} ÷ ${fmt(rate)} = ${fixed(raw,1)} min`, `Turn-around planning pressure near ${fmt(turn)} PSI`], 'Training estimate only; use department air management policy and instructor direction.');
    }
    if(type === 'ladder'){
      const height=num(box,'height',24), length=num(box,'length',28);
      const setback = height / 4;
      const needed = Math.sqrt(height*height + setback*setback);
      const reachOk = length >= needed;
      result(out, `${fixed(setback,1)} ft set-back`, [`4:1 rule: ${fmt(height)} ft ÷ 4`, `Approx. ladder length needed: ${fixed(needed,1)} ft`, reachOk ? 'Entered ladder length appears adequate for this height.' : 'Entered ladder may be too short for this height.']);
    }
    if(type === 'occupancy'){
      const area=num(box,'area',1200), factor=Math.max(0.1,num(box,'factor',15));
      const load = Math.ceil(area / factor);
      result(out, `${fmt(load)} person estimated occupant load`, [`${fmt(area)} sq ft ÷ ${factor} sq ft/person`, `Round up to the next whole person`, `Confirm with the adopted code and AHJ.`]);
    }
    if(type === 'drill'){
      result(out, `${val(box,'title')}`, [`Objective: ${val(box,'objective')}`, `Equipment: ${val(box,'equipment')}`, `Safety points: ${val(box,'safety')}`, `Evaluate: ${val(box,'eval')}`]);
    }
    if(type === 'preplan'){
      result(out, `${val(box,'occupancy')} preplan`, [`Construction: ${val(box,'construction')}`, `Hazards: ${val(box,'hazards')}`, `Access/hydrants/FDC: ${val(box,'hydrants')}`]);
    }
    if(type === 'violation'){
      result(out, `Inspection note`, [`Issue: ${val(box,'issue')}`, `Location: ${val(box,'location')}`, `Correction: ${val(box,'correction')}`, `Follow-up: ${val(box,'followup')}`]);
    }
    if(type === 'officer'){
      result(out, `${val(box,'topic')}`, [`Time: ${val(box,'time')}`, `Objective: ${val(box,'objective')}`, `Evaluation: ${val(box,'eval')}`]);
    }
    if(type === 'convert'){
      const feet=num(box,'feet',100), gal=num(box,'gal',1000), psi=num(box,'psi',100);
      result(out, `Unit conversions`, [`${feet} ft = ${fixed(feet*0.3048,1)} m`, `${gal} gal = ${fmt(gal*3.78541)} L`, `${psi} PSI = ${fixed(psi*0.0689476,1)} bar`]);
    }
  }
  document.querySelectorAll('[data-calc]').forEach(box=>{
    const out = box.querySelector('[data-output]');
    if(out && !box.querySelector('.copy-result')){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-result';
      btn.textContent = 'Copy result';
      btn.addEventListener('click', async()=>{
        const text = out.innerText.replace(/\n+/g,' • ');
        try{ await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; setTimeout(()=>btn.textContent='Copy result',1200); }
        catch(e){ btn.textContent = 'Select result to copy'; }
      });
      out.insertAdjacentElement('afterend', btn);
    }
    update(box);
    box.addEventListener('input',()=>update(box));
    box.addEventListener('change',()=>update(box));
  });
  const search = document.getElementById('toolSearch');
  if(search){
    const cards = Array.from(document.querySelectorAll('[data-tool-board] .tool-card'));
    const params = new URLSearchParams(location.search);
    if(params.get('q')){ search.value = params.get('q'); }
    const runSearch = ()=>{
      const q = search.value.trim().toLowerCase();
      cards.forEach(card=>{
        const text = (card.textContent + ' ' + (card.dataset.keywords||'')).toLowerCase();
        card.style.display = !q || text.includes(q) ? '' : 'none';
      });
    };
    search.addEventListener('input',runSearch);
    runSearch();
  }
})();
