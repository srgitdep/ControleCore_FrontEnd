import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  description?: string;
  trendLabel?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, description, trendLabel }: KpiCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Top: Icon and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-slate-500 stroke-[1.5px]" />
          </div>
          <span className="text-[15px] font-medium text-slate-500">{title}</span>
        </div>

        {/* Middle: Value and Pill */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
          
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                isNegative 
                  ? 'bg-red-50 text-red-500' 
                  : 'bg-emerald-50 text-emerald-600'
              )}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        {/* Bottom: Description or Trend Label */}
        {(description || trendLabel) && (
          <p className="text-sm text-slate-400 mt-1">
            {trendLabel || description}
          </p>
        )}
      </div>
    </div>
  );
}
