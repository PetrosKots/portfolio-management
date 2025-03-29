import React from 'react'
import { ResponsiveCalendar, CalendarTooltipProps } from '@nivo/calendar'
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
interface CalendarData {

    value:number;
    day:string;
}
const CustomTooltip: React.FC<CalendarTooltipProps> = ({ day, value }) => (
    <div style={{
      background: 'white',
      padding: '5px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#333'
    }}>
      <strong>{day}</strong><br />
      Performance: {value ?? 'No data'} %
    </div>
  );
const Calendar: React.FC <Props> = ({ChartData})  => {


    function GroupData(ApiResponseData: DataItem[]) {
        
        const processedData = ApiResponseData.map(item => {
          const date = new Date(item.date);
          return {
            ...item,
            year: date.getFullYear(),
            month: date.getMonth() + 1,  // Month is 0-indexed in JavaScript
            day: date.getDate(),
          };
        });
        
    
        const groupedData = _.groupBy(processedData, (item) => {
          return `${item.year}-${item.month}-${item.day}`;
        });
    
        
        
        return groupedData
      }

    function ProcessDataForCalendar(GroupedData : Record<string, GroupedData[]>){
        
        const TotalValueEachDay= Object.keys(GroupedData).reduce(
            (acc: Record<string, number[]>, dateKey) => {
            const totalValue = GroupedData[dateKey].reduce(
              (sum, item) => sum + item.quantity * item.closing_price,
              0
            );
            let totalInvested=0
            
      
            GroupedData[dateKey].forEach((item) => {
              
              if(item.Is_Investment_date==1)
                totalInvested+=item.amount_invested
                
              
            })
            acc[dateKey] = [totalValue,totalInvested];
            return acc;
          },
          {})
        
        const sortedData = 
        Object.entries(TotalValueEachDay)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        ;
        
        const Performance: [string, number][]= 
        sortedData.map((data,index) => {
    
            if(sortedData[index-1] && data[1][1]==0 ){
            return [data[0], (data[1][0]-sortedData[index-1][1][0])/sortedData[index-1][1][0]]
            }else if(sortedData[index-1] && data[1][1]>0){
            
            return [data[0], (data[1][0] - (sortedData[index-1][1][0] + data[1][1])) / (sortedData[index-1][1][0] + data[1][1]) ]
            }else{
            return [data[0],0]
            }
    
        })
        
        const CalendarData = Performance.map( ([date,performance]) => ({
            value: Number((performance*100).toFixed(2)),
            day: new Date(date).toISOString().substring(0, 10)

        }))
        
        return CalendarData
      }


    //function that returns the min date of the calendar data.It is a necessary property of the calendar
    function GetMinDate(ChartData: CalendarData[]) {
        if(ChartData[0]){
            return ChartData[0].day
        }else{
            return "2020-01-01"
        }
        
    }


    //function that returns the max date of the calendar data.It is a necessary property of the calendar
    function GetMaxDate (ChartData : CalendarData[]) {
        if(ChartData[ChartData.length-1]){
            return ChartData[ChartData.length-1].day
        }else {
            return"2025-12-12"
        }
        
        
    }
    const rowHeight = 200; // Height per year to avoid squeezing

    const chartHeight = Math.max(400, (GetMaxDate(ProcessDataForCalendar(GroupData(ChartData))).length / 365) * rowHeight); // Ensure enough space for each year
    
  return (
    <div>
        <Box sx={{width: "100%",maxHeight:400, overflow: "auto"}}>
            <div style={{ height:chartHeight}}>
            <ResponsiveCalendar
                data={ProcessDataForCalendar(GroupData(ChartData))}
                from={GetMinDate(ProcessDataForCalendar(GroupData(ChartData)))}
                to={GetMaxDate(ProcessDataForCalendar(GroupData(ChartData)))}
                minValue={-1.5}
                maxValue={1.5}
                theme={{
                    background:"#1F2A40",
                    text: {
                        fill:
                        "#ffffff"
                        }
                }}
                emptyColor="#eeeeee"
                colors={[  '#f50707', '#ff5252','#ffbaba', '#d4ffb2','#85ff7a', '#2db83d' ]}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
                tooltip={CustomTooltip}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'row',
                        translateY: 36,
                        itemCount: 4,
                        itemWidth: 42,
                        itemHeight: 36,
                        itemsSpacing: 14,
                        itemDirection: 'right-to-left'
                    }
                ]}
        />
        </div>
        </Box>
    </div>
  )
}

export default Calendar