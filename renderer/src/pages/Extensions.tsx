import { useEffect, useState } from 'react';
import {
  Accordion,
  Anchor,
  Badge,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';

function fileSizeKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function Extensions() {
  const [addons, setAddons] = useState<AddonInfo[] | null>(null);
  const [plugins, setPlugins] = useState<PluginInfo[] | null>(null);

  async function refresh() {
    const [a, p] = await Promise.all([
      window.api.ashita.listAddons(),
      window.api.ashita.listPlugins(),
    ]);
    setAddons(a);
    setPlugins(p);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onToggleAddon(name: string, enabled: boolean) {
    await window.api.ashita.toggleAddon(name, enabled);
    setAddons((cur) => cur?.map((x) => (x.name === name ? { ...x, enabled } : x)) ?? cur);
  }

  async function onTogglePlugin(name: string, enabled: boolean) {
    await window.api.ashita.togglePlugin(name, enabled);
    setPlugins((cur) => cur?.map((x) => (x.name === name ? { ...x, enabled } : x)) ?? cur);
  }

  return (
    <Stack mt="xl" gap="lg">
      <Title order={2}>Manage Extensions</Title>
      <Text c="dimmed">
        Enable or disable Ashita addons and plugins. Changes take effect the next time FFXI launches.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>Addons</Title>
            <Anchor component="button" onClick={() => window.api.ashita.openAddonsFolder()}>
              Open folder
            </Anchor>
          </Group>
          {addons === null ? (
            <Loader />
          ) : addons.length === 0 ? (
            <Text c="dimmed" size="sm">
              No addons found. Drop your Ashita install into the bundled resources directory.
            </Text>
          ) : (
            <Accordion variant="separated">
              {addons.map((a) => (
                <Accordion.Item key={a.name} value={a.name}>
                  <Accordion.Control>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={500}>{a.name}</Text>
                      <Switch
                        checked={a.enabled}
                        onChange={(e) => onToggleAddon(a.name, e.currentTarget.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      {a.description && <Text size="sm">{a.description}</Text>}
                      <Group gap="xs">
                        {a.author && <Badge variant="light">by {a.author}</Badge>}
                        {a.version && <Badge variant="light">v{a.version}</Badge>}
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>Plugins</Title>
            <Anchor component="button" onClick={() => window.api.ashita.openPluginsFolder()}>
              Open folder
            </Anchor>
          </Group>
          {plugins === null ? (
            <Loader />
          ) : plugins.length === 0 ? (
            <Text c="dimmed" size="sm">
              No plugins found.
            </Text>
          ) : (
            <Accordion variant="separated">
              {plugins.map((p) => (
                <Accordion.Item key={p.name} value={p.name}>
                  <Accordion.Control>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={500}>{p.name}</Text>
                      <Switch
                        checked={p.enabled}
                        onChange={(e) => onTogglePlugin(p.name, e.currentTarget.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" c="dimmed">
                      {fileSizeKB(p.fileSize)} • modified{' '}
                      {new Date(p.modifiedAt).toLocaleDateString()}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
