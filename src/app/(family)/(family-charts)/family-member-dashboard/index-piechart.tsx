'use client';
import { useMemo, useState } from "react"
import { Label, Pie, PieChart } from "recharts"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive pie chart"

const tvData = [
  { month: "january", tv: 186, fill: "var(--color-january)" },
  { month: "february", tv: 305, fill: "var(--color-february)" },
  { month: "march", tv: 237, fill: "var(--color-march)" },
  { month: "april", tv: 173, fill: "var(--color-april)" },
  { month: "may", tv: 209, fill: "var(--color-may)" },
]
const movieData = [
  { month: "january", movie: 80, fill: "var(--color-january)" },
  { month: "february", movie: 200, fill: "var(--color-february)" },
  { month: "march", movie: 120, fill: "var(--color-march)" },
  { month: "april", movie: 190, fill: "var(--color-april)" },
  { month: "may", movie: 130, fill: "var(--color-may)" },
]
const foodieData = [
  { month: "january", foodie: 80, fill: "var(--color-january)" },
  { month: "february", foodie: 200, fill: "var(--color-february)" },
  { month: "march", foodie: 120, fill: "var(--color-march)" },
  { month: "april", foodie: 190, fill: "var(--color-april)" },
  { month: "may", foodie: 130, fill: "var(--color-may)" },
]

const chartConfig = {
  visitors: {
    label: "Posts",
  },
  tv: {
    label: "TV Junkies",
  },
  movie: {
    label: "Movie Maniacs",
  },
  foodie: {
    label: "Family Foodies",
  },
  january: {
    label: "January",
    color: "var(--chart-1)",
  },
  february: {
    label: "February",
    color: "var(--chart-2)",
  },
  march: {
    label: "March",
    color: "var(--chart-3)",
  },
  april: {
    label: "April",
    color: "var(--chart-4)",
  },
  may: {
    label: "May",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export default function FamilyMemberDashboardPie() {
  const id = "pie-interactive"
  const [activeMonth, setActiveMonth] = useState(tvData[0].month)

  const activePoint = useMemo(
    () => tvData.find((item) => item.month === activeMonth) ?? tvData[0],
    [activeMonth]
  )
  const months = useMemo(() => tvData.map((item) => item.month), [])

  return (
    <Card data-chart={ id } className="flex flex-col">
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Family Member Dashboard</CardTitle>
          <CardDescription>Family Social Feature Activity</CardDescription>
        </div>
        <Select value={ activeMonth } onValueChange={ setActiveMonth }>
          <SelectTrigger
            className="ml-auto h-7 w-32.5 rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            { months.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]

              if (!config) {
                return null
              }

              return (
                <SelectItem
                  key={ key }
                  value={ key }
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-xs"
                      style={ {
                        backgroundColor: `var(--color-${ key })`,
                      } }
                    />
                    { config?.label }
                  </div>
                </SelectItem>
              )
            }) }
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={ id }
          config={ chartConfig }
          className="mx-auto h-80 w-full max-w-75"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="visitors"
                  nameKey="month"
                  indicator="line"
                  labelFormatter={ (_, payload) => {
                    return chartConfig[
                      payload?.[0].dataKey as keyof typeof chartConfig
                    ].label
                  } }
                />
              }
            />
            <Pie data={ tvData } dataKey="tv" outerRadius={ 60 } />
            <Pie
              data={ movieData }
              dataKey="movie"
              innerRadius={ 70 }
              outerRadius={ 90 }
            />
            <Pie
              data={ foodieData }
              dataKey="foodie"
              innerRadius={ 70 }
              outerRadius={ 90 }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
