import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export default function Settings() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.config.get().then(setConfig);
  }, []);

  function update<K extends keyof LauncherConfig>(key: K, value: LauncherConfig[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      await window.api.config.update(config);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  if (!config) return null;

  return (
    <Stack mt="xl" gap="lg">
      <Title order={2}>Settings</Title>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Server
        </Title>
        <Stack>
          <TextInput
            label="Server host"
            description="The IP or hostname of your LSB server."
            value={config.serverHost}
            onChange={(e) => update('serverHost', e.currentTarget.value)}
          />
          <NumberInput
            label="HTTP API port"
            description="Port for the status API (default 8088). Auth/map ports are fixed by the server."
            value={config.serverPort}
            onChange={(v) => update('serverPort', typeof v === 'number' ? v : 8088)}
            min={1}
            max={65535}
          />
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Ashita
        </Title>
        <TextInput
          label="Boot profile"
          description="Ashita boot profile name (without .xml). Default: default."
          value={config.ashitaProfile}
          onChange={(e) => update('ashitaProfile', e.currentTarget.value)}
        />
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          FFXI graphics & sound
        </Title>
        <Alert color="gray" icon={<IconInfoCircle size={18} />} variant="light">
          Resolution, gamma, sound, and language live in FFXI's binary config blob in the registry.
          Editing them safely needs a parser that isn't built yet. For now, use the in-game config
          menu (Esc → Config) to change these.
        </Alert>
      </Card>

      <Divider />
      <Group justify="flex-end">
        <Button disabled={!dirty || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Group>
    </Stack>
  );
}
