/**
 * FireOpsSim PWA helper: register the service worker and surface an Android install action.
 */
(function (global) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {
        /* optional */
      });
    });
  }

  var deferredPrompt = null;

  function showBar() {
    var bar = document.getElementById('pwaInstall');
    if (!bar) return;
    bar.hidden = false;
    bar.classList.add('show');
  }

  function hideBar() {
    var bar = document.getElementById('pwaInstall');
    if (!bar) return;
    bar.hidden = true;
    bar.classList.remove('show');
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showBar();
    if (global.FireOpsAnalytics && global.FireOpsAnalytics.track) {
      global.FireOpsAnalytics.track('pwa_install_available', {});
    }
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-pwa-install]');
    if (!btn || !deferredPrompt) return;
    event.preventDefault();
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (global.FireOpsAnalytics && global.FireOpsAnalytics.track) {
        global.FireOpsAnalytics.track('pwa_install_choice', { outcome: choice.outcome });
      }
      deferredPrompt = null;
      hideBar();
    });
  });

  window.addEventListener('appinstalled', function () {
    hideBar();
    if (global.FireOpsAnalytics && global.FireOpsAnalytics.track) {
      global.FireOpsAnalytics.track('pwa_installed', {});
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
