import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isProfile = pathname === '/profile';

  // Extract eventId from /events/:eventId paths so the scan button is contextual
  const eventIdMatch = pathname.match(/^\/events\/([^/]+)(?:\/.*)?$/);
  const currentEventId = eventIdMatch?.[1] ?? null;

  function handleScan() {
    if (currentEventId) {
      navigate(`/events/${currentEventId}/scan`);
    } else {
      navigate('/');
    }
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-base-100 border-t border-base-300 flex h-16 safe-area-inset-bottom">
      {/* Events tab */}
      <button
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          !isProfile ? 'text-primary' : 'text-base-content/40'
        }`}
        onClick={() => navigate('/')}
        aria-label="Events"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={!isProfile ? 2 : 1.5} className="h-6 w-6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V9.75zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008z" />
        </svg>
        <span className="text-[10px] font-medium">Events</span>
      </button>

      {/* Centre scan FAB */}
      <div className="flex-none w-20 flex flex-col items-center justify-end pb-2 relative">
        <button
          className="absolute -top-5 flex flex-col items-center gap-0.5"
          onClick={handleScan}
          aria-label="Scan QR"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40 active:scale-95 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </span>
          <span className="text-[10px] font-medium text-primary mt-0.5">Scan</span>
        </button>
      </div>

      {/* Profile tab */}
      <button
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          isProfile ? 'text-primary' : 'text-base-content/40'
        }`}
        onClick={() => navigate('/profile')}
        aria-label="Profile"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isProfile ? 2 : 1.5} className="h-6 w-6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </nav>
  );
}
