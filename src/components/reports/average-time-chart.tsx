'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

interface AverageTimeChartProps {
  data: { stage: string; avgDays: number }[]
}

const chartConfig = {
  avgDays: {
    label: 'Avg Days',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

export function AverageTimeChart({ data }: AverageTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Average Time per Stage</CardTitle>
          <CardDescription>Average days spent in each workflow stage</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            No timing data available yet. Data will appear once articles complete workflow stages.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Time per Stage</CardTitle>
        <CardDescription>Average days spent in each workflow stage</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
            <YAxis
              type="category"
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              width={80}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => [`${value} days`, 'Avg Time']} />}
            />
            <Bar dataKey="avgDays" fill="var(--color-avgDays)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
