"use client"

import { useState } from "react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Bell, User } from "lucide-react"
import { AppSidebar } from "~/app/_components/app-sidebar"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

// Sample events data
const sampleEvents = [
    { id: 1, date: "2025-01-15", title: "Songwriters Showcase", type: "event" },
    { id: 2, date: "2025-01-22", title: "Open Mic Night", type: "event" },
    { id: 3, date: "2025-01-28", title: "Band Practice", type: "rsvp" },
]

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of the month and number of days
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    // Generate calendar days
    const calendarDays = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
        calendarDays.push(null as never)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day as never)
    }

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev)
            if (direction === "prev") {
                newDate.setMonth(prev.getMonth() - 1)
            } else {
                newDate.setMonth(prev.getMonth() + 1)
            }
            return newDate
        })
    }

    const getEventsForDate = (day: number) => {
        const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        return sampleEvents.filter((event) => event.date === dateString)
    }

    const isToday = (day: number) => {
        const today = new Date()
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
    }

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold text-gray-800">Calendar & RSVP</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-6 bg-gray-50 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    <Card className="h-full">
                        <CardContent className="p-6 h-full">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {MONTHS[month]} {year}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                                        Today
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 h-full">
                                {/* Day Headers */}
                                {DAYS.map((day) => (
                                    <div key={day} className="p-3 text-center font-semibold text-gray-600 border-b">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar Days */}
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`min-h-[120px] p-2 border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${day ? "cursor-pointer" : ""
                                            }`}
                                    >
                                        {day && (
                                            <>
                                                <div
                                                    className={`text-sm font-medium mb-1 ${isToday(day)
                                                        ? "bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                                        : "text-gray-700"
                                                        }`}
                                                >
                                                    {day}
                                                </div>

                                                {/* Events for this day */}
                                                <div className="space-y-1">
                                                    {getEventsForDate(day).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={`text-xs p-1 rounded truncate ${event.type === "event" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                                                }`}
                                                            title={event.title}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>

    )
}
