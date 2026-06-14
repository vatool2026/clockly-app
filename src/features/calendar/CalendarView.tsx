import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  addYears,
  subYears,
  getDaysInMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';
import './Calendar.css';

type TimeEntry = {
  id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  pause_minutes: number;
};

export const CalendarView = () => {
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, currentDate, viewMode]);

  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Determine date range to fetch
      let startStr = '';
      let endStr = '';

      if (viewMode === 'month') {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        startStr = format(start, 'yyyy-MM-dd');
        endStr = format(end, 'yyyy-MM-dd');
      } else {
        startStr = `${format(currentDate, 'yyyy')}-01-01`;
        endStr = `${format(currentDate, 'yyyy')}-12-31`;
      }

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('work_date', startStr)
        .lte('work_date', endStr)
        .order('work_date', { ascending: true });

      if (error) {
        console.error("Error fetching calendar data:", error);
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const nextYear = () => setCurrentDate(addYears(currentDate, 1));
  const prevYear = () => setCurrentDate(subYears(currentDate, 1));

  // --- MONTH VIEW LOGIC ---
  const renderMonthCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dateStr = format(day, 'yyyy-MM-dd');
        
        // Find entries for this day
        const dayEntries = entries.filter(e => e.work_date === dateStr);
        let totalMs = 0;
        
        dayEntries.forEach(entry => {
          if (entry.clock_out) {
            const start = new Date(entry.clock_in).getTime();
            const end = new Date(entry.clock_out).getTime();
            const pauseMs = (entry.pause_minutes || 0) * 60000;
            totalMs += (end - start - pauseMs);
          }
        });
        
        const hours = totalMs > 0 ? (totalMs / (1000 * 60 * 60)).toFixed(1) : 0;

        days.push(
          <div
            className={`calendar-cell ${
              !isSameMonth(day, monthStart)
                ? "disabled"
                : isSameDay(day, new Date()) ? "today" : ""
            }`}
            key={day.toISOString()}
          >
            <span className="calendar-day-number">{formattedDate}</span>
            {Number(hours) > 0 && (
              <div className="calendar-day-hours">
                {hours} h
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-row" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-body">{rows}</div>;
  };

  // --- YEAR VIEW LOGIC ---
  const renderYearCells = () => {
    const months = [];
    const year = format(currentDate, 'yyyy');

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(Number(year), i, 1);
      const daysInMonth = getDaysInMonth(monthDate);
      
      // Calculate total hours for this month
      const startStr = format(monthDate, 'yyyy-MM-01');
      const endStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      
      const monthEntries = entries.filter(e => e.work_date >= startStr && e.work_date <= endStr);
      let totalMs = 0;
      
      monthEntries.forEach(entry => {
        if (entry.clock_out) {
          const start = new Date(entry.clock_in).getTime();
          const end = new Date(entry.clock_out).getTime();
          const pauseMs = (entry.pause_minutes || 0) * 60000;
          totalMs += (end - start - pauseMs);
        }
      });
      
      const hours = totalMs > 0 ? (totalMs / (1000 * 60 * 60)).toFixed(1) : 0;

      months.push(
        <div 
          key={i} 
          className="calendar-year-month glass-card"
          onClick={() => {
            setCurrentDate(monthDate);
            setViewMode('month');
          }}
        >
          <div className="month-name">{format(monthDate, 'MMMM', { locale: de })}</div>
          <div className="month-stats">
            <span className="month-hours">{hours} h</span>
            <span className="month-days">{daysInMonth} Tage</span>
          </div>
        </div>
      );
    }

    return <div className="calendar-year-grid">{months}</div>;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header glass-card">
        <div className="calendar-controls">
          <button onClick={viewMode === 'month' ? prevMonth : prevYear} className="btn-icon">
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="calendar-title" onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')} style={{ cursor: 'pointer' }}>
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy', { locale: de }) 
              : format(currentDate, 'yyyy')
            }
          </h2>
          
          <button onClick={viewMode === 'month' ? nextMonth : nextYear} className="btn-icon">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="view-toggles">
          <button 
            className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('month')}
            style={{ padding: '0.4rem 1rem' }}
          >
            Monat
          </button>
          <button 
            className={`btn ${viewMode === 'year' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('year')}
            style={{ padding: '0.4rem 1rem' }}
          >
            Jahr
          </button>
        </div>
      </div>

      <div className="calendar-content">
        {isLoading && <div className="calendar-loading">Lade Daten...</div>}
        
        {!isLoading && viewMode === 'month' && (
          <div className="calendar-month-view glass-card">
            <div className="calendar-days-header">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div className="calendar-day-name" key={day}>{day}</div>
              ))}
            </div>
            {renderMonthCells()}
          </div>
        )}

        {!isLoading && viewMode === 'year' && renderYearCells()}
      </div>
    </div>
  );
};
