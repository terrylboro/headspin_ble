import {
  AppShell,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Title,
  Stepper,
  Grid,
  Flex,
  Box,
} from '@mantine/core';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';
import ManualHeadRendering from '../test/ManualHeadRendering';
import ManualCanalRendering from '../test/ManualCanalRendering';
import { TreatmentStage } from '../types/treatmentTypes';

type TreatmentScreenProps = {
  onBack: () => void;
};

export default function TreatmentScreen({
  onBack,
}: TreatmentScreenProps) {

  const treatment =  useTreatment();

  function calibrateOrientation() {
        const current = treatment.matrixRef.current.clone();
        treatment.offsetMatrixRef.current.copy(current).invert();
  }

  return (
    <Stack h="100%">

      <Card withBorder shadow="sm" radius="md">
        <Text fw={600}>Progress</Text>
        < Progress value={treatment.state.stageProgress * 100}
          color={treatment.state.stage === TreatmentStage.COMPLETE ? "green" : "blue"}
          animated = {treatment.state.stage === TreatmentStage.COMPLETE}
          mt="md" size="xl" radius="xl" />
        < Stepper active={treatment.state.stage} mt="md" size="md" radius="xl" color={(treatment.state.stage === TreatmentStage.COMPLETE) ? "green" : "blue"} styles={{ step: { cursor: "default" } }}>
          <Stepper.Step label="Stage 1" />
          <Stepper.Step label="Stage 2" />
          <Stepper.Step label="Stage 3" />
          {/* <Stepper.Completed ></Stepper.Completed> */}
        </Stepper>
      </Card>

      {/* <Group align="stretch" grow style={{ flex: 1 }}> */}
      <Flex gap="xl" wrap="nowrap" w="100%">

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 480 }}>
            <Stack h="100%">
              <Text fw={600}>Control</Text>

              <Button mt="md" onClick={() => treatment.dispatch({ type: 'RESET_PROGRESS' })}>
                Restart Treatment
              </Button>

              <Button mt="md" onClick={() => {}}>
                Record
              </Button>

            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 3, minWidth: 0 }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
            <Stack h="100%" >
              <Text fw={600}>Canal Alignment</Text>
              <div
                style={{
                  flex: 1,
                  background: 'BACKGR_COLOUR_CSS',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >

                <CanalRendering/>

              </div>

              {/* <Text size="lg" >{(alignmentRef.current * 100).toFixed(1)}%</Text> */}
            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 2, minWidth: 0 }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
            <Stack h="100%" align="center" justify="center">
              <Text fw={600}>Check calibration</Text>

              <HeadRendering/>

              < Button fullWidth mt="md" onClick={calibrateOrientation}>
                Recentre
              </Button>

            </Stack>
          </Card>
        </Box>
      </Flex> 
    </Stack>
  );
}

// Useful components
// {/* <Card withBorder shadow="sm" radius="md">
//         <Text fw={600}>Latest data</Text>
//         <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
//         <Text>{treatment.latestSampleText}</Text>
//         </Card> */}