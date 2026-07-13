import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  Box,
  useMantineTheme,
  Modal,
  SimpleGrid,
  ActionIcon,
  SegmentedControl,
} from '@mantine/core';

import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';

import { SelectCanalButton } from '../custom/canalButton';
import { useTreatment } from '../context/TreatmentProvider';
import { InfoCard } from '../custom/infoCard';

type SetupScreenProps = {
  bleStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  deviceName: string | null;
  bleError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onContinue: () => void;
};

type TreatmentSide = 'left' | 'right';

const epleyInstructions: Record<TreatmentSide, string[]> = {
  left: [
    'Sit the patient upright on the treatment bed. Turn their head 45° to the left.',
    'Lie the patient back on the bed quickly so their shoulders are touching the bed. Keep the head reclined and looking 45° to the left. Hold for around 30 seconds or until nystagmus subsides.',
    "Turn the patient's head 90° to the right without raising it. Their head will now be looking 45° to the right. Hold for around 30 seconds or until nystagmus subsides.",
    "Turn the patient's head and body another 90° to the right, so they are now looking 45° from the floor. Hold for around 30 seconds or until nystagmus subsides.",
    'Sit the patient up on the right side, keeping their chin tucked.',
  ],
  right: [
    'Sit the patient upright on the treatment bed. Turn their head 45° to the right.',
    'Lie the patient back on the bed quickly so their shoulders are touching the bed. Keep the head reclined and looking 45° to the right. Hold for around 30 seconds or until nystagmus subsides.',
    "Turn the patient's head 90° to the left without raising it. Their head will now be looking 45° to the left. Hold for around 30 seconds or until nystagmus subsides.",
    "Turn the patient's head and body another 90° to the left, so they are now looking 45° from the floor. Hold for around 30 seconds or until nystagmus subsides.",
    'Sit the patient up on the left side, keeping their chin tucked.',
  ],
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

   const [opened, { open, close }] = useDisclosure(false);
   const [infoOpened, { open : infoOpen, close : infoClose }] = useDisclosure(false);
   const [refresherSide, setRefresherSide] = useState<TreatmentSide>('right');

   const openRefresher = () => {
     setRefresherSide(state.affectedEar ?? 'right');
     open();
   };

   const sideLabel = refresherSide === 'left' ? 'Left' : 'Right';
   const instructions = epleyInstructions[refresherSide];

  return (
    <>

    <Modal styles={{title: {fontSize: 56, fontWeight: 600}}}size="calc(100vw - 20px)" opened={opened} onClose={close} title="How to Perform the Epley Manoeuvre"  transitionProps={{ transition: 'fade', duration: 200 }}>
      <Group justify="center" mb="lg" gap="md">
        <Text fw={600} size="lg">
          Affected ear:
        </Text>
        <SegmentedControl
          size="lg"
          value={refresherSide}
          onChange={(value) => setRefresherSide(value as TreatmentSide)}
          data={[
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ]}
          aria-label="Epley manoeuvre treatment side"
        />
      </Group>
      <SimpleGrid cols={5} spacing="sm">
        {instructions.map((textBody, index) => (
          <InfoCard
            key={index}
            title={index === 0 ? 'Preparation' : `Position ${index}`}
            imageSrc={`${process.env.PUBLIC_URL}/diagrams/Position ${index} ${sideLabel}.png`}
            textBody={textBody}
          />
        ))}
      </SimpleGrid>
      
    </Modal>

    <Modal styles={{title: {fontSize: 56, fontWeight: 600}}} size="calc(100vw - 20px)" opened={infoOpened} onClose={infoClose} title="BPPV Pathology Reminder"  transitionProps={{ transition: 'fade', duration: 200 }}>
      In 90% of cases, the posterior canal is the one affected. The diagnostic test is the Dix-Hallpike Manoeuvre, which consists of the Epley Manoeure's first two positions.
      
      If a patient feels dizzy and they show some torsional nystagmus during the Dix-Hallpike, it is likely their vertigo is caused by posterior canal BPPV.
    </Modal>

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
                    <Group w='100%' justify='space-between'>
                      <Group align='center' gap='sm'>
                        <Title order={1} mb="sm">
                        Select affected canal
                        </Title>
                        <ActionIcon variant='subtle' onClick={infoOpen}  >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 17.25a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 19.25Zm1.18-5.82-.43.22V14.5h-1.5v-1.31a1 1 0 0 1 .55-.9l.71-.36a2.14 2.14 0 0 0 1.24-1.93 1.75 1.75 0 0 0-3.5 0h-1.5a3.25 3.25 0 0 1 6.5 0 3.62 3.62 0 0 1-2.07 3.43Z"/>
                          </svg>
                        </ActionIcon>
                      </Group>
                      
                      <Button variant="outline" onClick={openRefresher}>
                        Need a refresher?
                      </Button>
                    </Group>
                    
                    {/* <Button variant='light' onClick={infoOpen}>
                      More info
                    </Button> */}
                  
                </Box>

                <Stack gap="md">
                  <Group wrap="nowrap" grow>
                    <SelectCanalButton label="Posterior" imageSrc={process.env.PUBLIC_URL + "/Posterior Canal Selected.png"} selected={state.affectedCanal === 'posterior'} onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'posterior' })}/>
                    <SelectCanalButton label="Anterior" imageSrc={process.env.PUBLIC_URL + "/Anterior Canal Selected.png"} selected={state.affectedCanal === 'anterior'} disabled onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'anterior' })}/>
                    <SelectCanalButton label="Lateral" imageSrc={process.env.PUBLIC_URL + "/Lateral Canal Selected.png"} selected={state.affectedCanal === 'lateral'} disabled onClick={() => dispatch({ type: 'SELECT_CANAL', canal: 'lateral' })}/>
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
    </>
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
