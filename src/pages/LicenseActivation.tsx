import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Baby,
  UserCog,
  User,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  validateLicense,
  isAdminSecret,
  fetchLicenseByKey,
  registerClientData,
  isLicenseExpired,
} from '@/utils/firestore';
import { useApp } from '@/context/AppContext';
import type { License } from '@/types';

export function LicenseActivation() {
  const navigate = useNavigate();
  const { setLicenseKey, setActivated, setRole, setSuperAdmin } = useApp();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [expired, setExpired] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError(null);
    setExpired(false);

    if (isAdminSecret(key.trim())) {
      setSuperAdmin(true);
      navigate('/super-admin');
      setLoading(false);
      return;
    }

    try {
      const fetched = await fetchLicenseByKey(key.trim());
      if (!fetched) {
        setError('Clave de activación inválida. Verifica e intenta de nuevo.');
        setLoading(false);
        return;
      }
      if (!fetched.is_active) {
        setError('Esta licencia está inactiva. Contacta al administrador.');
        setLoading(false);
        return;
      }
      if (isLicenseExpired(fetched.expiration_date ?? null)) {
        setExpired(true);
        setLoading(false);
        return;
      }

      const validated = await validateLicense(key.trim());
      if (!validated) {
        setError('No se pudo vincular. La licencia podría tener el máximo de 4 dispositivos.');
        setLoading(false);
        return;
      }

      setLicense(validated);

      if (!validated.parent_name || !validated.child_name) {
        setShowRegistration(true);
      } else {
        setLicenseKey(key.trim());
        setActivated(true);
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !childName.trim()) return;
    setRegistering(true);
    setError(null);
    try {
      await registerClientData(key.trim(), parentName.trim(), childName.trim());
      setLicenseKey(key.trim());
      setActivated(true);
      setShowRegistration(false);
    } catch {
      setError('Error al registrar los datos. Verifica tu conexión e intenta de nuevo.');
    }
    setRegistering(false);
  };

  const handleSelectRole = (role: 'child' | 'admin') => {
    setRole(role);
    navigate(role === 'child' ? '/child' : '/admin');
  };

  if (expired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_70%)]" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 ring-2 ring-red-500/20">
            <Calendar className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Licencia Vencida</h1>
          <p className="mt-3 text-sm text-slate-400">
            Tu plan mensual ha expirado. Contacte al administrador para renovar su suscripción mensual.
          </p>
          <button
            onClick={() => { setExpired(false); setKey(''); }}
            className="mt-6 rounded-xl bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (showRegistration && license) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 ring-2 ring-blue-500/20">
              <User className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Registro de Cliente</h1>
              <p className="mt-1 text-sm text-slate-400">
                Completa los datos para activar tu licencia {license.key}
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Nombre del Padre/Madre
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 focus-within:ring-blue-500/40">
                <User className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Nombre del Hijo/Hija
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 focus-within:ring-blue-500/40">
                <Baby className="h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ej: Carlos Pérez"
                  className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-xs text-blue-300 ring-1 ring-blue-500/20">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Tu licencia será válida por 30 días a partir de hoy.</span>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={registering || !parentName.trim() || !childName.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {registering ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Registrando...
                </>
              ) : (
                'Completar Registro'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { isActivated } = useApp();

  if (!isActivated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 ring-2 ring-blue-500/20">
              <ShieldCheck className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Control Parental</h1>
              <p className="mt-1 text-sm text-slate-400">
                Ingresa tu clave de activación para comenzar
              </p>
            </div>
          </div>

          <form onSubmit={handleActivate} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 focus-within:ring-blue-500/40">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ej: PADRE-001"
                className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Validando...
                </>
              ) : (
                'Activar Licencia'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 ring-2 ring-green-500/20">
            <ShieldCheck className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Licencia Activada</h1>
          <p className="mt-1 text-sm text-slate-400">Selecciona el modo de uso</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelectRole('child')}
            className="group flex items-center gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-blue-500/30"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500">
              <Baby className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white">Modo Hijo</h3>
              <p className="text-sm text-slate-400">Dispositivo del niño con bloqueo y tracking</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectRole('admin')}
            className="group flex items-center gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-blue-500/30"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
              <UserCog className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white">Modo Admin</h3>
              <p className="text-sm text-slate-400">Panel de control del padre</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
