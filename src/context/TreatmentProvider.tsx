import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useReducer,
} from 'react';
// import * as THREE from 'three';
import { Matrix4, Quaternion } from 'three';
import { useBleDevice } from './BleProvider';
import { decodeNumericIMUPacket } from '../utils/imuDecoder';

// Import your existing Madgwick module here
// Example only — replace with your actual import:
import { MadgwickFilter } from '../utils/madgwickFilter';
import { changeQuaternionBase } from '../utils/changeBase';

import { treatmentReducer, initialState } from './treatmentReducer';
import { TreatmentState, Action, EarSide, CanalType } from '../types/treatmentTypes';

// export type EarSide = 'left' | 'right' | null;
// export type CanalType = 'anterior' | 'posterior' | 'lateral' | null;



// export enum TreatmentStage {
//   STAGE_1,
//   STAGE_2,
//   STAGE_3
// }

type TreatmentContextValue = {
  affectedEar: EarSide;
  setAffectedEar: (ear: EarSide) => void;

  affectedCanal: CanalType;
  setAffectedCanal: (canal: CanalType) => void;

  selectedCanals: string[];
  setSelectedCanals: (canals: string[]) => void;

  alignedRef: React.MutableRefObject<boolean>;
  // setAlignedRef: (value: boolean) => void;

  showGuidanceArrows : boolean;
  setShowGuidanceArrows: (value: boolean) => void;

  alignmentRef: React.MutableRefObject<number> | null;

  resetTime: number | null;
  setResetTime: (time: number | null) => void;

  stageProgress: number;
  setStageProgress: (progress: number) => void;

  state: TreatmentState;
  dispatch: React.Dispatch<Action>;

  isTreating: boolean;
  setIsTreating: (value: boolean) => void;

  latestSampleText: string;

  rollValue: number;
  pitchValue: number;
  yawValue: number;

  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;

  matrixRef: React.MutableRefObject<Matrix4>;
  offsetMatrixRef: React.MutableRefObject<Matrix4>;

  calibrateOffset: () => void;
  startTreatment: () => void;
  stopTreatment: () => void;
  resetTreatment: () => void;
};

type RecordedImuSample = {
  timestamp: number;
  relativeTimestampMs: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  roll: number;
  pitch: number;
  yaw: number;
};

const TreatmentContext = createContext<TreatmentContextValue | null>(null);

/**
 * Replace this with your real treatment rule.
 * This function takes your distilled orientation/alignment info
 * and maps it to UI-oriented treatment state.
 */


