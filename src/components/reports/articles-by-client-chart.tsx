'use client'

import { Pie, PieChart, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

interface ArticlesByClientChartProps {
  data: { client: string; count: number }[]
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function ArticlesByClientChart({ data }: ArticlesByClientChartProps) {
  // Take top 5 clients and group rest as "Other"
  const topClients = data.slice(0, 5)
  const otherCount = data.slice(5).reduce((sum, item) => sum + item.count, 0)

  const chartData =
    otherCount > 0 ? [...topClients, { client: 'Other', count: otherCount }] : topClients

  // Build dynamic config for legend
  const chartConfig: ChartConfig = chartData.reduce((acc, item, index) => {
    acc[item.client] = {
      label: item.client,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles by Client</CardTitle>
        <CardDescription>Distribution of articles across clients</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="client" />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="client"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="client" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
