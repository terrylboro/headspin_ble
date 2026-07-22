import { Box, Button, Group, Slider, Text } from '@mantine/core';
import { useTreatment } from '../context/TreatmentProvider';
import { useBleDevice } from '../context/BleProvider';
import { HoldDurationType } from '../types/treatmentTypes';

const SHOW_ADVANCED_CONTROLS = false;
const sliderMarks = [
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

type TopBarProps = {
    setScreen: (screen: 'setup' | 'treatment' | 'research') => void;
    setCalibrationOpen: (open: boolean) => void;
    onReset: () => void;
    showTimerSlider: boolean;
};

export default function TopBar({ setScreen, setCalibrationOpen, onReset, showTimerSlider }: TopBarProps) {
  const treatment = useTreatment();
  const ble = useBleDevice();
  const selectedHoldDuration = treatment.state.holdDurationSec === 5
    ? 45
    : treatment.state.holdDurationSec;
  const batteryPercentage = ble.batteryLevel;
  const batteryFill = batteryPercentage === null
    ? 0
    : Math.min(100, Math.max(0, batteryPercentage));
  const batteryLabel = batteryPercentage === null ? 'Unavailable' : `${batteryPercentage}%`;
  const batteryColor = batteryFill <= 20
    ? 'var(--mantine-color-red-6)'
    : batteryFill <= 40
    ? 'var(--mantine-color-yellow-6)'
    : 'var(--mantine-color-green-6)';

  function handleHoldDurationChange(value: number) {
    treatment.dispatch({
      type: 'SET_HOLD_DURATION',
      holdDuration: value as HoldDurationType,
    });
  }

  return (
    <Group justify="space-between" h="100%" px="md">
      <img
        src={`${process.env.PUBLIC_URL}/diagrams/HeadSpin Logo White.png`}
        alt="HeadSpin"
        style={{ display: 'block', width: 'auto', height: 38 }}
      />
      {/* <Group>
        <Badge color="green">Bluetooth connected</Badge>
        <Badge color="green">Streaming</Badge>
      </Group> */}
      <Group gap="md" wrap="nowrap">
        {showTimerSlider && !ble.connected && (
          <Button color="orange" loading={ble.connecting} onClick={() => void ble.connect()}>
            Reconnect device
          </Button>
        )}
        {showTimerSlider && (
          <Group gap="sm" wrap="nowrap" mr="md">
            <Text size="sm" fw={600} ta="center" style={{ whiteSpace: 'nowrap' }} component="p">
              Adjust
              <br />
              Timer
            </Text>
            <Slider
              value={selectedHoldDuration}
              min={30}
              max={60}
              step={15}
              marks={sliderMarks}
              label={(value) => sliderMarks.find((mark) => mark.value === value)?.label}
              onChange={handleHoldDurationChange}
              w={220}
              color="green"
              styles={{
                markLabel: { color: 'var(--mantine-color-white)', fontSize: 10 },
              }}
            />
          </Group>
        )}

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
          aria-label={`Device battery ${batteryLabel}`}
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
                  width: `${batteryFill}%`,
                  height: '100%',
                  borderRadius: 1,
                  background: batteryColor,
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
          <Text size="sm" fw={600} c="gray.8">
            {batteryPercentage === null ? '--' : `${batteryPercentage}%`}
          </Text>
        </Group>

        <Button color="green" onClick={onReset}>
          Back to setup
        </Button>
      </Group>
    </Group>
  );
}
