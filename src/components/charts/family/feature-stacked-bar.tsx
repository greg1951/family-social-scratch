'use client';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "Member Bar Chart"

const chartData = [
  { feature: "TV", John: 2, Jane: 2, Mike: 1, Emily: 3, Gregorio: 1 },
  { feature: "Movies", John: 2, Jane: 1, Mike: 3, Emily: 2, Gregorio: 2 },
  { feature: "Foodie", John: 1, Jane: 2, Mike: 1, Emily: 2, Gregorio: 2 },
  { feature: "Threads", John: 3, Jane: 2, Mike: 1, Emily: 3, Gregorio: 6 },
  { feature: "Books", John: 1, Jane: 2, Mike: 3, Emily: 1, Gregorio: 5 },
]

const memberColors = {
  John: "#f97316",
  Jane: "#14b8a6",
  Mike: "#2563eb",
  Emily: "#eab308",
  Gregorio: "#ec4899",
} as const

const chartConfig = {
  visitors: {
    label: "Posts",
  },
  John: {
    label: "John",
    color: memberColors.John,
  },
  Jane: {
    label: "Jane",
    color: memberColors.Jane,
  },
  Mike: {
    label: "Mike",
    color: memberColors.Mike,
  },
  Emily: {
    label: "Emily",
    color: memberColors.Emily,
  },
  Gregorio: {
    label: "Gregorio",
    color: memberColors.Gregorio,
  },
} satisfies ChartConfig

export default function MemberStackedBarChart() {
  const id = "radial-interactive"

  return (
    <>
      <CardHeader className="flex-row items-start space-y-0 pt-0">
        <div className="grid gap-1">
          <CardTitle className="text-center text-sm font-semibold">Activity by Feature</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        <ChartContainer
          id={ id }
          config={ chartConfig }
          className="mx-auto aspect-square h-50 w-screen max-w-md"
        >
          <BarChart accessibilityLayer data={ chartData }>
            <CartesianGrid vertical={ false } />
            <XAxis
              dataKey="feature"
              tickLine={ false }
              tickMargin={ 10 }
              axisLine={ false }
              tickFormatter={ (value: string) => value.slice(0, 10) }
            />
            <ChartTooltip content={ <ChartTooltipContent hideLabel /> } />
            <ChartLegend content={ <ChartLegendContent /> } />
            <Bar
              dataKey="John"
              stackId="a"
              fill={ memberColors.John }
              radius={ [0, 0, 0, 0] }
            />
            <Bar
              dataKey="Jane"
              stackId="a"
              fill={ memberColors.Jane }
              radius={ [0, 0, 0, 0] }
            />
            <Bar
              dataKey="Mike"
              stackId="a"
              fill={ memberColors.Mike }
              radius={ [0, 0, 0, 0] }
            />
            <Bar
              dataKey="Emily"
              stackId="a"
              fill={ memberColors.Emily }
              radius={ [0, 0, 0, 0] }
            />
            <Bar
              dataKey="Gregorio"
              stackId="a"
              fill={ memberColors.Gregorio }
              radius={ [0, 0, 0, 0] }
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </>
  )
}
