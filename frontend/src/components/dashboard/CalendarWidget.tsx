
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import { format, isSameDay, parseISO, isAfter } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Custom CSS wrapper
const calendarStyles = `
  .custom-calendar {
    width: 100% !important;
    background: white;
    border: none;
    font-family: inherit;
  }
  .custom-calendar .react-calendar__navigation {
    display: flex;
    margin-bottom: 12px;
  }
  .custom-calendar .react-calendar__navigation button {
    min-width: 40px;
    background: none;
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    border-radius: 8px;
    padding: 4px;
  }
  .custom-calendar .react-calendar__navigation button:enabled:hover,
  .custom-calendar .react-calendar__navigation button:enabled:focus {
    background-color: #f1f5f9;
  }
  .custom-calendar .react-calendar__month-view__weekdays {
    text-transform: uppercase;
    font-weight: 600;
    font-size: 0.7em;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .custom-calendar .react-calendar__tile {
    max-width: 100%;
    padding: 10px 4px;
    background: none;
    text-align: center;
    line-height: 16px;
    font-weight: 500;
    font-size: 13px;
    color: #334155;
    border-radius: 8px;
    transition: all 0.2s;
    position: relative;
  }
  .custom-calendar .react-calendar__tile:enabled:hover,
  .custom-calendar .react-calendar__tile:enabled:focus {
    background-color: #f8fafc;
    color: #0ea5e9;
  }
  .custom-calendar .react-calendar__tile--now {
    background: #e0f2fe;
    color: #0284c7;
    font-weight: bold;
  }
  .custom-calendar .react-calendar__tile--active {
    background: #0ea5e9 !important;
    color: white !important;
    box-shadow: 0 4px 6px -1px rgb(14 165 233 / 0.3);
  }
  .event-dot {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: #3b82f6;
    border-radius: 50%;
  }
`;

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  type: string;
  status: string;
}

const CalendarWidget = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/dashboard/calendar');
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper to find events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  // Filter upcoming events for the "Agenda" list (future only)
  const upcomingEvents = events
    .filter(event => isAfter(parseISO(event.date), new Date()))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Take top 3

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <style>{calendarStyles}</style>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Kalender</h3>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <Calendar
          className="custom-calendar"
          view="month"
          prevLabel={<ChevronLeft size={18} />}
          nextLabel={<ChevronRight size={18} />}
          onChange={(value) => setSelectedDate(value as Date)}
          value={selectedDate}
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const dayEvents = getEventsForDay(date);
              return dayEvents.length > 0 ? <div className="event-dot" /> : null;
            }
          }}
        />
      </div>

      {/* Agenda List - Real Data */}
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agenda Terdekat</h4>

      {loading ? (
        <div className="text-center text-gray-400 text-xs py-4">Memuat agenda...</div>
      ) : upcomingEvents.length > 0 ? (
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => {
            const eventDate = parseISO(event.date);
            const isPrimary = index === 0; // Use blue for first, emerald for others
            const colorClass = isPrimary ? 'blue' : 'emerald';

            return (
              <div key={event.id} className={`flex flex-col p-3 bg-${colorClass}-50/50 rounded-xl border border-${colorClass}-100/50`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-${colorClass}-900 text-sm truncate pr-2`}>{event.title}</span>
                  <span className={`text-xs font-bold text-${colorClass}-600 bg-${colorClass}-100 px-2 py-0.5 rounded-full whitespace-nowrap`}>
                    {format(eventDate, 'd MMM', { locale: idLocale })}
                  </span>
                </div>
                <div className={`flex items-center text-${colorClass}-500 text-xs`}>
                  <Clock size={12} className="mr-1" /> {format(eventDate, 'HH:mm', { locale: idLocale })} WIB
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <CalendarDays size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-500">Tidak ada agenda tugas mendatang</p>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;
