import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Switch, Text, Title, Box, useMantineTheme } from '@mantine/core';
// import {LineChart} from '@mantine/charts';
import { useTreatment } from '../context/TreatmentProvider';
import ManualCanalRendering from './ManualCanalRendering';
import { TreatmentStage } from '../types/treatmentTypes';

import useSound from "use-sound"
// import { LineChart } from '';

type ResearchScreenTestProps = {
  bleStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  deviceName: string | null;
  bleError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function ResearchScreenTestPanel({
  bleStatus,
  deviceName,
  bleError,
  onConnect,
  onDisconnect,
}: ResearchScreenTestProps): JSX.Element {
  const {
    state,
    dispatch,
    stageProgress,
    affectedCanal,
    setAffectedCanal,
  } = useTreatment();

  const theme = useMantineTheme();
  const treatment = useTreatment();

  const [playAligned] = useSound(process.env.PUBLIC_URL + "/sounds/aligned.mp3")
  const [playNotAligned] = useSound(process.env.PUBLIC_URL + "/sounds/naligned.mp3")
  const [playNext] = useSound(process.env.PUBLIC_URL + "/sounds/stagedone.mp3")

  return (
    <Stack h="100%" gap="xl">
    < Group align="stretch" grow>
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Debug controls</Title>

        <Group>
            <Card withBorder shadow="sm" radius="md" p="xl"
                h="100%" w="100%" style={{ minHeight: 120 }} >
                <Stack h="100%" justify="space-between" align="stretch">

                <Button fullWidth size="xl" onClick={onConnect} loading={bleStatus === 'connecting'} color={bleStatus === 'connected' ? theme.colors.green[6] : theme.colors.blue[6]}>
                    {bleStatus === 'connected' ? 'Device Connected' : 'Connect Device'}
                </Button>

                {/* <LineChart
                    h={320}
                    data={data}
                    dataKey="time"
                    withLegend
                    curveType="monotone"
                    yAxisLabel="Value"
                    xAxisLabel="Time"
                    series={[
                    { name: 'temperature', color: 'red.6', label: 'Temperature' },
                    { name: 'pressure', color: 'blue.6', label: 'Pressure' },
                    ]}
                /> */}

                </Stack>
            </Card>
        </Group>

        <Stack gap={4}>
          <Text size="sm">Stage: {TreatmentStage[state.stage]}</Text>
          <Text size="sm">Progress: {(state.stageProgress * 100).toFixed(1)}%</Text>
          <Text size="sm">Canal: {state.affectedCanal}</Text>
          <Text size="sm">Side: {state.affectedEar}</Text>
        </Stack>

        <Group>
          <Button onClick={() => dispatch({ type: 'PROGRESS' })}>
            Progress
          </Button>
          
          <Button color="red" variant="light" onClick={() => dispatch({ type: 'RESET' })}>
            Reset
          </Button>

          <Button variant={state.affectedEar === 'left' ? 'filled' : 'light'}
            onClick={() => dispatch({ type: 'SELECT_EAR', ear: 'left' })}
          >
            Left Ear
          </Button>
          <Button variant={state.affectedEar === 'right' ? 'filled' : 'light'}
            onClick={() => dispatch({ type: 'SELECT_EAR', ear: 'right' })}
          >
            Right Ear
          </Button>
        </Group>

        <Group>
          <Button
            variant={state.affectedCanal === 'anterior' ? 'filled' : 'light'}
            onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'anterior' })}
          >
            Anterior
          </Button>
          <Button
            variant={state.affectedCanal === 'posterior' ? 'filled' : 'light'}
            onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'posterior' })}
          >
            Posterior
          </Button>
          <Button
            variant={state.affectedCanal === 'lateral' ? 'filled' : 'light'}
            onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'lateral' })}
          >
            Lateral
          </Button>
        </Group>

        <Group>
          <Button onClick={() => playAligned()} >
            Aligned Sound
          </Button>
          <Button onClick={() => playNotAligned()} >
            NAligned Sound
          </Button>
          <Button onClick={() => playNext()} >
            Progress Sound
          </Button>
        </Group>


        <Button
        variant='filled'
        onClick={() => {}}
        >
        Record
        </Button>

        <Button variant={state.isAligned ? 'filled' : 'light'}
          onClick={() => dispatch({ type: 'TOGGLE_ALIGNED' })}
        >
          Toggle Aligned
        </Button>

        <Button variant={state.isAligned ? 'filled' : 'light'}
          onClick={() => dispatch({ type: 'ALIGNMENT_ENTER' })}
        >
          Start Timer
        </Button>
      </Stack>
    </Card>

    < Card withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Canal rendering</Title>
        <ManualCanalRendering />
      </Stack>
    </Card>
  </Group>

 <Card withBorder shadow="sm" radius="md">
         <Text fw={600}>Latest data</Text>
         <Text fw={600}>aX | aY | aZ | gX | gY | gZ | Roll | Pitch | Yaw</Text>
         <Text>{treatment.latestSampleText}</Text>
         </Card>
  </Stack>
  );
}