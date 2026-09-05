import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Group, Image, Loader, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconCircleFilled, IconPlayerPlay } from '@tabler/icons-react';
// Imported rather than referenced by path so Vite fingerprints it into the bundle -- a bare
// /src path resolves in dev and 404s in the packaged app, where the renderer is served from
// file://.
import bannerImage from '../assets/lsm-test-server.png';

// Mirrors UNCONFIGURED_SERVER_HOST in electron/main/config-store.ts. A tester who never
// changes this connects to their own machine and gets a confusing xiloader failure, so
// say so up front rather than letting Play look like it is broken.
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '::1'];

export default function Home() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  async function refresh() {
    const s = await window.api.server.getStatus();
    setStatus(s);
  }

  useEffect(() => {
    refresh();
    window.api.config.get().then(setConfig);
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  const serverUnconfigured = config !== null && LOOPBACK_HOSTS.includes(config.serverHost);

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
      {serverUnconfigured && (
        <Alert
          color="yellow"
          icon={<IconAlertTriangle size={18} />}
          title="No server configured"
          variant="light"
        >
          The server host is still <strong>{config?.serverHost}</strong>, which points at your own
          computer. Open <strong>Settings</strong> and enter the server address you were given, or
          the game will fail to connect.
        </Alert>
      )}
      <Card withBorder padding="lg" radius="md">
        {/* Sits above the status row and Play, so the card leads with what this launcher IS
            before it reports on it. Fixed aspect via the natural size; width:100% lets it
            shrink with the window rather than forcing a horizontal scrollbar. */}
        <Image
          src={bannerImage}
          alt="LSM Test Server"
          radius="md"
          mb="lg"
          style={{ width: '100%', height: 'auto' }}
        />
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
