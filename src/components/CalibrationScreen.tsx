import { useState } from 'react';
import {
  Alert,
  Button,
  SimpleGrid,
  Stack,
} from '@mantine/core';
import { MathUtils, Vector3 } from 'three';

import { useTreatment } from '../context/TreatmentProvider';
import { InfoCard } from '../custom/infoCard';

const UPRIGHT_TOLERANCE_DEGREES = 30;
const WORLD_UP_AXIS = new Vector3(0, 0, 1);

type CalibrationScreenProps = {
  onBack: () => void;
  onContinue: ()=> void;
};

export default function CalibrationScreen({
  onBack,
  onContinue,
}: CalibrationScreenProps) {

  const { latestImuSample, calibrateOffset, state } = useTreatment();
  const [orientationError, setOrientationError] = useState<string | null>(null);
  // The original "Left" assets face right, while the mirrored "Right" assets
  // face left. Select by facing direction so it matches the affected ear.
  const affectedEarImageLabel = state.affectedEar === 'right' ? 'Left' : 'Right';

  function handleStart() {
    setOrientationError(null);

    if (!latestImuSample) {
      setOrientationError('Waiting for orientation data from the device.');
      return;
    }

    // Use the latest gravity reading rather than the filtered orientation matrix.
    // This responds immediately when the clinician removes and replaces the device;
    // the orientation filter can otherwise retain the previous inverted pose briefly.
    const deviceUp = new Vector3(
      -latestImuSample.ay,
      -latestImuSample.az,
      latestImuSample.ax
    );

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
    onContinue();
  }


  return (
    <Stack h="100%" gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" style={{ flex: 1 }}>
        <InfoCard
          title="Place the device"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/HeadSpin Device Placement ${affectedEarImageLabel}.png`}
          textBody="Place the device on the patient, ensuring the device is sat next to their affected ear."
        />

        <InfoCard
          title="Get ready"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/Calibration Get Ready Side Profile ${affectedEarImageLabel}.png`}
          textBody="Sit the patient upright with their legs on the bed. Ensure they are looking straight ahead, then press either the big button on the device or the Start button below to begin the manoeuvre."
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
