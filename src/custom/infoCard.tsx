import { Card, Image, Text } from '@mantine/core';

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
            <Card.Section>
                <Image
                src={imageSrc}
                // height={160}
                height="100%"
                alt="Diagram"
                />
            </Card.Section>

            <Text fw={500}>{title}</Text>

            <Text size="sm" c="dimmed">
                {textBody}
            </Text>
        </Card>

    );
}