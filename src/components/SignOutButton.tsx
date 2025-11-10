'use client';

import { useRouter } from 'next/navigation';

interface SignOutButtonProps {
  userName: string;
}

export default function SignOutButton({ userName }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      });
      
      router.push('/signin');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="text-right">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Welcome, <span className="font-semibold">{userName}</span>
      </p>
      <button
        onClick={handleSignOut}
        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Sign out
      </button>
    </div>
  );
}
