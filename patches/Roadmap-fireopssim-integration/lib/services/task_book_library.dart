import 'package:firepath/models/requirement.dart';
import 'package:firepath/models/task_book.dart';
import 'package:firepath/services/fireops_sim_links.dart';

/// Built-in FireOps Preparation Tasks.
///
/// IMPORTANT: These are not official skill sheets.
class TaskBookLibrary {
  /// Returns a qualification task book (tasks grouped into sections) when
  /// FireOps has a starter set for the given requirement.
  ///
  /// For now we key off known certificationDefinitionIds + well-known titles.
  static List<TaskBookTaskDefinition> tasksForRequirement(Requirement r) {
    final defId = r.certificationDefinitionId;
    if (defId == 'driver_operator_pumper') {
      return _withCompanionResources(
        _driverOperatorPumper(),
        certificationId: 'driver_operator_pumper',
      );
    }
    if (defId == 'firefighter_1') {
      return _withCompanionResources(_firefighter1(), certificationId: defId!);
    }
    if (defId == 'firefighter_2') {
      return _withCompanionResources(_firefighter2(), certificationId: defId!);
    }
    if (defId == 'fire_officer_1') {
      return _withCompanionResources(_fireOfficer1(), certificationId: defId!);
    }
    if (defId == 'hazmat_operations') {
      return _withCompanionResources(_hazmatOperations(), certificationId: defId!);
    }
    if (defId == 'fire_investigator') {
      return _withCompanionResources(_fireInvestigator(), certificationId: defId!);
    }
    if (defId == 'fire_inspector_1') {
      return _withCompanionResources(_fireInspector1(), certificationId: defId!);
    }
    if (defId == 'emt') {
      return _withCompanionResources(_emtBasics(), certificationId: defId!);
    }
    final name = r.name.trim().toLowerCase();
    if (name.contains('driver operator') && name.contains('pumper')) {
      return _withCompanionResources(
        _driverOperatorPumper(),
        certificationId: 'driver_operator_pumper',
      );
    }
    if (name.contains('firefighter i') || name.contains('firefighter 1') || name == 'ff1') {
      return _withCompanionResources(_firefighter1(), certificationId: 'firefighter_1');
    }
    if (name.contains('firefighter ii') || name.contains('firefighter 2') || name == 'ff2') {
      return _withCompanionResources(_firefighter2(), certificationId: 'firefighter_2');
    }
    if (name.contains('fire officer i') || name.contains('company officer')) {
      return _withCompanionResources(_fireOfficer1(), certificationId: 'fire_officer_1');
    }
    if (name.contains('hazmat') && name.contains('operations')) {
      return _withCompanionResources(_hazmatOperations(), certificationId: 'hazmat_operations');
    }
    if (name.contains('investigator')) {
      return _withCompanionResources(_fireInvestigator(), certificationId: 'fire_investigator');
    }
    if (name.contains('inspector i') || name.contains('inspector 1')) {
      return _withCompanionResources(_fireInspector1(), certificationId: 'fire_inspector_1');
    }
    if (name.contains('emt') && !name.contains('paramedic')) {
      return _withCompanionResources(_emtBasics(), certificationId: 'emt');
    }
    return const <TaskBookTaskDefinition>[];
  }

  static bool hasTasksForRequirement(Requirement r) =>
      tasksForRequirement(r).isNotEmpty;

  static List<TaskBookTaskDefinition> _withCompanionResources(
    List<TaskBookTaskDefinition> tasks, {
    required String certificationId,
  }) {
    return tasks
        .map(
          (task) => TaskBookTaskDefinition(
            id: task.id,
            title: task.title,
            section: task.section,
            goalId: task.goalId,
            requirementId: task.requirementId,
            isCustom: task.isCustom,
            fireOpsObjective: task.fireOpsObjective,
            whatToKnow: task.whatToKnow,
            performanceTasks: task.performanceTasks,
            safetyPoints: task.safetyPoints,
            commonMistakes: task.commonMistakes,
            practiceTools: task.practiceTools,
            resources: [
              ...task.resources,
              TaskBookResourceLink(
                title: 'FireOpsSim: study, practice, and training help',
                url: FireOpsSimLinks.taskbookResourcesUri(
                  certId: certificationId,
                  taskId: task.id,
                  returnUrl: FireOpsSimLinks.dailyFocusReturnUri().toString(),
                ).toString(),
                type: TaskBookTaskResourceType.fireOpsGuide,
                issuingSource: 'FireOpsSim',
                notes:
                    'Free companion study material, practice tools, class finder, and official source links.',
                fileRef: null,
              ),
            ],
          ),
        )
        .toList(growable: false);
  }

