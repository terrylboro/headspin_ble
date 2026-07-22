import {
  AppShell,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Flex,
  Box,
  Image,
  Modal,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';
import { TreatmentStage } from '../types/treatmentTypes';
import AlignmentProgress from '../custom/alignmentProgress';

const POSITION_COUNT = 4;

type TreatmentScreenProps = {
  onBack: () => void;
  deviceConnected: boolean;
  onFinish: () => void | Promise<void>;
};

type CompletionPage = 'complete' | 'power-off' | 'disconnected';

export default function TreatmentScreen({
  onBack,
  deviceConnected,
  onFinish,
}: TreatmentScreenProps) {

  const treatment =  useTreatment();
  const treatmentStage = treatment.state.stage;
  const isRecording = treatment.isRecording;
  const stopRecording = treatment.stopRecording;
  const onFinishRef = useRef(onFinish);
  const [completionModalOpened, setCompletionModalOpened] = useState(false);
  const [completionPage, setCompletionPage] = useState<CompletionPage>('complete');
  const affectedEarImageLabel = treatment.state.affectedEar === 'right' ? 'Right' : 'Left';
  const isComplete = treatment.state.stage === TreatmentStage.COMPLETE;
  const isPositionTimeComplete = !isComplete && treatment.state.stageProgress >= 1;
  const currentPositionIndex = Math.min(treatment.state.stage, POSITION_COUNT - 1);
  const currentPositionNumber = currentPositionIndex + 1;
  const hasSideProfileImage = currentPositionNumber <= 3;
  const originalPositionImageSrc = `${process.env.PUBLIC_URL}/diagrams/Position ${currentPositionNumber} ${affectedEarImageLabel}.png`;
  const sideProfileImageSrc = `${process.env.PUBLIC_URL}/diagrams/Position ${currentPositionNumber} ${affectedEarImageLabel} Side Profile.png`;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const treatmentComplete = treatmentStage === TreatmentStage.COMPLETE;
    setCompletionModalOpened(treatmentComplete);

    if (treatmentComplete) {
      setCompletionPage('complete');
    }
  }, [treatmentStage]);

  useEffect(() => {
    const treatmentComplete = treatmentStage === TreatmentStage.COMPLETE;

    if (treatmentComplete && isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording, treatmentStage]);

  useEffect(() => {
    if (!completionModalOpened || completionPage !== 'power-off' || deviceConnected) {
      return;
    }

    setCompletionPage('disconnected');
  }, [completionModalOpened, completionPage, deviceConnected]);

  useEffect(() => {
    if (completionPage !== 'disconnected') {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      void onFinishRef.current();
    }, 1500);

    return () => window.clearTimeout(resetTimer);
  }, [completionPage]);

  function calibrateOrientation() {
        const current = treatment.matrixRef.current.clone();
        treatment.offsetMatrixRef.current.copy(current).invert();
  }

  return (
    <Stack
      h="calc(100vh - 92px)"
      style={{ minHeight: 0, overflow: 'hidden' }}
    >

      <Modal
        opened={completionModalOpened}
        onClose={() => {
          if (completionPage === 'complete') {
            setCompletionModalOpened(false);
          }
        }}
        withCloseButton={completionPage === 'complete'}
        closeOnClickOutside={completionPage === 'complete'}
        closeOnEscape={completionPage === 'complete'}
        title={completionPage === 'complete' ? 'Manoeuvre complete' : 'Turn off device'}
        centered
        size="lg"
      >
        {completionPage === 'complete' ? (
          <Stack>
            <Text size="xl" fw={600} ta="center" py="lg">
              Manoeuvre completed - continue to hold here until dizziness subsides
            </Text>
            <Button size="lg" color="green" fullWidth onClick={() => setCompletionPage('power-off')}>
              Finish
            </Button>
          </Stack>
        ) : completionPage === 'power-off' ? (
          <Stack align="center" py="lg">
            <Text size="xl" fw={600} ta="center">
              Turn the device off by pressing and holding both buttons together for 2 seconds
            </Text>
            <Text c="dimmed" ta="center">
              Waiting for the device to disconnect (this may take a few seconds)…
            </Text>
          </Stack>
        ) : (
          <Stack align="center" py="lg">
            <Text size="xl" fw={700} c="green.7" ta="center" role="status">
              Device disconnected
            </Text>
            <Text c="dimmed" ta="center">
              Returning to setup…
            </Text>
          </Stack>
        )}
      </Modal>

      {/* <Group align="stretch" grow style={{ flex: 1 }}> */}
      <Flex
        gap="md"
        wrap="nowrap"
        w="100%"
        h="100%"
        align="stretch"
        style={{ minHeight: 0, overflow: 'hidden' }}
      >

        {/* <Card withBorder shadow="sm" radius="md">
        <Text fw={600}>Latest data</Text>
        <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
        <Text>{treatment.latestSampleText}</Text>
        </Card> */}

        <Box style={{ flex: 3, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            <Stack h="100%" gap="sm" style={{ minHeight: 0 }}>
              {/* <Switch mt="md" defaultChecked label="Show arrows" onChange={() => treatment.setShowGuidanceArrows(!treatment.showGuidanceArrows)}/> */}

              <Group justify="space-between" align="flex-end" wrap="nowrap">
                <Box>
                  <Text fw={700} size="lg">
                    Position {currentPositionIndex + 1} of {POSITION_COUNT}
                  </Text>
                  {isComplete && (
                    <Text size="sm" c="green.7" fw={600}>
                      Final position complete
                    </Text>
                  )}
                </Box>
              </Group>

              <Group gap={6} wrap="nowrap" aria-label={`Position ${currentPositionIndex + 1} of ${POSITION_COUNT}`}>
                {Array.from({ length: POSITION_COUNT }, (_, index) => {
                  const isCompletedPosition = isComplete || index < currentPositionIndex;
                  const isCurrentPosition = !isComplete && index === currentPositionIndex;

                  return (
                    <Box
                      key={index}
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 999,
                        background: isCompletedPosition
                          ? 'var(--mantine-color-green-6)'
                          : isCurrentPosition
                            ? 'var(--mantine-color-blue-6)'
                            : 'var(--mantine-color-gray-3)',
                      }}
                    />
                  );
                })}
              </Group>

              <Box
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  borderRadius: 8,
                  border: '1px solid var(--mantine-color-gray-3)',
                  background: 'var(--mantine-color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack h="100%" w="100%" gap="xs" style={{ minHeight: 0 }}>
                  <Stack gap={2} style={{ flex: hasSideProfileImage ? 3 : 1, minHeight: 0 }}>
                    <Text size="xs" ta="left" lh={1} px="xs">
                      Back View
                    </Text>
                    <Image
                      src={originalPositionImageSrc}
                      alt={`Position ${currentPositionNumber} ${affectedEarImageLabel.toLowerCase()} overhead view`}
                      style={{ flex: 1, minHeight: 0 }}
                      w="100%"
                      fit="contain"
                    />
                  </Stack>

                  {hasSideProfileImage && (
                    <Stack gap={2} style={{ flex: 2, minHeight: 0 }}>
                      <Text size="xs" ta="left" lh={1} px="xs">
                        Side View
                      </Text>
                      <Image
                        src={sideProfileImageSrc}
                        alt={`Position ${currentPositionNumber} ${affectedEarImageLabel.toLowerCase()} side profile`}
                        style={{ flex: 1, minHeight: 0 }}
                        w="100%"
                        fit="contain"
                      />
                    </Stack>
                  )}
                </Stack>
              </Box>

              <Group grow>
                <Button onClick={() => treatment.dispatch({ type: 'RETURN_TO_PREVIOUS_STAGE' })}>
                  Previous
                </Button>

                <Button onClick={() => treatment.dispatch({ type: 'PROGRESS' })}>
                  Next
                </Button>
              </Group>

              {/* <Button mt="md" onClick={() => {}}>
                Record
              </Button> */}

            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 3.5, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            <Stack h="100%" style={{ minHeight: 0 }}>
              <Group justify="space-between">
                <Text fw={600}>Canal Alignment</Text>
                <Text size="sm">{(treatment.alignmentRef!.current * 100).toFixed(0)}%</Text>
              </Group>
              {/* <Text fw={600}>Canal Alignment</Text> */}
              
              <AlignmentProgress
                score={treatment.alignmentRef!.current}
                greenThreshold={
                  treatment.state.stage === TreatmentStage.STAGE_2 ? 75 : 85
                }
              />
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                  background: 'BACKGR_COLOUR_CSS',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >

                <CanalRendering/>
              </div>

              <Box style={{ flexShrink: 0, marginTop: -12 }}>
                <Text size="sm" fw={600} mb={2} mt={0}>
                  {isComplete || isPositionTimeComplete ? "" : "Time in Position"}
                </Text>
                <Box pos="relative">
                  <Progress
                    value={treatment.state.stageProgress * 100}
                    color={isComplete || isPositionTimeComplete ? "green" : "green"}
                    animated={isComplete || isPositionTimeComplete}
                    size={isComplete || isPositionTimeComplete ? 42 : 24}
                    radius="xl"
                  />
                  {isPositionTimeComplete && (
                    <Text
                      size="lg"
                      fw={700}
                      c="white"
                      ta="center"
                      pos="absolute"
                      inset={0}
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        lineHeight: 1,
                        pointerEvents: 'none',
                      }}
                    >
                      Press Next to progress when dizziness subsides
                    </Text>
                  )}
                </Box>
              </Box>
            </Stack>
          </Card>
        </Box>

        <Box style={{ flex: 3.5, minWidth: 0, display: 'flex' }}>
          <Card withBorder shadow="sm" radius="md" style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
            <Stack h="100%" style={{ minHeight: 0 }}>
              <Text fw={600}>Head Position</Text>

              <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <HeadRendering calibrateMode={false} />
              </Box>

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
