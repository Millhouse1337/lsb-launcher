import { useState } from 'react';
import { AppShell, Group, Title, Tabs, Container } from '@mantine/core';
import { IconHome, IconPuzzle, IconSettings } from '@tabler/icons-react';
import Home from './pages/Home';
import Extensions from './pages/Extensions';
import Settings from './pages/Settings';

type TabKey = 'home' | 'extensions' | 'settings';

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Title order={3}>LSB Launcher</Title>
          <Tabs value={tab} onChange={(v) => v && setTab(v as TabKey)}>
            <Tabs.List>
              <Tabs.Tab value="home" leftSection={<IconHome size={16} />}>
                Home
              </Tabs.Tab>
              <Tabs.Tab value="extensions" leftSection={<IconPuzzle size={16} />}>
                Extensions
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          {tab === 'home' && <Home />}
          {tab === 'extensions' && <Extensions />}
          {tab === 'settings' && <Settings />}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
