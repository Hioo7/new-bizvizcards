import { useState } from 'react';
import { useSession } from '../SessionContext';
import { api } from '../api';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfilePage() {
  const session = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await api.signOut();
    } catch {
      // ignore — clear UI anyway
    }
    // Force page reload so AuthGuard re-checks session and shows unauthenticated state
    window.location.href = '/';
  }

  const name = session.user.name;
  const email = session.user.email;

  return (
    <div className="min-h-screen bg-base-200 pb-20">
      {/* Header */}
      <header className="bg-primary px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-primary-content">Profile</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto flex flex-col gap-4">
        {/* Avatar + name card */}
        <div className="card bg-base-100 shadow-sm p-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-content text-2xl font-bold">
            {initials(name)}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-base-content">{name}</p>
            <p className="text-sm text-base-content/60">{email}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          className="btn btn-error btn-outline w-full gap-2"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          {signingOut ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          )}
          Sign out
        </button>
      </main>
    </div>
  );
}
