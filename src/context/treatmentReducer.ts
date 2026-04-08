import { TreatmentState, Action, TreatmentStage } from '../types/treatmentTypes';

// const HOLD_DURATION_MS = 5000;
const ONE_MILLISECOND = 1000;

export const initialState: TreatmentState = {
  stage: TreatmentStage.STAGE_1,
  affectedCanal: 'posterior',
  affectedEar: null,
  isAligned: false,
  holdStartTime: null,
  holdDurationSec: 45,
  stageProgress: 0,
};

export function treatmentReducer(
  state: TreatmentState,
  action: Action
): TreatmentState {
  switch (action.type) {
    case 'SELECT_CANAL':
      return { ...state, affectedCanal: action.canal };

    case 'SELECT_EAR':
      return { ...state, affectedEar: action.ear };

    case 'TOGGLE_ALIGNED':
      return { ...state, isAligned: !state.isAligned };

    case 'SET_HOLD_DURATION':
      return { ...state, holdDurationSec: action.holdDuration};

    case 'ALIGNMENT_ENTER':
      if (state.stage !== TreatmentStage.COMPLETE) {
        return { ...state, isAligned: true, holdStartTime: Date.now() };
      }
      else return { ...state, stageProgress: 1 };

    case 'PROGRESS':
      return { ...state, stage: (state.stage < 3) ? (state.stage + 1) : TreatmentStage.COMPLETE };

    case 'TIMER_TICK': {
      if (state.holdStartTime) {
        const elapsed = action.now - state.holdStartTime;
        if (elapsed >= state.holdDurationSec*ONE_MILLISECOND) {
          return { ...state, stage: (state.stage < 3) ? (state.stage + 1) : TreatmentStage.COMPLETE, holdStartTime: null, isAligned: false, stageProgress: 0 };
        }
        return { ...state, stageProgress: elapsed / (state.holdDurationSec*ONE_MILLISECOND) };
      }
      return state;
    }

    case 'RESET_PROGRESS':
      return { ...state, stage: TreatmentStage.STAGE_1, holdStartTime: null, stageProgress: 0, isAligned: false,};

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}