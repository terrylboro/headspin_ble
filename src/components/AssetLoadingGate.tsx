import { Alert, Button, Center, Progress, Stack, Text, Title } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AssetProgress,
  preloadCriticalAssets,
  preloadDeferredAssets,
} from '../utils/assetLoader';

type AssetLoadingGateProps = {
  children: ReactNode;
};

export default function AssetLoadingGate({ children }: AssetLoadingGateProps) {
  const [progress, setProgress] = useState<AssetProgress>({ loaded: 0, total: 1, path: '' });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setProgress({ loaded: 0, total: 1, path: '' });
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    preloadCriticalAssets((nextProgress) => {
      if (active) setProgress(nextProgress);
    })
      .then(() => {
        if (!active) return;
        setReady(true);
        void preloadDeferredAssets().catch((deferredError) => {
          console.warn('Some deferred images could not be preloaded:', deferredError);
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : String(loadError));
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (ready) return <>{children}</>;

  const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;

  return (
    <Center mih="100vh" p="xl">
      <Stack w="min(560px, 100%)" gap="md">
        <Title order={2} ta="center">Preparing HeadSpin</Title>
        <Text c="dimmed" ta="center">
          Loading and checking the head model, canal models, and essential images.
        </Text>
        <Progress value={percent} animated={!error} size="xl" />
        <Text size="sm" ta="center">
          {progress.loaded} of {progress.total} assets loaded
        </Text>
        {progress.path && <Text size="xs" c="dimmed" ta="center">{progress.path}</Text>}
        {error && (
          <Alert color="red" title="Essential assets could not be loaded">
            <Text size="sm" mb="sm">{error}</Text>
            <Button color="red" variant="light" onClick={retry}>Retry loading</Button>
          </Alert>
        )}
      </Stack>
    </Center>
  );
}
