'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/taskbook-resources.json'), 'utf8'));
const taskbookHtml = fs.readFileSync(path.join(ROOT, 'taskbook-resources.html'), 'utf8');
const studyHtml = fs.readFileSync(path.join(ROOT, 'study-guides.html'), 'utf8');
const finderHtml = fs.readFileSync(path.join(ROOT, 'school-finder.html'), 'utf8');
const supportHtml = fs.readFileSync(path.join(ROOT, 'roadmap-support.html'), 'utf8');
const contract = fs.readFileSync(path.join(ROOT, 'ROADMAP_SUPPORT_CONTRACT.md'), 'utf8');
const companion = fs.readFileSync(path.join(ROOT, 'ROADMAP_COMPANION.md'), 'utf8');

const ROADMAP_CERTS = [
  'firefighter_1', 'firefighter_2', 'hazmat_awareness', 'hazmat_operations', 'hazmat_technician',
  'driver_operator_pumper', 'driver_operator_aerial', 'fire_officer_1', 'fire_officer_2',
  'fire_officer_3', 'fire_officer_4', 'fire_instructor_1', 'fire_instructor_2', 'fire_inspector_1',
  'fire_inspector_2', 'fire_investigator', 'emt', 'aemt', 'paramedic', 'bls', 'acls', 'pals',
  'ics_100', 'ics_200', 'ics_300', 'ics_400', 'is_700', 'is_800'
];

const PUMPER_TASKS = [
  'do_pumper_pump_theory', 'do_pumper_apparatus_inspection', 'do_pumper_engage_pump',
  'do_pumper_hydrant_ops', 'do_pumper_drafting', 'do_pumper_friction_loss',
  'do_pumper_multiple_attack_lines', 'do_pumper_master_streams', 'do_pumper_relay_pumping',
  'do_pumper_troubleshooting'
];

for (const id of ROADMAP_CERTS) {
  assert(catalog.certifications[id], `Catalog missing Roadmap certification ${id}`);
  const rec = catalog.certifications[id];
  assert(rec.title && rec.summary && rec.finderPath, `${id} needs title, summary, finderPath`);
  assert(Array.isArray(rec.study) && rec.study.length > 0, `${id} needs study links`);
}

for (const id of PUMPER_TASKS) {
  assert(catalog.taskOverrides[id], `Catalog missing Driver/Operator task ${id}`);
}

assert(fs.existsSync(path.join(ROOT, 'ics-nims-training.html')), 'ICS/NIMS hub page is required');
assert(fs.existsSync(path.join(ROOT, 'ems-life-support.html')), 'EMS life-support companion page is required');
assert(taskbookHtml.includes('resolveCert') || taskbookHtml.includes('taskOverrides[taskId]'), 'Task Book hub must resolve catalog IDs');
assert(!/taskId&&!task&&certId!=='driver_operator_pumper'/.test(taskbookHtml), 'Unknown tasks must not redirect away from a known certification');
assert(studyHtml.includes("q.get('cert')"), 'Study guides must honor cert=');
assert(finderHtml.includes("q.get('cert')") && finderHtml.includes('ics'), 'School finder must honor cert= and ICS path');
assert(supportHtml.includes("id:'ics_100'") && supportHtml.includes("id:'bls'") && supportHtml.includes("id:'fire_officer_3'"), 'roadmap-support catalog must cover ICS, BLS, and FO III');
assert(contract.includes('ics_100') && contract.includes('bls'), 'Support contract must list the expanded certification coverage');
assert(companion.includes('/data/taskbook-resources.json'), 'Companion contract must keep the machine-readable catalog URL');

const ics = fs.readFileSync(path.join(ROOT, 'ics-nims-training.html'), 'utf8');
const life = fs.readFileSync(path.join(ROOT, 'ems-life-support.html'), 'utf8');
assert(ics.includes('IS-100') && ics.includes('IS-700') && ics.includes('training.fema.gov'), 'ICS hub must link FEMA courses');
assert(life.includes('cpr.heart.org') && life.includes('redcross.org'), 'Life-support page must link accepted providers');

console.log(`Roadmap catalog coverage OK: ${ROADMAP_CERTS.length} certifications, ${PUMPER_TASKS.length} pumper tasks.`);
