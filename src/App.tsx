import { useCallback, useEffect, useState } from 'react';
import { configured, supabase } from './lib/supabase';
import { settings } from './lib/settings';
import { ensurePush } from './lib/push';
import { useMemories, useSky } from './lib/hooks';
import { AuthScreen, NewPasswordScreen, SetupScreen } from './screens/Auth';
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

export interface Ctx { userId: string; go: (r: Route) => void; refresh: () => void; version: number }

export default function App() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true); // chegou pelo link do e-mail
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!configured) return <SetupScreen />;
  if (userId === undefined) return <div className="boot" />;
  if (userId && recovery) return <NewPasswordScreen onDone={() => setRecovery(false)} />;
  if (!userId) return <AuthScreen />;
  return <Shell userId={userId} />;
}

function Shell({ userId }: { userId: string }) {
  const [route, setRoute] = useState<Route>({ name: 'today' });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const [list, loadError] = useMemories(userId, version);
  const sky = useSky();

  useEffect(() => {
    settings.syncTimezone(userId).catch(() => {});
    settings.get(userId).then((s) => (s.remind ? ensurePush(userId) : undefined)).catch(() => {});
  }, [userId]);

  const ctx: Ctx = { userId, go: setRoute, refresh, version };
  const tab = route.name === 'memory' ? route.from : route.name === 'capture' ? 'today' : route.name;
  return (
    <div className={`app ${tab === 'today' ? 'sky' : ''}`} style={tab === 'today' ? sky : undefined}>
      <main>
        {loadError && <p className="err banner" role="alert">{loadError} <button className="textbtn" onClick={refresh}>Tentar de novo</button></p>}
        {route.name === 'today' && <Today ctx={ctx} list={list} />}
        {route.name === 'gallery' && <Gallery ctx={ctx} list={list} />}
        {route.name === 'calendar' && <CalendarScreen ctx={ctx} list={list} initialMonth={route.month} />}
        {route.name === 'settings' && <SettingsScreen ctx={ctx} />}
        {route.name === 'capture' && <Capture ctx={ctx} date={route.date} />}
        {route.name === 'memory' && <MemoryView ctx={ctx} id={route.id} from={route.from} />}
      </main>
      {route.name !== 'capture' && (
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
