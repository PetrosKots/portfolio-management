import React,{ useState, useEffect } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import { Box} from '@mui/material' 
import dayjs from "dayjs";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { DateTime } from 'luxon';

interface Props {

    PerformanceData: PerformanceItem[]
  }

type PerformanceItem = [string, number];

type DailyData = { //format of the api response whne fetching the S&P historical data
    date: string;
    close: number;
    percentChange: number;
  };

//function that returns the difference in days between two dates
function dateDIffIndays(a:Date,b:Date){

  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


//function that forward fills the data returned from the S&P API.
//The issue is that the Historical S&P data don't include the days that the market is closed
//but the API response with the portfolio performance includes these days as 0% performance.
//The function gets the S&P Historical data and for the days that the market is closed adds 0% performance.
function forwardFill(data: DailyData[],startDate:string): DailyData[] {
  if (data.length === 0) return []
 
  //The first day of the portfolio's performance
  const PerformanceStart= new Date(startDate)

  
  const SnPstart=new Date(data[0].date) //The first day of the S&P performance
  const filledData: DailyData[] = [] //An array to store the new data
  let currentDate = new Date(data[0].date) //a variable to track each day during the loop through the data.
  const endDate = new Date(data[data.length - 1].date) //the last day of the returned data
  let dataIndex = 0
  const extraEntries:DailyData[]=[] //An array to store extra entries during a very specific scenario
  
  //looping through the data
  while (DateTime.fromJSDate(currentDate).startOf('day') <= DateTime.fromJSDate(endDate).startOf('day')) {
    
      const yyyy = currentDate.getFullYear()
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0') // Months are 0-based
      const dd = String(currentDate.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}` //New string for the date
      
      //if that day already exists in the data, push the whole row
      if (data[dataIndex] && data[dataIndex].date === dateStr) {
        filledData.push(data[dataIndex]);
        dataIndex++;
      } else { //If the day is not included in the data,meaning that the market was closed,psuh the date with 0% change
        filledData.push({ date: dateStr, close:0, percentChange: 0 });
      }
      
      //do the same for the next day, until we cover the whole array
      currentDate.setDate(currentDate.getDate() + 1); // next day
  
  
  }
  
  //If the first day of the portfolio data is before the first day of S&P data.
  //Which means that some days right before the selected dates, the market was closed.
  //Add the date and 0% change to the start of the array.
  while( DateTime.fromJSDate(SnPstart).startOf('day')>DateTime.fromJSDate(PerformanceStart).startOf('day')) {
   
    if (dateDIffIndays(SnPstart,PerformanceStart)<4){
      const yyyy = PerformanceStart.getFullYear()
      const mm = String(PerformanceStart.getMonth() + 1).padStart(2, '0') // Months are 0-based
      const dd = String(PerformanceStart.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}` //New string for the date

      extraEntries.push({date: dateStr,close:0,percentChange:0})
      PerformanceStart.setDate(PerformanceStart.getDate()+1)
    }else break
    
  }
  
  
  if(extraEntries){
  //if there are any extra entries, add them to the start of data
  return extraEntries.concat(filledData)

  }else return filledData

}
 

