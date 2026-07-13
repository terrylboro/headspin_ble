import {
  AppShell,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Stepper,
  Flex,
  Box,
  Slider,
  Image,
  Modal,
} from '@mantine/core';
import { useEffect, useState } from 'react';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';
import { TreatmentStage, HoldDurationType } from '../types/treatmentTypes';
import AlignmentProgress from '../custom/alignmentProgress';

const sliderMarks = [
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

const SHOW_SHORT_HOLD_DEMO = false;

const treatmentSteps = [
  {
    label: 'Position 1',
  },
  {
    label: 'Position 2',
  },
  {
    label: 'Position 3',
  },
  {
    label: 'Position 4',
  },
];

type TreatmentScreenProps = {
  onBack: () => void;
};

export default function TreatmentScreen({
  onBack,
}: TreatmentScreenProps) {

  const treatment =  useTreatment();
  const [selectedHoldDuration, setSelectedHoldDuration] = useState<HoldDurationType>(
    treatment.state.holdDurationSec === 5 ? 45 : treatment.state.holdDurationSec
  );
  const [isShortHoldDemo, setIsShortHoldDemo] = useState(false);
  const [completionModalOpened, setCompletionModalOpened] = useState(false);
  const affectedEarImageLabel = treatment.state.affectedEar === 'right' ? 'Right' : 'Left';

  useEffect(() => {
    setCompletionModalOpened(treatment.state.stage === TreatmentStage.COMPLETE);
  }, [treatment.state.stage]);

  function calibrateOrientation() {
        const current = treatment.matrixRef.current.clone();
        treatment.offsetMatrixRef.current.copy(current).invert();
  }

  function handleShortHoldDemoToggle() {
    setIsShortHoldDemo((isEnabled) => {
      const nextIsEnabled = !isEnabled;
      treatment.dispatch({
        type: 'SET_HOLD_DURATION',
        holdDuration: nextIsEnabled ? 5 : selectedHoldDuration,
      });
      return nextIsEnabled;
    });
  }

  function handleHoldDurationChange(value: number) {
    const holdDuration = value as HoldDurationType;
    setSelectedHoldDuration(holdDuration);

    if (!isShortHoldDemo) {
      treatment.dispatch({ type: 'SET_HOLD_DURATION', holdDuration });
    }
  }

  return (
    <Stack h="100%" style={{ minHeight: 0 }}>

      <Modal
        opened={completionModalOpened}
        onClose={() => setCompletionModalOpened(false)}
        title="Manoeuvre complete"
        centered
        size="lg"
      >
        <Text size="xl" fw={600} ta="center" py="lg">
          Manoeuvre completed - continue to hold here until dizziness subsides
        </Text>
      </Modal>

      {/* <Group align="stretch" grow style={{ flex: 1 }}> */}
      <Flex gap="xl" wrap="nowrap" w="100%" h="100%" align="stretch" style={{ minHeight: 0 }}>

        {/* <Card withBorder shadow="sm" radius="md">
        <Text fw={600}>Latest data</Text>
        <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
        <Text>{treatment.latestSampleText}</Text>
        </Card> */}

        <Box style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 480, height: '100%', overflow: 'hidden' }}>
            <Stack h="100%" style={{ minHeight: 0 }}>
              <Group justify="space-between" align="stretch">
                <Text fw={600}>Hold time</Text>
                
                {SHOW_SHORT_HOLD_DEMO && (
                  <Button size="xs" w={90} h={72}
                    variant={isShortHoldDemo ? "outline" : "light"}
                    color={isShortHoldDemo ? "green" : "blue"}
                    aria-pressed={isShortHoldDemo}
                    onClick={handleShortHoldDemoToggle}
                    styles={{label: { whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.15,},}}
                  >
                    Demo: Short Hold
                  </Button>
                )}
              </Group>
              
              <Slider
                  value={selectedHoldDuration}
                  min={30} max={60}
                  step={15}
                  marks={sliderMarks}
                  label={(val) => sliderMarks.find((mark) => mark.value === val)!.label} 
                  onChange={handleHoldDurationChange}
              />

              {/* <Switch mt="md" defaultChecked label="Show arrows" onChange={() => treatment.setShowGuidanceArrows(!treatment.showGuidanceArrows)}/> */}

              <Group grow mt="md">
                <Button onClick={() => treatment.dispatch({ type: 'RETURN_TO_PREVIOUS_STAGE' })}>
                  Previous Position
                </Button>

                <Button onClick={() => treatment.dispatch({ type: 'PROGRESS' })}>
                  Progress Position
                </Button>
              </Group>

              <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <Stepper
                  active={treatment.state.stage}
                  orientation="vertical"
                  mt="md"
                  size="sm"
                  radius="xl"
                  color={(treatment.state.stage === TreatmentStage.COMPLETE) ? "green" : "blue"}
                  styles={{ step: { cursor: "default" }, content: { paddingTop: 12 } }}
                >
                  {treatmentSteps.map((step, index) => (
                    <Stepper.Step
                      key={step.label}
                      label={step.label}
                      description={
                        <span style={{ display: 'block', marginTop: 8, width: '100%' }}>
                          {treatment.state.stage === index && (
                            <span
                              style={{
                                display: 'block',
                                width: '100%',
                                height: 'clamp(220px, 34vh, 420px)',
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid var(--mantine-color-gray-3)',
                                background: 'var(--mantine-color-gray-0)',
                              }}
                            >
                              <Image
                                src={`${process.env.PUBLIC_URL}/diagrams/Position ${index + 1} ${affectedEarImageLabel}.png`}
                                alt={step.label}
                                h="100%"
                                w="100%"
                                fit="contain"
                              />
                            </span>
                          )}
                        </span>
                      }
                    />
                  ))}
                  <Stepper.Completed>
                    <Text size="xl" >
                      End of manoeuvre
                    </Text>
                  </Stepper.Completed>
                </Stepper>
              </Box>

              

              {/* <Button mt="md" onClick={() => {}}>
                Record
              </Button> */}

            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 2, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 480, height: '100%' }}>
            <Stack h="100%" >
              <Group justify="space-between">
                <Text fw={600}>Canal Alignment</Text>
                <Text size="sm">{(treatment.alignmentRef!.current * 100).toFixed(0)}%</Text>
              </Group>
              {/* <Text fw={600}>Canal Alignment</Text> */}
              
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

              <Text fw={600}>Progress</Text>
              < Progress value={treatment.state.stageProgress * 100}
                color={treatment.state.stage === TreatmentStage.COMPLETE ? "green" : "blue"}
                animated = {treatment.state.stage === TreatmentStage.COMPLETE}
                mt="xs" size="xl" radius="xl" />
            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 2, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 480, height: '100%' }}>
            <Stack h="100%" >
              <Text fw={600}>Head Position</Text>

              <HeadRendering calibrateMode={false} />

            </Stack>
          </Card>
        </Box>
      </Flex> 

      {/* <Card withBorder shadow="sm" radius="md"> */}
        {/* <Text fw={600}>Progress</Text> */}
        {/* < Stepper active={treatment.state.stage} mt="md" size="md" radius="xl" color={(treatment.state.stage === TreatmentStage.COMPLETE) ? "green" : "blue"} styles={{ step: { cursor: "default" } }}>
          <Stepper.Step label="Position 1" />
          <Stepper.Step label="Position 2" />
          <Stepper.Step label="Position 3" />
          <Stepper.Step label="Position 4" />
        </Stepper> */}
        {/* < Progress value={treatment.state.stageProgress * 100}
          color={treatment.state.stage === TreatmentStage.COMPLETE ? "green" : "blue"}
          animated = {treatment.state.stage === TreatmentStage.COMPLETE}
          mt="md" size="xl" radius="xl" /> */}
        
      {/* </Card> */}

      
    </Stack>
  );
}

// Useful components
// {/* <Card withBorder shadow="sm" radius="md">
//         <Text fw={600}>Latest data</Text>
//         <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
//         <Text>{treatment.latestSampleText}</Text>
//         </Card> */}
