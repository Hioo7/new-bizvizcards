import { createContext, useContext } from 'react';
import type { CustomerSession } from './types';

export const SessionContext = createContext<CustomerSession | null>(null);

export function useSession(): CustomerSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionContext.Provider');
  return ctx;
}
