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
