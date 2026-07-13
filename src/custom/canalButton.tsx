import { Card, Image, Text, UnstyledButton, Stack } from '@mantine/core';

type SelectCardButtonProps = {
  label: string;
  imageSrc: string;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function SelectCanalButton({
  label,
  imageSrc,
  selected = false,
  disabled = false,
  onClick,
}: SelectCardButtonProps) {
  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      style={{ width: '100%', display: 'block' }}
    >
      <Card
        withBorder
        h="100%"
        radius="md"
        padding="xs"
        style={{
          transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
          borderColor: selected ? '#228be6' : undefined,
          boxShadow: selected ? '0 0 0 2px rgba(34, 139, 230, 0.25)' : undefined,
          transform: selected ? 'translateY(-1px)' : undefined,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Stack gap="xs" align="center">
          <Image
            src={imageSrc}
            alt={label}
            h={100}
            fit="contain"
          />
          <Text fw={600} ta="center">
            {label}
          </Text>
        </Stack>
      </Card>
    </UnstyledButton>
  );
}
