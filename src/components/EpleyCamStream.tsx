import { Box, Button, Center, Stack, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

const EPLEY_CAM_STREAM_URL = 'http://192.168.4.1:81/stream';
const EPLEY_CAM_HEALTH_URL = 'http://192.168.4.1/health';
const HEALTH_CHECK_INTERVAL_MS = 3000;
const STALLED_FRAME_AGE_MS = 7000;

export default function EpleyCamStream() {
  const [streamKey, setStreamKey] = useState(0);
  const [streamState, setStreamState] = useState<'loading' | 'playing' | 'error'>('loading');
  const restartingRef = useRef(false);
  const failedHealthChecksRef = useRef(0);

  useEffect(() => {
    if (streamState !== 'playing') return;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${EPLEY_CAM_HEALTH_URL}?t=${Date.now()}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`Health check returned ${response.status}`);

        const health = await response.json() as { frameAgeMs?: number };
        failedHealthChecksRef.current = 0;
        if (
          typeof health.frameAgeMs === 'number' &&
          health.frameAgeMs > STALLED_FRAME_AGE_MS &&
          !restartingRef.current
        ) {
          restartingRef.current = true;
          setStreamState('loading');
          setStreamKey((currentKey) => currentKey + 1);
        }
      } catch {
        failedHealthChecksRef.current += 1;
        // Tolerate brief Wi-Fi jitter, but recover if the camera disappears
        // without causing the browser's MJPEG image to emit an error.
        if (failedHealthChecksRef.current >= 3 && !restartingRef.current) {
          restartingRef.current = true;
          failedHealthChecksRef.current = 0;
          setStreamState('loading');
          setStreamKey((currentKey) => currentKey + 1);
        }
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), HEALTH_CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [streamState, streamKey]);

  function retry() {
    restartingRef.current = false;
    failedHealthChecksRef.current = 0;
    setStreamState('loading');
    setStreamKey((currentKey) => currentKey + 1);
  }

  return (
    <Box
      pos="relative"
      h="100%"
      w="100%"
      bg="#eeeeee"
      style={{ overflow: 'hidden', borderRadius: 8 }}
    >
      <img
        key={streamKey}
        src={`${EPLEY_CAM_STREAM_URL}?retry=${streamKey}`}
        alt="Live video from EpleyCam"
        onLoad={() => {
          restartingRef.current = false;
          setStreamState('playing');
        }}
        onError={() => {
          restartingRef.current = false;
          setStreamState('error');
        }}
        style={{
          display: streamState === 'error' ? 'none' : 'block',
          width: '100%',
          height: '100%',
          // The camera stream is wider than this treatment panel. Cropping the
          // sides keeps the patient centred above the head rendering below.
          objectFit: 'cover',
          objectPosition: 'center center',
        }}
      />

      {streamState !== 'playing' && (
        <Center pos="absolute" inset={0} p="md">
          <Stack align="center" gap="xs">
            <Text c="dark" fw={600} ta="center">
              {streamState === 'loading' ? 'Connecting to EpleyCam…' : 'EpleyCam stream unavailable'}
            </Text>
            <Text c="dimmed" size="xs" ta="center">
              Connect this device to the EpleyCam Wi-Fi network, then retry.
            </Text>
            {streamState === 'error' && (
              <Button size="xs" variant="white" onClick={retry}>
                Retry stream
              </Button>
            )}
          </Stack>
        </Center>
      )}
    </Box>
  );
}
