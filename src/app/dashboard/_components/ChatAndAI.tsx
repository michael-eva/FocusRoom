import { Button } from "~/components/ui/button"
import { MessageSquare, Activity, Bell, Zap, MoreHorizontal, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { useEffect, useRef, useState } from "react"

export default function ChatAndAI({
  chatMessages,
  chatMessage,
  setChatMessage,
  handleSendMessage,
  currentUserId,
  hasMore,
  onLoadMore,
  isLoadingMore,
  onRSVP
}: {
  chatMessages: any[],
  chatMessage: string,
  setChatMessage: (message: string) => void,
  handleSendMessage: () => void,
  currentUserId?: string,
  hasMore?: boolean,
  onLoadMore?: () => void,
  isLoadingMore?: boolean,
  onRSVP?: (eventId: number, eventTitle: string) => void
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtTop, setIsAtTop] = useState(false);
  const previousMessageCountRef = useRef(chatMessages.length);
  const isLoadingMoreRef = useRef(false);

  // Auto-scroll to bottom to show most recent messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentCount = chatMessages.length;
    const previousCount = previousMessageCountRef.current;

    // Always scroll to bottom when:
    // 1. We're not loading more messages (to avoid jumping during load more), AND
    // 2. We have messages to show
    if (!isLoadingMoreRef.current && currentCount > 0) {
      // Force scroll to bottom to always show most recent content
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 0);
    }

    // Update the previous count
    previousMessageCountRef.current = currentCount;
  }, [chatMessages]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && chatMessages.length > 0) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, []);

  // Scroll event listener to detect if user is at the top
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Consider "at top" if scrolled to within 10px of the top
      const atTop = container.scrollTop <= 10;
      setIsAtTop(atTop);
    };

    container.addEventListener('scroll', handleScroll);
    // Check initial position
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Track loading state and reset isAtTop when loading more
  useEffect(() => {
    isLoadingMoreRef.current = Boolean(isLoadingMore);
    if (isLoadingMore) {
      setIsAtTop(false);
    }
  }, [isLoadingMore]);

  // Wrapper for onLoadMore to preserve scroll position
  const handleLoadMore = () => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadMore) return;

    // Store current scroll position
    const scrollHeight = container.scrollHeight;
    const scrollTop = container.scrollTop;

    // Set loading flag
    isLoadingMoreRef.current = true;

    // Call the actual load more function
    onLoadMore();

    // After loading, maintain scroll position (don't auto-scroll to bottom)
    setTimeout(() => {
      if (container) {
        // Calculate new scroll position to maintain relative position
        const newScrollHeight = container.scrollHeight;
        const heightDifference = newScrollHeight - scrollHeight;
        container.scrollTop = scrollTop + heightDifference;
      }
      isLoadingMoreRef.current = false;
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Group Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 h-[500px] flex flex-col">
          {/* Load More Button - only show when at top and has more */}
          {hasMore && isAtTop && (
            <div className="flex justify-center mb-4">
              <Button
                variant="packOutline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-white/80 hover:bg-white border-border text-foreground hover:text-foreground"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Load previous messages
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Chat Messages - Scrollable Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-3">
              {chatMessages.length > 0 ? (
                <>
                  {chatMessages.map((msg) => {
                    const isCurrentUser = msg.chatData?.clerkUserId === currentUserId;

                    return msg.type === 'chat' ? (
                      // CHAT MESSAGE - Traditional chat app style
                      <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-3 max-w-xs sm:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar - only show for other users */}
                          {!isCurrentUser && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${msg.avatarColor} shadow-sm flex-shrink-0 mt-1`}>
                              {msg.avatar}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {/* Username and timestamp - only for other users */}
                            {!isCurrentUser && (
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">{msg.user}</span>
                                <span className="text-xs text-gray-500">{msg.timeAgo}</span>
                              </div>
                            )}
                            {/* Message bubble */}
                            <div className={`px-4 py-2.5 rounded-lg shadow-sm ${isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-100 text-gray-800'
                              }`}>
                              <p className="leading-relaxed">{msg.message}</p>
                            </div>
                            {/* Timestamp for current user (below bubble) */}
                            {isCurrentUser && (
                              <div className="flex justify-end mt-1">
                                <span className="text-xs text-gray-500">{msg.timeAgo}</span>
                                {msg.isEdited && (
                                  <span className="text-xs text-gray-400 ml-1">(edited)</span>
                                )}
                              </div>
                            )}
                            {/* Edited indicator for other users */}
                            {!isCurrentUser && msg.isEdited && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-400">(edited)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // ACTIVITY EVENT - Enhanced with RSVP button for events
                      <div key={msg.id} className="flex justify-center my-4">
                        <div className="flex items-center gap-2 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-2 text-sm shadow-sm">
                          <Zap className="h-3.5 w-3.5 text-blue-500" />
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${msg.avatarColor}`}>
                            {msg.avatar}
                          </div>
                          <span className="font-medium text-gray-700">{msg.user}</span>
                          <span className="text-gray-600">{msg.message}</span>
                          <span className="text-xs text-blue-600 font-medium ml-1">{msg.timeAgo}</span>

                          {/* RSVP Button for events */}
                          {msg.activityData?.action === 'event_created' && onRSVP && (
                            <Button
                              size="sm"
                              variant="packOutline"
                              className="ml-2 h-6 px-2 text-xs bg-white hover:bg-gray-50 border-border"
                              onClick={(e) => {
                                e.stopPropagation();
                                const eventTitle = msg.activityData?.details?.replace('Created event: ', '') || 'Event';
                                onRSVP(msg.activityData?.metadata?.eventId, eventTitle);
                              }}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              RSVP
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">No messages yet</p>
                  <p className="text-sm text-gray-500">Start the conversation with your team!</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Input - Sticky Bottom */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-blue-200/60">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md shadow-sm transition-all duration-200 hover:shadow-md text-sm font-medium"
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            {/* Coming Soon Message */}
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600 mb-1">Coming Soon!</p>
            <p className="text-xs text-gray-500 max-w-xs">
              We&apos;re working on an AI assistant to help with songwriting, chord progressions, and creative inspiration.
            </p>

            {/* Disabled Input Preview */}
            <div className="flex gap-2 mt-6 w-full max-w-sm opacity-50">
              <input
                type="text"
                placeholder="Ask AI... (coming soon)"
                disabled
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <Button size="sm" disabled className="bg-purple-400 cursor-not-allowed">
                Ask
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
