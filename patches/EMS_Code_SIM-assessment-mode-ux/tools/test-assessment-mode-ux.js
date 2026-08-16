'use strict';

const fs = require('fs');
const assert = require('assert');

const ux = fs.readFileSync('vitals/scenario-assessment-mode-ux.js', 'utf8');
const css = fs.readFileSync('vitals/scenario-assessment-mode-ux.css', 'utf8');
const html = fs.readFileSync('vitals/visual-patient.html', 'utf8');
const learning = fs.readFileSync('vitals/scenario-learning-upgrade.js', 'utf8');

assert(html.includes('scenario-assessment-mode-ux.js'), 'visual-patient.html must load Assessment Mode UX');
assert(ux.includes('assessmentModeBanner'), 'Onboarding banner is required');
assert(ux.includes('Start here'), 'Banner must guide Assessment → Vitals → History');
assert(ux.includes('patient-hotspot') && ux.includes('hotspots'), 'Interactive patient hotspots are required');
assert(ux.includes('left_hip') && ux.includes('distal_csm') && ux.includes('pelvis_hip'), 'Horse-crush hotspot regions must cover hip/CMS/pelvis');
assert(ux.includes('assessmentDecisionProgress') && ux.includes('Discovered so far'), 'Decision progress checklist is required');
assert(ux.includes('Show required findings for next decision'), 'Optional required-findings control is required');
assert(ux.includes('What am I missing') || ux.includes('WHAT AM I MISSING'), 'Soft prompt affordance is required');
assert(ux.includes('nav-progress') && ux.includes('actionMiniResult'), 'Action bar progress and mini-result feedback are required');
assert(ux.includes('resetAssessmentProgress'), 'Lightweight assessment progress reset is required');
assert(ux.includes('Paused while reading') || ux.includes('clock-pause'), 'Patient clock pause-while-reading is required');
assert(ux.includes('highlightLatestFinding'), 'New findings must scroll/highlight in the care feed');
assert(css.includes('@media (max-width:767px)'), 'Mobile layout polish under 768px is required');
assert(css.includes('min-height:44px') || css.includes('min-height:58px'), 'Touch targets must meet 44px guidance');
assert(learning.includes('discoveryChecklist'), 'Assessment Mode locked cards must show discovery checklists');
assert(!learning.includes('No assessment hints are shown in Assessment Mode.'), 'Generic Assessment Mode lock copy should be replaced with discovery progress');

console.log('Assessment Mode UX contract checks passed.');
