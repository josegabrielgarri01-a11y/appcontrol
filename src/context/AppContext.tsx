import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getDeviceId, getMasterPin } from '@/utils/device';
import type { AppRole } from '@/types';

interface AppState {
  role: AppRole | null;
  licenseKey: string | null;
  deviceId: string;
  masterPin: string;
  setRole: (role: AppRole | null) => void;
  setLicenseKey: (key: string | null) => void;
  isActivated: boolean;
  setActivated: (v: boolean) => void;
  isSuperAdmin: boolean;
  setSuperAdmin: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = 'pc_app_state';

export function AppProvider({ children }: { children: ReactNode }) {
  const deviceId = getDeviceId();
  const masterPin = getMasterPin();

  const [role, setRole] = useState<AppRole | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [isActivated, setActivated] = useState<boolean>(false);
  const [isSuperAdmin, setSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setRole(data.role ?? null);
        setLicenseKey(data.licenseKey ?? null);
        setActivated(data.isActivated ?? false);
        setSuperAdmin(data.isSuperAdmin ?? false);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ role, licenseKey, isActivated, isSuperAdmin }),
    );
  }, [role, licenseKey, isActivated, isSuperAdmin]);

  return (
    <AppContext.Provider
      value={{
        role,
        licenseKey,
        deviceId,
        masterPin,
        setRole,
        setLicenseKey,
        isActivated,
        setActivated,
        isSuperAdmin,
        setSuperAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
