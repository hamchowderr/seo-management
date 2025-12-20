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

interface ArticlesByTypeChartProps {
  data: { type: string; count: number }[]
}

const chartConfig = {
  Blog: {
    label: 'Blog',
    color: 'var(--chart-1)',
  },
  SEO: {
    label: 'SEO',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const COLORS = ['var(--chart-1)', 'var(--chart-2)']

export function ArticlesByTypeChart({ data }: ArticlesByTypeChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles by Type</CardTitle>
        <CardDescription>Blog vs SEO content distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="type" />} />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            Total: <span className="text-foreground font-medium">{total}</span> articles
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
