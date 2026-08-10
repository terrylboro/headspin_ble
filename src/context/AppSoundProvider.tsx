import { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import useSound from 'use-sound';

import { publicAssetUrl } from '../utils/assetLoader';

type AppSoundContextValue = {
  playAligned: () => void;
  playMisaligned: () => void;
};

const AppSoundContext = createContext<AppSoundContextValue | null>(null);

export function AppSoundProvider({ children }: { children: ReactNode }) {
  // This provider mounts on the startup screen, allowing Howler and the audio
  // files to load before the first canal-alignment transition occurs.
  const [playAlignedSound, { stop: stopAlignedSound }] = useSound(publicAssetUrl('sounds/aligned.mp3'), {
    interrupt: true,
    preload: true,
  });
  const [playMisalignedSound, { stop: stopMisalignedSound }] = useSound(
    publicAssetUrl('sounds/545373__stwime__up3.mp3'),
    { interrupt: true, preload: true },
  );

  const playAligned = useCallback(() => {
    stopMisalignedSound();
    playAlignedSound();
  }, [playAlignedSound, stopMisalignedSound]);

  const playMisaligned = useCallback(() => {
    stopAlignedSound();
    playMisalignedSound();
  }, [playMisalignedSound, stopAlignedSound]);

  return (
    <AppSoundContext.Provider value={{ playAligned, playMisaligned }}>
      {children}
    </AppSoundContext.Provider>
  );
}

export function useAppSounds(): AppSoundContextValue {
  const sounds = useContext(AppSoundContext);
  if (!sounds) throw new Error('useAppSounds must be used inside AppSoundProvider');
  return sounds;
}
