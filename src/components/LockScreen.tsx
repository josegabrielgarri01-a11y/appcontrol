import { useState } from 'react';
import { Lock, Shield, X } from 'lucide-react';

interface LockScreenProps {
  masterPin: string;
  onUnlock: () => void;
  reason?: string;
}

export function LockScreen({ masterPin, onUnlock, reason }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === masterPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_70%)]" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 ring-4 ring-red-500/30">
          <Lock className="h-12 w-12 text-red-400" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Dispositivo Bloqueado</h1>
          <p className="mt-2 text-sm text-slate-400">
            {reason || 'Has alcanzado tu límite de tiempo diario.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <Shield className="h-5 w-5 text-slate-400" />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="PIN Maestro"
              className="w-32 bg-transparent text-center text-lg tracking-[0.5em] text-white placeholder:text-slate-600 focus:outline-none"
              autoFocus
            />
          </div>
          {error && (
            <p className="flex items-center gap-1 text-sm text-red-400">
              <X className="h-4 w-4" /> PIN incorrecto
            </p>
          )}
          <button
            type="submit"
            className="rounded-xl bg-red-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-red-600 active:scale-95"
          >
            Desbloquear
          </button>
        </form>

        <p className="text-xs text-slate-600">
          Contacta al administrador si no conoces el PIN.
        </p>
      </div>
    </div>
  );
}
