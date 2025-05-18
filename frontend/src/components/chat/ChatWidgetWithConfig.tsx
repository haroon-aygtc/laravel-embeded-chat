import React, { useState } from 'react'
import ChatWidget from './ChatWidget'

export interface ChatWidgetConfig {
    titleText?: string
    subtitleText?: string
    primaryColor?: string
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    theme?: 'light' | 'dark' | 'auto'
    initialState?: 'open' | 'closed'
}

interface ChatWidgetWithConfigProps {
    config?: ChatWidgetConfig
    embedded?: boolean
}

const ChatWidgetWithConfig = ({ config, embedded = false }: ChatWidgetWithConfigProps) => {
    const [isOpen, setIsOpen] = useState(config?.initialState === 'open')
    const widgetId = 'default' // This would normally come from API or props

    // Mock configuration to match widget structure
    const mockWidgetConfig = {
        id: widgetId,
        title: config?.titleText || 'Chat Assistant',
        subtitle: config?.subtitleText || 'Ask me anything',
        visual_settings: {
            position: config?.position || 'bottom-right',
            theme: config?.theme || 'light',
            colors: {
                primary: config?.primaryColor || '#4F46E5',
                secondary: '#10B981',
                background: '#FFFFFF',
                text: '#1F2937'
            },
            style: 'rounded',
            width: '380px',
            height: '600px',
            showHeader: true,
            showFooter: true
        },
        behavioral_settings: {
            initialState: config?.initialState || 'closed',
            autoOpen: false,
            openDelay: 3,
            notification: true,
            mobileBehavior: 'standard',
            sounds: false
        },
        content_settings: {
            welcomeMessage: 'Hello! How can I assist you today?',
            placeholderText: 'Type your message...',
            botName: 'AI Assistant',
            avatarUrl: null,
            allowAttachments: true,
            allowVoice: false,
            allowEmoji: true
        }
    }

    const toggleWidget = () => {
        setIsOpen(prev => !prev)
    }

    const closeWidget = () => {
        setIsOpen(false)
    }

    return (
        <ChatWidget
            widgetId={widgetId}
            embedded={embedded}
            isCollapsed={!isOpen}
            onToggleCollapse={toggleWidget}
            onClose={closeWidget}
            initialMessages={[
                {
                    id: 'welcome',
                    content: mockWidgetConfig.content_settings.welcomeMessage,
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                }
            ]}
        />
    )
}

export default ChatWidgetWithConfig 