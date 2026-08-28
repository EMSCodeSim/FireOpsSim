#!/usr/bin/env node
/**
 * Skill Support Engine tests: catalog integrity, matcher, search, return URLs.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const SS = require('../js/skill-support.js');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'skill-support');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const index = readJson(path.join(DATA, 'index.json'));
const packs = index.catalogFiles.map((f) => readJson(path.join(DATA, f)));
const catalog = SS.buildCatalog(index, packs);

const errors = [];
function ok(cond, msg) {
  if (!cond) errors.push(msg);
}

ok(catalog.skills.length >= 50, 'expected 50+ skills, got ' + catalog.skills.length);
ok(index.catalogFiles.length === 7, 'seven certification files');

const ids = new Set(catalog.skills.map((s) => s.skill.id));
ok(ids.size === catalog.skills.length, 'skill IDs must be unique');

for (const rec of catalog.skills) {
  const s = rec.skill;
  ok(s.id && s.certificationId && s.title && s.summary, 'required fields ' + s.id);
  ok(s.certificationId === rec.cert.id, 'cert id mismatch ' + s.id);
  ok((s.learningPoints || []).length >= 3, 'learning points ' + s.id);
  ok((s.safetyNotes || []).length >= 1, 'safety ' + s.id);
  ok((s.readinessQuestions || []).length >= 3, 'questions ' + s.id);
  ok(s.drill && s.drill.modes && s.drill.modes['5'] && s.drill.modes['15'] && s.drill.modes['30'], 'drill modes ' + s.id);
  ok((s.officialSources || []).length >= 1, 'sources ' + s.id);
  for (const rel of s.relatedSkills || []) {
    ok(ids.has(rel), s.id + ' related missing: ' + rel);
  }
  for (const item of [...(s.practiceResources || []), ...(s.seeResources || []), ...(s.officialSources || [])]) {
    const url = item.url || '';
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    const file = path.join(ROOT, url.replace(/^\//, '').split('?')[0]);
    ok(fs.existsSync(file), s.id + ' missing file ' + url);
  }
}

function matchTask(cert, task) {
  return SS.match(catalog, { cert, task, source: 'roadmap' });
}

const hydrant = matchTask('driver_operator_pumper', 'do_pumper_hydrant_ops');
ok(hydrant.kind === 'skill', 'hydrant should match skill');
ok(hydrant.skill && hydrant.skill.id === 'do_pumper_hydrant_ops', 'hydrant id');

const vent = matchTask('firefighter_2', 'ventilation');
ok(vent.kind === 'skill', 'ff2 ventilation');
ok(vent.skill && vent.skill.id === 'ff2_ventilation', 'ff2 ventilation id, got ' + (vent.skill && vent.skill.id));

const hose = SS.match(catalog, { cert: 'probationary_firefighter', task: 'hose advancement', goal: 'Firefighter' });
ok(hose.kind === 'skill' && hose.skill.id === 'probation_hose_advancement', 'probation hose, got ' + (hose.skill && hose.skill.id));

const irr = SS.match(catalog, { cert: 'fire_officer_1', task: 'initial radio report', goal: 'Lieutenant' });
ok(irr.kind === 'skill' && irr.skill.id === 'fo1_initial_radio_report', 'FO1 IRR, got ' + (irr.skill && irr.skill.id));

const fo1alias = SS.match(catalog, { cert: 'FO1', task: 'size up' });
ok(fo1alias.kind === 'skill', 'FO1 alias cert');

const engineer = SS.search(catalog, 'engineer', 8);
ok(engineer.skills.some((s) => s.cert.id === 'driver_operator_pumper'), 'engineer search → D/O');
ok(engineer.resources.some((r) => /hydrant|pump|driver/i.test(r.title + r.url)), 'engineer resources');

const hydrantSearch = SS.search(catalog, 'hydrant', 10);
ok(hydrantSearch.skills.some((s) => s.skill.id === 'do_pumper_hydrant_ops'), 'hydrant search skill');
ok(hydrantSearch.resources.some((r) => /hydrant-flow/i.test(r.url)), 'hydrant calculator in search');

const fo1search = SS.search(catalog, 'FO1', 8);
ok(fo1search.skills.some((s) => s.cert.id === 'fire_officer_1'), 'FO1 search');

const unknown = SS.match(catalog, { cert: 'driver_operator_pumper', task: 'department_custom_ladder_evaluation', goal: 'Engineer' });
ok(unknown.kind === 'fallback', 'unknown custom task uses fallback, got ' + unknown.kind + (unknown.skill ? ' ' + unknown.skill.id : ''));
ok((unknown.closest || []).length > 0, 'unknown has closest skills');
ok(unknown.cert && unknown.cert.id === 'driver_operator_pumper', 'unknown keeps D/O cert context');
ok(unknown.requested === 'department_custom_ladder_evaluation', 'unknown requested id is the task, got ' + unknown.requested);

const certOnly = SS.match(catalog, { cert: 'driver_operator_pumper' });
ok(certOnly.kind === 'cert', 'cert-only lands on cert picker');

ok(SS.isSafeReturnUrl('/task-book'), 'relative return');
ok(SS.isSafeReturnUrl('https://fireopscareerroadmap.com/log'), 'fireops host');
ok(SS.isSafeReturnUrl('https://app.emscodesim.com/roadmap'), 'emscodesim host');
ok(!SS.isSafeReturnUrl('javascript:alert(1)'), 'block javascript');
ok(!SS.isSafeReturnUrl('https://evil.example/phish'), 'block random https');
ok(!SS.isSafeReturnUrl('//evil.com'), 'block protocol-relative');

const ctx = SS.parseContext('cert=driver_operator_pumper&task=do_pumper_hydrant_ops&goal=Engineer&state=CO&source=roadmap&return_url=https://evil.example');
ok(ctx.cert === 'driver_operator_pumper' && ctx.state === 'CO', 'parse context');
ok(!SS.isSafeReturnUrl(ctx.returnUrl), 'unsafe return_url rejected');

const sizeUp = catalog.byId.fo1_size_up;
ok(sizeUp.skill.relatedSkills.includes('fo1_initial_radio_report'), 'size-up → IRR');
ok(sizeUp.skill.relatedSkills.includes('fo1_accountability'), 'size-up → accountability');
ok(sizeUp.skill.relatedSkills.includes('fo1_transfer_of_command'), 'size-up → TOC');

const awareness = SS.match(catalog, { cert: 'hazmat_awareness', source: 'roadmap' });
ok(awareness.kind === 'cert' || awareness.kind === 'fallback' || awareness.kind === 'skill', 'hazmat awareness is not empty');
ok((awareness.closest || []).length > 0 || awareness.kind === 'cert' || awareness.kind === 'skill', 'hazmat awareness has a path forward');

const fo2 = SS.match(catalog, { cert: 'fire_officer_2', task: 'unknown_admin_task', goal: 'Captain', source: 'roadmap' });
ok(fo2.kind !== 'skill' || fo2.skill, 'FO2 unknown is not a crash');
ok((fo2.closest || []).length > 0 || fo2.kind === 'cert', 'FO2 unknown has closest skills');

const counts = {};
for (const rec of catalog.skills) {
  counts[rec.cert.id] = (counts[rec.cert.id] || 0) + 1;
}
ok(counts.firefighter_1 >= 8, 'FF1 coverage');
ok(counts.firefighter_2 >= 6, 'FF2 coverage');
ok(counts.hazmat_operations >= 6, 'HazMat Ops coverage');
ok(SS.canonCertKey('officer_1') === 'fire_officer_1', 'level officer_1 maps to FO1');
ok(SS.canonCertKey('Fire Officer I') === 'fire_officer_1', 'roman Fire Officer I maps');
ok(SS.canonCertKey('driver_operator') === 'driver_operator_pumper', 'level driver_operator maps');

const dailyFo1Ctx = SS.parseContext('source=roadmap&level=officer_1&topic=Initial%20radio%20report&qualification=Fire%20Officer%20I&goal=Lieutenant&task_id=officer-radio-report&requirement_id=fire_officer_1');
ok(dailyFo1Ctx.task === 'officer-radio-report', 'Daily Focus task_id, got ' + dailyFo1Ctx.task);
ok(dailyFo1Ctx.title === 'Initial radio report', 'Daily Focus topic as title, got ' + dailyFo1Ctx.title);
ok(dailyFo1Ctx.cert === 'fire_officer_1', 'Daily Focus cert from qualification/level, got ' + dailyFo1Ctx.cert);
ok(dailyFo1Ctx.requirement === '', 'requirement_id that is a cert is not treated as a skill, got ' + dailyFo1Ctx.requirement);
const dailyFo1 = SS.match(catalog, dailyFo1Ctx);
ok(dailyFo1.kind === 'skill' && dailyFo1.skill.id === 'fo1_initial_radio_report', 'Daily Focus FO1 radio, got ' + (dailyFo1.skill && dailyFo1.skill.id));

const dailyHydrantCtx = SS.parseContext('source=roadmap&level=driver_operator&topic=hydrant%20supply&task_id=do_pumper_hydrant_ops&goal=Engineer');
ok(dailyHydrantCtx.cert === 'driver_operator_pumper', 'Daily Focus D/O level maps, got ' + dailyHydrantCtx.cert);
ok(dailyHydrantCtx.task === 'do_pumper_hydrant_ops', 'Daily Focus hydrant task_id');
const dailyHydrant = SS.match(catalog, dailyHydrantCtx);
ok(dailyHydrant.kind === 'skill' && dailyHydrant.skill.id === 'do_pumper_hydrant_ops', 'Daily Focus hydrant session');

const standpipe = matchTask('driver_operator_pumper', 'do_pumper_standpipe_fdc');
ok(standpipe.kind === 'skill' && standpipe.skill.id === 'do_pumper_standpipe_fdc', 'standpipe skill');
const tender = matchTask('driver_operator_pumper', 'tender shuttle');
ok(tender.kind === 'skill' && tender.skill.id === 'do_pumper_rural_tender', 'tender skill, got ' + (tender.skill && tender.skill.id));
const placement = SS.match(catalog, { cert: 'driver_operator_pumper', title: 'apparatus placement', goal: 'Engineer' });
ok(placement.kind === 'skill' && placement.skill.id === 'do_pumper_apparatus_placement', 'placement skill, got ' + (placement.skill && placement.skill.id));
ok(counts.fire_officer_1 >= 7, 'FO1 coverage');
ok(counts.fire_instructor_1 >= 6, 'FI1 coverage');
ok(counts.probationary_firefighter >= 6, 'probation coverage');

const focusHtml = fs.readFileSync(path.join(ROOT, 'focus-drills.html'), 'utf8');
ok(/source=roadmap/.test(focusHtml) === false || /skill-support\.html/.test(focusHtml), 'focus-drills mentions Skill Support');
ok(focusHtml.includes("location.replace('/skill-support.html'"), 'focus-drills redirects Roadmap Daily Focus');
ok(fs.existsSync(path.join(DATA, 'handoff.json')), 'handoff.json exists');
const handoff = readJson(path.join(DATA, 'handoff.json'));
ok(Array.isArray(handoff.skills) && handoff.skills.length === catalog.skills.length, 'handoff lists every skill');
ok(handoff.dailyFocus && handoff.dailyFocus.levelToCert.driver_operator === 'driver_operator_pumper', 'handoff maps Daily Focus levels');

if (errors.length) {
  console.error('FAIL\n' + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('PASS ' + catalog.skills.length + ' skills, matcher, search, and return-URL checks');
