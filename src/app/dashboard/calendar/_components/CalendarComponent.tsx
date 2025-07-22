'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '~/trpc/react';

interface Event {
  id: number;
  title: string | null;
  description: string | null;
  location: string | null;
  eventDate: string | null;
  maxAttendees: number | null;
  isVirtual: boolean | null;
  virtualLink: string | null;
  eventType: string | null;
  createdByClerkUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userRSVP?: {
    id: number;
    eventId: number;
    userId: number;
    status: "attending" | "maybe" | "declined";
    createdAt: string;
    updatedAt: string;
  } | null;
}

interface CalendarComponentProps {
  viewType?: 'month' | 'week' | 'day';
  onEventClick?: (event: Event) => void;
  showCreateButton?: boolean;
  height?: string;
  userId?: number;
}

export default function CalendarComponent({
  viewType = 'month',
  onEventClick,
  showCreateButton = true,
  height = 'h-full',
  userId
}: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get events for the current month
  const { data: events = [], isLoading } = api.events.getByMonth.useQuery({
    year,
    month,
    userId: userId?.toString(),
  });

  const mappedEvents = events.map((event: any) => ({
    ...event,
    eventDate: event.eventDate || event.startDateTime || null,
    virtualLink: event.virtualLink || event.rsvpLink || null,
    // add other mappings as needed
  }));

  // Get upcoming events
  const { data: upcomingEvents = [] } = api.events.getUpcoming.useQuery({
    limit: 5,
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventsForDate = (date: Date): Event[] => {
    return mappedEvents.filter(event => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];

    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Next month's days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className={`${height} flex items-center justify-center bg-white rounded-lg shadow-md`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (viewType === 'month') {
    const calendarDays = generateCalendarDays();

    return (
      <Card className={`${height} flex flex-col`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <div className="grid grid-cols-7 gap-0 h-full">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 border-b">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-b border-r cursor-pointer transition-colors ${isCurrentMonth
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-gray-50 text-gray-400'
                    } ${isTodayDate ? 'bg-orange-50' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`text-sm font-medium mb-1 ${isTodayDate
                    ? 'bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : ''
                    }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:shadow-md transition-shadow ${event.userRSVP?.status === "attending"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : event.userRSVP?.status === "maybe"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : event.userRSVP?.status === "declined"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        title={`${event.title}${event.userRSVP ? ` (RSVP: ${event.userRSVP.status})` : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">
                            {event.title}
                          </span>
                          {event.userRSVP && (
                            <span className="ml-1 text-xs font-medium">
                              {event.userRSVP.status === "attending" && "✓"}
                              {event.userRSVP.status === "maybe" && "?"}
                              {event.userRSVP.status === "declined" && "✗"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view for upcoming events
  return (
    <Card className={height}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No upcoming events</p>
            <p className="text-sm text-gray-400">Create your first event to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {event.eventDate ? `${formatDate(event.eventDate)} • ${formatTime(event.eventDate)}` : "No date"}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {event.eventDate ? 'Scheduled' : 'No Date'}
                    </Badge>

                    {event.virtualLink && (
                      <a
                        href={event.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Users className="h-3 w-3" />
                        Join
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
