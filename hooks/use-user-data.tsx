import { useState, useEffect } from 'react';

// Simplified user storage for the project session
let currentUser = {
  name: 'Guest User',
  email: '',
};

const listeners = new Set<(user: typeof currentUser) => void>();

export function useUserData() {
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    const listener = (u: typeof currentUser) => setUser({ ...u });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const loginUser = (name: string, email: string) => {
    currentUser = { name, email };
    listeners.forEach(l => l(currentUser));
  };

  return { user, loginUser };
}
