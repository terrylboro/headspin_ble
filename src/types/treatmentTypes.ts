export enum TreatmentStage {
    STAGE_1,
    STAGE_2,
    STAGE_3,
    COMPLETE
}

export type CanalType = 'anterior' | 'posterior' | 'lateral';

export type TreatmentState = {
  stage: TreatmentStage;
  affectedCanal: CanalType | null;
  isAligned: boolean;
  holdStartTime: number | null;
  stageProgress: number;
};

export type Action =
  | { type: 'SELECT_CANAL'; canal: CanalType }
  | { type: 'TOGGLE_ALIGNED' }
  | { type: 'ALIGNMENT_ENTER'}
  | { type: 'PROGRESS'; }
  | { type: 'TIMER_TICK'; now: number }
  | { type: 'RESET' };