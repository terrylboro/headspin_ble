import { useState, useRef, useCallback, useEffect } from 'react';
import { PASS_THRESHOLD, TRANSITION_ALLOWANCE_TIME, PROGRESS_TIME } from '../utils/config';

export type ProgramState = 'RESET' | 'SELECT_CANAL' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_COMPLETE';

export interface StateMachineContext {
  affectedEar: 'left' | 'right' | 'unselected';
  affectedCanal: 'posterior' | 'anterior' | 'lateral' | 'all' | 'unselected';
  currentStage: number; // 1, 2, or 3
  alignment: number;
  passTime: number; // Time alignment has been above PASS_THRESHOLD
  resetTime: number; // Time alignment has been below PASS_THRESHOLD
  stage1Progress: number;
  stage2Progress: number;
  stage3Progress: number;
}

export interface StateMachineActions {
  selectCanal: (ear: 'left' | 'right' | 'unselected', canal: 'posterior' | 'anterior' | 'lateral' | 'unselected') => void;
  updateEar: (ear: 'left' | 'right' | 'unselected') => void;
  updateAlignment: (alignment: number) => void;
  resetToStart: () => void;
  advanceStage: () => void;
  returnToStage1: () => void;
  resetAllTimers: () => void;
}

const initialContext: StateMachineContext = {
  affectedEar: 'unselected',
  affectedCanal: 'unselected',
  currentStage: 1,
  alignment: 0,
  passTime: 0,
  resetTime: 0,
  stage1Progress: 0,
  stage2Progress: 0,
  stage3Progress: 0,
};

