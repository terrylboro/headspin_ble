import {
  Button,
  Card,
  Group,
  MultiSelect,
  Stack,
  Text,
  Title,
  Alert,
} from '@mantine/core';

type SetupScreenProps = {
  bleStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  deviceName: string | null;
  bleError: string | null;
  selectedCanals: string[];
  setSelectedCanals: (value: string[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onContinue: () => void;
};

const canalOptions = [
  { value: 'anterior', label: 'Anterior canal' },
  { value: 'posterior', label: 'Posterior canal' },
  { value: 'horizontal', label: 'Horizontal canal' },
];

export default function SetupScreen({
  bleStatus,
  deviceName,
  bleError,
  selectedCanals,
  setSelectedCanals,
  onConnect,
  onDisconnect,
  onContinue,
}: SetupScreenProps) {
  const canContinue = bleStatus === 'connected' && selectedCanals.length > 0;

  return (
    <Stack maw={720} mx="auto" mt="xl">
      <Title order={2}>Setup</Title>

      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack>
          <Text fw={600}>Connect device</Text>
          <Text size="sm">
            Status:{' '}
            {bleStatus === 'connected'
              ? `Connected to ${deviceName ?? 'device'}`
              : bleStatus === 'connecting'
              ? 'Connecting...'
              : bleStatus === 'error'
              ? 'Connection error'
              : 'Not connected'}
          </Text>

          {bleError && (
            <Alert color="red" title="Bluetooth error">
              {bleError}
            </Alert>
          )}

          <Group>
            <Button onClick={onConnect} disabled={bleStatus === 'connecting' || bleStatus === 'connected'}>
              {bleStatus === 'connecting' ? 'Connecting...' : 'Connect device'}
            </Button>

            <Button
              variant="light"
              color="red"
              onClick={onDisconnect}
              disabled={bleStatus !== 'connected'}
            >
              Disconnect
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack>
          <Text fw={600}>Select canals to treat</Text>
          <MultiSelect
            data={canalOptions}
            value={selectedCanals}
            onChange={setSelectedCanals}
            placeholder="Choose one or more canals"
            searchable={false}
            clearable
          />
        </Stack>
      </Card>

      <Group justify="flex-end">
        <Button onClick={onContinue} disabled={!canContinue}>
          Continue
        </Button>
      </Group>
    </Stack>
  );
}