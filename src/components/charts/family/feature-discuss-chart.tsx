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

export type FeatureDiscussChartData = {
  feature: string;
  DISCUSS_START: number;
  DISCUSS_REPLY: number;
  DISCUSS_REACT: number;
}[];

const chartConfig = {
  DISCUSS_START: { label: "Discussion Creates", color: "#fb923c" },
  DISCUSS_REPLY: { label: "Discussion Replies", color: "#22c55e" },
  DISCUSS_REACT: { label: "Discussion Reacts", color: "#8b5cf6" },
} satisfies ChartConfig;

const featureNameMap: Record<string, string> = {
  "TV Room": "TV",
  "Movie Theater": "Movies",
  "The Kitchen": "Recipes",
  "Poetry Nook": "Poems",
  "Reading Room": "Books",
  "Family Gallery": "Photos",
};

export default function FeatureDiscussChart({ data }: { data: FeatureDiscussChartData }) {
  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Discussion Activity By Feature</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        <ChartContainer config={ chartConfig } className="mx-auto h-72 w-full min-w-0">
          <BarChart accessibilityLayer data={ data } margin={ { top: 56, left: 12, right: 12 } }>
            <CartesianGrid vertical={ false } />
            <XAxis
              dataKey="feature"
              tickLine={ false }
              tickMargin={ 10 }
              axisLine={ false }
              tick={ { fontSize: 12 } }
              tickFormatter={ (value: string) => featureNameMap[value] || value }
            />
            <ChartTooltip content={ <ChartTooltipContent hideLabel /> } />
            <ChartLegend verticalAlign="top" height={ 56 } content={ <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-[11px]" /> } />
            <Bar dataKey="DISCUSS_START" stackId="a" fill="#fb923c" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="DISCUSS_REPLY" stackId="a" fill="#22c55e" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="DISCUSS_REACT" stackId="a" fill="#8b5cf6" radius={ [4, 4, 0, 0] } />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
