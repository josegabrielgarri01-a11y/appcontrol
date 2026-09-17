import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Plus,
  Loader2,
  ArrowLeft,
  Lock,
  Unlock,
  Smartphone,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  KeyRound,
  Clock,
} from 'lucide-react';
import {
  generateLicenses,
  toggleLicenseActive,
  linkDeviceToLicense,
  watchLicenses,
  renewLicense,
} from '@/utils/firestore';
import { getDeviceId } from '@/utils/device';
import { useApp } from '@/context/AppContext';
import type { License } from '@/types';

type LicenseRow = License & { id: string };

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date() > new Date(dateStr);
}

export function SuperAdminPanel() {
  const navigate = useNavigate();
  const { setSuperAdmin } = useApp();
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [linkingDevice, setLinkingDevice] = useState(false);
  const [linkResult, setLinkResult] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchLicenses((lics) => {
      setLicenses(lics);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult(null);
    try {
      const count = await generateLicenses(100);
      setGenResult(`Se generaron ${count} licencias (PADRE-001 a PADRE-100).`);
    } catch {
      setGenResult('Error al generar licencias. Verifica la conexión.');
    }
    setGenerating(false);
  };

  const handleToggleLicense = async (licenseId: string, isActive: boolean) => {
    await toggleLicenseActive(licenseId, !isActive);
  };

  const handleLinkChildDevice = async () => {
    setLinkingDevice(true);
    setLinkResult(null);
    try {
      const deviceId = getDeviceId();
      const ok = await linkDeviceToLicense('PADRE-001', deviceId, 'Celular de mi Hijo');
      if (ok) {
        setLinkResult('Dispositivo vinculado a la licencia PADRE-001 correctamente.');
      } else {
        setLinkResult('No se pudo vincular. PADRE-001 podría tener 4 dispositivos ya.');
      }
    } catch {
      setLinkResult('Error al vincular el dispositivo.');
    }
    setLinkingDevice(false);
  };

  const handleRenew = async (licenseId: string) => {
    setRenewingId(licenseId);
    try {
      await renewLicense(licenseId, 30);
    } catch {
      /* ignore */
    }
    setRenewingId(null);
  };

  const handleExit = () => {
    setSuperAdmin(false);
    navigate('/');
  };

  const activeCount = licenses.filter((l) => l.is_active).length;
  const inUseCount = licenses.filter((l) => (l.linked_devices?.length ?? 0) > 0).length;
  const expiredCount = licenses.filter((l) => isExpired(l.expiration_date ?? null)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_60%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Panel Maestro</h1>
              <p className="text-xs text-slate-400">Super Administrador · Dueño</p>
            </div>
          </div>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-2xl font-bold text-white">{licenses.length}</p>
            <p className="text-xs text-slate-400">Total licencias</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-slate-400">Activas</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-2xl font-bold text-amber-400">{inUseCount}</p>
            <p className="text-xs text-slate-400">En uso</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="text-2xl font-bold text-red-400">{expiredCount}</p>
            <p className="text-xs text-slate-400">Vencidas</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-6 py-4 font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" /> Generar 100 Licencias
              </>
            )}
          </button>
          <button
            onClick={handleLinkChildDevice}
            disabled={linkingDevice}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {linkingDevice ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Vinculando...
              </>
            ) : (
              <>
                <Smartphone className="h-5 w-5" /> Configurar Celular de Mi Hijo
              </>
            )}
          </button>
        </div>

        {genResult && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-3 text-sm text-violet-300 ring-1 ring-violet-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{genResult}</span>
          </div>
        )}
        {linkResult && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-3 text-sm text-blue-300 ring-1 ring-blue-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{linkResult}</span>
          </div>
        )}

        <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Gestión de Licencias</h2>
            <span className="text-xs text-slate-400">{licenses.length} registros</span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : licenses.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-slate-500">
              <Crown className="h-10 w-10" />
              <p className="text-sm">No hay licencias. Genera las primeras con el botón de arriba.</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto rounded-xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                  <tr className="text-xs text-slate-400">
                    <th className="px-3 py-3 font-medium">Clave</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Padre</th>
                    <th className="px-3 py-3 font-medium">Hijo</th>
                    <th className="px-3 py-3 font-medium">PIN</th>
                    <th className="px-3 py-3 font-medium">Vencimiento</th>
                    <th className="px-3 py-3 font-medium">Disp.</th>
                    <th className="px-3 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {licenses.map((lic) => {
                    const linkedCount = lic.linked_devices?.length ?? 0;
                    const maxDev = lic.max_devices ?? 4;
                    const expired = isExpired(lic.expiration_date ?? null);
                    return (
                      <tr key={lic.id} className="hover:bg-white/5">
                        <td className="px-3 py-3 font-mono text-white">{lic.key}</td>
                        <td className="px-3 py-3">
                          {!lic.is_active ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                              <XCircle className="h-3 w-3" /> Inactiva
                            </span>
                          ) : expired ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20">
                              <Clock className="h-3 w-3" /> Vencida
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Activa
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {lic.parent_name ?? (
                            <span className="text-slate-600">Sin registrar</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {lic.child_name ?? (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {lic.admin_pin ? (
                            <span className="flex items-center gap-1 font-mono text-xs text-violet-300">
                              <KeyRound className="h-3 w-3" /> {lic.admin_pin}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {lic.expiration_date ? (
                            <span className={`text-xs ${expired ? 'text-orange-400' : 'text-slate-300'}`}>
                              {formatDate(lic.expiration_date)}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-semibold ${linkedCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {linkedCount}/{maxDev}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRenew(lic.id)}
                              disabled={renewingId === lic.id}
                              title="Renovar +30 días"
                              className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 ring-1 ring-green-500/20 disabled:opacity-50"
                            >
                              {renewingId === lic.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Calendar className="h-3 w-3" /> +30d
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleLicense(lic.id, lic.is_active)}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                lic.is_active
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 ring-1 ring-red-500/20'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 ring-1 ring-green-500/20'
                              }`}
                            >
                              {lic.is_active ? (
                                <>
                                  <Lock className="h-3 w-3" /> Bloq
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3 w-3" /> Act
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
