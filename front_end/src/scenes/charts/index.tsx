import  { useState, useEffect }  from 'react'
import { Box} from '@mui/material';
import Heatmap from './Heatmap'
import Calendar from './Calendar';
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import  "../../globals.css"
import _ from 'lodash' 
import Linechart from './Linechart';
import Skeleton from '@mui/material/Skeleton';

interface DataItem {
  company_id: string  //company ticker
  date: string        //the date
  average_price: number //the average share cost of the investment
  quantity: number      //the quantity bought if it was a deposit, null if it was a withdrawl
  amount_invested: number //total amount of the investment, null if its a withdrawl
  closing_price: number   //the closing price of the ticker that day
  open_price:number       //the open price of the ticker that day
  Is_Investment_date: number //whether that day any deposits/withdrawls were made
  average_price_sold: number  //the average sold price of a ticker, null if it is a deposit
  quantity_sold: number       //the number of shares sold, null if it is a deposit 
  amount_sold:number          //total amount of the selling
  last_closing:number         //the closing price of the ticker the day before
  } 

interface GroupedData extends DataItem {
  year: number 
  month: number 
  day: number 
}

const index = () => {
  const [searchParams] = useSearchParams(); // Get URL search parameters

  const selectedPortfolio = searchParams.get("portfolio_name") // get Selected Portfolio from url
  const [data,setData]= useState([])
  
  
  if(selectedPortfolio){
    //fetch all the historical data of the investments within the portfolio to plot the charts
    useEffect(() => {

      // Fetch the chart data
      axios.get(`http://localhost:5000/chart-data?portfolio_name=${selectedPortfolio}`)
        .then((response) => {
          setData(response.data);//save the response to 'data' variable
          
        })
        .catch((_error) => {
          console.error("error while fetching the chart data");
        });
    }, [selectedPortfolio]);
  }

  function GroupData(ApiResponseData: DataItem[]) {
      
      //creating a new column for the year/month/day of the date
      const processedData = ApiResponseData.map(item => {
        const date = new Date(item.date) 
        return {
          ...item,
          year: date.getFullYear(),
          month: date.getMonth() + 1,  // Month is 0-indexed 
          day: date.getDate(),
        } 
      }) 
      
      //grouping the data for each day.Each date objects includes all the portfolio holdings of that date
      const groupedData = _.groupBy(processedData, (item) => {
        return `${item.year}-${item.month}-${item.day}` 
      }) 
  
      
      return groupedData
    }
    
    //function to calculate the performance of the portfolio.The expected parameter is the grouped array of the investments
  function CalculatePerformance(GroupedData: Record<string, GroupedData[]>) {

    // calculating the total value of the portfolio for each day by summing the values of individual stocks
    //Value each day is an array of consisting of Value Before any Investment that day, totalInvested that day if any, portfolio value at market open, portfolio value at market close, value of portfolio at last days closing.
    //All these values are used to properly calculate the time weighted return TWR for each day.
    //TWR is a metric used to calculate the performance of a an investment without considering and deposits or withdrawls that affect the portfolio value
    //To calculate TWR we need to know the portfolio's value right before and right after the investment.
    const TotalValueEachDay = Object.keys(GroupedData).reduce(
      (
        acc: Record<
          string,
          {
            totalInvested: number 
            ValueAtOpen: number 
            ValueAtClose: number 
            LastClosingValue: number 
            ReturnEachPeriod: number[]
          }
        >,
        dateKey
      ) => {
        const grouped = _.mapValues(_.groupBy(GroupedData[dateKey], "company_id"),group => _.sortBy(group,"Is_Investment_date")) //firstly grouping the investments further by company_id which results to {date: ... [ {company_id: GOOG, [ ... ] } ,{company_id: AMZN, [ ... ] } ]
        
        const ReturnEachPeriod: number[] =[]
        let totalInvested = 0 //total amount invested 
        let ValueAtOpen = 0   //portfolio value at market open
        let ValueAtClose = 0  //portfolio value at market close
        let LastClosingValue = 0  //portfolio value at last days closing

        GroupedData[dateKey].forEach((item) => {  //iterating over the holdings for each day
          
          if (item.Is_Investment_date == 1) {  // if a holding was bought/sold today

            totalInvested += item.amount_invested + item.amount_sold  //add to total invested the total amount invested and the total amount sold, whith one of them always be null as the item was either bought or sold.
                                                                      //Also the amount sold is negative so it subtracts from the total          
          }

          
          if (item.quantity_sold && item.Is_Investment_date == 1) { // if that day is the investment day and quantity sold is not null,which means that its a withdraw.
            ValueAtOpen += 0 // Add to the open value the quantity sold times the opening price
            
          } else if (!(item.Is_Investment_date == 1 && item.quantity > 0)) { // if that holding was not sold/bought today and the quantity isn't greater than 0.
                                                                            //p.s If the investment was made today, during the opening the stocks weren't purchased yet so they are not included in the total value.
            ValueAtOpen += item.quantity * item.open_price  //add to the value at open the quantity times the open price
          }

          // Add to the value at close the quantity times the closing price.It doesn't matter if the holding was bought/sold today, as the quantity which is negative in case of a sale subtracts from the total value at close the total amount sold
          ValueAtClose += item.quantity * item.closing_price 

          
          if (item.Is_Investment_date == 1 && item.quantity >0) { //if a purchase was made today, calculate the value that the shares bought had during the last closing.Its used to calculate the return of the day
            LastClosingValue += item.last_closing * item.quantity 
          }
        }) 
        
        
        let previous_portfolio_value=0    //last known portfolio value
        
        //Calculating the value of the portfolio right before any deposit/withdrawl by iterating over every holding every day
        //As more than one deposits/withdrawls can be made within a day,ReaturnEachPeriod is an array storing the return between two investments
        //For instance, if the portfolio value is 1000$ at a given T1 time and T2 is the time that we deposit 500$, to calculate the total TWR return for the day we need to firstly calculate
        //The return between T1 and T2
        Object.entries(grouped).forEach(([_companyId, data]) => {  //Calculating the value of the portfolio right before any deposit/withdrawl by iterating over every holding every day.
        let total_quantity = 0 //total number of shares for each ticker
        let lastPrice=0        //last known price of the ticker
        
          
        data.forEach((item) => {
          total_quantity+=item.quantity

          if(item.Is_Investment_date==1 && item.amount_invested && ReturnEachPeriod.length==0){  //if a deposit was made and its the first of the day
            lastPrice=item.average_price                                                         //Assign to last know price the price that the stock was bought

            const starting_value=ValueAtOpen                                                     //The starting portfolio value is the value during opening

            //The end value is the opening value minus the quantity of stocks we had at the start of the session times 
            // the opening price,plus the quantity we had at the start of the session times the price of the stock when we purchase more
            //For instance assuming that we hold 5 GOOG stocks that their value is 200$ each at the market open , and during the session we buy 2 more at 250 each,
            //just before the purchase the total value will be 1000-5*200+5*250=1250 as the stock price has gone up.
            //We substract the quantity bought from the total because we need the amount we had before the purchase and the total includes the stocks just bought
            const end_value=ValueAtOpen-(item.open_price*(total_quantity-item.quantity)) + (item.average_price*(total_quantity-item.quantity))   

            ReturnEachPeriod.push((end_value-starting_value)/starting_value)   //Adding to the array the return between the opening and the time right before the purchase

            previous_portfolio_value=end_value+(item.quantity*item.average_price)  //Assign to last known portfolio value the value just after the purchase
            
          }else if(item.Is_Investment_date==1 && item.amount_invested){    //if there is another deposit during
            const starting_value=previous_portfolio_value                  //starting value is the last known value
            const end_value=previous_portfolio_value - ((total_quantity-item.quantity)*lastPrice) + (item.average_price*(total_quantity-item.quantity))  //End value is the portfolio value before the investment as described above


            previous_portfolio_value=end_value+(item.quantity*item.average_price)  //Last known value is the value right after the investment
            ReturnEachPeriod.push((end_value-starting_value)/starting_value)       //adding to the array the return between the two investments

            lastPrice=item.average_price                                           //Last known price of the stock is the one that we just bought it for

          }else if(item.Is_Investment_date==1 && item.quantity_sold && ReturnEachPeriod.length==0){    //If we make a withdrawl and its the first move of the day
                                                                                                        //Exactly the same as if we made a purchase but the quantity sold is used instead of the quantity bought
            const starting_value=ValueAtOpen                                                           
            const end_value= ValueAtOpen - ((total_quantity+item.quantity_sold)*lastPrice) + ((total_quantity+item.quantity_sold)*item.average_price_sold)

            ReturnEachPeriod.push((end_value-starting_value)/starting_value)
            previous_portfolio_value=end_value-(item.quantity_sold*item.average_price_sold)
            
            lastPrice=item.average_price_sold
          }else if(item.Is_Investment_date==1 && item.quantity_sold && ReturnEachPeriod.length>0){   //if we make a withdrawl withing the session

            const starting_value=previous_portfolio_value
            const end_value= previous_portfolio_value - ((total_quantity+item.quantity_sold)*lastPrice) + ((total_quantity+item.quantity_sold)*item.average_price_sold)

            ReturnEachPeriod.push((end_value-starting_value)/starting_value)

            previous_portfolio_value=end_value-(item.quantity_sold*item.average_price_sold)
            
            lastPrice=item.average_price_sold
          }else{

            lastPrice=item.open_price                                              //If the holding was not bought/sold that day assign its open price as the last known price
          }
        });
      
        
        
        
      }) 
      
      ReturnEachPeriod.push((ValueAtClose-previous_portfolio_value)/previous_portfolio_value)    //Finally calculating and adding to the array the return between the last investment and the closing of the session
      
      acc[dateKey] = { //return all the values
        totalInvested,
        ValueAtOpen,
        ValueAtClose,
        LastClosingValue,
        ReturnEachPeriod
      } 

      return acc 
    },
    {}
  )
    
    //sort data by day to make return calculations easier.Calculation of return requires the portfolio's total value at closing the day before
    const sortedData = Object.entries(TotalValueEachDay).sort(
      ([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()
    ) 
    
    const Performance: [string, number][] = sortedData.map(([date, values], index, array) => {  //calculating the TWR for each day.Return is calculated between last closing and today's closing to include any price changes during after and pre market.

      if (values.totalInvested == 0 && array[index - 1]) { //if its a day that no investments were made and data for the day before are available
        return [
          date,
          (values.ValueAtClose - array[index - 1][1].ValueAtClose) /  //Total return equals to " total value at closing - value at closing the day before/ value at closing the day before"
            array[index - 1][1].ValueAtClose,
        ] 
      } else if (values.totalInvested !=1 && array[index - 1]) { //if its a day that a deposit was made
        return [                                                 //The formula for TWR is " (1 + return from last closing to right before investment) * (1+ return from right after investment to closing) -1 "
          date,values.ReturnEachPeriod.reduce((product,item) => { return(product*(1+item))},1) * ((values.ValueAtOpen-array[index-1][1].ValueAtClose)/ array[index-1][1].ValueAtClose + 1) -1
        ] 
      } else {
        return [date, 0]
      }
    })
    
  return Performance
  }

  
  return (
    <div>
      
      <Box sx={{marginTop: 10}}>
        <div className='h1-bold'>Performance By Month</div>
      {selectedPortfolio && data.length>1? (
        <div>
        <Heatmap PerformanceData={CalculatePerformance(GroupData(data))} />
        
        
        </div>
      ) : (
        <Box>
        <Skeleton />
        <Skeleton animation="wave" />
        <Skeleton animation={false} />
        </Box>
      )}
      </Box>
      <Box sx={{marginTop: 10}}>
      <div className='h1-bold'>Daily Performance Since Inception</div>
      {selectedPortfolio && data.length>1 ?(
        
        <div><Calendar PerformanceData={CalculatePerformance(GroupData(data))}/> </div>
        
        
      ) : (
        <Box>
        <Skeleton />
        <Skeleton animation="wave" />
        <Skeleton animation={false} />
        </Box>)
        }
      </Box>

      <Box sx={{marginTop: 10}}>
      <div className='h1-bold'>Performance Compared To S&P 500 Index</div>
      {selectedPortfolio && data.length>1 ?(
        
        <div><Linechart  PerformanceData={CalculatePerformance(GroupData(data))}/> </div>
        
        
      ): (
        <Box>
        <Skeleton />
        <Skeleton animation="wave" />
        <Skeleton animation={false} />
        </Box>
      )}
      </Box>
      
    </div>
  )
}

export default index