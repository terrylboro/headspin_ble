import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Group, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { GyroscopeOffsets, LatestImuSample, useTreatment } from '../context/TreatmentProvider';
import { applyEarAxisBasis } from '../utils/earAxisBasis';

const RECORDING_DURATION_MS = 3000;
type RecordedStep = 'still' | 'nod' | 'shake';
type GyroscopeSample = Pick<LatestImuSample, 'gx' | 'gy' | 'gz'>;

type GuidedCalibrationScreenProps = {
  onBack: () => void;
  onComplete: () => void;
  startRequestId: number | null;
  onStartRequestHandled: () => void;
};

const steps = [
  { id: 'still', title: 'Look forwards', instruction: 'Look directly forwards and hold your head completely still for 3 seconds.', buttonLabel: 'Record still position' },
  { id: 'nod', title: 'Nod carefully', instruction: 'Gently nod your head up and down for 3 seconds.', buttonLabel: 'Record nodding' },
  { id: 'shake', title: 'Shake carefully', instruction: 'Gently turn your head from side to side for 3 seconds.', buttonLabel: 'Record head shaking' },
  { id: 'forward', title: 'Look forwards again', instruction: 'Return to looking directly forwards. When you are ready, start the treatment.', buttonLabel: 'Start treatment' },
] as const;

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function stationaryOffsets(samples: GyroscopeSample[]): GyroscopeOffsets {
  return {
    gx: median(samples.map((sample) => sample.gx)),
    gy: median(samples.map((sample) => sample.gy)),
    gz: median(samples.map((sample) => sample.gz)),
  };
}

function peakMotion(samples: GyroscopeSample[], offsets: GyroscopeOffsets, sensorMountEar: 'left' | 'right' | null): GyroscopeOffsets {
  return samples.reduce<GyroscopeOffsets>((peak, sample) => {
    const [gx, gy, gz] = applyEarAxisBasis(
      sample.gx - offsets.gx,
      sample.gy - offsets.gy,
      sample.gz - offsets.gz,
      sensorMountEar
    );
    return {
      gx: Math.max(peak.gx, Math.abs(gx)),
      gy: Math.max(peak.gy, Math.abs(gy)),
      gz: Math.max(peak.gz, Math.abs(gz)),
    };
  }, { gx: 0, gy: 0, gz: 0 });
}

