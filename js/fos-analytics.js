/**
 * Lightweight FireOpsSim analytics.
 * No patient data. No account identifiers.
 * Compatible with a future Google Tag Manager / dataLayer hook.
 */
(function (global) {
  const KEY = 'fos-analytics-v1';
  const MAX_EVENTS = 80;

  function sanitize(value) {
    if (value == null) return undefined;
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value).slice(0, 180);
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        counts: raw.counts && typeof raw.counts === 'object' ? raw.counts : {},
        recent: Array.isArray(raw.recent) ? raw.recent.slice(-MAX_EVENTS) : []
      };
    } catch {
      return { counts: {}, recent: [] };
    }
  }

  function save(store) {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* private mode / quota — analytics is optional */
    }
  }

  function track(eventName, props) {
    const event = String(eventName || '').slice(0, 80);
    if (!event) return;
    const safe = {};
    if (props && typeof props === 'object') {
      for (const [k, v] of Object.entries(props)) {
        if (/patient|name|email|phone|address|ssn|dob/i.test(k)) continue;
        const cleaned = sanitize(v);
        if (cleaned !== undefined) safe[String(k).slice(0, 40)] = cleaned;
      }
    }
    const payload = { event, t: Date.now(), ...safe };
    const store = load();
    store.counts[event] = (store.counts[event] || 0) + 1;
    store.recent.push(payload);
    if (store.recent.length > MAX_EVENTS) store.recent = store.recent.slice(-MAX_EVENTS);
    save(store);
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({ event: 'fos_' + event, fosEvent: event, ...safe });
  }

  global.FireOpsAnalytics = { track, load };
})(typeof window !== 'undefined' ? window : globalThis);
