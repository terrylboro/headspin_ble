import { AppShell, Group, Title, Button } from '@mantine/core';

type TopBarProps = {
    setScreen: (screen: 'setup' | 'treatment' | 'research') => void;
    setCalibrationOpen: (open: boolean) => void;
    onReset: () => void;
};

export default function TopBar({ setScreen, setCalibrationOpen, onReset }: TopBarProps) {
  return (
    <Group justify="space-between" h="100%" px="md">
      <Title order={3}>HeadSpin</Title>
      {/* <Group>
        <Badge color="green">Bluetooth connected</Badge>
        <Badge color="green">Streaming</Badge>
      </Group> */}
      <Button color="green" onClick={() => setCalibrationOpen(true)}>
          Correct Drift
        </Button>
      < Button color="green" onClick={() => setScreen("research")}>
          Activate Research Mode
      </Button>
      <Button color="green" onClick={onReset}>
          Back to setup
        </Button>
    </Group>
  );
}
