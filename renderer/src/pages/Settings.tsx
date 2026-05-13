import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Group,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';

const WINDOW_MODE_OPTIONS = [
  { label: 'Fullscreen', value: '0' },
  { label: 'Windowed', value: '1' },
  { label: 'Borderless', value: '3' },
];

export default function Settings() {
  const [config, setConfig] = useState<LauncherConfig | null>(null);
  const [ffxi, setFfxi] = useState<FFXISettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.config.get().then(setConfig);
    window.api.ffxi.getSettings().then(setFfxi);
  }, []);

  function patchConfig<K extends keyof LauncherConfig>(key: K, value: LauncherConfig[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }

  function patchFfxi<K extends keyof FFXISettings>(key: K, value: FFXISettings[K]) {
    setFfxi((c) => (c ? { ...c, [key]: value } : c));
    setDirty(true);
  }

  async function save() {
    if (!config || !ffxi) return;
    setSaving(true);
    try {
      await Promise.all([window.api.config.update(config), window.api.ffxi.setSettings(ffxi)]);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  if (!config || !ffxi) return null;

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
            onChange={(e) => patchConfig('serverHost', e.currentTarget.value)}
          />
          <NumberInput
            label="HTTP API port"
            description="Used for status polling. Default 8088."
            value={config.serverPort}
            onChange={(v) => patchConfig('serverPort', typeof v === 'number' ? v : 8088)}
            min={1}
            max={65535}
          />
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Graphics
        </Title>
        <Stack>
          <div>
            <Text size="sm" fw={500} mb={4}>
              Window mode
            </Text>
            <SegmentedControl
              fullWidth
              data={WINDOW_MODE_OPTIONS}
              value={String(ffxi.windowMode ?? 1)}
              onChange={(v) => patchFfxi('windowMode', Number(v) as 0 | 1 | 3)}
            />
          </div>
          <SimpleGrid cols={2}>
            <NumberInput
              label="Window width"
              value={ffxi.windowWidth ?? 1920}
              onChange={(v) => patchFfxi('windowWidth', typeof v === 'number' ? v : undefined)}
              min={640}
              max={7680}
            />
            <NumberInput
              label="Window height"
              value={ffxi.windowHeight ?? 1080}
              onChange={(v) => patchFfxi('windowHeight', typeof v === 'number' ? v : undefined)}
              min={480}
              max={4320}
            />
          </SimpleGrid>
          <NumberInput
            label="Gamma"
            description="0 is the default. Negative is darker, positive is brighter."
            value={ffxi.gamma ?? 0}
            onChange={(v) => patchFfxi('gamma', typeof v === 'number' ? v : undefined)}
          />
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Sound
        </Title>
        <Stack>
          <Switch
            label="Sound enabled"
            checked={ffxi.soundEnabled ?? true}
            onChange={(e) => patchFfxi('soundEnabled', e.currentTarget.checked)}
          />
          <Switch
            label="Play sound when window is in background"
            checked={ffxi.soundAlwaysOn ?? false}
            onChange={(e) => patchFfxi('soundAlwaysOn', e.currentTarget.checked)}
          />
          <NumberInput
            label="Max simultaneous sounds"
            description="12 lowest, 20 highest."
            value={ffxi.maxSounds ?? 12}
            onChange={(v) => patchFfxi('maxSounds', typeof v === 'number' ? v : undefined)}
            min={12}
            max={20}
          />
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Title order={4} mb="md">
          Misc
        </Title>
        <Stack>
          <Switch
            label="Hardware mouse"
            checked={ffxi.hardwareMouse ?? true}
            onChange={(e) => patchFfxi('hardwareMouse', e.currentTarget.checked)}
          />
          <Switch
            label="Show opening movie"
            checked={ffxi.showOpeningMovie ?? false}
            onChange={(e) => patchFfxi('showOpeningMovie', e.currentTarget.checked)}
          />
        </Stack>
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
