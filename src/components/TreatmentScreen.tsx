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
import { useTreatment } from '../context/TreatmentProvider';

type TreatmentScreenProps = {
  selectedCanals: string[];
  progress: number;
  latestSampleText: string;
  onBack: () => void;
};

export default function TreatmentScreen({
  selectedCanals,
  progress,
  latestSampleText,
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

              <HeadRendering/>

            </div>
          </Stack>
        </Card>

        <Stack style={{ flex: 1 }}>
          <Card withBorder shadow="sm" radius="md">
            <Stack gap="xs">
              <Text fw={600}>Selected canals</Text>
              <Text size="sm">{selectedCanals.join(', ')}</Text>
            </Stack>
          </Card>

          <Card withBorder shadow="sm" radius="md">
            <Stack gap="xs">
              <Text fw={600}>Progress</Text>
              <Progress value={progress} />
              <Text size="sm">{progress}% complete</Text>
            </Stack>
          </Card>

          <Card withBorder shadow="sm" radius="md">
            <Stack gap="xs">
              <Text fw={600}>Latest data</Text>
              <Text size="sm">{latestSampleText}</Text>
            </Stack>
          </Card>
        </Stack>
      </Group>
    </Stack>
  );
}