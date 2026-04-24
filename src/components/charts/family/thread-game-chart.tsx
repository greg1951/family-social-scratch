'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type ThreadGameChartData = {
  member: string;
  THREAD_CREATED: number;
  GAME_STARTED: number;
}[];

const chartConfig = {
  THREAD_CREATED: { label: "Threads", color: "#3b82f6" },
  GAME_STARTED: { label: "Games", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function ThreadGameChart({ data }: { data: ThreadGameChartData }) {
  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Thread and Game Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        <ChartContainer config={ chartConfig } className="mx-auto h-60 w-full min-w-0">
          <BarChart accessibilityLayer data={ data } margin={ { left: 12, right: 12 } }>
            <CartesianGrid vertical={ false } />
            <XAxis
              dataKey="member"
              tickLine={ false }
              tickMargin={ 10 }
              axisLine={ false }
              tick={ { fontSize: 12 } }
            />
            <ChartTooltip content={ <ChartTooltipContent hideLabel /> } />
            <ChartLegend content={ <ChartLegendContent /> } />
            <Bar dataKey="THREAD_CREATED" fill="#3b82f6" radius={ [4, 4, 0, 0] } />
            <Bar dataKey="GAME_STARTED" fill="var(--chart-2)" radius={ [4, 4, 0, 0] } />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
