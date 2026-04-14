import { Box, Card, Image, Stack, Text } from '@mantine/core';

type InfoCardProps = {
  title: string;
  imageSrc: string;
  textBody : string;
};
export function InfoCard({
  title,
  imageSrc,
  textBody,
}: InfoCardProps) {
    return(
        <Card>
            <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Card.Section>
                    <Image
                    src={imageSrc}
                    height={300}
                    fit="contain"
                    alt="Diagram"
                    />
                </Card.Section>

                <Box p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                   <Text fw={500}>{title}</Text>

                    <Text size="sm" c="dimmed" lineClamp={8}>
                        {textBody}
                    </Text> 
                </Box>
                
            </Box>
        </Card>

    );
}