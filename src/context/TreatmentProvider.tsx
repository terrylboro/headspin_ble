import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
// import * as THREE from 'three';
import { Matrix4, Quaternion } from 'three';
import { useBleDevice } from './BleProvider';
import { decodeNumericIMUPacket } from '../utils/imuDecoder';

// Import your existing Madgwick module here
// Example only — replace with your actual import:
import { MadgwickFilter } from '../utils/madgwickFilter';

export type EarSide = 'left' | 'right' | null;
export type CanalType = 'anterior' | 'posterior' | 'horizontal' | null;
export type AlignmentState = 'idle' | 'aligning' | 'aligned' | 'misaligned';

export type TreatmentStage =
  | 'idle'
  | 'calibration'
  | 'alignment'
  | 'hold'
  | 'complete';

type TreatmentContextValue = {
  affectedEar: EarSide;
  setAffectedEar: (ear: EarSide) => void;

  affectedCanal: CanalType;
  setAffectedCanal: (canal: CanalType) => void;

  selectedCanals: string[];
  setSelectedCanals: (canals: string[]) => void;

  alignment: AlignmentState;
  setAlignment: (alignment: AlignmentState) => void;

  resetTime: number | null;
  setResetTime: (time: number | null) => void;

  stageProgress: number;
  setStageProgress: (progress: number) => void;

  currentStage: TreatmentStage;
  setCurrentStage: (stage: TreatmentStage) => void;

  isTreating: boolean;
  setIsTreating: (value: boolean) => void;

  latestSampleText: string;

  matrixRef: React.MutableRefObject<Matrix4>;
  offsetMatrixRef: React.MutableRefObject<Matrix4>;

  calibrateOffset: () => void;
  startTreatment: () => void;
  stopTreatment: () => void;
  resetTreatment: () => void;
};

const TreatmentContext = createContext<TreatmentContextValue | null>(null);

const STAGE_ORDER: TreatmentStage[] = [
  'idle',
  'calibration',
  'alignment',
  'hold',
  'complete',
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function advanceStage(stage: TreatmentStage): TreatmentStage {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) return stage;
  return STAGE_ORDER[index + 1];
}

/**
 * Replace this with your real treatment rule.
 * This function takes your distilled orientation/alignment info
 * and maps it to UI-oriented treatment state.
 */
function evaluateAlignmentFromDistilledPose(input: {
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
}) {
  const { rollDeg, pitchDeg } = input;

  // Example thresholds only — replace with your real logic
  const angleError = Math.sqrt(rollDeg * rollDeg + pitchDeg * pitchDeg);

  if (angleError < 5) {
    return { alignment: 'aligned' as AlignmentState, quality: 1 };
  }
  if (angleError < 12) {
    return { alignment: 'aligning' as AlignmentState, quality: 0.5 };
  }
  return { alignment: 'misaligned' as AlignmentState, quality: 0 };
}

