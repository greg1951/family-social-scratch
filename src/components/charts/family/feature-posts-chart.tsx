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

export type FeaturePostsChartData = {
  feature: string;
  POST_CREATED: number;
  COMMENT_CREATED: number;
  REACTION_ADDED: number;
}[];

const chartConfig = {
  POST_CREATED: { label: "Posts", color: "#d1d5db" },
  COMMENT_CREATED: { label: "Comments", color: "var(--chart-2)" },
  REACTION_ADDED: { label: "Reactions", color: "#60a5fa" },
} satisfies ChartConfig;

const featureNameMap: Record<string, string> = {
  "TV Junkies": "TV",
  "Movie Maniacs": "Movies",
  "Family Foodies": "Recipes",
  "Poetry Cafe": "Poems",
  "Reading Room": "Books",
  "Family Gallery": "Photos",
};

export default function FeaturePostsChart({ data }: { data: FeaturePostsChartData }) {
  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">By Feature: Posts, Comments, Reactions</CardTitle>
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
            <Bar dataKey="POST_CREATED" stackId="a" fill="#d1d5db" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="COMMENT_CREATED" stackId="a" fill="var(--chart-2)" radius={ [0, 0, 0, 0] } />
            <Bar dataKey="REACTION_ADDED" stackId="a" fill="#60a5fa" radius={ [4, 4, 0, 0] } />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  );
}
