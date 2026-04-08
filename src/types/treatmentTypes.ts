export enum TreatmentStage {
    STAGE_1,
    STAGE_2,
    STAGE_3,
    STAGE_4,
    COMPLETE
}

export type CanalType = 'anterior' | 'posterior' | 'lateral';
export type EarSide = 'left' | 'right' | null;
export type HoldDurationType = 5 | 45 | 60;

export type TreatmentState = {
  stage: TreatmentStage;
  affectedCanal: CanalType | null;
  affectedEar: EarSide | null;
  isAligned: boolean;
  holdStartTime: number | null;
  holdDurationSec: HoldDurationType;
  stageProgress: number;
};

export type Action =
  | { type: 'SELECT_CANAL'; canal: CanalType }
  | { type: 'SELECT_EAR'; ear: EarSide }
  | { type: 'TOGGLE_ALIGNED' }
  | { type: 'SET_HOLD_DURATION'; holdDuration: HoldDurationType }
  | { type: 'ALIGNMENT_ENTER'}
  | { type: 'PROGRESS'; }
  | { type: 'TIMER_TICK'; now: number }
  | { type: 'RESET_PROGRESS' }
  | { type: 'RESET' };