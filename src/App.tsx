import { useCallback, useEffect, useState } from 'react';
import { getSession } from './lib/auth';
import { users } from './lib/db';
import { startReminderLoop } from './lib/notifications';
import { useMemories } from './lib/hooks';
import AuthScreen from './screens/Auth';
import Today from './screens/Today';
import Capture from './screens/Capture';
import Gallery from './screens/Gallery';
import CalendarScreen from './screens/Calendar';
import MemoryView from './screens/MemoryView';
import SettingsScreen from './screens/Settings';
import { Icon } from './screens/ui';

export type Route =
  | { name: 'today' } | { name: 'gallery' } | { name: 'calendar'; month?: string } | { name: 'settings' }
  | { name: 'capture'; date: string } | { name: 'memory'; id: string; from: 'gallery' | 'calendar' | 'today' };

export interface Ctx {
  userId: string; go: (r: Route) => void; refresh: () => void; version: number; logout: () => void;
}

export default function App() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const id = getSession();
    if (!id) { setUserId(null); return; }
    users.get(id).then((u) => setUserId(u ? u.id : null));
  }, []);
  if (userId === undefined) return <div className="boot" />;
  if (!userId) return <AuthScreen onAuth={setUserId} />;
  return <Shell userId={userId} onLogout={() => setUserId(null)} />;
}

function Shell({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [route, setRoute] = useState<Route>({ name: 'today' });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const list = useMemories(userId, version);
  useEffect(() => startReminderLoop(userId), [userId]);
  const ctx: Ctx = { userId, go: setRoute, refresh, version, logout: onLogout };

  const tab = route.name === 'memory' ? route.from : route.name === 'capture' ? 'today' : route.name;
  const full = route.name === 'capture';
  return (
    <div className={`app ${tab === 'today' ? 'sky' : ''}`}>
      <main>
        {route.name === 'today' && <Today ctx={ctx} list={list} />}
        {route.name === 'gallery' && <Gallery ctx={ctx} list={list} />}
        {route.name === 'calendar' && <CalendarScreen ctx={ctx} list={list} initialMonth={route.month} />}
        {route.name === 'settings' && <SettingsScreen ctx={ctx} />}
        {route.name === 'capture' && <Capture ctx={ctx} date={route.date} />}
        {route.name === 'memory' && <MemoryView ctx={ctx} id={route.id} from={route.from} />}
      </main>
      {!full && (
        <nav className="tabbar" aria-label="Navegação principal">
          {([['today', 'Hoje', 'home'], ['gallery', 'Meus Céus', 'image'], ['calendar', 'Calendário', 'calendar'], ['settings', 'Configurações', 'gear']] as const).map(([k, label, icon]) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined}
              onClick={() => setRoute({ name: k } as Route)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
