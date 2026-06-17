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
  INVITES_SENT: number;
  NEW_MEMBERS_JOINED: number;
}[];

const chartConfig = {
  THREAD_CREATED: { label: "Threads", color: "#3b82f6" },
  GAME_STARTED: { label: "Games", color: "var(--chart-2)" },
  INVITES_SENT: { label: "Invites", color: "var(--chart-3)" },
  NEW_MEMBERS_JOINED: { label: "New Members", color: "var(--chart-4)" },
} satisfies ChartConfig;

export default function ThreadGameChart({ data }: { data: ThreadGameChartData }) {
  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Family-Wide Threads, Games, Invites</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        <ChartContainer config={ chartConfig } className="mx-auto h-72 w-full min-w-0">
          <BarChart accessibilityLayer data={ data } margin={ { top: 56, left: 12, right: 12 } }>
            <CartesianGrid vertical={ false } />
            <XAxis
              dataKey="member"
              tickLine={ false }
              tickMargin={ 10 }
              axisLine={ false }
              tick={ { fontSize: 12 } }
            />
            <ChartTooltip content={ <ChartTooltipContent hideLabel /> } />
            <ChartLegend verticalAlign="top" height={ 56 } content={ <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-[11px]" /> } />
            <Bar dataKey="THREAD_CREATED" fill="#3b82f6" radius={ [4, 4, 0, 0] } />
            <Bar dataKey="GAME_STARTED" fill="var(--chart-2)" radius={ [4, 4, 0, 0] } />
            <Bar dataKey="INVITES_SENT" fill="var(--chart-3)" radius={ [4, 4, 0, 0] } />
            <Bar dataKey="NEW_MEMBERS_JOINED" fill="var(--chart-4)" radius={ [4, 4, 0, 0] } />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
