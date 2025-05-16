/**
 * Laravel Embedded Chat Widget
 * 
 * This script allows embedding a chat widget into any website.
 * Usage:
 * <script src="https://your-domain.com/embed.js"></script>
 * <script>
 *   document.addEventListener('DOMContentLoaded', function() {
 *     LaravelChat.init({
 *       widgetId: 'your-widget-id',
 *       container: 'chat-container', // Optional
 *       position: 'bottom-right', // Optional: bottom-right, bottom-left, top-right, top-left
 *       primaryColor: '#4f46e5', // Optional
 *     });
 *   });
 * </script>
 */

(function () {
    // Configuration
    const API_BASE_URL = window.CHAT_API_URL || 'http://localhost:9000/api';
    const FRONTEND_URL = window.CHAT_FRONTEND_URL || 'http://localhost:3000';
    const STORAGE_PREFIX = 'laravel_chat_';

    // Initialize the global object
    window.LaravelChat = {
        config: {
            widgetId: null,
            container: null,
            position: 'bottom-right',
            primaryColor: '#4f46e5',
            autoOpen: false,
            title: 'Chat Support',
            subtitle: 'How can we help you today?',
            placeholderText: 'Type your message...',
            buttonSize: '60px',
            widgetWidth: '380px',
            widgetHeight: '600px',
        },

        // Elements references
        elements: {
            container: null,
            button: null,
            frame: null,
        },

        /**
         * Initialize the chat widget
         * @param {Object} options Configuration options
         */
        init: function (options) {
            // Merge options with defaults
            this.config = { ...this.config, ...options };

            if (!this.config.widgetId) {
                console.error('LaravelChat: No widgetId provided. Widget cannot be initialized.');
                return;
            }

            // Create widget container if a custom container ID is provided
            if (this.config.container) {
                this.targetContainer = document.getElementById(this.config.container);
                if (!this.targetContainer) {
                    this.targetContainer = document.createElement('div');
                    this.targetContainer.id = this.config.container;
                    document.body.appendChild(this.targetContainer);
                }
                this.createEmbeddedWidget();
            } else {
                // Create floating widget
                this.createFloatingWidget();
            }
        },

        /**
         * Create a floating chat widget
         */
        createFloatingWidget: function () {
            const widgetContainer = document.createElement('div');
            widgetContainer.id = 'laravel-chat-widget-container';
            widgetContainer.style.position = 'fixed';

            // Set position based on config
            switch (this.config.position) {
                case 'bottom-right':
                    widgetContainer.style.bottom = '20px';
                    widgetContainer.style.right = '20px';
                    break;
                case 'bottom-left':
                    widgetContainer.style.bottom = '20px';
                    widgetContainer.style.left = '20px';
                    break;
                case 'top-right':
                    widgetContainer.style.top = '20px';
                    widgetContainer.style.right = '20px';
                    break;
                case 'top-left':
                    widgetContainer.style.top = '20px';
                    widgetContainer.style.left = '20px';
                    break;
            }

            widgetContainer.style.zIndex = '999999';
            document.body.appendChild(widgetContainer);

            // Create toggle button
            const chatButton = document.createElement('button');
            chatButton.id = 'laravel-chat-button';
            chatButton.style.width = this.config.buttonSize;
            chatButton.style.height = this.config.buttonSize;
            chatButton.style.borderRadius = '50%';
            chatButton.style.backgroundColor = this.config.primaryColor;
            chatButton.style.border = 'none';
            chatButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            chatButton.style.cursor = 'pointer';
            chatButton.style.display = 'flex';
            chatButton.style.alignItems = 'center';
            chatButton.style.justifyContent = 'center';
            chatButton.style.transition = 'transform 0.2s ease';
            chatButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
            chatButton.setAttribute('aria-label', 'Open chat');

            // Add hover effect
            chatButton.onmouseover = function () {
                this.style.transform = 'scale(1.05)';
            };
            chatButton.onmouseout = function () {
                this.style.transform = 'scale(1)';
            };

            // Create chat frame (initially hidden)
            const chatFrame = document.createElement('iframe');
            chatFrame.id = 'laravel-chat-frame';
            chatFrame.style.width = this.config.widgetWidth;
            chatFrame.style.height = this.config.widgetHeight;
            chatFrame.style.border = 'none';
            chatFrame.style.borderRadius = '12px';
            chatFrame.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            chatFrame.style.position = 'absolute';
            chatFrame.style.overflow = 'hidden';
            chatFrame.style.transition = 'opacity 0.3s, transform 0.3s';
            chatFrame.style.opacity = '0';
            chatFrame.style.visibility = 'hidden';
            chatFrame.style.pointerEvents = 'none';

            // Position the frame based on position setting
            switch (this.config.position) {
                case 'bottom-right':
                    chatFrame.style.bottom = '80px';
                    chatFrame.style.right = '0';
                    break;
                case 'bottom-left':
                    chatFrame.style.bottom = '80px';
                    chatFrame.style.left = '0';
                    break;
                case 'top-right':
                    chatFrame.style.top = '80px';
                    chatFrame.style.right = '0';
                    break;
                case 'top-left':
                    chatFrame.style.top = '80px';
                    chatFrame.style.left = '0';
                    break;
            }

            // Add elements to container
            widgetContainer.appendChild(chatButton);
            widgetContainer.appendChild(chatFrame);

            // Save references to elements
            this.elements.container = widgetContainer;
            this.elements.button = chatButton;
            this.elements.frame = chatFrame;

            // Toggle widget on button click
            chatButton.addEventListener('click', () => {
                this.toggleWidget(chatFrame, chatButton);
            });

            // Auto-open if configured
            if (this.config.autoOpen) {
                setTimeout(() => {
                    this.toggleWidget(chatFrame, chatButton);
                }, 1000); // Small delay to ensure everything is loaded
            }
        },

        /**
         * Create an embedded chat widget within a container
         */
        createEmbeddedWidget: function () {
            // Create an iframe that takes up the full container
            const chatFrame = document.createElement('iframe');
            chatFrame.id = 'laravel-chat-embedded-frame';
            chatFrame.style.width = '100%';
            chatFrame.style.height = '100%';
            chatFrame.style.border = 'none';
            chatFrame.style.borderRadius = '12px';
            chatFrame.style.overflow = 'hidden';

            // Save references
            this.elements.frame = chatFrame;

            // Add the iframe to the target container
            this.targetContainer.appendChild(chatFrame);

            // Load the chat interface
            this.loadChatInterface(chatFrame, true);
        },

        /**
         * Toggle the chat widget visibility
         */
        toggleWidget: function (frame, button) {
            const isHidden = frame.style.opacity === '0';

            if (isHidden) {
                // Show the widget
                frame.style.opacity = '1';
                frame.style.visibility = 'visible';
                frame.style.pointerEvents = 'auto';
                frame.style.transform = 'translateY(0)';

                // Load the chat interface if not already loaded
                if (!frame.src) {
                    this.loadChatInterface(frame, false);
                }
            } else {
                // Hide the widget
                frame.style.opacity = '0';
                frame.style.visibility = 'hidden';
                frame.style.pointerEvents = 'none';
                frame.style.transform = 'translateY(10px)';
            }
        },

        /**
         * Load the chat interface into the iframe
         */
        loadChatInterface: function (frame, embedded) {
            // Get or create a session ID
            let sessionId = localStorage.getItem(`${STORAGE_PREFIX}session_${this.config.widgetId}`);

            // Build the URL with parameters
            const embedUrl = `${FRONTEND_URL}/chat-embed?widgetId=${this.config.widgetId}&embedded=${embedded}&primaryColor=${encodeURIComponent(this.config.primaryColor)}`;

            // Add session ID if it exists
            const finalUrl = sessionId ? `${embedUrl}&sessionId=${sessionId}` : embedUrl;

            // Set iframe source
            frame.src = finalUrl;

            // Handle messages from the iframe
            window.addEventListener('message', (event) => {
                // Verify origin
                if (event.origin !== FRONTEND_URL) {
                    return;
                }

                const data = event.data;

                // Handle session creation
                if (data.action === 'session-created' && data.sessionId) {
                    localStorage.setItem(`${STORAGE_PREFIX}session_${this.config.widgetId}`, data.sessionId);
                }

                // Handle close widget request
                if (data.action === 'close-widget' && !embedded) {
                    this.toggleWidget(frame, document.getElementById('laravel-chat-button'));
                }
            });
        },

        /**
         * Manually open the chat widget
         */
        open: function () {
            if (!this.elements.frame || !this.elements.button) {
                console.error('LaravelChat: Widget not initialized. Call init() first.');
                return;
            }

            const frame = this.elements.frame;
            const button = this.elements.button;

            if (frame.style.opacity === '0') {
                this.toggleWidget(frame, button);
            }
        },

        /**
         * Manually close the chat widget
         */
        close: function () {
            if (!this.elements.frame || !this.elements.button) {
                console.error('LaravelChat: Widget not initialized. Call init() first.');
                return;
            }

            const frame = this.elements.frame;
            const button = this.elements.button;

            if (frame.style.opacity !== '0') {
                this.toggleWidget(frame, button);
            }
        },

        /**
         * Destroy the chat widget
         */
        destroy: function () {
            // Remove event listeners
            if (this.elements.button) {
                this.elements.button.removeEventListener('click', this.toggleWidget);
            }

            // Remove DOM elements
            if (this.elements.container) {
                document.body.removeChild(this.elements.container);
            } else if (this.targetContainer && this.elements.frame) {
                this.targetContainer.removeChild(this.elements.frame);
            }

            // Reset state
            this.elements = {
                container: null,
                button: null,
                frame: null
            };
        }
    };
})(); 