import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useRescueHubStore } from '@/stores/rescue-hub-store'

export function Overview() {
  const cases = useRescueHubStore((state) => state.cases)

  // Count cases by severity
  const severityCounts = cases.reduce(
    (acc, c) => {
      acc[c.severity] = (acc[c.severity] || 0) + 1
      return acc
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<string, number>
  )

  const data = [
    { name: 'Low', count: severityCounts['Low'] },
    { name: 'Medium', count: severityCounts['Medium'] },
    { name: 'High', count: severityCounts['High'] },
    { name: 'Critical', count: severityCounts['Critical'] },
  ]

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
        />
        <Bar
          dataKey='count'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
