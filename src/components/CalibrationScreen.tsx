import {
  Button,
  Card,
  Stack,
  Text,
  Flex,
  Box,
} from '@mantine/core';

import HeadRendering from  './HeadRendering';
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

  const { matrixRef, offsetMatrixRef, state} =  useTreatment();
  const selectedEarText = state.affectedEar
    ? `${state.affectedEar[0].toUpperCase()}${state.affectedEar.slice(1)} ear selected`
    : 'No ear selected';

  function calibrateOrientation() {
        const current = matrixRef.current.clone();
        offsetMatrixRef.current.copy(current).invert();
  }


  return (
    <Stack h="100%">
      <Flex gap="xl" wrap="nowrap" w="100%">

        <Box style={{ flex: 1, minWidth: 0, maxHeight: '60vh' }}>
          <InfoCard title="Get ready" imageSrc={process.env.PUBLIC_URL + '/diagrams/PrepPosition.jpeg'} textBody='Sit the patient upright with their legs on the treatment bed. Ensure they are looking straight ahead, then press the Recentre button to calibrate the headset.'/>
        </Box>

        <Box style={{ flex: 2, minWidth: 0, maxHeight: '60vh' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
            <Stack h="100%" align="center" justify="center">
              <Text fw={600}>Check calibration</Text>
              <Text size="sm" c="dimmed">{selectedEarText}</Text>

              <HeadRendering calibrateMode={true} />

              < Button fullWidth mt="md" onClick={calibrateOrientation}>
                Recentre
              </Button>

            </Stack>
          </Card>
        </Box>
      </Flex> 
      < Button fullWidth mt="md" onClick={onContinue}>
        Start Treatment
      </Button>
    </Stack>
  );
}