const Linechart: React.FC <Props> = ({PerformanceData}) => {

  const [response,setResponse]= useState<DailyData[]>([])
  const [SnPData, setSnPData]= useState <DailyData[]>([]) //state for the S$P historical data
  const today= new Date().toISOString().split('T')[0]  //todays date
  const start=PerformanceData[0][0] //the first day of the portfolios performance.Used to fetch S&P data for the correct dates.
  const [data,setdata]= useState<PerformanceItem[]>(PerformanceData)

  //fetching the Historical performance of S&P from portfolio's inception until today using an API endpoint
  useEffect(() => {
    async  function fetchData(){

      try{
        await fetch(`http://localhost:5000/historical/s&p500?start=${start}&end=${today}`)
        .then(res => res.json())
        .then(data => {
          
          setResponse(data); //storing the api response to the state
        });
      }catch(error){
        console.log(error)
      }
    }
    fetchData()
    
  }, [PerformanceData]);

  useEffect(() => {
    if(response){
      setSnPData(response)
    }
  },[response])
  
  //Assuming that we start with a portfolio valued at 1000$
  let currentValue=0
  let previousValue=1000

  const performance=data.map((values,_index) => {
      
      //Calculate the value of the portfolio each day using the value the day before and today's percentage increase/decrease
      currentValue=previousValue*values[1] + previousValue
      previousValue=currentValue

      //returning for each day the percentage increase/decrease in respect of the initial value of the portfolio
      //which is 1000$
      //That gives an image of the total performance over time without considering any other parameters
      return [values[0],((currentValue-1000)/1000)*100]
      
      
  })

  
  //The same for the S&P500 data.
  //Calculate for every day whats the total return of S&P if the initial investment was 1000
  currentValue=0
  previousValue=1000

  const SnPperformance =forwardFill(SnPData,data[0][0]).map((day,_index) => {
    currentValue=previousValue*(day.percentChange/100) +previousValue
    previousValue=currentValue
    return[day.date, ((currentValue-1000)/1000)*100 ]
  })
  
  
  //the dates for which the linechart will be plot
  const dates = SnPperformance.map((day) => {return new Date(day[0])})

  //The values of S&P and portfolio for the linechart
  let valuesSnP = SnPperformance.map((day) => {return Number(day[1]) })
  const valuesPortfolio = performance.map((day) => {return Number(day[1]) })
  
  
  //Difference in size of the portfolio data and the SnPdata.
  //The portfolio data include today's performance
  //But the S&P historical data API includes today's data only after the market closes
  //So the times that these two responses don't match need to be excluded.
  const difference=valuesPortfolio.length-valuesSnP.length
  
   
  //Removing the last entry of the array which is today's data if the market is still open
  valuesPortfolio.length=valuesPortfolio.length-difference
  
  
  //Updating the states of the data used for the plots according to the date range of each button
  const handle1weekClick= () => {
    const currentDate=new Date()
    const week=new Date(currentDate.getTime()-8*24*60*60*1000)
    
    const WeekPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=week) {return entry}})
    const WeekSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=week) {return entry}})
    
    
    setdata(WeekPerformancePortfolio)
    setSnPData(WeekSnPPerformance)
    
  }

  const handle1monthClick= () => {
    const currentDate=new Date()
    const month=new Date(currentDate.getTime()-31*24*60*60*1000)
    
    const MonthPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=month) {return entry}})
    const MonthSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=month) {return entry}})
    
    
    setdata(MonthPerformancePortfolio)
    setSnPData(MonthSnPPerformance)
  }

  const handle6monthClick= () => {
    const currentDate=new Date()
    const sixMonth=new Date(currentDate.getTime()-181*24*60*60*1000)
    
    const SixMonthPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=sixMonth) {return entry}})
    const SixMonthSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=sixMonth) {return entry}})
    
    
    setdata(SixMonthPerformancePortfolio)
    setSnPData(SixMonthSnPPerformance)
    
  }

  const handle1yearClick= () => {
    const currentDate=new Date()
    const year=new Date(currentDate.getTime()-181*24*60*60*1000)
    
    const YearPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=year) {return entry}})
    const YearSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=year) {return entry}})
    
    
    setdata(YearPerformancePortfolio)
    setSnPData(YearSnPPerformance)
    
  }

  const handleYTDClick= () => {

    const currentDate=new Date()
    const yearToDate=new Date(currentDate.getFullYear(), 0, 1)
    
    const YTDPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=yearToDate) {return entry}})
    const YTDSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=yearToDate) {return entry}})
    
    
    setdata(YTDPerformancePortfolio)
    setSnPData(YTDSnPPerformance)
    
  }

  const handleMTDClick= () => {

    const currentDate=new Date()
    const monthToDate=new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    const MTDPerformancePortfolio=PerformanceData.filter((entry) => { if( new Date(entry[0])>=monthToDate) {return entry}})
    const MTDSnPPerformance=forwardFill(response,data[0][0]).filter((entry) => { if( new Date(entry.date)>=monthToDate) {return entry}})
    
    
    setdata(MTDPerformancePortfolio)
    setSnPData(MTDSnPPerformance)
    
  }

  const handleMaxClick= () => {

    setdata(PerformanceData)
    setSnPData(response)
  }
  
  
  //plotting the linechart
  return (
    <Box sx={{height:450, background:'#1F2A40'}}>
      
      {dates.length===valuesSnP.length &&(
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
      )
      }
      <ButtonGroup variant="outlined" aria-label="Basic button group" sx={{background:'#1F2A40',marginTop:1,marginLeft:1}}>
        <Button onClick={handle1weekClick}>1w</Button>
        <Button onClick={handle1monthClick}>1m</Button>
        <Button onClick={handleMTDClick}>MTD</Button>
        <Button onClick={handle6monthClick}>6m</Button>
        <Button onClick={handle1yearClick}>1y</Button>
        <Button onClick={handleYTDClick}>YTD</Button>
        <Button onClick={handleMaxClick}>max</Button>
      </ButtonGroup>
    
    
    </Box>
  )
}

export default Linechart