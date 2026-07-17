import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  dia: string;
  valor: number;
}

interface SalesChartProps {
  data: ChartData[];
  title?: string;
  subtitle?: string;
}

export function SalesChart({ data, title = "Customer Activity", subtitle = "Customer activity for the last 3 months" }: SalesChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[15px] font-medium text-slate-900">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-500 rounded-sm"></div>
            <span className="text-xs text-slate-500 font-medium">Active Accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-200 rounded-sm"></div>
            <span className="text-xs text-slate-500 font-medium">New Customers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-800 rounded-sm"></div>
            <span className="text-xs text-slate-500 font-medium">Returning Users</span>
          </div>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="dia" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
              dy={10}
            />
            <Tooltip
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                fontWeight: 500
              }}
              itemStyle={{ color: '#0f172a' }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#64748b"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorValor)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#0f172a' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
