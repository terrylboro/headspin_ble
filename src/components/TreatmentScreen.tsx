import {
  AppShell,
  Button,
  Card,
  Group,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';

import HeadRendering from  './HeadRendering';
import CanalRendering from './CanalRendering';
import { useTreatment } from '../context/TreatmentProvider';

type TreatmentScreenProps = {
  onBack: () => void;
};

export default function TreatmentScreen({
  onBack,
}: TreatmentScreenProps) {

  const treatment =  useTreatment();

  return (
    <Stack h="100%">
      <Group justify="space-between">
        <Title order={2}>Treatment</Title>
        <Button variant="light" onClick={onBack}>
          Back to setup
        </Button>
      </Group>

      <Group align="stretch" grow style={{ flex: 1 }}>
        <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
          <Stack h="100%">
            <Text fw={600}>3D model view</Text>
            <div
              style={{
                flex: 1,
                background: '#111',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* <Text c="dimmed">React Three Fiber canvas goes here</Text> */}

              <CanalRendering/>

            </div>
          </Stack>
        </Card>

        <Card withBorder shadow="sm" radius="md" style={{ flex: 2, minHeight: 480 }}>
          <Stack h="100%">
            <Text fw={600}>3D model view</Text>
            <div
              style={{
                flex: 1,
                background: '#111',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* <Text c="dimmed">React Three Fiber canvas goes here</Text> */}

              <HeadRendering/>

            </div>
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