export function TreatmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ble = useBleDevice();

  const [affectedEar, setAffectedEar] = useState<EarSide>(null);
  const [affectedCanal, setAffectedCanal] = useState<CanalType>(null);
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

  const [alignment, setAlignment] = useState<AlignmentState>('idle');
  const [resetTime, setResetTime] = useState<number | null>(null);

  const [stageProgress, setStageProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<TreatmentStage>('idle');
  const [isTreating, setIsTreating] = useState(false);

  const [latestSampleText, setLatestSampleText] = useState('Waiting for data');

  const matrixRef = useRef(new Matrix4());
  const offsetMatrixRef = useRef(new Matrix4());

  // Track the latest processed BLE message so we do not reprocess the same one
  const lastProcessedTimestampRef = useRef<number | null>(null);

  // Track hold timing for progress logic
  const holdStartRef = useRef<number | null>(null);

  // Optional: instantiate your Madgwick stateful filter once if needed
  // Replace this with your actual setup if your module is class-based or stateful.
  const madgwickRef = useRef<any>(null);

  useEffect(() => {
    // Example only.
    // If your Madgwick module requires initialization, do it here.
    madgwickRef.current = new MadgwickFilter(1/256, 0.1); // dt=1/256s, beta=0.1 (tune as needed for responsiveness vs noise)
    madgwickRef.current.init(0, 0, 9.81);
    // madgwickRef.current = madgwickFilter;
  }, []);

  const calibrateOffset = useCallback(() => {
    offsetMatrixRef.current.copy(matrixRef.current).invert();
    setCurrentStage('calibration');
    setAlignment('aligned');
    setResetTime(Date.now());
  }, []);

  const startTreatment = useCallback(() => {
    setIsTreating(true);
    setCurrentStage('alignment');
    setStageProgress(0);
    setResetTime(Date.now());
    holdStartRef.current = null;
  }, []);

  const stopTreatment = useCallback(() => {
    setIsTreating(false);
    holdStartRef.current = null;
  }, []);

  const resetTreatment = useCallback(() => {
    setIsTreating(false);

    setAlignment('idle');
    setResetTime(Date.now());
    setStageProgress(0);
    setCurrentStage('idle');
    setLatestSampleText('Waiting for data');

    matrixRef.current.identity();
    offsetMatrixRef.current.identity();

    holdStartRef.current = null;
  }, []);

  useEffect(() => {
    const latestMessage = ble.latestMessage;
    if (!latestMessage) return;

    if (lastProcessedTimestampRef.current === latestMessage.timestamp) return;
    lastProcessedTimestampRef.current = latestMessage.timestamp;

    const dataArr = decodeNumericIMUPacket(latestMessage.data);

    console.log(dataArr);
    
      /**
       * 2) Run your existing Madgwick module here.
       *
       * Replace this section with your actual module API.
       *
       * Examples of what you might already have:
       * - const q = madgwickRef.current.update(gx, gy, gz, ax, ay, az, dt)
       * - const pose = madgwickRef.current.getOrientation()
       * - const result = updateMadgwick(frame)
       */
    //   const filtPos = madgwickRef.current.update
    //     ? madgwickRef.current.update(dataArr[0], dataArr[1], dataArr[2], dataArr[3], dataArr[4], dataArr[5])
    //     : madgwickRef.current(dataArr[0], dataArr[1], dataArr[2], dataArr[3], dataArr[4], dataArr[5]);
    const filtPos = madgwickRef.current.update(dataArr[0]*9.81, dataArr[1]*9.81, dataArr[2]*9.81, dataArr[3], dataArr[4], dataArr[5], 0.01);

      /**
       * Expect your distilled output to provide orientation in some usable form.
       * Adapt these field names to your real output.
       *
       * Supported examples:
       * - quaternion: { w, x, y, z }
       * - euler: { rollDeg, pitchDeg, yawDeg }
       */

        const [w,x,y,z] = [filtPos.qw, filtPos.qx, filtPos.qy, filtPos.qz] as [number, number, number, number];
                  
        const quat = new Quaternion(x, y, z, w);  // this worked with MATLAB-calculated quaternion
        const mat = new Matrix4().makeRotationFromQuaternion(quat);
        /**
         * 3) Update the live matrix ref used by your 3D rendering.
         * The render code can consume this without frequent React re-renders.
         */
        matrixRef.current.copy(mat);
        // console.log(matrixRef.current);

      /**
       * 4) Distill orientation into alignment / progress state.
       * Replace evaluateAlignmentFromDistilledPose with your real treatment rule.
       */
      

      /**
       * 5) Stage logic.
       * Replace this section with your exact treatment progression rules.
       */
      
  }, [ble.latestMessage, isTreating, currentStage]);

  const value = useMemo<TreatmentContextValue>(
    () => ({
      affectedEar,
      setAffectedEar,

      affectedCanal,
      setAffectedCanal,

      selectedCanals,
      setSelectedCanals,

      alignment,
      setAlignment,

      resetTime,
      setResetTime,

      stageProgress,
      setStageProgress,

      currentStage,
      setCurrentStage,

      isTreating,
      setIsTreating,

      latestSampleText,

      matrixRef,
      offsetMatrixRef,

      calibrateOffset,
      startTreatment,
      stopTreatment,
      resetTreatment,
    }),
    [
      affectedEar,
      affectedCanal,
      selectedCanals,
      alignment,
      resetTime,
      stageProgress,
      currentStage,
      isTreating,
      latestSampleText,
      calibrateOffset,
      startTreatment,
      stopTreatment,
      resetTreatment,
    ]
  );

  return (
    <TreatmentContext.Provider value={value}>
      {children}
    </TreatmentContext.Provider>
  );
}

export function useTreatment() {
  const context = useContext(TreatmentContext);
  if (!context) {
    throw new Error('useTreatment must be used within a TreatmentProvider');
  }
  return context;
}