import { Smartphone, Clock } from 'lucide-react';
import type { AppUsageEntry } from '@/types';

interface AppUsageChartProps {
  data: AppUsageEntry[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function AppUsageChart({ data }: AppUsageChartProps) {
  const maxSeconds = data.length > 0 ? Math.max(...data.map((d) => d.usage_seconds)) : 1;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
        <Smartphone className="h-10 w-10" />
        <p className="text-sm">No hay datos de uso de aplicaciones todavía.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.slice(0, 7).map((app, idx) => {
        const pct = (app.usage_seconds / maxSeconds) * 100;
        const colors = [
          'from-orange-400 to-red-500',
          'from-blue-400 to-cyan-500',
          'from-red-400 to-pink-500',
          'from-green-400 to-emerald-500',
          'from-purple-400 to-indigo-500',
          'from-yellow-400 to-orange-500',
          'from-teal-400 to-green-500',
        ];
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-2">
              <div className={`h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${colors[idx % 7]} flex items-center justify-center`}>
                <Smartphone className="h-4 w-4 text-white" />
              </div>
              <span className="truncate text-xs font-medium text-slate-700">
                {app.app_name}
              </span>
            </div>
            <div className="flex-1">
              <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors[idx % 7]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="flex w-16 shrink-0 items-center justify-end gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {formatTime(app.usage_seconds)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
