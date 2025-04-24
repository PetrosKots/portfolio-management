import React,{ useState, useEffect } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { Box} from '@mui/material' 
import dayjs from "dayjs";
import Skeleton from '@mui/material/Skeleton';


interface Props {

    PerformanceData: PerformanceItem[]
  }

type PerformanceItem = [string, number];

type DailyData = {
    date: string;
    close: number;
    percentChange: number;
  };

  
function forwardFill(data: DailyData[],startDate:string): DailyData[] {
  if (data.length === 0) return [];
 
  
  const PerformanceStart= new Date(startDate)
  const SnPstart=new Date(data[0].date)
  const filledData: DailyData[] = [];
  let currentDate = new Date(data[0].date);
  const endDate = new Date(data[data.length - 1].date);
  let dataIndex = 0;
  const extraEntries:DailyData[]=[]
  while (currentDate <= endDate) {
    
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      if (data[dataIndex] && data[dataIndex].date === dateStr) {
        filledData.push(data[dataIndex]);
        dataIndex++;
      } else {
        filledData.push({ date: dateStr, close:0, percentChange: 0 });
      }
      
      currentDate.setDate(currentDate.getDate() + 1); // next day
  
  
  }
  while( SnPstart>PerformanceStart  ){

    const Datestr=PerformanceStart.toISOString().split('T')[0]

    extraEntries.push({date: Datestr,close:0,percentChange:0})
    PerformanceStart.setDate(PerformanceStart.getDate()+1)
  }
  
  return extraEntries.concat(filledData);
}
 
const Linechart: React.FC <Props> = ({PerformanceData}) => {

  const [SnPData, setSnPData]= useState <DailyData[]>([])
  const today= new Date().toISOString().split('T')[0]
  const start=PerformanceData[0][0]
  
  useEffect(() => {
    async  function fetchData(){

      try{
        await fetch(`http://localhost:5000/historical/s&p500?start=${start}&end=${today}`)
        .then(res => res.json())
        .then(data => {
          
          setSnPData(data); 
        });
      }catch(error){
        console.log(error)
      }
    }
    fetchData()
    
  }, [PerformanceData]);

  
  
  let currentValue=0
  let previousValue=1000

  const performance=PerformanceData.map((values,index) => {
      
      currentValue=previousValue*values[1] + previousValue
      previousValue=currentValue
      return [values[0],((currentValue-1000)/1000)*100]
      
      
  })


  currentValue=0
  previousValue=1000

  const SnPperformance =forwardFill(SnPData,PerformanceData[0][0]).map((day,index) => {
    currentValue=previousValue*(day.percentChange/100) +previousValue
    previousValue=currentValue
    return[day.date, ((currentValue-1000)/1000)*100 ]
  })
  
  
  
  const dates = performance.map((day) => {return new Date(day[0])})
  const valuesSnP = SnPperformance.map((day) => {return Number(day[1]) })
  const valuesPortfolio = performance.map((day) => {return Number(day[1]) })

  //difference in size of the portfolio data and the SnPdata
  const difference=valuesPortfolio.length-valuesSnP.length
  
  //if portfolio data and SnP data differ in size
  if (difference>0){
    dates.length=dates.length-difference
  }
  

  //not including today's data because the portfolio data include todays perfromance but
  //the SnP data API returns data only after todays closing.
  valuesPortfolio.length=valuesPortfolio.length-difference
  
  
  
  return (
    <Box sx={{height:400, background:'#1F2A40'}}>
      {dates.length===valuesSnP.length ?(
        <LineChart
        xAxis={[
          {
            label: "Date",
            data: dates,
            tickInterval: dates,
            scaleType: "time",
            valueFormatter: (date) => dayjs(date).format("MMM D YYYY"),
            disableTicks:true
          },
        ]}
        yAxis={[{ label: "Performance" }]}
        series={[
          {label: "S&P Performance", data:valuesSnP, showMark:false,area:true,baseline:0},
          {label: "Portfolio Performance", data:valuesPortfolio, showMark:false,area:true,baseline:0}
        ]}
        height={400}
        margin={{ top: 20, bottom: 20 }}
        sx={{
          
          '& .MuiChartsAxis-bottom .MuiChartsAxis-line': {
            stroke: '#141b2d',
            strokeWidth: 2,
          },
          
          '& .MuiChartsAxis-left .MuiChartsAxis-line': {
            stroke: '#141b2d',
            strokeWidth: 2,
          },
          
          '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
            fill: '#141b2d',
          },
          
          '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
            fill: '#141b2d',
          },
        }}
        />
      ):(<Skeleton variant="rectangular" width={210} height={118} />)
      }
    
    
    
    </Box>
  )
}

export default Linechart