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

export type MemberPostsChartData = {
  member: string;
  POST_CREATED: number;
  COMMENT_CREATED: number;
  LIKE_ADDED: number;
  LOVE_ADDED: number;
}[];

const chartConfig = {
  POST_CREATED: { label: "Posts", color: "#d1d5db" },
  COMMENT_CREATED: { label: "Comments", color: "var(--chart-2)" },
  LIKE_ADDED: { label: "Likes", color: "#93c5fd" },
  LOVE_ADDED: { label: "Loves", color: "#f472b6" },
} satisfies ChartConfig;

export default function MemberPostsChart({ data }: { data: MemberPostsChartData }) {
  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Member Posts</CardTitle>
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
              tickFormatter={ (value: string) => value.split(" ")[0] }
            />
            <ChartTooltip content={ <ChartTooltipContent hideLabel /> } />
            <ChartLegend content={ <ChartLegendContent /> } />
            <Bar dataKey="POST_CREATED" stackId="a" fill="#d1d5db" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="COMMENT_CREATED" stackId="a" fill="var(--chart-2)" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="LIKE_ADDED" stackId="a" fill="#93c5fd" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="LOVE_ADDED" stackId="a" fill="#f472b6" radius={ [4, 4, 0, 0] } />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
