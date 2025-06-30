
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"

import { Bell, User, Music, Guitar, Mic } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

export default function Dashboard() {
    const recentActivities = [
        { id: 1, text: "Ellie posted in Community Feed" },
        { id: 2, text: "Setlist Swap created a new event" },
        { id: 3, text: "Johnny added a task to Project X" },
    ]

    return (
        <>
            <header className="flex items-center justify-between p-4 border-b bg-white">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold text-gray-800">Pack Music Australia</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Welcome Banner */}
                    <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to the Focus Room!</h2>
                                    <p className="text-gray-600">Songwriters Showcase - Apr 30</p>
                                </div>
                                <div className="flex items-center gap-4 text-orange-400">
                                    <Music className="h-8 w-8" />
                                    <Guitar className="h-12 w-12" />
                                    <Music className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-orange-100 border-orange-200 hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <h3 className="font-semibold text-gray-800">Create Event</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-blue-100 border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <h3 className="font-semibold text-gray-800">Poll</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-100 border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <h3 className="font-semibold text-gray-800">Spotlight</h3>
                                    <Mic className="h-8 w-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white"></div>
                                    <p className="text-gray-600">{activity.text}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    )
}
