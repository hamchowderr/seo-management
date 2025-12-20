'use client'

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { STAGE_LABELS, STAGE_COLORS, WORKFLOW_STAGES } from '@/lib/constants/stages'
import { useIsMobile } from '@/hooks/use-mobile'

interface ArticlesByStageChartProps {
  stageBreakdown: Record<string, number>
  totalArticles: number
}

export function ArticlesByStageChart({ stageBreakdown, totalArticles }: ArticlesByStageChartProps) {
  const isMobile = useIsMobile()

  // Responsive chart dimensions
  const yAxisWidth = isMobile ? 100 : 140
  const fontSize = isMobile ? 10 : 12

  // Transform data for the chart - only workflow stages (excluding keyword_hopper)
  const chartData = WORKFLOW_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: stageBreakdown[stage] || 0,
    fill: STAGE_COLORS[stage],
  }))

  // Create chart config dynamically based on stages
  const chartConfig: ChartConfig = WORKFLOW_STAGES.reduce((acc, stage) => {
    acc[stage] = {
      label: STAGE_LABELS[stage],
      color: STAGE_COLORS[stage],
    }
    return acc
  }, {} as ChartConfig)

  chartConfig.count = {
    label: 'Articles',
  }

  if (totalArticles === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center sm:h-[200px]">
        <p className="text-muted-foreground text-sm">No articles yet. Start by adding keywords.</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full sm:h-[200px]">
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 0, right: 16 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={yAxisWidth}
          tick={{ fontSize }}
        />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => Math.floor(value).toString()}
        />
        <ChartTooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--color-count)" />
      </BarChart>
    </ChartContainer>
  )
}
