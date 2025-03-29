import React from 'react'
import { Box} from '@mui/material';
import { ResponsiveHeatMap } from '@nivo/heatmap'
import _ from 'lodash';
import { scaleSequential } from 'd3-scale';
import { interpolateRdYlGn } from 'd3-scale-chromatic'; 




interface Props {

  ChartData: DataItem[]
}


interface DataItem {
  company_id: string;
  date: string;
  average_price: number;
  quantity: number;
  amount_invested: number;
  closing_price: number;
  Is_Investment_date: number;
};

interface GroupedData extends DataItem {
  year: number;
  month: number;
  day: number;
}

//colour scale for the heatmap
const ColorScale = scaleSequential(interpolateRdYlGn).domain([-5, 5]);
const Heatmap: React.FC <Props> = ({ChartData}) => {


  //function to group the data returned from the api.The api response is all the ivnestments in the selected portfolio
  //The format of the response is an array of objects like {"company_id": "AMZN","date": "2025-03-08T00:00:00.000Z", "Is_Investment_date": 0, "average_price": 228.175, "quantity": 5, "amount_invested": 1140.88, "closing_price": 199.25}
  function GroupData(ApiResponseData: DataItem[]) {
    
    //creating a new column for the year/month/day of the date
    const processedData = ApiResponseData.map(item => {
      const date = new Date(item.date);
      return {
        ...item,
        year: date.getFullYear(),
        month: date.getMonth() + 1,  // Month is 0-indexed in JavaScript
        day: date.getDate(),
      };
    });
    
    //grouping the data for each.Each date objects includes all the portfolio holdings of that date
    const groupedData = _.groupBy(processedData, (item) => {
      return `${item.year}-${item.month}-${item.day}`;
    });

    
    return groupedData
  }
  
  //function to calculate the performance of the portfolio.The expected parameter is the grouped array of the investments
  function CalculatePerformance(GroupedData : Record<string, GroupedData[]>){
    
    //calculating the total value of the portfolio for each day by multiplying the quantity of each holding with its closing price that day
    // then summing the value of the holdings
   const TotalValueEachDay= Object.keys(GroupedData).reduce(
      (acc: Record<string, number[]>, dateKey) => {
      const totalValue = GroupedData[dateKey].reduce(
        (sum, item) => sum + item.quantity * item.closing_price,
        0
      );
      let totalInvested=0
      
      //getting the dates that an investment(deposit) and the investment amount 
      GroupedData[dateKey].forEach((item) => {
        
        if(item.Is_Investment_date==1)
          totalInvested+=item.amount_invested
          
        
      })

      //returning arrays of [portfolio Value, amount invested] for each day since the inception of the portfolio.
      //If there are not any investments made on that specific date, amount invested is 0
      acc[dateKey] = [totalValue,totalInvested];
      return acc;
    },
    {})
  
    //sorting the data by date.Helps with calculating the performance later on.
    const sortedData = 
      Object.entries(TotalValueEachDay)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    ;
    
    //Calculating return for each day.The return is calculated using " (Value at the end of the day-Value the day before) / Value the day before
    //The days that deposits/investments were made, the formula used is " (Value at the end of the day - (Value the day before + amount invested)) / (Value the day before + amount invested) "
    //The returns for each day will be used to calculate time weighted return
    // Time Weighted Return is a widely used metric as it removes the impact that deposits/withdrawls have to the increase of the portfolio's total value.
    //SortedData is an array of objects like ["YYYY-MM-DD" : [Portfolio Value At the End of the day, amount invested that day]
    const Performance: [string, number][]= 
      sortedData.map((data,index) => {

        //if the day before exists and no investments were made.If [index-1] is false only the day that the portfolio was created.
        if(sortedData[index-1] && data[1][1]==0 ){
          return [data[0], (data[1][0]-sortedData[index-1][1][0])/sortedData[index-1][1][0]]
        }else if(sortedData[index-1] && data[1][1]>0){ //if investment was made that day
          
          return [data[0], (data[1][0] - (sortedData[index-1][1][0] + data[1][1])) / (sortedData[index-1][1][0] + data[1][1]) ]
        }else{ //return 0% performance
          return [data[0],0]
        }

      })
      
    //Changing the format of performance to ['Year','Month','Performance'] to start creating the valid format of the heatmap which is [ 'Year' : ['month', 'performance']] 
    //
    const FormattedPerformance=
      Performance.map((data) =>{
        const date=new Date(data[0])

        const row={
          id:date.getFullYear(),
          month: date.toLocaleString('default', { month: 'long' }),
          performance: data[1]
        }
        return row
      })
    
    //grouping performance by year
    const PerformanceGroupedByYear=
      _.groupBy(FormattedPerformance, 'id')
    
    //grouping performance further by year and month
    const PerformanceGroupedByYearMonth= _.mapValues(PerformanceGroupedByYear, (yearData) =>
      _.mapValues(_.groupBy(yearData, 'month'), (monthData) =>
        monthData.map(item => item.performance)
      )
    )

    //calculating the time weighted return for each month
    //the formula is TWR= (1-r1)*(1-r2)...-1 where r1,r2,..rn are the returns for each day of the month
    const TimeWeightedReturnByMonth:Record<number, Record<string, number>> =  {}
    

    Object.keys(PerformanceGroupedByYearMonth).forEach(year => {
      TimeWeightedReturnByMonth[parseInt(year)] = {}

      Object.keys(PerformanceGroupedByYearMonth[year]).forEach(month => {

        TimeWeightedReturnByMonth[parseInt(year)][month] = PerformanceGroupedByYearMonth[year][month].reduce((product, num) => product * (1+num), 1) -1;
      })
    })
    
    //Converting the data to the final format that is valid for the heatmap
    const ChartData = Object.keys(TimeWeightedReturnByMonth).map(year => ({

      id: year,
      data: Object.keys(TimeWeightedReturnByMonth[parseInt(year)]).map(month => ({
        x: month,
        y: TimeWeightedReturnByMonth[parseInt(year)][month]*100
      }))
    }))

    const allMonths = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    
    // Ensure all months exist in each year's data
    const CompleteChartData = ChartData.map(yearData => {
      const existingMonths = new Set(yearData.data.map(entry => entry.x));
    
      // Add missing months with y: null
      const filledData = allMonths.map(month => ({
        x: month,
        y: existingMonths.has(month) 
          ? yearData.data.find(entry => entry.x === month)!.y 
          : null
      }));
    
      return { ...yearData, data: filledData };
    });
    
    //sorting the data before returning it
    return CompleteChartData.sort((a,b) => parseInt(b.id) - parseInt(a.id))
  }
  
  

  
  
  
  
  
  

  return (
    <div>
        
        <Box sx={{height:400}}>
        <ResponsiveHeatMap
            data={CalculatePerformance(GroupData(ChartData))}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.2s"
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
