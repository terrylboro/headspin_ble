import {
  Button,
  Group,
  SimpleGrid,
  Stack,
} from '@mantine/core';

import { useTreatment } from '../context/TreatmentProvider';
import { InfoCard } from '../custom/infoCard';

type CalibrationScreenProps = {
  onBack: () => void;
  onContinue: ()=> void;
};

export default function CalibrationScreen({
  onBack,
  onContinue,
}: CalibrationScreenProps) {

  const { matrixRef, offsetMatrixRef } = useTreatment();

  function calibrateOrientation() {
        const current = matrixRef.current.clone();
        offsetMatrixRef.current.copy(current).invert();
  }


  return (
    <Stack h="100%" gap="xl">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" style={{ flex: 1 }}>
        <InfoCard
          title="Place the device"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/HeadSpin Device Placement.png`}
          textBody="Place the device on the patient, with the device next to their ear."
        />

        <InfoCard
          title="Get ready"
          imageSrc={`${process.env.PUBLIC_URL}/diagrams/Calibration Get Ready Side Profile v2.png`}
          textBody="Sit the patient upright with their legs on the treatment bed. Ensure they are looking straight ahead, then press the Recentre button to calibrate the headset."
        />
      </SimpleGrid>

      <Group grow>
        <Button size="lg" onClick={calibrateOrientation}>
          Recentre
        </Button>
        <Button size="lg" color="green" onClick={onContinue}>
          Start Treatment
        </Button>
      </Group>
    </Stack>
  );
}
