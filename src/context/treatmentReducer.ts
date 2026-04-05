import { TreatmentState, Action, TreatmentStage } from '../types/treatmentTypes';

const HOLD_DURATION_MS = 5000;

export const initialState: TreatmentState = {
  stage: TreatmentStage.STAGE_1,
  affectedCanal: 'posterior',
  isAligned: false,
  holdStartTime: null,
  stageProgress: 0,
};

export function treatmentReducer(
  state: TreatmentState,
  action: Action
): TreatmentState {
  switch (action.type) {
    case 'SELECT_CANAL':
      return { ...state, affectedCanal: action.canal };

    case 'TOGGLE_ALIGNED':
      return { ...state, isAligned: !state.isAligned };

    case 'ALIGNMENT_ENTER':
      return { ...state, holdStartTime: Date.now() };

    case 'PROGRESS':
      return { ...state, stage: (state.stage + 1) % 3 };

    case 'TIMER_TICK': {
      if (state.holdStartTime) {
        const elapsed = action.now - state.holdStartTime;
        if (elapsed >= HOLD_DURATION_MS) {
          return { ...state, stage: (state.stage + 1) % 3, holdStartTime: null, isAligned: false, stageProgress: 0 };
        }
        return { ...state, stageProgress: elapsed / HOLD_DURATION_MS };
      }
      return state;
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}