import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SessionContext } from './SessionContext';
import { EventRoleProvider } from './EventRoleContext';
import { api } from './api';
import type { CustomerSession } from './types';
import BottomNav from './components/BottomNav';
import LoginPage from './pages/LoginPage';
import EventListPage from './pages/EventListPage';
import EventDetailPage from './pages/EventDetailPage';
import ProfilePage from './pages/ProfilePage';
import ScanPage from './pages/ScanPage';
import EditEventPage from './pages/EditEventPage';

// Layout wrapper that adds bottom nav on appropriate pages
function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const showNav = !pathname.includes('/scan') && !pathname.endsWith('/edit');
  return (
    <>
      {children}
      {showNav && <BottomNav />}
    </>
  );
}

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: CustomerSession }
  | { status: 'unauthenticated' };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    api.getSession()
      .then((session) => setAuth({ status: 'authenticated', session }))
      .catch(() => setAuth({ status: 'unauthenticated' }));
  }, []);

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <LoginPage
        onLogin={(session) => setAuth({ status: 'authenticated', session })}
      />
    );
  }

  return (
    <SessionContext.Provider value={auth.session}>
      <EventRoleProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<EventListPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/events/:eventId/edit" element={<EditEventPage />} />
            <Route path="/events/:eventId/scan" element={<ScanPage mode="gate" />} />
            <Route path="/events/:eventId/trackables/:trackableId/scan" element={<ScanPage mode="trackable" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
      </EventRoleProvider>
    </SessionContext.Provider>
  );
}
