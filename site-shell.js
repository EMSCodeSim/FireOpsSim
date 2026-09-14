(function(){
  const core=document.createElement('script');
  core.src='/site-shell-core.js';
  core.onload=function(){
    if(/\/focus-drills(?:\.html)?\/?$/.test(location.pathname)){
      const depth=document.createElement('script');
      depth.src='/js/focus-drill-depth.js';
      depth.defer=true;
      document.head.appendChild(depth);
    }
  };
  document.head.appendChild(core);
})();
