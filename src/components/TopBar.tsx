import { AppShell, Group, Title, Button } from '@mantine/core';

type TopBarProps = {
    setScreen: (screen: 'setup' | 'treatment') => void;
};

export default function TopBar({ setScreen }: TopBarProps) {
  return (
    <Group justify="space-between" h="100%" px="md">
      <Title order={3}>HeadSpin</Title>
      {/* <Group>
        <Badge color="green">Bluetooth connected</Badge>
        <Badge color="green">Streaming</Badge>
      </Group> */}
      <Button color="green" onClick={() => setScreen('setup')}>
          Back to setup
        </Button>
    </Group>
  );
}