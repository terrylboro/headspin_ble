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
import { useEffect, useState } from 'react';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';
import { TreatmentStage } from '../types/treatmentTypes';
import AlignmentProgress from '../custom/alignmentProgress';

const POSITION_COUNT = 4;

type TreatmentScreenProps = {
  onBack: () => void;
};

export default function TreatmentScreen({
  onBack,
}: TreatmentScreenProps) {

  const treatment =  useTreatment();
  const [completionModalOpened, setCompletionModalOpened] = useState(false);
  const affectedEarImageLabel = treatment.state.affectedEar === 'right' ? 'Right' : 'Left';
  const isComplete = treatment.state.stage === TreatmentStage.COMPLETE;
  const isPositionTimeComplete = !isComplete && treatment.state.stageProgress >= 1;
  const currentPositionIndex = Math.min(treatment.state.stage, POSITION_COUNT - 1);
  const currentPositionNumber = currentPositionIndex + 1;
  const hasSideProfileImage = currentPositionNumber <= 3;
  const originalPositionImageSrc = `${process.env.PUBLIC_URL}/diagrams/Position ${currentPositionNumber} ${affectedEarImageLabel}.png`;
  const sideProfileImageSrc = `${process.env.PUBLIC_URL}/diagrams/Position ${currentPositionNumber} ${affectedEarImageLabel} Side Profile.png`;

  useEffect(() => {
    setCompletionModalOpened(treatment.state.stage === TreatmentStage.COMPLETE);
  }, [treatment.state.stage]);

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

              <Box mt="xs" pos="relative" style={{ flexShrink: 0 }}>
                <Progress
                  value={treatment.state.stageProgress * 100}
                  color={isComplete || isPositionTimeComplete ? "green" : "blue"}
                  animated={isComplete || isPositionTimeComplete}
                  size={28}
                  radius="xl"
                />
                {isPositionTimeComplete && (
                  <Text
                    size="sm"
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
                    Progress when dizziness subsides
                  </Text>
                )}
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
