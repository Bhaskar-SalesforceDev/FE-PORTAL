import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(() => localStorage.getItem('fe_email') || '');

  useEffect(() => {
    if (email) localStorage.setItem('fe_email', email);
    else localStorage.removeItem('fe_email');
  }, [email]);

  const logout = () => setEmail('');

  return (
    <AuthContext.Provider value={{ email, setEmail, isLoggedIn: !!email, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
