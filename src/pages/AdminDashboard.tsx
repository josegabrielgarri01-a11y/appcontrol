import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, Clock, MapPin, Loader2, ArrowLeft, RefreshCw, KeyRound, MessageCircle, Settings, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchDevice, updateDeviceLock, updateMaxDailyHours, fetchLicenseByKey, updateAdminPin } from '@/utils/firestore';
import { fetchLocations } from '@/utils/offlineSync';
import { fetchAppUsage } from '@/utils/appUsage';
import { MapView } from '@/components/MapView';
import { AppUsageChart } from '@/components/AppUsageChart';
import type { Device, LocationLog, AppUsageEntry, License } from '@/types';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { deviceId, licenseKey } = useApp();
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [license, setLicense] = useState<License | null>(null);

  const [device, setDevice] = useState<Device | null>(null);
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [usage, setUsage] = useState<AppUsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(4);
  const [togglingLock, setTogglingLock] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    if (licenseKey) {
      fetchLicenseByKey(licenseKey).then((lic) => {
        if (lic) setLicense(lic);
      });
    }
  }, [licenseKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dev, locs, apps] = await Promise.all([
        fetchDevice(deviceId),
        fetchLocations(deviceId, 100),
        fetchAppUsage(deviceId),
      ]);
      setDevice(dev);
      setLocations(locs);
      setUsage(apps);
      if (dev) setHours(dev.max_daily_hours);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadData();
  }, [authed]);

  const currentPin = license?.admin_pin ?? '1234';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === currentPin) {
      setAuthed(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 1500);
    }
  };

  const handleToggleLock = async () => {
    if (!device) return;
    setTogglingLock(true);
    const newState = !device.is_locked;
    await updateDeviceLock(deviceId, newState);
    setDevice({ ...device, is_locked: newState });
    setTogglingLock(false);
  };

  const handleHoursChange = async (val: number) => {
    setHours(val);
    if (device) {
      setDevice({ ...device, max_daily_hours: val });
    }
  };

  const handleHoursCommit = async () => {
    await updateMaxDailyHours(deviceId, hours);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError(null);
    if (newPin.length < 4) {
      setPinModalError('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinModalError('Los PINs no coinciden.');
      return;
    }
    setPinSaving(true);
    try {
      await updateAdminPin(licenseKey!, newPin);
      setLicense({ ...license!, admin_pin: newPin });
      setPinSaved(true);
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => {
        setShowPinModal(false);
        setPinSaved(false);
      }, 1500);
    } catch {
      setPinModalError('Error al guardar el PIN. Intenta de nuevo.');
    }
    setPinSaving(false);
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.15),transparent_60%)]" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 ring-2 ring-orange-500/20">
              <KeyRound className="h-10 w-10 text-orange-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Acceso de Administrador</h1>
              <p className="mt-1 text-sm text-slate-400">Ingresa tu PIN de acceso</p>
            </div>
          </div>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 focus-within:ring-orange-500/40">
              <Lock className="h-5 w-5 text-slate-400" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="PIN"
                className="flex-1 bg-transparent text-center text-lg tracking-[0.5em] text-white placeholder:text-slate-600 focus:outline-none"
                autoFocus
              />
            </div>
            {pinError && <p className="text-sm text-red-400">PIN incorrecto</p>}
            <button
              type="submit"
              className="rounded-2xl bg-orange-500 px-6 py-4 font-semibold text-white transition-all hover:bg-orange-600 active:scale-[0.98]"
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Panel de Control</h1>
              <p className="text-xs text-slate-500">Modo Administrador</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              <Settings className="h-4 w-4" /> Configuración
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {license?.parent_name && (
              <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <KeyRound className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {license.parent_name} · Padre/Madre
                  </p>
                  <p className="text-xs text-slate-500">
                    Hijo/a: {license.child_name} · Licencia: {license.key}
                  </p>
                </div>
                {license.expiration_date && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Vence</p>
                    <p className={`text-sm font-semibold ${new Date(license.expiration_date) > new Date() ? 'text-slate-700' : 'text-red-500'}`}>
                      {new Date(license.expiration_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">Control de Bloqueo</h2>
                <div className="flex flex-col items-center gap-4">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full ${device?.is_locked ? 'bg-red-100' : 'bg-green-100'}`}>
                    {device?.is_locked ? (
                      <Lock className="h-10 w-10 text-red-500" />
                    ) : (
                      <Unlock className="h-10 w-10 text-green-500" />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${device?.is_locked ? 'text-red-600' : 'text-green-600'}`}>
                    {device?.is_locked ? 'Dispositivo bloqueado' : 'Dispositivo activo'}
                  </p>
                  <button
                    onClick={handleToggleLock}
                    disabled={togglingLock}
                    className={`w-full rounded-xl px-6 py-3 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 ${device?.is_locked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {togglingLock ? (
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    ) : device?.is_locked ? (
                      'Desbloquear Dispositivo'
                    ) : (
                      'Bloquear Dispositivo'
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock className="h-4 w-4" /> Límite de Horas Diarias
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-slate-900">{hours}</span>
                    <span className="ml-1 text-lg text-slate-500">horas</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={0.5}
                    value={hours}
                    onChange={(e) => handleHoursChange(parseFloat(e.target.value))}
                    onMouseUp={handleHoursCommit}
                    onTouchEnd={handleHoursCommit}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1h</span>
                    <span>12h</span>
                  </div>
                  <p className="text-center text-xs text-slate-500">
                    El cambio se aplica inmediatamente en el dispositivo del niño.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin className="h-4 w-4 text-orange-500" /> Ubicación en Tiempo Real
              </h2>
              {locations.length > 0 ? (
                <MapView locations={locations} deviceLocked={!!device?.is_locked} />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                  <MapPin className="h-10 w-10" />
                  <p className="text-sm">Aún no hay ubicaciones registradas.</p>
                </div>
              )}
              {locations.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Ubicación actual
                  <span className="ml-3 h-2 w-2 rounded-full bg-blue-500" /> Histórico
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Aplicaciones Más Usadas</h2>
              <AppUsageChart data={usage} />
            </div>

            <div className="rounded-2xl bg-green-50 p-6 shadow-sm ring-1 ring-green-200">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageCircle className="h-4 w-4 text-green-600" /> Soporte
              </h2>
              <p className="mb-4 text-xs text-slate-500">
                ¿Necesitas ayuda con la app? Contáctanos directamente por WhatsApp.
              </p>
              <a
                href="https://wa.me/521234567890?text=Hola%2C%20necesito%20ayuda%20con%20Control%20Parental"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white transition-all hover:bg-green-600 active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                Soporte WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>

      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <KeyRound className="h-5 w-5 text-orange-500" /> Cambiar PIN de Acceso
              </h3>
              <button
                onClick={() => { setShowPinModal(false); setNewPin(''); setConfirmPin(''); setPinModalError(null); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {pinSaved ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <KeyRound className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-sm font-medium text-green-600">PIN actualizado correctamente</p>
              </div>
            ) : (
              <form onSubmit={handleChangePin} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Nuevo PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 5678"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.3em] focus:border-orange-400 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Confirmar PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repite el PIN"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.3em] focus:border-orange-400 focus:outline-none"
                  />
                </div>
                {pinModalError && (
                  <p className="text-sm text-red-500">{pinModalError}</p>
                )}
                <button
                  type="submit"
                  disabled={pinSaving || !newPin || !confirmPin}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                >
                  {pinSaving ? 'Guardando...' : 'Guardar PIN'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
