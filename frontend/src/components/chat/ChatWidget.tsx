import React, { useState, useEffect, useRef } from 'react'
import { SendHorizontal, Paperclip, X, Minimize2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'

// Define the WidgetChatMessage type here to avoid import conflicts
export interface WidgetChatMessage {
    id: string
    content: string
    role: 'user' | 'assistant' | 'system'
    timestamp: string | Date
    status?: 'sending' | 'sent' | 'error'
}

export interface ChatWidgetProps {
    widgetId: string
    embedded?: boolean
    onClose?: () => void
    initialMessages?: WidgetChatMessage[]
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    className?: string
}

const ChatWidget = ({
    widgetId,
    embedded = false,
    onClose,
    initialMessages = [],
    isCollapsed = false,
    onToggleCollapse,
    className = ''
}: ChatWidgetProps) => {
    const [messages, setMessages] = useState<WidgetChatMessage[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [session, setSession] = useState<{ id: string, name: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [widgetConfig, setWidgetConfig] = useState<any>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    // Initialize chat session - using mock data for now
    useEffect(() => {
        const initSession = async () => {
            try {
                setLoading(true)

                // Mock widget configuration for testing
                const mockConfig = {
                    title: 'Chat Assistant',
                    subtitle: 'Ask me anything',
                    content_settings: {
                        welcomeMessage: 'Hello! How can I assist you today?',
                        placeholderText: 'Type your message...',
                        botName: 'AI Assistant',
                        avatarUrl: null,
                        allowAttachments: true
                    },
                    visual_settings: {
                        position: 'bottom-right',
                        theme: 'light',
                        colors: {
                            primary: '#4F46E5'
                        },
                        style: 'rounded'
                    }
                }

                setWidgetConfig(mockConfig)

                // Mock session creation
                setSession({
                    id: 'session-' + Date.now(),
                    name: 'New Chat'
                })

                // Add welcome message if not provided in initialMessages
                if (initialMessages.length === 0 && mockConfig.content_settings.welcomeMessage) {
                    setMessages([
                        {
                            id: 'welcome',
                            content: mockConfig.content_settings.welcomeMessage,
                            role: 'assistant',
                            timestamp: new Date().toISOString(),
                            status: 'sent'
                        }
                    ])
                }
            } catch (error) {
                console.error('Error initializing chat session:', error)
            } finally {
                setLoading(false)
            }
        }

        initSession()
    }, [widgetId, initialMessages])

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!newMessage.trim() && selectedFiles.length === 0) return
        if (!session) return

        // Create local message object
        const tempId = `temp-${Date.now()}`
        const userMessage: WidgetChatMessage = {
            id: tempId,
            content: newMessage,
            role: 'user',
            timestamp: new Date().toISOString(),
            status: 'sending'
        }

        // Add user message to state
        setMessages(prev => [...prev, userMessage])
        setNewMessage('')

        try {
            // Mock API response for now
            setTimeout(() => {
                // Update user message status
                setMessages(prev =>
                    prev.map(msg => msg.id === tempId ? { ...msg, status: 'sent' } : msg)
                )

                // Add assistant response
                const assistantMessage: WidgetChatMessage = {
                    id: `response-${Date.now()}`,
                    content: `This is a simulated response to: "${newMessage}"`,
                    role: 'assistant',
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                }

                setMessages(prev => [...prev, assistantMessage])

                // Clear selected files
                setSelectedFiles([])
            }, 1000)
        } catch (error) {
            console.error('Error sending message:', error)

            // Mark message as error
            setMessages(prev =>
                prev.map(msg => msg.id === tempId ? { ...msg, status: 'error' } : msg)
            )
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files)
            setSelectedFiles(prev => [...prev, ...fileArray])
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    // Handle session end
    const endSession = async () => {
        if (!session) return

        try {
            // Mock session end
            if (onClose) onClose()
        } catch (error) {
            console.error('Error ending session:', error)
        }
    }

    if (isCollapsed) {
        return (
            <div className={`fixed ${widgetConfig?.visual_settings?.position || 'bottom-right'} p-4 z-50 ${className}`}>
                <Button
                    className="rounded-full h-14 w-14 shadow-lg"
                    style={{ backgroundColor: widgetConfig?.visual_settings?.colors?.primary || '#4F46E5' }}
                    onClick={onToggleCollapse}
                >
                    <SendHorizontal className="h-6 w-6" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className={`flex flex-col ${embedded ? 'h-full w-full' : 'fixed shadow-lg h-[550px] w-[380px] border border-gray-200 rounded-lg'} ${className}`}
            style={{
                bottom: embedded ? 0 : '20px',
                right: embedded ? 0 : '20px',
                zIndex: 50,
                backgroundColor: widgetConfig?.visual_settings?.colors?.background || '#FFFFFF',
                borderRadius: widgetConfig?.visual_settings?.style === 'rounded' ? '12px' : '4px'
            }}
        >
            {/* Header */}
            {widgetConfig?.visual_settings?.showHeader !== false && (
                <div
                    className="p-4 flex justify-between items-center"
                    style={{
                        backgroundColor: widgetConfig?.visual_settings?.colors?.primary || '#4F46E5',
                        color: '#FFFFFF',
                        borderTopLeftRadius: widgetConfig?.visual_settings?.style === 'rounded' ? '12px' : '4px',
                        borderTopRightRadius: widgetConfig?.visual_settings?.style === 'rounded' ? '12px' : '4px'
                    }}
                >
                    <div className="flex items-center space-x-2">
                        {widgetConfig?.content_settings?.avatarUrl && (
                            <Avatar>
                                <img src={widgetConfig.content_settings.avatarUrl} alt="Bot" />
                            </Avatar>
                        )}
                        <div>
                            <h3 className="font-semibold">{widgetConfig?.title || 'Chat Assistant'}</h3>
                            {widgetConfig?.subtitle && (
                                <p className="text-sm opacity-90">{widgetConfig.subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-1">
                        {onToggleCollapse && (
                            <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8 text-white">
                                <Minimize2 className="h-4 w-4" />
                            </Button>
                        )}
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={endSession} className="h-8 w-8 text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                    <div
                        key={message.id || index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-lg ${message.role === 'user'
                                ? 'bg-primary text-white ml-4'
                                : 'bg-white border border-gray-200 mr-4'
                                }`}
                            style={message.role === 'user' ? { backgroundColor: widgetConfig?.visual_settings?.colors?.primary || '#4F46E5' } : {}}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.status === 'error' && (
                                <div className="text-xs mt-1 text-red-500">Failed to send. Try again?</div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Selected files */}
            {selectedFiles.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center bg-white rounded-md border px-2 py-1 text-sm">
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-1"
                                    onClick={() => removeFile(index)}
                                >
                                    <XCircle className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    {widgetConfig?.content_settings?.allowAttachments && (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={triggerFileInput}
                                className="shrink-0"
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                                multiple
                            />
                        </>
                    )}

                    <Textarea
                        placeholder={widgetConfig?.content_settings?.placeholderText || "Type your message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={1}
                        className="min-h-[40px] max-h-[120px] flex-1 resize-none"
                    />

                    <Button
                        type="submit"
                        size="icon"
                        className="shrink-0"
                        disabled={loading || (!newMessage.trim() && selectedFiles.length === 0)}
                        style={{ backgroundColor: widgetConfig?.visual_settings?.colors?.primary || '#4F46E5' }}
                    >
                        <SendHorizontal className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}

export default ChatWidget 