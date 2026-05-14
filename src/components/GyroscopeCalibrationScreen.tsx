import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useTreatment, GyroscopeOffsets } from '../context/TreatmentProvider';

const CALIBRATION_DURATION_MS = 5000;

type GyroscopeSample = {
  gx: number;
  gy: number;
  gz: number;
};

type GyroscopeCalibrationScreenProps = {
  onComplete?: () => void;
};

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[midpoint];
  }

  return (sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2;
}

function calculateGyroscopeOffsets(samples: GyroscopeSample[]): GyroscopeOffsets {
  return {
    gx: median(samples.map((sample) => sample.gx)),
    gy: median(samples.map((sample) => sample.gy)),
    gz: median(samples.map((sample) => sample.gz)),
  };
}

function formatOffset(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

export default function GyroscopeCalibrationScreen({
  onComplete,
}: GyroscopeCalibrationScreenProps) {
  const {
    latestImuSample,
    gyroscopeOffsets,
    setGyroscopeOffsets,
    clearGyroscopeOffsets,
  } = useTreatment();

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastResult, setLastResult] = useState<GyroscopeOffsets | null>(null);
  const [statusText, setStatusText] = useState('Ready to calibrate');

  const samplesRef = useRef<GyroscopeSample[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const lastSampleTimestampRef = useRef<number | null>(null);

  const progress = Math.min((elapsedMs / CALIBRATION_DURATION_MS) * 100, 100);
  const sampleCount = samplesRef.current.length;

  const displayedOffsets = useMemo(
    () => lastResult ?? gyroscopeOffsets,
    [gyroscopeOffsets, lastResult]
  );

  const finishCalibration = useCallback(() => {
    const samples = samplesRef.current;
    startedAtRef.current = null;
    setIsCalibrating(false);
    setElapsedMs(CALIBRATION_DURATION_MS);

    if (samples.length === 0) {
      setStatusText('No gyroscope samples received');
      return;
    }

    const nextOffsets = calculateGyroscopeOffsets(samples);
    setGyroscopeOffsets(nextOffsets);
    setLastResult(nextOffsets);
    setStatusText(`Calibration complete from ${samples.length} samples`);
  }, [setGyroscopeOffsets]);

  function startCalibration() {
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    lastSampleTimestampRef.current = null;
    setElapsedMs(0);
    setLastResult(null);
    setStatusText('Keep the headset completely still');
    setIsCalibrating(true);
  }

  function handleClearOffsets() {
    clearGyroscopeOffsets();
    setLastResult(null);
    setElapsedMs(0);
    setStatusText('Offsets cleared');
  }

  useEffect(() => {
    if (!isCalibrating || !latestImuSample) {
      return;
    }

    if (lastSampleTimestampRef.current === latestImuSample.timestamp) {
      return;
    }

    lastSampleTimestampRef.current = latestImuSample.timestamp;
    samplesRef.current.push({
      gx: latestImuSample.gx,
      gy: latestImuSample.gy,
      gz: latestImuSample.gz,
    });
  }, [isCalibrating, latestImuSample]);

  useEffect(() => {
    if (!isCalibrating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }

      const nextElapsedMs = Date.now() - startedAtRef.current;
      setElapsedMs(Math.min(nextElapsedMs, CALIBRATION_DURATION_MS));

      if (nextElapsedMs >= CALIBRATION_DURATION_MS) {
        finishCalibration();
      }
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [finishCalibration, isCalibrating]);

  return (
    <Card withBorder shadow="sm" radius="md">
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Gyroscope calibration</Text>
          <Badge color={isCalibrating ? 'blue' : lastResult ? 'green' : 'gray'}>
            {isCalibrating ? 'Calibrating' : lastResult ? 'Complete' : 'Idle'}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Place the headset on a still surface, then capture five seconds of data.
        </Text>

        <Progress value={progress} animated={isCalibrating} />

        <Group justify="space-between">
          <Text size="sm">{statusText}</Text>
          <Text size="sm" c="dimmed">
            {(Math.max(CALIBRATION_DURATION_MS - elapsedMs, 0) / 1000).toFixed(1)}s
          </Text>
        </Group>

        <SimpleGrid cols={3}>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">X offset</Text>
            <Text fw={600}>{formatOffset(displayedOffsets.gx)}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Y offset</Text>
            <Text fw={600}>{formatOffset(displayedOffsets.gy)}</Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">Z offset</Text>
            <Text fw={600}>{formatOffset(displayedOffsets.gz)}</Text>
          </Stack>
        </SimpleGrid>

        <Text size="xs" c="dimmed">
          Samples captured: {sampleCount}
        </Text>

        <Group grow>
          <Button onClick={startCalibration} loading={isCalibrating}>
            {lastResult ? 'Recalibrate' : 'Start calibration'}
          </Button>
          <Button variant="light" onClick={handleClearOffsets} disabled={isCalibrating}>
            Clear offsets
          </Button>
          {onComplete && (
            <Button variant="default" onClick={onComplete} disabled={isCalibrating}>
              Done
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
