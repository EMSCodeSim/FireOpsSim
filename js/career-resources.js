(function(){
  document.querySelectorAll('[data-save-group]').forEach(group=>{
    const key='fireopssim:'+group.dataset.saveGroup;
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch(_){saved={}}
    group.querySelectorAll('input[type="checkbox"][data-item]').forEach(box=>{
      box.checked=Boolean(saved[box.dataset.item]);
      box.addEventListener('change',()=>{
        saved[box.dataset.item]=box.checked;
        try{localStorage.setItem(key,JSON.stringify(saved))}catch(_){}
      });
    });
  });
})();
