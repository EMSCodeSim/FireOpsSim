(function(){
  const fmt = n => Number.isFinite(n) ? Math.round(n).toLocaleString() : '—';
  const num = (box, name, fallback=0) => {
    const el = box.querySelector(`[data-field="${name}"]`);
    const v = el ? parseFloat(el.value) : fallback;
    return Number.isFinite(v) ? v : fallback;
  };
  function update(box){
    const type = box.dataset.calc;
    const out = box.querySelector('[data-output]');
    if(!out) return;
    if(type === 'pdp'){
      const np=num(box,'np',50), gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',200), elev=num(box,'elev',0), app=num(box,'app',0);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      const pdp = np + fl + elev + app;
      out.textContent = `${fmt(pdp)} PSI PDP • FL ${fmt(fl)} PSI (${fmt(fl100)}/100 ft)`;
    }
    if(type === 'friction'){
      const gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',200);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      out.textContent = `${fmt(fl)} PSI total FL • ${fmt(fl100)} PSI per 100 ft`;
    }
    if(type === 'hydrant'){
      const s=num(box,'static',80), r=num(box,'residual',60), f=num(box,'flow',1000), target=num(box,'target',20);
      const drop = s - r;
      const remaining = s - target;
      const q = drop > 0 && remaining > 0 ? f * Math.pow(remaining/drop,0.54) : NaN;
      out.textContent = `Approx. ${fmt(q)} GPM available to ${fmt(target)} PSI residual`;
    }
    if(type === 'nozzle'){
      const select = box.querySelector('[data-field="type"]');
      const kind = select ? select.value : 'fog';
      const gpm=num(box,'gpm',185), np=num(box,'np',50), d=num(box,'diam',0.875);
      const nr = kind === 'smooth' ? 1.57 * d * d * np : 0.0505 * gpm * Math.sqrt(np);
      out.textContent = `${fmt(nr)} lb estimated nozzle reaction`;
    }
    if(type === 'relay'){
      const gpm=num(box,'gpm',1000), c=num(box,'c',0.08), len=num(box,'length',2000), drop=num(box,'drop',80);
      const fl100 = c * Math.pow(gpm/100,2);
      const perSegment = drop > 0 && fl100 > 0 ? (drop / fl100) * 100 : NaN;
      const segments = perSegment > 0 ? Math.ceil(len / perSegment) : NaN;
      const relayEngines = Number.isFinite(segments) ? Math.max(0, segments - 1) : NaN;
      out.textContent = `Approx. ${fmt(segments)} segment(s) • ${fmt(relayEngines)} relay engine(s) • ${fmt(fl100)} PSI/100 ft`;
    }
    if(type === 'tender'){
      const tank=num(box,'tank',3000), fill=num(box,'fill',5), dump=num(box,'dump',4), travel=num(box,'travel',12), count=num(box,'count',2);
      const cycle = fill + dump + travel;
      const gpm = cycle > 0 ? (tank * count) / cycle : NaN;
      out.textContent = `Approx. ${fmt(gpm)} GPM sustained • ${fmt(cycle)} min cycle`;
    }
    if(type === 'standpipe'){
      const np=num(box,'np',50), fl=num(box,'fl',25), system=num(box,'system',25), floors=num(box,'floors',3), perfloor=num(box,'perfloor',5), app=num(box,'app',0);
      const elev = floors * perfloor;
      const pdp = np + fl + system + elev + app;
      out.textContent = `${fmt(pdp)} PSI estimated FDC pressure • Elevation ${fmt(elev)} PSI`;
    }

    if(type === 'master'){
      const gpm=num(box,'gpm',500), np=num(box,'np',80), lines=Math.max(1,num(box,'lines',2)), c=num(box,'c',2), len=num(box,'length',200), app=num(box,'app',0);
      const perLine = gpm / lines;
      const fl100 = c * Math.pow(perLine/100,2);
      const fl = fl100 * (len/100);
      const pdp = np + fl + app;
      out.textContent = `${fmt(pdp)} PSI PDP • ${fmt(perLine)} GPM per line • FL ${fmt(fl)} PSI per line`;
    }
    if(type === 'wye'){
      const mainfl=num(box,'mainfl',20), app=num(box,'app',10), npa=num(box,'npa',50), fla=num(box,'fla',30), npb=num(box,'npb',50), flb=num(box,'flb',45), elev=num(box,'elev',0);
      const a = npa + fla;
      const b = npb + flb;
      const govern = Math.max(a,b);
      const pdp = mainfl + app + govern + elev;
      const branch = a >= b ? 'Branch A controls' : 'Branch B controls';
      out.textContent = `${fmt(pdp)} PSI PDP • ${branch} (${fmt(govern)} PSI branch requirement)`;
    }
    if(type === 'deck'){
      const gpm=num(box,'gpm',500), np=num(box,'np',80), app=num(box,'app',0);
      const pdp = np + app;
      const nr = 0.0505 * gpm * Math.sqrt(np);
      out.textContent = `${fmt(pdp)} PSI pump target • ${fmt(nr)} lb estimated nozzle reaction`;
    }
    if(type === 'foam'){
      const eductor=num(box,'eductor',200), gpm=num(box,'gpm',185), c=num(box,'c',15.5), len=num(box,'length',50), elev=num(box,'elev',0);
      const fl100 = c * Math.pow(gpm/100,2);
      const fl = fl100 * (len/100);
      const pdp = eductor + fl + elev;
      out.textContent = `${fmt(pdp)} PSI engine PDP • 200 PSI at eductor + ${fmt(fl)} PSI engine-to-eductor FL`;
    }
    if(type === 'setup'){
      const val = name => {
        const el = box.querySelector(`[data-field="${name}"]`);
        return el ? el.value : '';
      };
      out.textContent = `${val('apparatus')} • ${val('line')}: ${val('length')} ft ${val('hose')} using ${val('nozzle')} • C ${val('c')}`;
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
      out.textContent = `Friction loss table generated at ${fmt(gpm)} GPM`;
    }
    if(type === 'layout'){
      const val = name => {
        const el = box.querySelector(`[data-field="${name}"]`);
        return el ? el.value : '';
      };
      out.textContent = `${val('type')} • ${val('gpm')} GPM • ${val('length')} ft ${val('hose')} • target ${val('np')} PSI • ${val('notes')}`;
    }


    if(type === 'spill'){
      const length=num(box,'length',20), width=num(box,'width',12), depth=num(box,'depth',0.5), factor=num(box,'factor',25);
      const cubicFeet = length * width * (depth/12);
      const gallons = cubicFeet * 7.48052;
      const adjusted = gallons * (1 + factor/100);
      out.textContent = `${fmt(gallons)} gal (${fmt(gallons*3.78541)} L) visible • ${fmt(adjusted)} gal with ${fmt(factor)}% factor`;
    }
    if(type === 'hazisolate'){
      const radius=num(box,'radius',150), downwind=num(box,'downwind',1000), width=num(box,'width',300), density=num(box,'density',10);
      const circleArea = Math.PI * radius * radius;
      const downwindArea = downwind * width;
      const totalSqFt = circleArea + downwindArea;
      const acres = totalSqFt / 43560;
      const people = acres * density;
      out.textContent = `${acres.toFixed(1)} acres planning area • approx. ${fmt(people)} people at ${fmt(density)}/acre`;
    }
    if(type === 'decon'){
      const lanes=Math.max(1,num(box,'lanes',2)), minutes=Math.max(0.1,num(box,'minutes',4)), people=num(box,'people',12), gpm=num(box,'gpm',15);
      const perHour = lanes * (60/minutes);
      const totalTime = (people / perHour) * 60;
      const water = lanes * gpm * totalTime;
      out.textContent = `${fmt(perHour)} people/hour • ${fmt(totalTime)} min for ${fmt(people)} people • ${fmt(water)} gal water estimate`;
    }
    if(type === 'haznotes'){
      const val = name => {
        const el = box.querySelector(`[data-field="${name}"]`);
        return el ? el.value : '';
      };
      out.textContent = `Product: ${val('product')} • Container: ${val('container')} • Weather: ${val('weather')} • Actions: ${val('actions')}`;
    }

    if(type === 'convert'){
      const feet=num(box,'feet',100), gal=num(box,'gal',1000), psi=num(box,'psi',100);
      out.textContent = `${feet} ft = ${(feet*0.3048).toFixed(1)} m • ${gal} gal = ${fmt(gal*3.78541)} L • ${psi} PSI = ${(psi*0.0689476).toFixed(1)} bar`;
    }
  }
  document.querySelectorAll('[data-calc]').forEach(box=>{
    update(box);
    box.addEventListener('input',()=>update(box));
    box.addEventListener('change',()=>update(box));
  });
  const search = document.getElementById('toolSearch');
  if(search){
    const cards = Array.from(document.querySelectorAll('[data-tool-board] .tool-card'));
    search.addEventListener('input',()=>{
      const q = search.value.trim().toLowerCase();
      cards.forEach(card=>{
        const text = (card.textContent + ' ' + (card.dataset.keywords||'')).toLowerCase();
        card.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  }
})();