export function TreatmentProvider({children,}: {children: React.ReactNode;}) {

  // Instantiate the reducer to manage the app state
  const [state, dispatch] = useReducer(treatmentReducer, initialState);

  // Access BLE data from provider
  const ble = useBleDevice();

  const [affectedEar, setAffectedEar] = useState<EarSide>(null);
  const [affectedCanal, setAffectedCanal] = useState<CanalType>('posterior');
  const [selectedCanals, setSelectedCanals] = useState<string[]>([]);

  // const [alignment, setAlignment] = useState<AlignmentState>('idle');
  const [resetTime, setResetTime] = useState<number | null>(null);

  const [stageProgress, setStageProgress] = useState(0);
  // const [currentStage, setCurrentStage] = useState<TreatmentStage>(TreatmentStage.STAGE_1);
  const [isTreating, setIsTreating] = useState(false);

  const [latestSampleText, setLatestSampleText] = useState('Waiting for data');

  const [showGuidanceArrows, setShowGuidanceArrows] = useState(true);

  const [rollValue, setRollValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(0);
  const [yawValue, setYawValue] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const matrixRef = useRef(new Matrix4());
  const offsetMatrixRef = useRef(new Matrix4());
  const recordedSamplesRef = useRef<RecordedImuSample[]>([]);
  const recordingStartTimestampRef = useRef<number | null>(null);

  const alignmentRef = useRef(0);
  // const [alignedRef, setAlignedRef] = useState(false);
  const alignedRef = useRef<boolean>(false);

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
    // setCurrentStage('calibration');
    // setAlignment('aligned');
    setResetTime(Date.now());
  }, []);

  const startTreatment = useCallback(() => {
    setIsTreating(true);
    // setCurrentStage('alignment');
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

    // setAlignment('idle');
    setResetTime(Date.now());
    setStageProgress(0);
    setLatestSampleText('Waiting for data');

    matrixRef.current.identity();
    offsetMatrixRef.current.identity();

    holdStartRef.current = null;
  }, []);

  const downloadRecording = useCallback((samples: RecordedImuSample[]) => {
    if (samples.length === 0) {
      return;
    }

    const now = new Date();
    const twoDigits = (value: number) => value.toString().padStart(2, '0');
    const formattedTimestamp = [
      twoDigits(now.getMonth() + 1),
      twoDigits(now.getDate()),
      twoDigits(now.getHours()),
      twoDigits(now.getMinutes()),
      twoDigits(now.getSeconds()),
    ];

    const header = ['timestamp', 'relative_timestamp_ms', 'ax', 'ay', 'az', 'gx', 'gy', 'gz', 'roll_deg', 'pitch_deg', 'yaw_deg'];
    const rows = samples.map((sample) => [
      sample.timestamp,
      sample.relativeTimestampMs,
      sample.ax,
      sample.ay,
      sample.az,
      sample.gx,
      sample.gy,
      sample.gz,
      sample.roll,
      sample.pitch,
      sample.yaw,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `imu-recording-${formattedTimestamp[0]}-${formattedTimestamp[1]}-${formattedTimestamp[2]}:${formattedTimestamp[3]}:${formattedTimestamp[4]}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }, []);

  const startRecording = useCallback(() => {
    recordedSamplesRef.current = [];
    recordingStartTimestampRef.current = null;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    downloadRecording(recordedSamplesRef.current);
    recordedSamplesRef.current = [];
    recordingStartTimestampRef.current = null;
  }, [downloadRecording]);

  // Timer checking action for hold-based progression logic
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'TIMER_TICK', now: Date.now() });
    }, 50); // ~20Hz

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const latestMessage = ble.latestMessage;
    if (!latestMessage) return;

    if (lastProcessedTimestampRef.current === latestMessage.timestamp) return;
    lastProcessedTimestampRef.current = latestMessage.timestamp;

    const dataArr = decodeNumericIMUPacket(latestMessage.data);

    // console.log(dataArr);

    
    
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
    // Attempt to map IMU co-ordinates to madgwick co-ordinates
      const filtPos = madgwickRef.current.update(-dataArr[1]*9.81, -dataArr[2]*9.81, dataArr[0]*9.81, -dataArr[4], -dataArr[5], dataArr[3], 0.01);

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
        changeQuaternionBase(mat, quat);
        /**
         * 3) Update the live matrix ref used by your 3D rendering.
         * The render code can consume this without frequent React re-renders.
         */
        matrixRef.current.copy(mat);

        setLatestSampleText(`Received data: ${dataArr.map((v) => v.toFixed(2)).join(' | ')} | ${filtPos.roll.toFixed(3)} | ${filtPos.pitch.toFixed(3)} | ${filtPos.yaw.toFixed(3)}`);

        setRollValue(filtPos.roll);
        setPitchValue(filtPos.pitch);
        setYawValue(filtPos.yaw);

        if (isRecording) {
          if (recordingStartTimestampRef.current === null) {
            recordingStartTimestampRef.current = latestMessage.timestamp;
          }

          recordedSamplesRef.current.push({
            timestamp: latestMessage.timestamp,
            relativeTimestampMs: latestMessage.timestamp - recordingStartTimestampRef.current,
            ax: dataArr[0],
            ay: dataArr[1],
            az: dataArr[2],
            gx: dataArr[3],
            gy: dataArr[4],
            gz: dataArr[5],
            roll: filtPos.roll * 180 / Math.PI,
            pitch: filtPos.pitch * 180 / Math.PI,
            yaw: filtPos.yaw * 180 / Math.PI,
          });
        }

        // console.log(matrixRef.current);

      /**
       * 4) Distill orientation into alignment / progress state.
       * Replace evaluateAlignmentFromDistilledPose with your real treatment rule.
       */
      

      /**
       * 5) Stage logic.
       * Replace this section with your exact treatment progression rules.
       */
      
  }, [ble.latestMessage, isTreating, state]);

  const value = useMemo<TreatmentContextValue>(
    () => ({
      affectedEar,
      setAffectedEar,

      affectedCanal,
      setAffectedCanal,

      selectedCanals,
      setSelectedCanals,

      alignmentRef,

      alignedRef,
      // setAlignedRef,

      showGuidanceArrows,
      setShowGuidanceArrows,

      resetTime,
      setResetTime,

      stageProgress,
      setStageProgress,

      state,
      dispatch,

      isTreating,
      setIsTreating,

      latestSampleText,

      rollValue,
      pitchValue,
      yawValue,
      isRecording,
      startRecording,
      stopRecording,

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
      alignmentRef,
      resetTime,
      stageProgress,
      state,
      dispatch,
      isTreating,
      latestSampleText,
      rollValue,
      pitchValue,
      yawValue,
      isRecording,
      startRecording,
      stopRecording,
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
