import { Box, Button, Group, Text, Title } from '@mantine/core';

const SHOW_ADVANCED_CONTROLS = false;
const PLACEHOLDER_BATTERY_PERCENTAGE = 75;

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
      <Group gap="md" wrap="nowrap">
        {SHOW_ADVANCED_CONTROLS && <Button color="green" onClick={() => setCalibrationOpen(true)}>
            Correct Drift
          </Button>}
        {SHOW_ADVANCED_CONTROLS && <Button color="green" onClick={() => setScreen("research")}>
            Activate Research Mode
        </Button>}

        <Group
          gap={8}
          wrap="nowrap"
          role="status"
          aria-label={`Device battery ${PLACEHOLDER_BATTERY_PERCENTAGE}%`}
          px="sm"
          py={6}
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-md)',
            background: 'var(--mantine-color-white)',
          }}
        >
          <Group gap={2} wrap="nowrap" aria-hidden="true">
            <Box
              style={{
                width: 28,
                height: 15,
                padding: 2,
                border: '2px solid var(--mantine-color-gray-7)',
                borderRadius: 3,
              }}
            >
              <Box
                style={{
                  width: `${PLACEHOLDER_BATTERY_PERCENTAGE}%`,
                  height: '100%',
                  borderRadius: 1,
                  background: 'var(--mantine-color-green-6)',
                }}
              />
            </Box>
            <Box
              style={{
                width: 3,
                height: 7,
                borderRadius: '0 2px 2px 0',
                background: 'var(--mantine-color-gray-7)',
              }}
            />
          </Group>
          <Text size="sm" fw={600}>{PLACEHOLDER_BATTERY_PERCENTAGE}%</Text>
        </Group>

        <Button color="green" onClick={onReset}>
          Back to setup
        </Button>
      </Group>
    </Group>
  );
}
