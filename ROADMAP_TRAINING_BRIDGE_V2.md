# Responder Roadmap → FireOpsSim Training Bridge v2

## Product rule
Responder Roadmap defines the competency and remains the official record. FireOpsSim is the training engine that prepares the member to demonstrate it. A Roadmap training link must never dump a member on the FireOpsSim homepage or require browsing to find the assigned skill.

## Direct handoff contract
Roadmap should link directly to:

`/focus-drills.html?source=roadmap&level=<level>&topic=<competency>&goal=<task-book-goal>&task=<task-id>&return=<encoded-roadmap-url>`

FireOpsSim must use these values to:
1. Show a visible `Responder Roadmap Assignment` banner.
2. Select the correct certification/role level.
3. Find the strongest matching drill for the requested competency.
4. Open that drill automatically and scroll directly to the drill runner.
5. Preserve the Roadmap return URL.
6. On practice completion, clearly distinguish practice from official evaluator sign-off.
7. Provide one-tap `Return to Responder Roadmap` and `Ready for Evaluation` actions.

## Training module standard
A Roadmap-linked drill should be a mini instructor packet, not a short prompt. Each priority drill should include:
- competency/objective
- why the skill matters
- prerequisites
- equipment
- staffing/roles
- setup diagram or clear setup instructions where useful
- safety briefing / stop conditions
- scenario dispatch or operational context
- step-by-step evolution
- instructor cues
- at least one realistic complication/inject
- measurable evaluator checklist
- common errors and coaching corrections
- after-action questions
- harder second-rep option
- related study/calculator/simulator links
- `Ready for evaluation` handoff back to Roadmap

## First 10 deep modules
1. Attack-line deployment and advancement
2. Primary search
3. Ground ladders
4. Forcible entry
5. Ventilation coordination
6. Hydrant and water supply
7. Pump discharge pressure / pump operations
8. Standpipe operations
9. Mayday / RIT
10. Initial company officer operations

## Depth example: Attack-line deployment and advancement
Objective: Deploy, charge, advance and operate a 1¾-inch attack line while maintaining crew integrity, communication, hose management and nozzle control.

Scenario: First-due engine to a single-story residence with smoke showing from Division 1. Officer orders an interior attack through Side Alpha toward a reported rear-bedroom fire.

Equipment: Engine, 150–200 ft 1¾-inch attack line, department nozzle, PPE/SCBA, radio, door/cones/prop as available.

Evolution:
1. Size up stretch distance and select enough hose.
2. Deploy without creating avoidable hose piles or pinch points.
3. Stage at entry, communicate readiness and request water.
4. Bleed/check pattern as applicable and confirm usable stream.
5. Advance while managing corners, doorways and hose behind the nozzle team.
6. Maintain communication and crew integrity.
7. Flow/move according to department procedure and conditions.
8. Stop, communicate and correct any loss of water, kink, crew separation or unsafe condition.

Injects (select one): hose catches at doorway; significant kink reduces flow; simulated victim encountered; nozzle firefighter reports low air; fire location changes; water supply interruption.

Evaluator checks: appropriate line/stretch; hose positioned for advancement; clear water call; kinks corrected; nozzle controlled; crew integrity maintained; communications clear; inject handled appropriately; safe termination/exit.

AAR: What delayed water application? Where did hose movement become difficult? Did the crew anticipate pinch points? What one change will improve the next rep?

Second rep: Change entry point, add a turn/stair/door obstacle, or introduce an inject earlier.

## UX requirement
When `source=roadmap`, hide discovery friction. The assignment and matched drill should appear above the general library. The member should not need to choose a level, search, spin the wheel, or browse cards before beginning assigned practice.

## Data boundary
FireOpsSim practice completion is training evidence only unless/until Roadmap explicitly accepts it. Never imply that completing a FireOpsSim drill constitutes official department task-book sign-off.