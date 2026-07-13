import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Box,
  Card,
  Group,
  Image,
  Stack,
  Title,
  Text,
} from '@mantine/core';
import { useTreatment, GyroscopeOffsets } from '../context/TreatmentProvider';

const CALIBRATION_DURATION_MS = 3000;

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

export default function GyroscopeCalibrationScreen({
  onComplete,
}: GyroscopeCalibrationScreenProps) {
  const {
    latestImuSample,
    setGyroscopeOffsets,
  } = useTreatment();

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [lastResult, setLastResult] = useState<GyroscopeOffsets | null>(null);

  const samplesRef = useRef<GyroscopeSample[]>([]);
  const lastSampleTimestampRef = useRef<number | null>(null);

  const finishCalibration = useCallback(() => {
    const samples = samplesRef.current;
    setIsCalibrating(false);

    if (samples.length === 0) {
      return;
    }

    const nextOffsets = calculateGyroscopeOffsets(samples);
    setGyroscopeOffsets(nextOffsets);
    setLastResult(nextOffsets);
  }, [setGyroscopeOffsets]);

  function startCalibration() {
    samplesRef.current = [];
    lastSampleTimestampRef.current = null;
    setLastResult(null);
    setIsCalibrating(true);
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

    const timeoutId = window.setTimeout(finishCalibration, CALIBRATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [finishCalibration, isCalibrating]);

  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="lg"
      maw={760}
      w="100%"
      h="calc(100vh - 92px)"
      mx="auto"
      style={{ overflow: 'hidden' }}
    >
      <Stack gap="lg" h="100%">
        <Title order={3} ta="left">
          Leave the device on a flat surface and press Calibrate.
        </Title>

        < Text ta="left" color="dimmed">
          The device will calibrate itself for a few seconds. If it gets knocked or moved, press Recalibrate and wait again, otherwise press Proceed.
        </Text>

        <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: 8 }}>
          <Image
            src={`${process.env.PUBLIC_URL}/diagrams/Gyroscope Calibration Flat Surface.png`}
            alt="HeadSpin device placed flat on a stable surface"
            w="100%"
            h="100%"
            fit="cover"
          />
        </Box>

        <Group grow wrap="nowrap">
          <Button size="lg" onClick={startCalibration} loading={isCalibrating}>
            {lastResult ? 'Recalibrate' : 'Calibrate'}
          </Button>
          {onComplete && (
            <Button size="lg" color="green" onClick={onComplete} disabled={isCalibrating || !lastResult}>
              Proceed
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