  static List<TaskBookTaskDefinition> _driverOperatorPumper() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'do_pumper_pump_theory',
        title: 'Pump theory (overview)',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Build a working understanding of pump principles so you can diagnose problems under stress.',
        whatToKnow: [
          'Positive displacement vs centrifugal pumps (high-level)',
          'Net pump pressure basics (PDP / intake / discharge relationships)',
          'Priming purpose and limitations',
          'Cavitation warning signs and consequences',
        ],
        performanceTasks: [
          'Explain pump modes/controls used on your apparatus (instructor-led)',
          'Identify common gauges/indicators and what “normal” looks like',
        ],
        safetyPoints: [
          'Never rely on a single gauge—confirm water supply and line status.',
        ],
        commonMistakes: [
          'Chasing pressure without verifying intake supply',
          'Over-priming or priming with incorrect valves set',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Open FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Pump operations practice scenarios',
          ),
          TaskBookPracticeToolLink(
            title: 'Open FireOps Calc',
            route: '/resources?tool=fireops_calc',
            subtitle: 'Friction loss and PDP quick math',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_apparatus_inspection',
        title: 'Daily apparatus inspection (driver check)',
        section: 'APPARATUS OPERATIONS',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Build a repeatable inspection routine that catches safety issues early.',
        whatToKnow: [
          'Your department’s inspection checklist / documentation process',
          'Critical pump controls, valves, interlocks, and indicators',
          'Tank level, foam system basics (if applicable)',
        ],
        performanceTasks: [
          'Perform the inspection using your department checklist',
          'Identify and report deficiencies per SOP',
        ],
        safetyPoints: [
          'Use wheel chocks / parking brake where required by SOP.',
          'Lockout/tagout procedures if needed.',
        ],
        commonMistakes: [
          'Rushing and skipping critical items (tires, fluids, pump panel)',
          'Failing to document small issues that become big failures',
        ],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_engage_pump',
        title: 'Engage pump (basic sequence)',
        section: 'APPARATUS OPERATIONS',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Safely transition from drive to pump mode and confirm readiness for water operations.',
        whatToKnow: [
          'Your apparatus-specific pump engage sequence and interlocks',
          'What indicators confirm pump engaged (RPM, pressure, lights)',
        ],
        performanceTasks: [
          'Follow the manufacturer + department sequence',
          'Confirm pump engaged and stable before opening intakes/discharges',
        ],
        safetyPoints: [
          'Confirm transmission in correct mode before engaging.',
          'Communicate clearly with crew before charging lines.',
        ],
        commonMistakes: [
          'Engaging with incorrect RPM or drivetrain state',
          'Opening discharges before confirming supply / valve positions',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Practice in FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Simulated pump panel decisions',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_hydrant_ops',
        title: 'Hydrant operations (supply from municipal source)',
        section: 'APPARATUS OPERATIONS',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Establish a reliable hydrant supply and manage intake pressure safely.',
        whatToKnow: [
          'Hydrant types (dry vs wet barrel) and basic operation',
          'Water hammer risks and opening/closing discipline',
          'Intake pressure monitoring and when to throttle back',
        ],
        performanceTasks: [
          'Connect to hydrant and establish supply per SOP',
          'Monitor intake/discharge pressures and adjust for demand changes',
        ],
        safetyPoints: [
          'Avoid standing over outlets / caps during pressurization.',
          'Watch hose movement and communicate with hydrant firefighter.',
        ],
        commonMistakes: [
          'Opening hydrant too quickly',
          'Failing to anticipate demand changes (multiple lines opening)',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Hydrant Flow Calculator',
            route: '/resources?tool=hydrant_flow',
            subtitle: 'Estimate available flow from hydrant data',
          ),
          TaskBookPracticeToolLink(
            title: 'Open FireOps Calc',
            route: '/resources?tool=fireops_calc',
            subtitle: 'PDP + friction loss quick calculations',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_drafting',
        title: 'Drafting from a static water source',
        section: 'APPARATUS OPERATIONS',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Demonstrate the ability to establish a reliable water supply from a static source using fire apparatus.',
        whatToKnow: [
          'How drafting works (atmospheric pressure / lift limitations)',
          'Priming purpose and common failure modes',
          'Suction hose, gaskets, and air leak troubleshooting',
          'Strainer placement and avoiding vortexing',
          'Cavitation warning signs',
        ],
        performanceTasks: [
          'Position apparatus safely for drafting operations.',
          'Select appropriate suction equipment for the source.',
          'Assemble suction hose and confirm gasket integrity.',
          'Position the strainer correctly and control for debris/vortex.',
          'Engage the pump and set valves/intake appropriately.',
          'Prime the pump and confirm stable intake conditions.',
          'Transition to discharge operations and maintain supply.',
          'Monitor for loss of prime/cavitation and correct early.',
        ],
        safetyPoints: [
          'Control traffic / scene hazards near static sources.',
          'Avoid slip/trip hazards around water edge and hose.',
          'Use PPE and follow department SOP for water-side operations.',
        ],
        commonMistakes: [
          'Air leaks at gaskets / caps causing loss of prime',
          'Strainer too shallow leading to vortexing',
          'Over-priming or failing to bleed air appropriately',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Practice in FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Drafting scenarios and troubleshooting',
          ),
          TaskBookPracticeToolLink(
            title: 'Open FireOps Calc',
            route: '/resources?tool=fireops_calc',
            subtitle: 'Friction loss + PDP for draft operations',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_friction_loss',
        title: 'Friction loss + pump discharge pressure (PDP)',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Build repeatable friction loss habits to support safe and effective line operations.',
        whatToKnow: [
          'Friction loss factors (flow, hose diameter, length)',
          'Nozzle pressure concepts (per your nozzles/SOP)',
          'Appliance loss basics (gated wyes, master stream devices)',
        ],
        performanceTasks: [
          'Compute a target PDP for 1¾" and 2½" lines (training context)',
          'Adjust PDP for multiple lines while maintaining intake safety',
        ],
        safetyPoints: [
          'Avoid over-pressurizing hose/nozzles beyond ratings/SOP.',
        ],
        commonMistakes: [
          'Forgetting to account for elevation or appliances when applicable',
          'Chasing nozzle reaction complaints without checking flow',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Open FireOps Calc',
            route: '/resources?tool=fireops_calc',
            subtitle: 'Friction loss + PDP calculator',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_multiple_attack_lines',
        title: 'Supply multiple attack lines',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Maintain stable pressures while multiple discharges are operating and changing.',
        whatToKnow: [
          'Discharge management (gating, pressure relief/governor)',
          'Communications with crews opening/closing lines',
        ],
        performanceTasks: [
          'Establish a baseline PDP, then manage changes as lines open/close',
          'Demonstrate controlled adjustments without wild pressure swings',
        ],
        safetyPoints: [
          'Avoid sudden pressure changes (water hammer / hose movement).',
        ],
        commonMistakes: [
          'Late recognition of demand changes',
          'Over-correcting throttle and oscillating pressure',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Practice in FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Multi-line pump ops scenarios',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_master_streams',
        title: 'Master stream operations (basic support)',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Support master stream devices safely with appropriate pressures/flows.',
        whatToKnow: [
          'High flow impacts on intake supply and relay needs',
          'Appliance loss considerations (training context)',
        ],
        performanceTasks: [
          'Set up and supply master stream per SOP',
          'Recognize when additional supply/relay is required',
        ],
        safetyPoints: [
          'Confirm device anchoring and collapse zones (incident safety).',
        ],
        commonMistakes: ['Underestimating required flow/supply needs'],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Open FireOps Calc',
            route: '/resources?tool=fireops_calc',
            subtitle: 'High flow friction loss quick checks',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_relay_pumping',
        title: 'Relay pumping (overview)',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Understand relay basics and the critical communication needed to avoid supply failures.',
        whatToKnow: [
          'Basic relay concepts (intake/discharge, spacing, communications)',
          'Pressure targets and avoiding over-pressurization',
        ],
        performanceTasks: [
          'Describe relay roles (source, intermediate, attack pumper)',
          'Demonstrate stable discharge pressure in a simple relay scenario',
        ],
        safetyPoints: ['Monitor line ratings and use relief devices per SOP.'],
        commonMistakes: ['Poor communication causing pressure spikes/drops'],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Practice in FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Relay pumping practice',
          ),
        ],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'do_pumper_troubleshooting',
        title: 'Troubleshoot pressure / supply problems',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective:
            '$fireOps: Diagnose common pump and supply issues quickly and safely.',
        whatToKnow: [
          'Common causes: air leaks, intake restriction, cavitation, closed valves',
          'How to confirm if the issue is supply vs discharge vs pump mode',
        ],
        performanceTasks: [
          'Identify likely cause from symptoms (training scenarios)',
          'Apply a safe correction plan and confirm stabilization',
        ],
        safetyPoints: [
          'Prioritize crew safety and water supply stability over “perfect” pressures.',
        ],
        commonMistakes: [
          'Making multiple changes at once and losing track of cause/effect',
        ],
        practiceTools: [
          TaskBookPracticeToolLink(
            title: 'Practice in FirePumpSim',
            route: '/resources?tool=firepumpsim',
            subtitle: 'Troubleshooting scenarios',
          ),
        ],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _firefighter1() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'ff1_ppe_scba',
        title: 'PPE + SCBA readiness',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Build a dependable ready-for-entry sequence with partner checks.',
        whatToKnow: ['PPE layering order', 'SCBA donning/doffing sequence', 'PASS and low-air expectations'],
        performanceTasks: ['Complete a full ready check with a partner', 'Explain one common interface failure point'],
        safetyPoints: ['Never skip facepiece fit and PASS checks before entry.'],
        commonMistakes: ['Rushing interfaces', 'Missing hood/glove overlap checks'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'ff1_tools',
        title: 'Hand tools + forcible entry basics',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Identify, carry, and use common hand tools safely.',
        whatToKnow: ['Ax, halligan, pike pole, maul uses', 'Tool placement and striking safety'],
        performanceTasks: ['Select tools for a simulated entry task', 'Demonstrate safe striking/ prying technique'],
        safetyPoints: ['Maintain tool control and clear swing zones.'],
        commonMistakes: ['Using the wrong tool for the task', 'Poor body position while forcing'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'ff1_hose',
        title: 'Attack line deployment',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Deploy a working attack line with good hose management.',
        whatToKnow: ['Preconnect selection', 'Flaking/charging discipline', 'Nozzle team communication'],
        performanceTasks: ['Deploy and charge a line to a simulated entry point', 'Manage kinks and door control'],
        safetyPoints: ['Watch for hose movement and maintain door control.'],
        commonMistakes: ['Charging before the line is set', 'Poor communication at the door'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _firefighter2() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'ff2_ventilation',
        title: 'Horizontal ventilation coordination',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Coordinate ventilation with fire attack and command.',
        whatToKnow: ['Vent timing relative to attack', 'Coordination with interior crews', 'Reading smoke conditions'],
        performanceTasks: ['Describe when and where you would vent for a given scenario', 'Practice coordinated radio communication'],
        safetyPoints: ['Confirm location and accountability before opening up.'],
        commonMistakes: ['Venting before water on fire', 'Poor coordination with interior crews'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'ff2_search',
        title: 'Primary search fundamentals',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Conduct a disciplined primary search with a partner.',
        whatToKnow: ['Search patterns', 'Thermal imaging basics if available', 'Tagging and orientation'],
        performanceTasks: ['Run a room-by-room search drill with a partner', 'Maintain contact and communication throughout'],
        safetyPoints: ['Maintain crew integrity and a continuous hoseline or lifeline where required by SOP.'],
        commonMistakes: ['Searching too fast without a system', 'Losing partner contact'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'ff2_rit',
        title: 'RIT / rescue mindset',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Understand rapid intervention preparation and packaging basics.',
        whatToKnow: ['RIT staging expectations', 'Air supply and packaging priorities', 'Mayday basics'],
        performanceTasks: ['Stage as RIT and rehearse a down-firefighter scenario', 'Practice air transfer / packaging steps per SOP'],
        safetyPoints: ['RIT is not a secondary attack crew unless assigned.'],
        commonMistakes: ['Staging without a plan', 'Skipping air/emergency priorities'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _fireOfficer1() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'fo1_sizeup',
        title: 'Initial size-up',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Deliver a concise size-up that drives the first actions.',
        whatToKnow: ['Building/use/occupancy clues', 'Smoke and fire conditions', 'Resource needs early'],
        performanceTasks: ['Deliver a size-up for a simulated incident', 'Identify the first three tactical priorities'],
        safetyPoints: ['Include life hazard and collapse/ egress concerns early.'],
        commonMistakes: ['Too much detail before the first actions', 'Missing rear/sides conditions'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'fo1_crew_assign',
        title: 'Crew assignments',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Assign crews with clear objectives and accountability.',
        whatToKnow: ['Span of control', 'PAR expectations', 'Staging and sector basics'],
        performanceTasks: ['Assign crews for a small structure scenario', 'Conduct a PAR after simulated progress'],
        safetyPoints: ['Every assignment needs a location, objective, and safety note.'],
        commonMistakes: ['Vague assignments', 'Failing to track crew locations'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'fo1_radio',
        title: 'Initial radio report',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Give a clear first-on-scene report that sets command up for success.',
        whatToKnow: ['Local report format', 'Command transfer expectations', 'Benchmark timing'],
        performanceTasks: ['Deliver an arrival report on radio or simulated net', 'Request additional resources with justification'],
        safetyPoints: ['Include working incident status and immediate hazards.'],
        commonMistakes: ['Talking too long on the first report', 'Forgetting unit identification'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _hazmatOperations() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'hz_ops_isolation',
        title: 'Isolation and zones',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Establish appropriate zones for a hazmat release.',
        whatToKnow: ['Hot/warm/cold concepts', 'Wind and terrain effects', 'Evacuation/shelter basics'],
        performanceTasks: ['Sketch zones for a simulated release', 'Explain entry team support needs'],
        safetyPoints: ['Do not enter the hot zone without appropriate PPE and assignment.'],
        commonMistakes: ['Underestimating downwind hazards', 'Poor access control'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'hz_ops_decon',
        title: 'Emergency decontamination',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Support gross and technical decon per local protocol.',
        whatToKnow: ['Decon corridor setup', 'Contamination reduction priorities', 'Monitoring handoff'],
        performanceTasks: ['Set up a basic decon corridor drill', 'Walk through responder decon steps'],
        safetyPoints: ['Protect uncontaminated responders and the public.'],
        commonMistakes: ['Cross-contamination at the cold line', 'Skipping monitoring'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'hz_ops_product_id',
        title: 'Product identification support',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Gather and communicate clues for product identification.',
        whatToKnow: ['Placards/labels/SDS basics', 'DOT guide use', 'Witness and container clues'],
        performanceTasks: ['Use ERG/guide tools for a simulated product', 'Report findings to command clearly'],
        safetyPoints: ['Treat unknown products as worst reasonable case until identified.'],
        commonMistakes: ['Guessing without evidence', 'Poor documentation of clues'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _fireInvestigator() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'inv_cert',
        title: 'Investigator certification path',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Confirm legal authority, training route, and documentation expectations.',
        whatToKnow: ['State/agency investigator requirements', 'Legal authority limits', 'Training hour categories'],
        performanceTasks: ['Map your agency investigator pathway', 'Identify required legal/training milestones'],
        safetyPoints: ['Do not exceed your legal authority or agency assignment.'],
        commonMistakes: ['Collecting evidence without authority', 'Skipping legal updates'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'inv_oc',
        title: 'Origin and cause process',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Follow a systematic origin-and-cause exam before forming conclusions.',
        whatToKnow: ['Scene safety and legal hold', 'Area of origin concepts', 'Documentation sequence'],
        performanceTasks: ['Walk through a mock scene using a systematic exam order', 'Document observations without conclusions first'],
        safetyPoints: ['Scene safety and legal authority come before conclusions.'],
        commonMistakes: ['Deciding cause too early', 'Poor scene documentation'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'inv_evidence',
        title: 'Evidence awareness',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Preserve and document evidence according to agency protocol.',
        whatToKnow: ['Preservation priorities', 'Photography sequence', 'Chain-of-custody basics'],
        performanceTasks: ['Photograph a mock scene with overall/mid/close views', 'Describe what you would preserve first'],
        safetyPoints: ['Follow agency and prosecutor guidance for evidence handling.'],
        commonMistakes: ['Disturbing evidence before documentation', 'Incomplete photo coverage'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _fireInspector1() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'prev_fi1',
        title: 'Fire Inspector I walk-through',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Conduct an organized occupancy inspection using local code references.',
        whatToKnow: ['Inspection sequence', 'Common occupancy hazards', 'Documentation standards'],
        performanceTasks: ['Perform a mock walk-through and note violations accurately', 'Explain corrective actions clearly'],
        safetyPoints: ['Use appropriate PPE and follow agency inspection safety rules.'],
        commonMistakes: ['Vague violation descriptions', 'Missing egress/extinguisher checks'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'prev_code',
        title: 'Fire code navigation',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Practice finding requirements in the adopted code set.',
        whatToKnow: ['Adopted code family in your AHJ', 'Common chapters for occupancies you inspect'],
        performanceTasks: ['Locate code sections for a sample violation', 'Explain how local amendments apply'],
        safetyPoints: ['Verify the AHJ-adopted edition before citing requirements.'],
        commonMistakes: ['Citing the wrong code edition', 'Quoting from memory without verification'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'prev_bldg',
        title: 'Building construction for inspectors',
        section: 'KNOWLEDGE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Connect construction features to fire behavior and inspection comments.',
        whatToKnow: ['Construction types', 'Compartmentation and openings', 'Protection systems basics'],
        performanceTasks: ['Identify construction features in photos or a walk-through', 'Link features to likely fire spread concerns'],
        safetyPoints: ['Do not guess construction type when documentation is available.'],
        commonMistakes: ['Missing concealed spaces', 'Ignoring fire-resistance continuity'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }

  static List<TaskBookTaskDefinition> _emtBasics() {
    const fireOps = 'FireOps Preparation Tasks';
    return const [
      TaskBookTaskDefinition(
        id: 'emt_assessment',
        title: 'Primary patient assessment',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Perform a systematic primary assessment and identify immediate threats.',
        whatToKnow: ['Scene safety / BSI', 'ABCDE approach', 'Transport decision factors'],
        performanceTasks: ['Run a primary assessment on a simulated patient', 'Verbalize findings and immediate interventions'],
        safetyPoints: ['Scene safety and standard precautions first.'],
        commonMistakes: ['Skipping scene size-up', 'Fixating on obvious injury and missing airway'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'emt_airway',
        title: 'Airway and breathing support',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Support airway and breathing within scope and medical direction.',
        whatToKnow: ['Positioning', 'Basic adjuncts if authorized', 'Oxygen delivery basics'],
        performanceTasks: ['Position and reassess a simulated airway problem', 'Select appropriate oxygen therapy per protocol'],
        safetyPoints: ['Follow scope, protocol, and medical direction.'],
        commonMistakes: ['Inadequate reassessment after intervention', 'Over-oxygenating without indication'],
        practiceTools: [],
        resources: [],
      ),
      TaskBookTaskDefinition(
        id: 'emt_trauma',
        title: 'Trauma assessment and immobilization',
        section: 'PERFORMANCE',
        goalId: null,
        requirementId: null,
        isCustom: false,
        fireOpsObjective: '$fireOps: Identify life threats and perform basic trauma care within scope.',
        whatToKnow: ['Mechanism of injury', 'Spine motion restriction concepts', 'Bleeding control priorities'],
        performanceTasks: ['Complete a rapid trauma assessment', 'Demonstrate bleeding control and packaging steps per protocol'],
        safetyPoints: ['Maintain spinal precautions when indicated by protocol.'],
        commonMistakes: ['Missing hidden blood loss', 'Delayed transport for non-critical interventions'],
        practiceTools: [],
        resources: [],
      ),
    ];
  }
}
