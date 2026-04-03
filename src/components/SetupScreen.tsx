import {
  Button,
  Card,
  Group,
  MultiSelect,
  Stack,
  Text,
  Title,
  Alert,
  Grid,
  Box,
  useMantineTheme,
} from '@mantine/core';

import { SelectCanalButton } from '../custom/canalButton';

type SetupScreenProps = {
  bleStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  deviceName: string | null;
  bleError: string | null;
  selectedCanals: string[];
  setSelectedCanals: (value: string[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onContinue: () => void;
};

const canalOptions = [
  { value: 'anterior', label: 'Anterior canal' },
  { value: 'posterior', label: 'Posterior canal' },
  { value: 'horizontal', label: 'Horizontal canal' },
];

export default function SetupScreen({
  bleStatus,
  deviceName,
  bleError,
  selectedCanals,
  setSelectedCanals,
  onConnect,
  onDisconnect,
  onContinue,
}: SetupScreenProps) {
  const canContinue = bleStatus === 'connected' && selectedCanals.length > 0;

   const theme = useMantineTheme();

  return (
    <Box
      h="100%"
      w="100%"
      px="xl"
      py="xl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        // background: "green",
        alignSelf: 'stretch',
        justifyContent: 'center',
      }}
    >
      <Stack
        h="100%"
        w="100%"
        justify="center"
        gap="xl"
        // style={{ background: 'red' }}
      >

        <Grid gutter="xl" align="stretch">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              withBorder
              shadow="sm"
              radius="md"
              p="xl"
              h="100%"
              w="100%"
              style={{ minHeight: 320 }}
            >
              <Stack h="100%" justify="space-between" align="stretch">
                <Box>
                  <Title order={1} mb="sm">
                    Connect device
                  </Title>
                  <Text c="dimmed" size="sm">
                    Connect to your Bluetooth device before starting treatment.
                  </Text>
                </Box>

                <Stack gap="md">
                <Button fullWidth size="lg" onClick={onConnect} loading={bleStatus === 'connecting' || bleStatus === 'connected'}>
                  Connect
                </Button>
                </Stack>

              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 5 }}>
            <Card
              withBorder
              shadow="sm"
              radius="md"
              p="xl"
              h="100%"
              style={{ minHeight: 320 }}
            >
              <Stack h="100%" justify="space-between">
                <Box>
                  <Title order={1} mb="sm">
                    Select canals
                  </Title>
                  <Text c="dimmed" size="sm">
                    Choose the canals you would like to treat in this session.
                  </Text>
                </Box>

                <Stack gap="md">
                  <Group wrap="nowrap" grow>
                    <SelectCanalButton label="Posterior" imageSrc="C:/Users/teri-/Documents/Headspin_BLE/headspin_ble/public/logo192.png" selected={false} onClick={() => {}}/>
                    <SelectCanalButton label="Anterior" imageSrc="C:/Users/teri-/Documents/Headspin_BLE/headspin_ble/public/logo192.png" selected={false} onClick={() => {}}/>
                    <SelectCanalButton label="Lateral" imageSrc="C:/Users/teri-/Documents/Headspin_BLE/headspin_ble/public/logo192.png" selected={false} onClick={() => {}}/>
                  </Group>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Card
              withBorder
              shadow="sm"
              radius="md"
              p="xl"
              h="100%"
              style={{ minHeight: 320 }}
            >
              <Stack h="100%" justify="space-between">
                <Box>
                  <Title order={1} mb="sm">
                    Select side
                  </Title>
                  <Text c="dimmed" size="sm">
                    Choose to treat the left or right ear.
                  </Text>
                </Box>

                <Stack gap="md">
                  <Text size="sm">No side selected</Text>
                    <Button color="green" fullWidth>
                      Left
                    </Button>
                    <Button color="red" fullWidth>
                      Right
                    </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

        </Grid>

        <Button size="lg" fullWidth onClick={onContinue} disabled color="green">
          Continue
        </Button>
      </Stack>
    </Box>
  );

  // return (
  //   <Stack align="center" mt="xl">

  //   <Group maw={720} mx="auto" mt="xl">
      

  //     <Card withBorder shadow="sm" radius="md" p="lg">
  //       <Stack>
  //         <Text fw={600}>Connect device</Text>
  //         <Text size="sm">
  //           Status:{' '}
  //           {bleStatus === 'connected'
  //             ? `Connected to ${deviceName ?? 'device'}`
  //             : bleStatus === 'connecting'
  //             ? 'Connecting...'
  //             : bleStatus === 'error'
  //             ? 'Connection error'
  //             : 'Not connected'}
  //         </Text>

  //         {bleError && (
  //           <Alert color="red" title="Bluetooth error">
  //             {bleError}
  //           </Alert>
  //         )}

  //         <Group>
  //           <Button onClick={onConnect} disabled={bleStatus === 'connecting' || bleStatus === 'connected'}>
  //             {bleStatus === 'connecting' ? 'Connecting...' : 'Connect device'}
  //           </Button>

  //           <Button
  //             variant="light"
  //             color="red"
  //             onClick={onDisconnect}
  //             disabled={bleStatus !== 'connected'}
  //           >
  //             Disconnect
  //           </Button>
  //         </Group>
  //       </Stack>
  //     </Card>

  //     <Card withBorder shadow="sm" radius="md" p="lg">
  //       <Stack>
  //         <Text fw={600}>Select canals to treat</Text>
  //         <MultiSelect
  //           data={canalOptions}
  //           value={selectedCanals}
  //           onChange={setSelectedCanals}
  //           placeholder="Choose one or more canals"
  //           searchable={false}
  //           clearable
  //         />
  //       </Stack>
  //     </Card>

  //     <Group justify="flex-end">
  //       <Button onClick={onContinue} disabled={!canContinue}>
  //         Continue
  //       </Button>
  //     </Group>
  //   </Group>
  //   </Stack>
  // );
}