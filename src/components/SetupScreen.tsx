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
import { useTreatment } from '../context/TreatmentProvider';

type SetupScreenProps = {
  bleStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  deviceName: string | null;
  bleError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onContinue: () => void;
};

export default function SetupScreen({
  bleStatus,
  deviceName,
  bleError,
  onConnect,
  onDisconnect,
  onContinue,
}: SetupScreenProps) {

   const theme = useMantineTheme();
   const { state, dispatch} = useTreatment();

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
                <Button fullWidth size="xl" onClick={onConnect} loading={bleStatus === 'connecting'} color={bleStatus === 'connected' ? theme.colors.green[6] : theme.colors.blue[6]}>
                  {bleStatus === 'connected' ? 'Connected' : 'Connect'}
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
                    Select affected canal
                  </Title>
                  <Text c="dimmed" size="sm">
                    Posterior is most commonly affected.
                  </Text>
                </Box>

                <Stack gap="md">
                  <Group wrap="nowrap" grow>
                    <SelectCanalButton label="Posterior" imageSrc="/Posterior Canal Selected.png" selected={state.affectedCanal === 'posterior'} onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'posterior' })}/>
                    <SelectCanalButton label="Anterior" imageSrc="/Anterior Canal Selected.png" selected={state.affectedCanal === 'anterior'} onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'anterior' })}/>
                    <SelectCanalButton label="Lateral" imageSrc="/Lateral Canal Selected.png" selected={state.affectedCanal === 'lateral'} onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'lateral' })}/>
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
                    <Button color={state.affectedEar === "left" ? theme.colors.green[6] : theme.colors.gray[6]} fullWidth size="xl" onClick={() => dispatch({ type: 'SELECT_EAR', ear: 'left' })}>
                      Left
                    </Button>
                    <Button color={state.affectedEar === "right" ? theme.colors.red[6] : theme.colors.gray[6]} fullWidth size="xl" onClick={() => dispatch({ type: 'SELECT_EAR', ear: 'right' })}>
                      Right
                    </Button>
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>

        </Grid>

        <Button size="lg" fullWidth onClick={onContinue} disabled={!state.affectedEar || !state.affectedCanal || !( bleStatus === 'connected')} color="green">
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