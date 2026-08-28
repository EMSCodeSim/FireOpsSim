/**
 * FireOpsSim Skill Support Engine
 * Shared matcher, search, catalog loader, and Roadmap context helpers.
 */
(function (global) {
  const DEFAULT_INDEX = '/data/skill-support/index.json';

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[%+]/g, ' ')
      .replace(/[_\-/.]+/g, ' ')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const ALIAS_EXPAND = [
    ['fo1', 'fire officer 1'],
    ['fo 1', 'fire officer 1'],
    ['fo i', 'fire officer 1'],
    ['fo2', 'fire officer 2'],
    ['fi1', 'fire instructor 1'],
    ['fi 1', 'fire instructor 1'],
    ['fi i', 'fire instructor 1'],
    ['ff1', 'firefighter 1'],
    ['ff 1', 'firefighter 1'],
    ['ff i', 'firefighter 1'],
    ['ff2', 'firefighter 2'],
    ['ff 2', 'firefighter 2'],
    ['ff ii', 'firefighter 2'],
    ['dop', 'driver operator pumper'],
    ['do pumper', 'driver operator pumper'],
    ['hm ops', 'hazmat operations'],
    ['haz ops', 'hazmat operations'],
    ['haz mat', 'hazmat']
  ];

  function expandQuery(value) {
    let n = normalize(value);
    if (!n) return '';
    for (const [alias, canon] of ALIAS_EXPAND) {
      if (n === alias || n.includes(alias)) n += ' ' + canon;
    }
    if (/\bengineer\b/.test(n) && !/driver|operator|pumper/.test(n)) n += ' driver operator pumper';
    if (/\blieutenant\b/.test(n) && !/officer/.test(n)) n += ' fire officer 1';
    if (/\btraining officer\b/.test(n) && !/instructor/.test(n)) n += ' fire instructor 1';
    if (/\brookie\b|\bprobation\b|\bfirst 100\b/.test(n) && !/probationary/.test(n)) n += ' probationary firefighter';
    return n;
  }

  function tokens(value) {
    return expandQuery(value).split(' ').filter((t) => t.length > 1);
  }

  function unique(list) {
    return [...new Set((list || []).filter(Boolean))];
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function isSafeReturnUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return false;
    if (/[\s<>]/.test(raw) || raw.length > 1200) return false;
    if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return true;
    try {
      const parsed = new URL(raw);
      if (!/^https?:$/.test(parsed.protocol)) return false;
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (/(^|\.)fireops/.test(host)) return true;
      if (/(^|\.)emscodesim/.test(host)) return true;
      if (/roadmap|careerroad|firepath/.test(host)) return true;
      return false;
    } catch {
      return false;
    }
  }

  function parseContext(search) {
    const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
    const get = (...keys) => {
      for (const key of keys) {
        const value = params.get(key);
        if (value) return value;
      }
      return '';
    };
    return {
      cert: get('cert', 'certification'),
      task: get('task'),
      requirement: get('requirement'),
      id: get('id'),
      title: get('title'),
      goal: get('goal', 'target'),
      state: (get('state') || '').toUpperCase(),
      source: (get('source') || '').toLowerCase(),
      returnUrl: get('return_url', 'return'),
      q: get('q', 'query', 'search'),
      stage: get('stage')
    };
  }

  function haystack(skill, cert) {
    const parts = [
      skill.id,
      skill.title,
      skill.summary,
      skill.category,
      skill.careerStage,
      cert && cert.id,
      cert && cert.title,
      ...(skill.aliases || []),
      ...(skill.searchKeywords || []),
      ...(skill.learningPoints || []),
      ...((skill.practiceResources || []).map((r) => [r.label, r.note].join(' '))),
      ...((skill.seeResources || []).map((r) => [r.label, r.note].join(' ')))
    ];
    return normalize(parts.filter(Boolean).join(' '));
  }

  function scoreText(hay, query) {
    const nq = expandQuery(query);
    if (!nq || !hay) return 0;
    if (hay === nq) return 100;
    if (hay.includes(nq) || nq.includes(hay)) return 72 + Math.min(nq.length, 18);
    const qTokens = nq.split(' ').filter((t) => t.length > 1);
    const hSet = new Set(hay.split(' '));
    let hits = 0;
    for (const token of qTokens) {
      if (hSet.has(token) || hay.includes(token)) hits += token.length > 3 ? 14 : 8;
    }
    return hits;
  }

  function skillRecord(skill, cert) {
    return { skill, cert, hay: haystack(skill, cert) };
  }

  function buildCatalog(index, certPacks) {
    const certifications = {};
    const skills = [];
    const byId = {};
    const practiceIndex = [];
    for (const pack of certPacks || []) {
      if (!pack || !pack.id) continue;
      certifications[pack.id] = pack;
      for (const skill of pack.skills || []) {
        const record = skillRecord(skill, pack);
        skills.push(record);
        byId[skill.id] = record;
        for (const res of [...(skill.practiceResources || []), ...(skill.seeResources || [])]) {
          if (!res || !res.url) continue;
          practiceIndex.push({
            title: res.label,
            url: res.url,
            note: res.note || '',
            type: res.type || 'resource',
            skillId: skill.id,
            certificationId: pack.id,
            keywords: normalize([res.label, res.note, skill.title, pack.title].join(' '))
          });
        }
      }
    }
    for (const extra of index.practiceCatalog || []) {
      practiceIndex.push({
        title: extra.title,
        url: extra.url,
        note: extra.note || '',
        type: extra.type || 'resource',
        skillId: extra.skillId || '',
        certificationId: extra.certificationId || '',
        keywords: normalize([extra.title, extra.note, ...(extra.keywords || [])].join(' '))
      });
    }
    return { index, certifications, skills, byId, practiceIndex };
  }

  function findCert(catalog, value, context) {
    const n = expandQuery(value);
    if (!n && !(context && context.goal)) return null;
    let best = null;
    let bestScore = 0;
    for (const cert of Object.values(catalog.certifications)) {
      const names = [cert.id, cert.title, ...(cert.aliases || [])];
      let score = 0;
      for (const name of names) {
        score = Math.max(score, scoreText(normalize(name), n));
      }
      score += applyGoalBoost(context || {}, cert);
      if (score > bestScore) {
        bestScore = score;
        best = cert;
      }
    }
    return bestScore >= 28 ? best : null;
  }

  function findSkillInCert(catalog, cert, value) {
    if (!cert) return null;
    const n = expandQuery(value);
    if (!n) return null;
    let best = null;
    let bestScore = 0;
    for (const record of catalog.skills) {
      if (record.cert.id !== cert.id) continue;
      const names = [record.skill.id, record.skill.title, ...(record.skill.aliases || [])];
      let score = 0;
      for (const name of names) score = Math.max(score, scoreText(normalize(name), n));
      score = Math.max(score, scoreText(record.hay, n) * 0.55);
      if (score > bestScore) {
        bestScore = score;
        best = record;
      }
    }
    return bestScore >= 22 ? best : null;
  }

  function findSkillGlobal(catalog, value) {
    const n = expandQuery(value);
    if (!n) return null;
    let best = null;
    let bestScore = 0;
    for (const record of catalog.skills) {
      const names = [record.skill.id, record.skill.title, ...(record.skill.aliases || [])];
      let score = 0;
      for (const name of names) score = Math.max(score, scoreText(normalize(name), n));
      score = Math.max(score, scoreText(record.hay, n) * 0.6);
      if (score > bestScore) {
        bestScore = score;
        best = record;
      }
    }
    return bestScore >= 24 ? best : null;
  }

  function relatedRecords(catalog, skill) {
    const out = [];
    const seen = new Set([skill.id]);
    for (const id of skill.relatedSkills || []) {
      const rec = catalog.byId[id];
      if (rec && !seen.has(id)) {
        seen.add(id);
        out.push(rec);
      }
    }
    return out;
  }

  function closestSkills(catalog, query, limit) {
    const n = expandQuery(query);
    const scored = catalog.skills
      .map((record) => ({ record, score: scoreText(record.hay, n) }))
      .filter((x) => x.score >= 12)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit || 6)
      .map((x) => x.record);
    return scored;
  }

  function applyGoalBoost(context, cert) {
    const goal = expandQuery(context.goal);
    if (!goal || !cert) return 0;
    if (/engineer|driver|operator|pump/.test(goal) && cert.id === 'driver_operator_pumper') return 18;
    if (/officer|lieutenant|captain|acting/.test(goal) && cert.id === 'fire_officer_1') return 18;
    if (/instructor|training/.test(goal) && cert.id === 'fire_instructor_1') return 18;
    if (/hazmat|hazard/.test(goal) && cert.id === 'hazmat_operations') return 18;
    if (/probation|rookie/.test(goal) && cert.id === 'probationary_firefighter') return 14;
    if (/firefighter 2|ff2/.test(goal) && cert.id === 'firefighter_2') return 12;
    if (/firefighter/.test(goal) && cert.id === 'firefighter_1') return 8;
    return 0;
  }

  function match(catalog, context) {
    const ctx = context || {};
    const certHint = ctx.cert || '';
    const skillHint = [ctx.task, ctx.requirement, ctx.id, ctx.title].filter(Boolean).join(' ');
    const allHint = [skillHint, certHint, ctx.goal, ctx.q].filter(Boolean).join(' ');
    const cert = findCert(catalog, certHint, ctx) || findCert(catalog, allHint, ctx);

    let record = null;
    if (skillHint && cert) record = findSkillInCert(catalog, cert, skillHint);
    if (!record && skillHint) record = findSkillGlobal(catalog, skillHint);
    if (!record && ctx.q) record = findSkillGlobal(catalog, ctx.q);
    if (!record && cert && !skillHint) {
      return {
        kind: 'cert',
        cert,
        skill: null,
        fallback: false,
        closest: (catalog.skills.filter((s) => s.cert.id === cert.id).slice(0, 8)),
        context: ctx
      };
    }
    if (record) {
      return {
        kind: 'skill',
        cert: record.cert,
        skill: record.skill,
        fallback: false,
        closest: relatedRecords(catalog, record.skill),
        context: ctx
      };
    }

    const closest = closestSkills(catalog, allHint || ctx.goal, 6);
    const fallbackCert = cert || (closest[0] && closest[0].cert) || null;
    return {
      kind: 'fallback',
      cert: fallbackCert,
      skill: null,
      fallback: true,
      closest,
      context: ctx,
      requested: allHint || 'this Taskbook item'
    };
  }

  function search(catalog, query, limit) {
    const n = expandQuery(query);
    if (!n) return { skills: [], resources: [] };
    const skills = catalog.skills
      .map((record) => ({
        record,
        score: Math.max(
          scoreText(record.hay, n),
          scoreText(normalize(record.skill.id), n) + 8,
          scoreText(normalize(record.skill.title), n) + 10
        )
      }))
      .filter((x) => x.score >= 16)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit || 8)
      .map((x) => x.record);

    const seenUrl = new Set();
    const resources = catalog.practiceIndex
      .map((item) => ({ item, score: scoreText(item.keywords, n) }))
      .filter((x) => x.score >= 16)
      .sort((a, b) => b.score - a.score)
      .reduce((acc, x) => {
        if (seenUrl.has(x.item.url)) return acc;
        seenUrl.add(x.item.url);
        acc.push(x.item);
        return acc;
      }, [])
      .slice(0, limit || 8);

    return { skills, resources };
  }

  function stageForCert(catalog, certId) {
    for (const stage of catalog.index.stages || []) {
      if ((stage.certIds || []).includes(certId)) return stage;
    }
    return null;
  }

  function sessionUrl(skillId, certId, context) {
    const params = new URLSearchParams();
    if (certId) params.set('cert', certId);
    if (skillId) params.set('task', skillId);
    if (context) {
      if (context.goal) params.set('goal', context.goal);
      if (context.state) params.set('state', context.state);
      if (context.source) params.set('source', context.source);
      if (context.returnUrl && isSafeReturnUrl(context.returnUrl)) params.set('return_url', context.returnUrl);
    }
    return '/skill-support.html?' + params.toString();
  }

  function preserveContext(context, extra) {
    const payload = {
      savedAt: new Date().toISOString(),
      certId: context && context.cert,
      taskId: context && (context.task || context.requirement || context.id),
      goal: context && context.goal,
      state: context && context.state,
      source: context && context.source,
      ...extra
    };
    try {
      localStorage.setItem('fos-roadmap-context-v1', JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    return payload;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load ' + url);
    return res.json();
  }

  async function loadCatalog(base) {
    const root = (base || DEFAULT_INDEX).replace(/index\.json$/, '');
    const index = await fetchJson(base || DEFAULT_INDEX);
    const files = index.catalogFiles || [];
    const packs = await Promise.all(files.map((file) => fetchJson(root + file)));
    return buildCatalog(index, packs);
  }

  const api = {
    normalize,
    expandQuery,
    tokens,
    unique,
    escapeHtml,
    isSafeReturnUrl,
    parseContext,
    buildCatalog,
    findCert,
    match,
    search,
    relatedRecords,
    closestSkills,
    stageForCert,
    sessionUrl,
    preserveContext,
    loadCatalog,
    applyGoalBoost
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FireOpsSkillSupport = api;
})(typeof window !== 'undefined' ? window : globalThis);
