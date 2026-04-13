import { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, Switch, Text, Title } from '@mantine/core';
import { useTreatment } from '../context/TreatmentProvider';
import ManualCanalRendering from './ManualCanalRendering';
import { TreatmentStage } from '../types/treatmentTypes';

export default function StateMachineTestPanel() {
  const {
    state,
    dispatch,
    stageProgress,
    affectedCanal,
    setAffectedCanal,
  } = useTreatment();

  return (
    < Group align="stretch" grow>
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="md">
        <Title order={4}>Debug controls</Title>

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
  );
}