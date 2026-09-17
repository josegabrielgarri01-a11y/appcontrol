import { useEffect, useState } from 'react';
import { Lock, MapPin, Wifi, WifiOff, Clock, Smartphone, Loader2, CheckCircle2, Circle, MapPinned, Layers, BatteryFull, Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useDeviceLock } from '@/hooks/useDeviceLock';
import { useGeolocationTracking } from '@/hooks/useGeolocationTracking';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { registerDevice, updateDailyUsage } from '@/utils/firestore';
import { reportAppUsage } from '@/utils/appUsage';
import { LockScreen } from '@/components/LockScreen';
import { getTodayDateStr } from '@/utils/device';
import type { Device } from '@/types';

interface PermissionStep {
  id: string;
  icon: typeof MapPinned;
  title: string;
  description: string;
  instructions: string[];
}

const PERMISSION_STEPS: PermissionStep[] = [
  {
    id: 'gps',
    icon: MapPinned,
    title: 'GPS Continuo',
    description: 'Permite que la app capture la ubicación del dispositivo en segundo plano.',
    instructions: [
      'Ve a Configuración → Aplicaciones → Control Parental',
      'Toca "Permisos" → "Ubicación"',
      'Selecciona "Permitir siempre" (no solo "Mientras se usa")',
      'Activa "Usar ubicación precisa"',
    ],
  },
  {
    id: 'overlay',
    icon: Layers,
    title: 'Superposición de Pantalla',
    description: 'Permite que la pantalla de bloqueo aparezca sobre otras apps.',
    instructions: [
      'Ve a Configuración → Aplicaciones → Control Parental',
      'Busca "Mostrar sobre otras apps" o "Superposición"',
      'Activa el permiso para Control Parental',
      'Esto permite que el bloqueo cubra toda la pantalla',
    ],
  },
  {
    id: 'battery',
    icon: BatteryFull,
    title: 'Excepción de Batería',
    description: 'Evita que Android cierre la app para ahorrar batería.',
    instructions: [
      'Ve a Configuración → Batería → Optimización de batería',
      'Busca "Control Parental" en la lista',
      'Selecciona "No optimizar" o "Sin restricciones"',
      'Esto garantiza que el GPS y el bloqueo funcionen siempre',
    ],
  },
];

function PermissionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const step = PERMISSION_STEPS[currentStep];
  const Icon = step.icon;
  const isGranted = granted.has(step.id);
  const allGranted = granted.size === PERMISSION_STEPS.length;

  if (allGranted) {
    return (
      <div className="mb-6 rounded-2xl bg-green-500/10 p-6 ring-1 ring-green-500/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-400" />
          <div>
            <h3 className="text-sm font-semibold text-green-400">Permisos Configurados</h3>
            <p className="text-xs text-slate-400">Todos los permisos necesarios están activos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Asistente de Permisos</h2>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Omitir
        </button>
      </div>

      <div className="mb-5 flex gap-2">
        {PERMISSION_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              granted.has(s.id) ? 'bg-green-500' : i === currentStep ? 'bg-blue-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isGranted ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
          <Icon className={`h-6 w-6 ${isGranted ? 'text-green-400' : 'text-blue-400'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          <p className="mt-1 text-xs text-slate-400">{step.description}</p>
          <ol className="mt-3 space-y-1.5">
            {step.instructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-400">
                  {i + 1}
                </span>
                {inst}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {!isGranted ? (
          <button
            onClick={() => {
              const next = new Set(granted);
              next.add(step.id);
              setGranted(next);
              if (currentStep < PERMISSION_STEPS.length - 1) {
                setCurrentStep(currentStep + 1);
              }
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
          >
            <Circle className="h-4 w-4" /> Marcar como concedido
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentStep < PERMISSION_STEPS.length - 1) setCurrentStep(currentStep + 1);
            }}
            disabled={currentStep >= PERMISSION_STEPS.length - 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-500/20 transition-colors hover:bg-green-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {currentStep < PERMISSION_STEPS.length - 1 ? 'Siguiente permiso' : 'Completado'}
          </button>
        )}
      </div>
    </div>
  );
}

export function ChildMode() {
  const { deviceId, masterPin, licenseKey } = useApp();
  const online = useOnlineStatus();
  const { device, loading } = useDeviceLock(deviceId);
  const { coords, error: geoError } = useGeolocationTracking(deviceId, true);
  const [registered, setRegistered] = useState(false);
  const [usageSeconds, setUsageSeconds] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | undefined>();

  useEffect(() => {
    registerDevice().then(() => setRegistered(true));
  }, []);

  useEffect(() => {
    if (!device) return;
    const today = getTodayDateStr();
    const baseUsage = device.last_reset_date === today ? device.daily_used_seconds : 0;
    setUsageSeconds(baseUsage);

    const maxSeconds = device.max_daily_hours * 3600;
    if (baseUsage >= maxSeconds) {
      setIsLocked(true);
      setLockReason('Has alcanzado tu límite de tiempo diario.');
    } else if (device.is_locked) {
      setIsLocked(true);
      setLockReason('El dispositivo fue bloqueado por el administrador.');
    } else {
      setIsLocked(false);
      setLockReason(undefined);
    }
  }, [device]);

  useEffect(() => {
    if (isLocked || !registered) return;
    const interval = setInterval(() => {
      setUsageSeconds((prev) => {
        const next = prev + 1;
        const maxSeconds = (device?.max_daily_hours ?? 4) * 3600;
        if (next >= maxSeconds) {
          setIsLocked(true);
          setLockReason('Has alcanzado tu límite de tiempo diario.');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, registered, device?.max_daily_hours]);

  useEffect(() => {
    if (!registered || isLocked) return;
    const interval = setInterval(
      () => updateDailyUsage(deviceId, 60).catch(() => {}),
      60000,
    );
    return () => clearInterval(interval);
  }, [registered, isLocked, deviceId]);

  useEffect(() => {
    if (!registered) return;
    reportAppUsage().catch(() => {});
    const interval = setInterval(
      () => reportAppUsage().catch(() => {}),
      300000,
    );
    return () => clearInterval(interval);
  }, [registered]);

  const handleUnlock = () => {
    setIsLocked(false);
    setLockReason(undefined);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const maxHours = device?.max_daily_hours ?? 4;
  const maxSeconds = maxHours * 3600;
  const usagePct = Math.min((usageSeconds / maxSeconds) * 100, 100);
  const remainingMin = Math.max(Math.floor((maxSeconds - usageSeconds) / 60), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-md px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
              <Smartphone className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Modo Hijo</h1>
              <p className="text-xs text-slate-500">Licencia: {licenseKey?.slice(0, 8)}...</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${online ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'}`}>
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? 'En línea' : 'Sin conexión'}
          </div>
        </header>

        <PermissionWizard />

        <div className="mb-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4" /> Tiempo de uso hoy
            </span>
            <span className="text-sm font-semibold text-white">
              {Math.floor(usageSeconds / 3600)}h {Math.floor((usageSeconds % 3600) / 60)}m
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Te quedan {remainingMin} minutos de uso.
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Ubicación GPS</h2>
          </div>
          {coords ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Latitud</span>
                <span className="font-mono text-white">{coords.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Longitud</span>
                <span className="font-mono text-white">{coords.lng.toFixed(6)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                Tracking activo {online ? '(subiendo a la nube)' : '(guardando local)'}
              </div>
            </div>
          ) : geoError ? (
            <p className="text-sm text-red-400">Error: {geoError}</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo ubicación...
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="mb-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Estado del Dispositivo</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Estado de bloqueo</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${device?.is_locked ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'}`}>
              {device?.is_locked ? 'Bloqueado' : 'Activo'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Límite diario</span>
            <span className="text-sm font-semibold text-white">{maxHours} horas</span>
          </div>
        </div>
      </div>

      {isLocked && (
        <LockScreen
          masterPin={masterPin}
          onUnlock={handleUnlock}
          reason={lockReason}
        />
      )}
    </div>
  );
}
