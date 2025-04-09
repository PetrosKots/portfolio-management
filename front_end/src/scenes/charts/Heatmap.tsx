import React from 'react'
import { Box} from '@mui/material' 
import { ResponsiveHeatMap } from '@nivo/heatmap'
import _ from 'lodash' 
import { scaleSequential } from 'd3-scale' 
import { interpolateRdYlGn } from 'd3-scale-chromatic'  




interface Props {

  PerformanceData: PerformanceItem[]
}


type PerformanceItem = [string, number];


//colour scale for the heatmap
const ColorScale = scaleSequential(interpolateRdYlGn).domain([-5, 5]) 

const Heatmap: React.FC <Props> = ({PerformanceData}) => {

  
  function ProcessData(Data: PerformanceItem[]){
    // Changing the format of performance to ['Year','Month','Performance']
    // to start creating the valid format of the heatmap which is [ 'Year' : ['month', 'performance']]
    const FormattedPerformance = Data.map(([dates,performance]) => {
      const date = new Date(dates) 
      const row = {
        id: date.getFullYear(),
        month: date.toLocaleString("default", { month: "long" }),
        performance: performance,
      } 
      return row 
    }) 
  
    // grouping performance by year
    const PerformanceGroupedByYear = _.groupBy(FormattedPerformance, "id") 
  
    // grouping performance further by year and month
    const PerformanceGroupedByYearMonth = _.mapValues(
      PerformanceGroupedByYear,
      (yearData) =>
        _.mapValues(_.groupBy(yearData, "month"), (monthData) =>
          monthData.map((item) => item.performance)
        )
    ) 
  
    // calculating the time weighted return for each month
    // the formula is TWR = (1 + r1)*(1 + r2)*... - 1 where r1, r2, ..., rn are the returns for each day of the month
    const TimeWeightedReturnByMonth: Record<number, Record<string, number>> = {} 
  
    Object.keys(PerformanceGroupedByYearMonth).forEach((year) => {
      TimeWeightedReturnByMonth[parseInt(year)] = {} 
  
      Object.keys(PerformanceGroupedByYearMonth[year]).forEach((month) => {
        TimeWeightedReturnByMonth[parseInt(year)][month] =
          PerformanceGroupedByYearMonth[year][month].reduce(
            (product, num) => product * (1 + num),
            1
          ) - 1 
      }) 
    })
  
    // Converting the data to the final format that is valid for the heatmap
    const ChartData = Object.keys(TimeWeightedReturnByMonth).map((year) => ({
      id: year,
      data: Object.keys(TimeWeightedReturnByMonth[parseInt(year)]).map((month) => ({
        x: month,
        y: TimeWeightedReturnByMonth[parseInt(year)][month] * 100,
      })),
    }))
  
    const allMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ] 
  
    // Ensure all months exist in each year's data
    const CompleteChartData = ChartData.map((yearData) => {
      const existingMonths = new Set(yearData.data.map((entry) => entry.x))
  
      // Add missing months with y: null
      const filledData = allMonths.map((month) => ({
        x: month,
        y: existingMonths.has(month)
          ? yearData.data.find((entry) => entry.x === month)!.y
          : null,
      })) 
  
      return { ...yearData, data: filledData } 
    }) 
  
    // sorting the data before returning it
    return CompleteChartData.sort((a, b) => parseInt(b.id) - parseInt(a.id)) 
  }
  
  
  
  

  
  
  
  
  
  

  return (
    <div>
        
        <Box sx={{height:400}}>
        <ResponsiveHeatMap
            data={ProcessData(PerformanceData)}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat={(value: number) => `${value.toFixed(2)}%`}
            theme={{
              background: "#1F2A40",
              text: {
              fill:
              "#ffffff"
              },
              }}
            axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -35,
                legend: '',
                legendOffset: 46,
                truncateTickAt: 0
            }}
            axisRight={null}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -35,
                legendPosition: 'middle',
                legendOffset: -72,
                truncateTickAt: 0
            }}
            colors={(d) => {
              const value =d.value ?? 0
              return ColorScale(value)}
          }
            emptyColor="#324263"
            
        
        />
        </Box>
    </div>
  )
  
}

export default Heatmap
