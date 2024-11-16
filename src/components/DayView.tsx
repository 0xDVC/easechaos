import React from 'react';
import { DaySchedule } from '../types';
import clsx from 'clsx';
import { COURSE_CODES, COLOR_SCHEMES, DEFAULT_COLOR } from '../constants/courseCodes';

interface DayViewProps {
  schedule?: DaySchedule;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 7;
  
  if (hour === 12) {
    return '12 PM';
  }
  return hour > 12 
    ? `${hour - 12} PM` 
    : `${hour} AM`;
});

interface PositionedEvent {
  start: string;
  end: string;
  value: string;
  startPosition: number;
  duration: number;
  isOverlapping?: boolean;
  splitIndex?: number;
  totalSplits?: number;
  isContinuation?: boolean;
  continuationGroup?: string;
}

function convertTimeToNumber(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

const courseColorMap = new Map(
  COURSE_CODES.map((code, index) => [
    code, 
    COLOR_SCHEMES[index % COLOR_SCHEMES.length -1]
  ])
);

const getCourseColor = (value: string) => {
  const match = value.match(/\b\d{3}\b/);
  if (!match) return DEFAULT_COLOR;
  return courseColorMap.get(match[0] as (typeof COURSE_CODES)[number]) || DEFAULT_COLOR;
};

function splitEventValue(value: string): string[] {
  return value.split('\n').filter(Boolean);
}

export default function DayView({ schedule }: DayViewProps) {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTimePosition = React.useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const timeInHours = hours + minutes / 60;
    return ((timeInHours - 7) / 13) * 100;
  }, [currentTime]);

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-[700px] text-gray-500">
        No schedule available for this day
      </div>
    );
  }

  const processedEvents: PositionedEvent[] = schedule.data
    .filter((slot): slot is typeof slot & { value: string } => Boolean(slot.value))
    .flatMap(slot => {
      const startTime = convertTimeToNumber(slot.start);
      const endTime = convertTimeToNumber(slot.end);
      
      const startPosition = ((startTime - 7) / 13) * 100;
      const duration = ((endTime - startTime) / 13) * 100;
      
      const values = splitEventValue(slot.value);
      
      return values.map((value, index) => ({
        start: slot.start,
        end: slot.end,
        value,
        startPosition,
        duration,
        splitIndex: index,
        totalSplits: values.length,
        continuationGroup: value.match(/CE \d[A-Z] \d{3}/)?.[0]
      }));
    })
    .sort((a, b) => a.startPosition - b.startPosition);

  let currentGroup: { [key: string]: PositionedEvent[] } = {};
  processedEvents.forEach((event) => {
    if (event.continuationGroup) {
      if (!currentGroup[event.continuationGroup]) {
        currentGroup[event.continuationGroup] = [];
      }
      currentGroup[event.continuationGroup].push(event);
    }
  });

  const mergedEvents = processedEvents.reduce((acc: PositionedEvent[], event) => {
    if (!event.continuationGroup || !currentGroup[event.continuationGroup]) {
      acc.push(event);
      return acc;
    }

    const group = currentGroup[event.continuationGroup];
    if (group.length <= 1) {
      acc.push(event);
      return acc;
    }

    if (event === group[0]) {
      const lastEvent = group[group.length - 1];
      acc.push({
        ...event,
        end: lastEvent.end,
        duration: ((convertTimeToNumber(lastEvent.end) - convertTimeToNumber(event.start)) / 13) * 100
      });
    }

    return acc;
  }, []);

  processedEvents.forEach((event, index) => {
    const overlappingEvents = processedEvents.filter((otherEvent, otherIndex) => {
      if (otherIndex === index) return false;
      return !(
        otherEvent.startPosition >= (event.startPosition + event.duration) ||
        event.startPosition >= (otherEvent.startPosition + otherEvent.duration)
      );
    });
    event.isOverlapping = overlappingEvents.length > 0;
  });

  return (
    <div className="mx-auto max-w-4xl w-full">
      <div className="grid grid-cols-[100px_1fr] gap-4 h-[720px] overflow-y-auto relative pt-4 pb-6">
        <div className="sticky left-0 h-full">
          {timeSlots.map((time, index) => (
            <div
              key={time}
              className="absolute text-sm text-gray-700"
              style={{
                top: `${(index / (timeSlots.length - 1)) * 100}%`,
                right: '1rem',
                transform: 'translateY(-50%)'
              }}
            >
              {time}
            </div>
          ))}
        </div>

        <div className="relative border-l border-gray-200 pt-2">
          <div 
            className="absolute w-full h-[2px] bg-gray-500 z-10"
            style={{ 
              top: `${currentTimePosition}%`,  
              transform: 'translateY(-50%)'
            }} 
          >
            <div className="absolute left-0 w-2 h-2 rounded-full bg-gray-500" 
                 style={{ transform: 'translate(-50%, -34%)' }} /> 
          </div>

          <div className="absolute inset-0 pt-2 pb-4">
            {timeSlots.map((hour, index) => (
              <div
                key={hour}
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${(index / (timeSlots.length - 1)) * 100}%` }}
              />
            ))}
          </div>

          {mergedEvents.map((event, index) => {
            const colors = getCourseColor(event.value);
            const width = (event.totalSplits ?? 1) > 1 
              ? `calc(${100 / (event.totalSplits ?? 1)}% - 1rem)` 
              : event.isOverlapping 
                ? 'calc(50% - 1rem)' 
                : 'calc(100% - 1rem)';
            
            return (
              <div
                key={index}
                className={clsx(
                  "absolute p-2 rounded-md border",
                  colors.bg, colors.border,
                  "hover:brightness-95 transition-colors cursor-pointer"
                )}
                style={{
                  top: `${event.startPosition}%`,
                  height: `${event.duration}%`,
                  minHeight: '40px',
                  left: (event.totalSplits ?? 1) > 1 
                    ? `calc(${(event.splitIndex! * 100) / event.totalSplits!}%)`
                    : event.isOverlapping ? '50%' : '0',
                  width
                }}
              >
                <div className={clsx("text-sm line-clamp-2", colors.text)}>
                  {event.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}