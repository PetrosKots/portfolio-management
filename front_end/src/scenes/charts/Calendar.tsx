import React from 'react'
import { ResponsiveCalendar, CalendarTooltipProps } from '@nivo/calendar'
import { Box} from '@mui/material';
import _ from 'lodash';


interface Props {

  PerformanceData: PerformanceItem[]
}

interface CalendarData {

  value:number;
  day:string;
}
type PerformanceItem = [string, number];

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


const Calendar: React.FC <Props> = ({PerformanceData})  => {
    

    function ProcessData (PerformanceData: PerformanceItem[]) {
      //Formatting the data to the right format for the calendar
      const CalendarData = PerformanceData.map(([date, performance]) => {

        // Split input date and make it YYYY-MM-DD from YYYY-M-D
        const [year, month, day] = date.split('-').map(Number)
        const paddedMonth = String(month).padStart(2, '0')
        const paddedDay = String(day).padStart(2, '0')
        
        const isoDate = `${year}-${paddedMonth}-${paddedDay}` 
    
        return {
            value: Number((performance * 100).toFixed(2)),
            day: isoDate
        };
    });
    
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

    const chartHeight = Math.max(400, (GetMaxDate(ProcessData(PerformanceData))).length / 365 * rowHeight); // Ensure enough space for each year
    
  return (
    <div>
        <Box sx={{width: "100%",maxHeight:400, overflow: "auto"}}>
            <div style={{ height:chartHeight}}>
            <ResponsiveCalendar
                data={ProcessData(PerformanceData)}
                from={GetMinDate(ProcessData(PerformanceData))}
                to={GetMaxDate(ProcessData(PerformanceData))}
                minValue={-1.5}
                maxValue={1.5}
                theme={{
                    background:"#1F2A40",
                    text: {
                        fill:
                        "#ffffff"
                        }
                }}
                
                emptyColor="#1F2A40"
                colors={[  '#f50707', '#ff5252','#ffbaba', '#d4ffb2','#85ff7a', '#2db83d' ]}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={0.6}
                monthBorderWidth={0}
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