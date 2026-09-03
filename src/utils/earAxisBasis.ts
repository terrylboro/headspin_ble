import { EarSide } from '../types/treatmentTypes';
import type { SensorToAnatomicalMatrix } from './sensorSegmentAlignment';

/**
 * Convert a sensor vector into the right-ear reference basis used by the app.
 * Mounting the device on the left ear reverses its Y and Z axes while leaving
 * X unchanged (equivalent to a 180-degree rotation around X).
 */
export function applyEarAxisBasis(
  x: number,
  y: number,
  z: number,
  sensorMountEar: EarSide
): [number, number, number] {
  return sensorMountEar === 'left' ? [x, -y, -z] : [x, y, z];
}

/** Fixed mounting rotation used as the sign reference for functional calibration. */
export function getEarAxisBasisMatrix(sensorMountEar: EarSide): SensorToAnatomicalMatrix {
  return sensorMountEar === 'left'
    ? [1, 0, 0, 0, -1, 0, 0, 0, -1]
    : [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
