/**
 * STATE MACHINE DOCUMENTATION
 * 
 * This state machine controls the flow of the Epley maneuver program.
 * It manages transitions between states based on alignment feedback and timing.
 * 
 * ============================================================================
 * STATES
 * ============================================================================
 * 
 * RESET
 * -----
 * Initial state. All context variables are initialized to 0.
 * - affectedEar: 'right'
 * - affectedCanal: 'all'
 * - currentStage: 1
 * - alignment: 0
 * - passTime: 0 (time above PASS_THRESHOLD)
 * - resetTime: 0 (time below PASS_THRESHOLD)
 * - stage1Progress: 0
 * - stage2Progress: 0
 * - stage3Progress: 0
 * 
 * SELECT_CANAL
 * -----------
 * User selects which ear and canal to treat via the SelectWindow component.
 * Transitions immediately to STAGE_1 after selection.
 * 
 * STAGE_1, STAGE_2, STAGE_3
 * -----------------------
 * The three stages of the Epley maneuver.
 * Each stage has:
 * - A progress bar (stage1Progress, stage2Progress, stage3Progress)
 * - Progress fills the longer alignment stays above PASS_THRESHOLD
 * - Duration to complete: PROGRESS_TIME (10 seconds by default)
 * 
 * ============================================================================
 * TRANSITIONS
 * ============================================================================
 * 
 * RESET -> SELECT_CANAL
 * User begins by selecting a canal from SelectWindow
 * Call: actions.selectCanal(ear, canal)
 * After selection, automatically transitions to STAGE_1
 * 
 * STAGE_1 -> STAGE_2 -> STAGE_3
 * Triggered when passTime >= PROGRESS_TIME
 * passTime increments by 0.15 every 150ms while alignment >= PASS_THRESHOLD
 * passTime resets to 0 when alignment drops below PASS_THRESHOLD
 * 
 * STAGE_X -> STAGE_1 (Failure Recovery)
 * If alignment < PASS_THRESHOLD for longer than TRANSITION_ALLOWANCE_TIME:
 * - resetTime increments by 0.15 every 150ms
 * - When resetTime >= TRANSITION_ALLOWANCE_TIME (5 seconds):
 *   - Return to STAGE_1
 *   - Reset all timing variables (passTime, resetTime, progress bars)
 *   - User must restart the stage
 * 
 * STAGE_3 -> RESET
 * After completing STAGE_3, automatically returns to RESET state
 * User can then select a new canal or start again
 * 
 * ============================================================================
 * CONFIGURATION CONSTANTS
 * ============================================================================
 * 
 * From config.ts:
 * - PASS_THRESHOLD: 0.85 (alignment must exceed this to count as "aligned")
 * - PROGRESS_TIME: 10.0 seconds (time needed to complete each stage)
 * - TRANSITION_ALLOWANCE_TIME: 5.0 seconds (grace period before failing)
 * 
 * ============================================================================
 * PROGRESS BAR LOGIC
 * ============================================================================
 * 
 * Each stage has a progress bar (0 to 1):
 * progress = passTime / PROGRESS_TIME
 * 
 * - Increases when alignment >= PASS_THRESHOLD
 * - Resets to 0 if alignment < PASS_THRESHOLD for too long
 * - When progress reaches 1.0, stage advances automatically
 * 
 * ============================================================================
 * HOOK USAGE (useStateMachine)
 * ============================================================================
 * 
 * In your component:
 * const { state, context, actions } = useStateMachine();
 * 
 * STATE: 'RESET' | 'SELECT_CANAL' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3'
 * 
 * CONTEXT properties:
 * - affectedEar: 'left' | 'right'
 * - affectedCanal: 'posterior' | 'anterior' | 'lateral' | 'all'
 * - currentStage: 1 | 2 | 3
 * - alignment: number (0 to 1)
 * - passTime: number (seconds)
 * - resetTime: number (seconds)
 * - stage1Progress, stage2Progress, stage3Progress: number (0 to 1)
 * 
 * ACTIONS:
 * - selectCanal(ear, canal): Start treatment on specific ear/canal
 * - updateAlignment(alignment): Update alignment score (called automatically from App.tsx)
 * - resetToStart(): Reset to RESET state
 * - advanceStage(): Manually advance to next stage
 * - returnToStage1(): Return to STAGE_1 (manual failure recovery)
 * - resetAllTimers(): Clear all timing/progress values
 * 
 * ============================================================================
 * INTEGRATION WITH EXISTING CODE
 * ============================================================================
 * 
 * App.tsx:
 * --------
 * - Replaced individual useState calls with useStateMachine hook
 * - state machine now managed in useStateMachine.ts
 * - All props previously derived from React state now come from context
 * - alignmentRef changes trigger state machine updates via updateAlignment()
 * 
 * AlignmentDisplay.tsx:
 * --------------------
 * - Still receives same props (stage, stageCallback, alignmentRef, alignedRef)
 * - Progress bars can now be read directly from context
 * - stageCallback(true/false) calls advanceStage() or returnToStage1()
 * 
 * SelectWindow.tsx:
 * -----------------
 * - No changes needed
 * - canalCallback now calls actions.selectCanal()
 * 
 * ============================================================================
 * TESTING THE STATE MACHINE
 * ============================================================================
 * 
 * 1. Component renders in RESET state
 * 2. User selects posterior canal from SelectWindow
 * 3. State transitions: RESET -> SELECT_CANAL -> STAGE_1
 * 4. User aligns head; alignment score increases
 * 5. If alignment >= 0.85 for 10 seconds: STAGE_1 -> STAGE_2
 * 6. If alignment < 0.85 for > 5 seconds: automatic return to STAGE_1
 * 7. After STAGE_3 completes: STAGE_3 -> RESET
 * 
 * ============================================================================
 */

export {};
