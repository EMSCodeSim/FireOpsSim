'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/taskbook-resources.json'), 'utf8'));

const ROADMAP_CERTS = catalog.roadmapCertificationIds;

function certPathFromQuery(cert, pathParam) {
  const c = (cert || '').toLowerCase();
  if (/^(emt|aemt|paramedic|bls|acls|pals)$/.test(c)) return 'ems';
  if (/^(ics_|is_)/.test(c) || c === 'nims') return 'ics';
  if (/^fire_officer_4$/.test(c)) return 'nfa';
  return pathParam || 'fire';
}

function effectiveSchoolFinderPath(cert, pathParam) {
  const rec = catalog.certifications[cert];
  if (rec?.finderPath) return rec.finderPath;
  return certPathFromQuery(cert, pathParam);
}

function checkLocalUrl(url) {
  if (!url || url.startsWith('http')) return;
  const local = path.join(ROOT, url.split('?')[0].replace(/^\//, ''));
  assert(fs.existsSync(local), `Missing local target: ${url}`);
}

// --- Catalog integrity ---
for (const id of ROADMAP_CERTS) {
  const rec = catalog.certifications[id];
  assert(rec, `Catalog missing ${id}`);
  assert(rec.title && rec.summary && rec.finderPath, `${id} needs title, summary, finderPath`);
  assert(Array.isArray(rec.study) && rec.study.length > 0, `${id} needs study links`);
  for (const link of rec.study) checkLocalUrl(link.url);
}

for (const task of Object.values(catalog.taskOverrides)) {
  for (const link of task.links || []) checkLocalUrl(link.url);
}

// --- School finder routing must match catalog finderPath ---
for (const id of ROADMAP_CERTS) {
  const expected = catalog.certifications[id].finderPath;
  const actual = effectiveSchoolFinderPath(id, 'fire');
  assert.strictEqual(
    actual,
    expected,
    `school-finder path for ${id}: expected ${expected}, got ${actual}`,
  );
}

// --- ICS / EMS companion pages exist and reference FEMA / providers ---
const ics = fs.readFileSync(path.join(ROOT, 'ics-nims-training.html'), 'utf8');
const life = fs.readFileSync(path.join(ROOT, 'ems-life-support.html'), 'utf8');
assert(ics.includes('IS-100') && ics.includes('IS-700') && ics.includes('training.fema.gov'));
assert(life.includes('cpr.heart.org') && life.includes('redcross.org'));
for (const id of ['ics_100', 'ics_200', 'ics_300', 'ics_400', 'is_700', 'is_800']) {
  assert(ics.includes(`${id}:`) || ics.includes(`'${id}'`), `ics-nims missing ${id}`);
}
for (const id of ['bls', 'acls', 'pals']) {
  assert(life.includes(`${id}:`), `ems-life-support missing ${id}`);
}

// --- Page scripts include required behaviors ---
const finderHtml = fs.readFileSync(path.join(ROOT, 'school-finder.html'), 'utf8');
const studyHtml = fs.readFileSync(path.join(ROOT, 'study-guides.html'), 'utf8');
const taskHtml = fs.readFileSync(path.join(ROOT, 'taskbook-resources.html'), 'utf8');
const focusHtml = fs.readFileSync(path.join(ROOT, 'focus-drills.html'), 'utf8');

assert(finderHtml.includes("rec.finderPath){p.value=rec.finderPath"), 'school-finder must always prefer catalog finderPath');
assert(!finderHtml.includes('officer_3|officer_4'), 'school-finder must not misroute fire_officer_3 to NFA');
assert(studyHtml.includes("q.get('cert')") && studyHtml.includes('taskbook-resources.html'));
assert(studyHtml.includes('cert-study.json'), 'Study guides must load interactive decks');
assert(studyHtml.includes('id="flash"') && studyHtml.includes('id="quiz"'), 'Study guides must include flashcards and quiz');

const decks = JSON.parse(fs.readFileSync(path.join(ROOT, 'study-data/cert-study.json'), 'utf8'));
assert.strictEqual(Object.keys(decks.decks).length, ROADMAP_CERTS.length, 'Every Roadmap cert needs an interactive deck');
for (const id of ROADMAP_CERTS) {
  const deck = decks.decks[id];
  assert(deck, `Missing interactive deck for ${id}`);
  assert(deck.cards.length >= 6, `${id} needs flashcards`);
  assert(deck.quiz.length >= 4, `${id} needs a mini exam`);
  assert((catalog.certifications[id].study || []).some(s => (s.url || '').includes(`/study-guides.html?cert=${id}`)), `${id} catalog must link to interactive study`);
}
assert(taskHtml.includes('resolveCert') && taskHtml.includes('returnUrl'));
assert(focusHtml.includes('returnUrl') && focusHtml.includes('returnRoadmap'));

// --- Clean URL redirects ---
const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
for (const slug of ['/school-finder', '/study-guides', '/taskbook-resources', '/focus-drills', '/ics-nims', '/ems-life-support']) {
  assert(redirects.includes(slug), `_redirects missing ${slug}`);
}

console.log(`Companion pages OK: ${ROADMAP_CERTS.length} certifications, school-finder paths aligned, links verified.`);
