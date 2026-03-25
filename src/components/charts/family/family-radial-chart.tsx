'use client';
import { useMemo, useState } from "react"
import { Label, LabelList, Pie, PieChart, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Radial Bar Chart"

const chartData = [
  { feature: "tv", posts: 35, fill: "var(--color-tv)" },
  { feature: "movies", posts: 10, fill: "var(--color-movies)" },
  { feature: "foodie", posts: 17, fill: "var(--color-foodie)" },
  { feature: "threads", posts: 23, fill: "var(--color-threads)" },
  { feature: "books", posts: 5, fill: "var(--color-books)" },
]
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  tv: {
    label: "TV Junkies",
    color: "var(--chart-1)",
  },
  movies: {
    label: "Movie Maniacs",
    color: "var(--chart-2)",
  },
  foodie: {
    label: "Family Foodies",
    color: "var(--chart-3)",
  },
  threads: {
    label: "Threads",
    color: "var(--chart-4)",
  },
  books: {
    label: "Book Besties",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export default function FamilyRadialChart() {
  const id = "radial-interactive"

  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Family-Wide Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center h-55">
        <ChartContainer
          id={ id }
          config={ chartConfig }
          className="mx-auto aspect-square"
        >
          <RadialBarChart
            data={ chartData }
            startAngle={ -90 }
            endAngle={ 380 }
            innerRadius={ 30 }
            outerRadius={ 110 }
          >
            <ChartTooltip
              cursor={ false }
              content={ <ChartTooltipContent hideLabel nameKey="feature" /> }
            />
            <RadialBar dataKey="posts" background>
              <LabelList
                position="insideStart"
                dataKey="feature"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={ 11 }
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </>
  )
}
