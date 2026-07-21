import { useState, useEffect } from 'react';
import { api } from './api';
import type { CustomerSession } from './types';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: CustomerSession }
  | { status: 'unauthenticated' };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    api.getSession()
      .then((session) => setState({ status: 'authenticated', session }))
      .catch(() => setState({ status: 'unauthenticated' }));
  }, []);

  return state;
}
