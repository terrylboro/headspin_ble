import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { LineChart } from '@mantine/charts';

type ChartSample = {
  sample: string;
  value: number;
};

type LiveChartCardProps = {
  title?: string;
  points?: number;
  updateIntervalMs?: number;
};

function createSample(step: number): ChartSample {
  const waveA = Math.sin(step / 5) * 14;
  const waveB = Math.cos(step / 11) * 9;
  const noise = (Math.random() - 0.5) * 4;
  const value = Math.max(0, Math.min(100, 50 + waveA + waveB + noise));

  return {
    sample: `${step}`,
    value: Number(value.toFixed(2)),
  };
}

function createInitialData(points: number) {
  return Array.from({ length: points }, (_, index) => createSample(index));
}

export default function LiveChartCard({
  title = 'Live line chart',
  points = 40,
  updateIntervalMs = 350,
}: LiveChartCardProps) {
  const [nextStep, setNextStep] = useState(points);
  const [data, setData] = useState<ChartSample[]>(() => createInitialData(points));

  useEffect(() => {
    setData(createInitialData(points));
    setNextStep(points);
  }, [points]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNextStep((currentStep) => {
        const upcomingStep = currentStep + 1;

        setData((currentData) => [
          ...currentData.slice(-(points - 1)),
          createSample(upcomingStep),
        ]);

        return upcomingStep;
      });
    }, updateIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [points, updateIntervalMs]);

  const latestPoint = data[data.length - 1];
  const averageValue = useMemo(() => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    return total / Math.max(data.length, 1);
  }, [data]);

  return (
    <Card withBorder shadow="sm" radius="md" p="xs">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>{title}</Title>
            <Text c="dimmed" size="sm">
              Dummy stream updating on an interval. Later we can replace this state update with
              incoming Bluetooth values.
            </Text>
          </div>

          <Badge color="blue" variant="light">
            Demo stream
          </Badge>
        </Group>

        <LineChart
          h={220}
          data={data}
          dataKey="sample"
          withLegend={false}
          withDots={false}
          series={[{ name: 'value', color: 'blue.6' }]}
          curveType="natural"
          strokeWidth={3}
          gridAxis="xy"
          xAxisLabel="Sample"
          yAxisLabel="Value"
          yAxisProps={{ domain: [0, 100] }}
          tickLine="none"
        />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Latest: {latestPoint?.value.toFixed(1)}
          </Text>
          <Text size="sm" c="dimmed">
            Average: {averageValue.toFixed(1)}
          </Text>
          <Text size="sm" c="dimmed">
            Samples shown: {data.length}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
