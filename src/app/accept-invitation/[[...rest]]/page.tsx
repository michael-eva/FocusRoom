import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Shield, Calendar, MessageSquare } from "lucide-react";

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Welcome Information */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to FocusRoom
            </CardTitle>
            <p className="text-gray-600">
              You&apos;ve been invited to join our cooperative music platform and community workspace
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Collaborative Projects</h3>
                  <p className="text-sm text-gray-600">Work together on music projects with tasks, resources, and team management</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Community Chat</h3>
                  <p className="text-sm text-gray-600">Real-time messaging with your team and the community</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Events & Polls</h3>
                  <p className="text-sm text-gray-600">Create and participate in community events and decision-making polls</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Spotlight Features</h3>
                  <p className="text-sm text-gray-600">Share your music and stories with the community</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Complete your registration to get started and join the community
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <SignUp 
              forceRedirectUrl={"/dashboard"}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-xl border-0 bg-white/90 backdrop-blur-sm",
                  headerTitle: "text-xl font-bold text-gray-800",
                  headerSubtitle: "text-gray-600",
                  formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold",
                  footerActionLink: "text-orange-600 hover:text-orange-700",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500"
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