export const useStateMachine = () => {
  const [state, setState] = useState<ProgramState>('RESET');
  const [context, setContext] = useState<StateMachineContext>(initialContext);
  const lastAlignmentRef = useRef(0);
  const currentAlignmentRef = useRef(0);
  const alignmentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<ProgramState>('RESET');

  // Update selected ear and check if both ear and canal are now selected to transition to STAGE_1
  const updateEar = useCallback((ear: 'left' | 'right' | 'unselected') => {
    setContext((prev) => {
      const newContext = {
        ...prev,
        affectedEar: ear,
      };

      // If ear is being deselected and we're not in SELECT_CANAL, go back to SELECT_CANAL
      if (ear === 'unselected' && stateRef.current !== 'SELECT_CANAL' && stateRef.current !== 'RESET') {
        setState('SELECT_CANAL');
        stateRef.current = 'SELECT_CANAL';
      }
      // If ear is being selected and canal is already selected, go to STAGE_1
      else if (ear !== 'unselected' && prev.affectedCanal !== 'unselected') {
        setState('STAGE_1');
        stateRef.current = 'STAGE_1';
      }
      // Ear is selected but canal is unselected, or ear is unselected - stay in SELECT_CANAL
      else {
        setState('SELECT_CANAL');
        stateRef.current = 'SELECT_CANAL';
      }

      return newContext;
    });
  }, []);

  // Resets all context variables to 0
  const performReset = useCallback(() => {
    setContext(initialContext);
    setState('RESET');
    stateRef.current = 'RESET';
  }, []);

  // Transitions to SELECT_CANAL state, or to STAGE_1 if both ear and canal are selected
  const selectCanal = useCallback(
    (ear: 'left' | 'right' | 'unselected', canal: 'posterior' | 'anterior' | 'lateral' | 'unselected') => {
      setContext((prev) => ({
        ...prev,
        affectedEar: ear,
        affectedCanal: canal,
        currentStage: 1,
      }));

      // If canal is being deselected and we're not in SELECT_CANAL, go back to SELECT_CANAL
      if (canal === 'unselected' && stateRef.current !== 'SELECT_CANAL' && stateRef.current !== 'RESET') {
        setState('SELECT_CANAL');
        stateRef.current = 'SELECT_CANAL';
      }
      // If both ear and canal are selected and we're in SELECT_CANAL, go to STAGE_1
      else if (ear !== 'unselected' && canal !== 'unselected' && stateRef.current === 'SELECT_CANAL') {
        setState('STAGE_1');
        stateRef.current = 'STAGE_1';
      }
      // Otherwise stay in SELECT_CANAL
      else {
        setState('SELECT_CANAL');
        stateRef.current = 'SELECT_CANAL';
      }
    },
    []
  );

  // Updates alignment value (called whenever alignment changes)
  const updateAlignment = useCallback((alignment: number) => {
    currentAlignmentRef.current = alignment;
    setContext((prev) => ({
      ...prev,
      alignment,
    }));
  }, []);

  // Set up 150ms interval for timing increments and stage progression
  useEffect(() => {
    const incrementInterval = setInterval(() => {
      setContext((prev) => {
        const alignment = currentAlignmentRef.current;

        // Only process timing logic when both ear and canal have been selected and not in STAGE_COMPLETE
        if (prev.affectedCanal === 'unselected' || prev.affectedEar === 'unselected' || stateRef.current === 'STAGE_COMPLETE') {
          return prev;
        }

        const isAligned = alignment >= PASS_THRESHOLD;
        const wasAligned = lastAlignmentRef.current >= PASS_THRESHOLD;

        // Transition logic
        let newPassTime = prev.passTime;
        let newResetTime = prev.resetTime;

        if (isAligned && wasAligned) {
          // Alignment stays above threshold
          newPassTime = prev.passTime + 0.15;
        } else if (isAligned && !wasAligned) {
          // Alignment just crossed above threshold
          newPassTime = 0.15;
          newResetTime = 0;
        } else if (!isAligned && wasAligned) {
          // Alignment just went below threshold
          newResetTime = 0.15;
        } else {
          // Alignment stays below threshold
          newResetTime = prev.resetTime + 0.15;
        }

        lastAlignmentRef.current = alignment;

        // Check if passTime exceeds PROGRESS_TIME for stage advancement
        if (
          newPassTime >= PROGRESS_TIME &&
          (prev.currentStage === 1 || prev.currentStage === 2 || prev.currentStage === 3)
        ) {
          // Advance to next stage
          const nextStage = prev.currentStage < 3 ? prev.currentStage + 1 : prev.currentStage;
          newPassTime = 0;
          newResetTime = 0;

          // Update state machine based on current stage
          if (prev.currentStage === 1) {
            setState('STAGE_2');
            stateRef.current = 'STAGE_2';
          } else if (prev.currentStage === 2) {
            setState('STAGE_3');
            stateRef.current = 'STAGE_3';
          } else if (prev.currentStage === 3) {
            // Completed all stages, move to STAGE_COMPLETE
            setState('STAGE_COMPLETE');
            stateRef.current = 'STAGE_COMPLETE';
          }

          return {
            ...prev,
            alignment,
            passTime: newPassTime,
            resetTime: newResetTime,
            currentStage: nextStage,
            stage1Progress:
              prev.currentStage === 1 ? newPassTime / PROGRESS_TIME : prev.stage1Progress,
            stage2Progress:
              prev.currentStage === 2 ? newPassTime / PROGRESS_TIME : prev.stage2Progress,
            stage3Progress:
              prev.currentStage === 3 ? newPassTime / PROGRESS_TIME : prev.stage3Progress,
          };
        }

        // Check if resetTime exceeds TRANSITION_ALLOWANCE_TIME
        if (newResetTime >= TRANSITION_ALLOWANCE_TIME) {
          // Return to STAGE_1
          setState('STAGE_1');
          stateRef.current = 'STAGE_1';
          newPassTime = 0;
          newResetTime = 0;

          return {
            ...prev,
            alignment,
            passTime: 0,
            resetTime: 0,
            currentStage: 1,
            stage1Progress: 0,
            stage2Progress: 0,
            stage3Progress: 0,
          };
        }

        return {
          ...prev,
          alignment,
          passTime: newPassTime,
          resetTime: newResetTime,
          stage1Progress:
            prev.currentStage === 1 ? newPassTime / PROGRESS_TIME : prev.stage1Progress,
          stage2Progress:
            prev.currentStage === 2 ? newPassTime / PROGRESS_TIME : prev.stage2Progress,
          stage3Progress:
            prev.currentStage === 3 ? newPassTime / PROGRESS_TIME : prev.stage3Progress,
        };
      });
    }, 150); // Run every 150ms

    return () => clearInterval(incrementInterval);
  }, []);

  // Manually advance to next stage
  const advanceStage = useCallback(() => {
    setContext((prev) => {
      const nextStage = prev.currentStage < 3 ? prev.currentStage + 1 : prev.currentStage;
      return {
        ...prev,
        currentStage: nextStage,
        passTime: 0,
        resetTime: 0,
        stage1Progress: 0,
        stage2Progress: 0,
        stage3Progress: 0,
      };
    });

    setState((prevState) => {
      let nextState: ProgramState = prevState;
      if (prevState === 'STAGE_1') nextState = 'STAGE_2';
      else if (prevState === 'STAGE_2') nextState = 'STAGE_3';
      else if (prevState === 'STAGE_3') nextState = 'STAGE_COMPLETE';
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  // Return to STAGE_1 and reset timing variables
  const returnToStage1 = useCallback(() => {
    setContext((prev) => ({
      ...prev,
      currentStage: 1,
      passTime: 0,
      resetTime: 0,
      stage1Progress: 0,
      stage2Progress: 0,
      stage3Progress: 0,
    }));
    setState('STAGE_1');
    stateRef.current = 'STAGE_1';
  }, []);

  // Reset all timing variables
  const resetAllTimers = useCallback(() => {
    setContext((prev) => ({
      ...prev,
      passTime: 0,
      resetTime: 0,
      stage1Progress: 0,
      stage2Progress: 0,
      stage3Progress: 0,
    }));
  }, []);

  const actions: StateMachineActions = {
    selectCanal,
    updateEar,
    updateAlignment,
    resetToStart: performReset,
    advanceStage,
    returnToStage1,
    resetAllTimers,
  };

  return { state, context, actions };
};
