import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from './App';
import { BleProvider } from './context/BleProvider';
import { TreatmentProvider } from './context/TreatmentProvider';

describe('App', () => {
  test('renders the setup screen', () => {
    render(
      <MantineProvider>
        <BleProvider>
          <TreatmentProvider>
            <App />
          </TreatmentProvider>
        </BleProvider>
      </MantineProvider>
    );

    expect(screen.getByRole('heading', { name: 'Connect device' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeEnabled();
  });
});
