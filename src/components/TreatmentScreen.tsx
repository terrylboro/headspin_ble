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
  Slider,
  Switch,
} from '@mantine/core';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';
import ManualHeadRendering from '../test/ManualHeadRendering';
import ManualCanalRendering from '../test/ManualCanalRendering';
import { TreatmentStage, HoldDurationType } from '../types/treatmentTypes';
import AlignmentProgress from '../custom/alignmentProgress';

const sliderMarks = [
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

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

      {/* <Group align="stretch" grow style={{ flex: 1 }}> */}
      <Flex gap="xl" wrap="nowrap" w="100%">

        <Box style={{ flex: 1, minWidth: 0, maxHeight: '60vh' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 480 }}>
            <Stack h="100%">
              <Text fw={600}>Control</Text>

              <Text fw={600} >Hold time</Text>
              <Slider
                  defaultValue={45}
                  min={30} max={60}
                  step={15}
                  marks={sliderMarks}
                  label={(val) => sliderMarks.find((mark) => mark.value === val)!.label} 
                  onChange={(value) => treatment.dispatch({type: 'SET_HOLD_DURATION', holdDuration: value as HoldDurationType})}
              />

              <Switch mt="md" defaultChecked label="Show arrows" onChange={() => treatment.setShowGuidanceArrows(!treatment.showGuidanceArrows)}/>

              <Button mt="md" onClick={() => treatment.dispatch({ type: 'RESET_PROGRESS' })}>
                Restart Treatment
              </Button>

              <Button mt="md" onClick={() => treatment.dispatch({ type: 'SET_HOLD_DURATION', holdDuration: 5 as HoldDurationType  })}>
                Short Hold
              </Button>

              {/* <Button mt="md" onClick={() => {}}>
                Record
              </Button> */}

            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 3, minWidth: 0, maxHeight: '60vh' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
            <Stack h="100%" >
              <Text fw={600}>Canal Alignment</Text>
              {/* <Progress 
                value={treatment.alignmentRef!.current * 100}
                size="lg"
                radius="xl"
                striped
                animated
                styles={{
                  root: {
                    background: 'linear-gradient(90deg, red 0%, red 50%, orange 50%, orange 85%, green 85%, green 100%)',
                  }
                }}

              /> */}
              <AlignmentProgress score={treatment.alignmentRef!.current}/>
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

        <Box style={{ flex: 2, minWidth: 0, maxHeight: '60vh' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
            <Stack h="100%" >
              <Text fw={600}>Check calibration</Text>

              <HeadRendering calibrateMode={false} />

            </Stack>
          </Card>
        </Box>
      </Flex> 

      <Card withBorder shadow="sm" radius="md">
        <Text fw={600}>Progress</Text>
        < Stepper active={treatment.state.stage} mt="md" size="md" radius="xl" color={(treatment.state.stage === TreatmentStage.COMPLETE) ? "green" : "blue"} styles={{ step: { cursor: "default" } }}>
          <Stepper.Step label="Position 1" />
          <Stepper.Step label="Position 2" />
          <Stepper.Step label="Position 3" />
          <Stepper.Step label="Position 4" />
        </Stepper>
        < Progress value={treatment.state.stageProgress * 100}
          color={treatment.state.stage === TreatmentStage.COMPLETE ? "green" : "blue"}
          animated = {treatment.state.stage === TreatmentStage.COMPLETE}
          mt="md" size="xl" radius="xl" />
        
      </Card>
    </Stack>
  );
}

// Useful components
// {/* <Card withBorder shadow="sm" radius="md">
//         <Text fw={600}>Latest data</Text>
//         <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
//         <Text>{treatment.latestSampleText}</Text>
//         </Card> */}