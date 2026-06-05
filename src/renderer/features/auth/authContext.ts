import { createContext, useContext } from 'react';

export const AuthRefreshContext = createContext<() => void>(() => {});

export function useAuthRefresh(): () => void {
  return useContext(AuthRefreshContext);
}
