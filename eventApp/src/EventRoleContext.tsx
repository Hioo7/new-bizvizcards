import { createContext, useContext, useState } from 'react';
import type { EventMember } from './types';

type EventRole = EventMember['role'] | null;

interface EventRoleContextValue {
  role: EventRole;
  setRole: (role: EventRole) => void;
}

const EventRoleContext = createContext<EventRoleContextValue | null>(null);

export function EventRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<EventRole>(null);
  return (
    <EventRoleContext.Provider value={{ role, setRole }}>
      {children}
    </EventRoleContext.Provider>
  );
}

export function useEventRole(): EventRoleContextValue {
  const ctx = useContext(EventRoleContext);
  if (!ctx) throw new Error('useEventRole must be used within EventRoleProvider');
  return ctx;
}
