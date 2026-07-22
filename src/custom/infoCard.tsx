import { Box, Card, Image, Text, TextProps } from '@mantine/core';

type InfoCardProps = {
  title: string;
  imageSrc: string;
  textBody : string;
  titleTextSize?: TextProps['size'];
  bodyTextSize?: TextProps['size'];
};
export function InfoCard({
  title,
  imageSrc,
  textBody,
  titleTextSize = 'md',
  bodyTextSize = 'sm',
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
                   <Text size={titleTextSize} fw={500}>{title}</Text>

                    <Text size={bodyTextSize} c="dimmed" lineClamp={8}>
                        {textBody}
                    </Text> 
                </Box>
                
            </Box>
        </Card>

    );
}
