import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { MathUtils, Vector3 } from 'three';

import { useTreatment } from '../context/TreatmentProvider';
import { InfoCard } from '../custom/infoCard';
import { applyEarAxisBasis } from '../utils/earAxisBasis';

const UPRIGHT_TOLERANCE_DEGREES = 30;
const WORLD_UP_AXIS = new Vector3(0, 0, 1);

type CalibrationScreenProps = {
  onBack: () => void;
  onContinue: ()=> void;
  startRequestId: number | null;
  onStartRequestHandled: () => void;
};

export default function CalibrationScreen({
  onBack,
  onContinue,
  startRequestId,
  onStartRequestHandled,
}: CalibrationScreenProps) {

  const { latestImuSample, calibrateOffset, startRecording, state } = useTreatment();
  const [orientationError, setOrientationError] = useState<string | null>(null);
  // The original "Left" assets face right, while the mirrored "Right" assets
  // face left. Select by facing direction so it matches the affected ear.
  const affectedEarImageLabel = state.affectedEar === 'right' ? 'Left' : 'Right';

  const handleStart = useCallback(() => {
    setOrientationError(null);

    if (!latestImuSample) {
      setOrientationError('Waiting for orientation data from the device.');
      return;
    }

    // Use the latest gravity reading rather than the filtered orientation matrix.
    // This responds immediately when the clinician removes and replaces the device;
    // the orientation filter can otherwise retain the previous inverted pose briefly.
    const [ax, ay, az] = applyEarAxisBasis(
      latestImuSample.ax,
      latestImuSample.ay,
      latestImuSample.az,
      state.affectedEar
    );
    const deviceUp = new Vector3(-ay, -az, ax);

    if (deviceUp.lengthSq() === 0) {
      setOrientationError('Waiting for a valid orientation reading from the device.');
      return;
    }

    deviceUp.normalize();
    const uprightThreshold = Math.cos(MathUtils.degToRad(UPRIGHT_TOLERANCE_DEGREES));

    if (deviceUp.dot(WORLD_UP_AXIS) < uprightThreshold) {
      setOrientationError(
        'The device does not appear to be upright. Check its position on the patient and ensure they are sitting upright and looking straight ahead.'
      );
      return;
    }

    calibrateOffset();
    startRecording();
    onContinue();
  }, [calibrateOffset, latestImuSample, onContinue, startRecording, state.affectedEar]);

  useEffect(() => {
    if (startRequestId === null) {
      return;
    }

    onStartRequestHandled();
    handleStart();
  }, [handleStart, onStartRequestHandled, startRequestId]);


  return (
    <Stack h="100%" gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" style={{ flex: 1 }}>
        <InfoCard
          title="Place the device"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/HeadSpin Device Placement ${affectedEarImageLabel}.png`}
          textBody="Ensure the device is sat above the patient's affected ear and fastened securely."
          titleTextSize="xl"
          bodyTextSize="lg"
        />

        <InfoCard
          title="Get ready"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/Calibration Get Ready Side Profile ${affectedEarImageLabel}.png`}
          textBody="Sit the patient upright with their legs on the bed. Ensure they are looking straight ahead."
          titleTextSize="xl"
          bodyTextSize="lg"
        />

        <InfoCard
          title="Commence Manoeuvre"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/Button Explanation.png`}
          textBody="Press the Start button on the device to begin the manoeuvre. During the manoeuvre, progress between positions using the device buttons."
          titleTextSize="xl"
          bodyTextSize="lg"
        />
      </SimpleGrid>

      {orientationError && (
        <Alert color="red" title="Check device orientation">
          {orientationError}
        </Alert>
      )}

      <Button size="lg" color="green" fullWidth onClick={handleStart}>
        Start
      </Button>
    </Stack>
  );
}