export default function GuidedCalibrationScreen({ onBack, onComplete, startRequestId, onStartRequestHandled }: GuidedCalibrationScreenProps) {
  const {
    latestImuSample,
    sensorMountEar,
    setGyroscopeOffsets,
    setFunctionalCalibration,
    calibrateOffset,
    startRecording,
  } = useTreatment();
  const [stepIndex, setStepIndex] = useState(0);
  const [isRecordingStep, setIsRecordingStep] = useState(false);
  const [remainingMs, setRemainingMs] = useState(RECORDING_DURATION_MS);
  const [error, setError] = useState<string | null>(null);
  const samplesRef = useRef<Record<RecordedStep, GyroscopeSample[]>>({ still: [], nod: [], shake: [] });
  const lastTimestampRef = useRef<number | null>(null);
  const offsetsRef = useRef<GyroscopeOffsets>({ gx: 0, gy: 0, gz: 0 });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handlePrimaryAction = useCallback(() => {
    if (isRecordingStep) return;

    if (stepIndex === 3) {
      calibrateOffset();
      startRecording();
      onCompleteRef.current();
      return;
    }

    if (!latestImuSample) {
      setError('Waiting for motion data from the device. Check the connection and try again.');
      return;
    }

    const stepId = steps[stepIndex].id as RecordedStep;
    samplesRef.current[stepId] = [];
    lastTimestampRef.current = null;
    if (stepIndex === 0) setFunctionalCalibration(null);
    setError(null);
    setRemainingMs(RECORDING_DURATION_MS);
    setIsRecordingStep(true);
  }, [calibrateOffset, isRecordingStep, latestImuSample, setFunctionalCalibration, startRecording, stepIndex]);

  const primaryActionRef = useRef(handlePrimaryAction);
  primaryActionRef.current = handlePrimaryAction;

  useEffect(() => {
    if (startRequestId === null) return;
    onStartRequestHandled();
    primaryActionRef.current();
  }, [onStartRequestHandled, startRequestId]);

  useEffect(() => {
    if (!isRecordingStep || stepIndex > 2 || !latestImuSample) return;
    if (lastTimestampRef.current === latestImuSample.timestamp) return;
    lastTimestampRef.current = latestImuSample.timestamp;
    const stepId = steps[stepIndex].id as RecordedStep;
    samplesRef.current[stepId].push({ gx: latestImuSample.gx, gy: latestImuSample.gy, gz: latestImuSample.gz });
  }, [isRecordingStep, latestImuSample, stepIndex]);

  useEffect(() => {
    if (!isRecordingStep || stepIndex > 2) return;
    const currentStepIndex = stepIndex;
    const stepId = steps[currentStepIndex].id as RecordedStep;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setRemainingMs(Math.max(0, RECORDING_DURATION_MS - (Date.now() - startedAt)));
    }, 50);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      const samples = samplesRef.current[stepId];
      setIsRecordingStep(false);

      if (samples.length === 0) {
        setError('No motion samples were received. Check the device connection and record this step again.');
        setRemainingMs(RECORDING_DURATION_MS);
        return;
      }

      if (stepId === 'still') {
        offsetsRef.current = stationaryOffsets(samples);
        setGyroscopeOffsets(offsetsRef.current);
      } else if (stepId === 'shake') {
        setFunctionalCalibration({
          nodPeak: peakMotion(samplesRef.current.nod, offsetsRef.current, sensorMountEar),
          shakePeak: peakMotion(samplesRef.current.shake, offsetsRef.current, sensorMountEar),
        });
      }

      setRemainingMs(RECORDING_DURATION_MS);
      setStepIndex(currentStepIndex + 1);
    }, RECORDING_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isRecordingStep, sensorMountEar, setFunctionalCalibration, setGyroscopeOffsets, stepIndex]);

  const recordingProgress = isRecordingStep ? (RECORDING_DURATION_MS - remainingMs) / RECORDING_DURATION_MS : 0;
  const overallProgress = ((stepIndex + recordingProgress) / steps.length) * 100;
  const activeStep = steps[stepIndex];

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" maw={1180} w="100%" mx="auto">
      <Stack gap="xl">
        <Stack gap={4} ta="center">
          <Title order={1}>Head movement calibration</Title>
          <Text c="dimmed" size="lg">
            {stepIndex < 3
              ? 'Start each step using the button below or the physical device button. Each movement is recorded separately.'
              : 'Calibration is complete. Prepare to begin the treatment.'}
          </Text>
        </Stack>

        {stepIndex < 3 ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              {steps.slice(0, 3).map((item, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;
                return (
                  <Card key={item.id} withBorder p="lg" bg={isActive ? 'blue.0' : undefined} style={{ borderColor: isActive ? 'var(--mantine-color-blue-6)' : undefined }}>
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Badge size="lg" color={isComplete ? 'green' : isActive ? 'blue' : 'gray'}>{isComplete ? 'Complete' : `Step ${index + 1}`}</Badge>
                        {isActive && isRecordingStep && <Text fw={700} size="xl">{Math.max(1, Math.ceil(remainingMs / 1000))}s</Text>}
                      </Group>
                      <Title order={3}>{item.title}</Title>
                      <Text c="dimmed">{item.instruction}</Text>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>

            <Progress value={overallProgress} size="xl" radius="xl" animated={isRecordingStep} aria-label="Calibration progress" />
            <Text ta="center" size="xl" fw={700} role="status" aria-live="polite">{activeStep.instruction}</Text>
            {!isRecordingStep && <Text ta="center" c="dimmed">This recording will not begin until you press a button.</Text>}
          </>
        ) : (
          <Stack align="center" justify="center" gap="md" py="xl" mih={280} role="status" aria-live="polite">
            <Title order={1} ta="center">Look straight ahead</Title>
            <Text size="xl" ta="center" maw={620}>
              Return to looking directly forwards and hold your head still. When you are ready, start the treatment.
            </Text>
          </Stack>
        )}
        {error && <Alert color="red" title="Calibration could not continue">{error}</Alert>}

        <Group grow>
          <Button size="lg" variant="default" onClick={onBack} disabled={isRecordingStep}>Back</Button>
          <Button size="lg" color="green" onClick={handlePrimaryAction} disabled={isRecordingStep} loading={isRecordingStep}>{activeStep.buttonLabel}</Button>
        </Group>
      </Stack>
    </Card>
  );
}
