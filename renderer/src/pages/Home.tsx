import { useEffect, useState } from 'react';
import { Badge, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconCircleFilled, IconPlayerPlay } from '@tabler/icons-react';

export default function Home() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  async function refresh() {
    const s = await window.api.server.getStatus();
    setStatus(s);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  async function play() {
    setLaunching(true);
    setLaunchError(null);
    try {
      await window.api.play.launch();
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : 'Failed to launch');
    } finally {
      setTimeout(() => setLaunching(false), 2000);
    }
  }

  return (
    <Stack mt="xl" gap="lg">
      <Title order={2}>Welcome</Title>
      <Card withBorder padding="lg" radius="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group>
            {status === null ? (
              <Loader size="sm" />
            ) : status.online ? (
              <Badge color="green" leftSection={<IconCircleFilled size={10} />} size="lg" variant="light">
                Server: Online
              </Badge>
            ) : (
              <Badge color="red" leftSection={<IconCircleFilled size={10} />} size="lg" variant="light">
                Server: Offline
              </Badge>
            )}
            {status?.online && typeof status.sessions === 'number' && (
              <Text c="dimmed">
                {status.sessions} {status.sessions === 1 ? 'player' : 'players'} online
              </Text>
            )}
          </Group>
          <Button
            leftSection={<IconPlayerPlay size={18} />}
            size="lg"
            disabled={launching}
            onClick={play}
          >
            {launching ? 'Launching…' : 'Play'}
          </Button>
        </Group>
        {launchError && (
          <Text c="red" size="sm" mt="md">
            {launchError}
          </Text>
        )}
      </Card>
      <Text c="dimmed" size="sm">
        Click <strong>Play</strong> to start FFXI through the bundled xiloader. Server status
        refreshes every 30 seconds.
      </Text>
    </Stack>
  );
}
