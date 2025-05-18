/**
 * The Last Lab Widget
 * 
 * A lightweight widget loader for embedding chat widgets in any website.
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js"></script>
 * <script>
 *   TheLastLabWidget.init('your-widget-id', {
 *     // Optional configuration overrides
 *     position: 'bottom-right',
 *     primaryColor: '#4F46E5'
 *   });
 * </script>
 */

(function (window, document) {
    // Configuration
    const DEFAULT_CONFIG = {
        apiUrl: 'https://api.thelastlab.io',
        widgetId: null,
        position: 'bottom-right',
        primaryColor: '#4F46E5',
        autoOpen: false,
        autoOpenDelay: 5000,
        buttonSize: '60px',
        widgetWidth: '380px',
        widgetHeight: '600px',
        showBranding: true,
        showNotifications: true,
        zIndex: 9999,
        storagePrefix: 'thelastlab_widget_',
        sessionExpiryDays: 30
    };

    // Widget elements references
    let buttonEl = null;
    let containerEl = null;
    let iframeEl = null;
    let notificationEl = null;

    // Widget state
    let widgetConfig = { ...DEFAULT_CONFIG };
    let isOpen = false;
    let sessionId = null;
    let unreadCount = 0;

    // Initialize the widget namespace
    window.TheLastLabWidget = window.TheLastLabWidget || {
        /**
         * Initialize the widget
         * @param {string} widgetId - The ID of the widget to load
         * @param {object} options - Optional configuration overrides
         */
        init: function (widgetId, options = {}) {
            if (!widgetId) {
                console.error('TheLastLabWidget: Missing widget ID');
                return;
            }

            // Merge configurations
            widgetConfig = { ...DEFAULT_CONFIG, ...options, widgetId };

            // Try to load session from storage
            sessionId = getSessionFromStorage(widgetId);

            // Create the widget UI
            createWidgetUI();

            // Auto-open widget if configured
            if (widgetConfig.autoOpen) {
                setTimeout(() => {
                    toggleWidget(true);
                }, widgetConfig.autoOpenDelay);
            }

            // Load the widget settings from the server
            loadWidgetSettings(widgetId);

            return this;
        },

        /**
         * Open the widget
         */
        open: function () {
            toggleWidget(true);
            return this;
        },

        /**
         * Close the widget
         */
        close: function () {
            toggleWidget(false);
            return this;
        },

        /**
         * Toggle the widget
         */
        toggle: function () {
            toggleWidget(!isOpen);
            return this;
        },

        /**
         * Set widget configuration
         * @param {object} options - Configuration options
         */
        setConfig: function (options) {
            widgetConfig = { ...widgetConfig, ...options };
            updateWidgetUI();
            return this;
        },

        /**
         * Get current widget configuration
         */
        getConfig: function () {
            return { ...widgetConfig };
        },

        /**
         * Update notification count
         * @param {number} count - New notification count
         */
        setNotificationCount: function (count) {
            unreadCount = count;
            updateNotificationBadge();
            return this;
        }
    };

    /**
     * Create the widget UI
     */
    function createWidgetUI() {
        // Create container element
        containerEl = document.createElement('div');
        containerEl.id = 'thelastlab-widget-container';
        containerEl.style.position = 'fixed';
        containerEl.style.zIndex = widgetConfig.zIndex;

        // Set position based on config
        setPosition(containerEl, widgetConfig.position);

        // Create chat button
        buttonEl = document.createElement('button');
        buttonEl.id = 'thelastlab-widget-button';
        buttonEl.style.width = widgetConfig.buttonSize;
        buttonEl.style.height = widgetConfig.buttonSize;
        buttonEl.style.borderRadius = '50%';
        buttonEl.style.backgroundColor = widgetConfig.primaryColor;
        buttonEl.style.border = 'none';
        buttonEl.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        buttonEl.style.cursor = 'pointer';
        buttonEl.style.display = 'flex';
        buttonEl.style.alignItems = 'center';
        buttonEl.style.justifyContent = 'center';
        buttonEl.style.transition = 'transform 0.3s ease';
        buttonEl.innerHTML = getChatIcon();
        buttonEl.title = 'Open Chat';
        buttonEl.setAttribute('aria-label', 'Open Chat');

        // Add hover effect
        buttonEl.onmouseover = function () {
            buttonEl.style.transform = 'scale(1.05)';
        };
        buttonEl.onmouseout = function () {
            buttonEl.style.transform = 'scale(1)';
        };

        // Add click handler
        buttonEl.addEventListener('click', function () {
            toggleWidget(!isOpen);
        });

        // Create notification badge
        notificationEl = document.createElement('div');
        notificationEl.style.position = 'absolute';
        notificationEl.style.top = '-5px';
        notificationEl.style.right = '-5px';
        notificationEl.style.width = '20px';
        notificationEl.style.height = '20px';
        notificationEl.style.borderRadius = '50%';
        notificationEl.style.backgroundColor = '#EF4444';
        notificationEl.style.color = '#FFFFFF';
        notificationEl.style.fontSize = '12px';
        notificationEl.style.fontWeight = 'bold';
        notificationEl.style.display = 'flex';
        notificationEl.style.alignItems = 'center';
        notificationEl.style.justifyContent = 'center';
        notificationEl.style.display = 'none';

        // Create iframe (initially hidden)
        iframeEl = document.createElement('iframe');
        iframeEl.id = 'thelastlab-widget-iframe';
        iframeEl.style.width = widgetConfig.widgetWidth;
        iframeEl.style.height = widgetConfig.widgetHeight;
        iframeEl.style.border = 'none';
        iframeEl.style.borderRadius = '12px';
        iframeEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        iframeEl.style.display = 'none';
        iframeEl.title = 'Chat Widget';
        iframeEl.setAttribute('aria-hidden', 'true');

        // Calculate iframe positioning based on button position
        setIframePosition(iframeEl, widgetConfig.position);

        // Add elements to container
        buttonEl.appendChild(notificationEl);
        containerEl.appendChild(buttonEl);
        containerEl.appendChild(iframeEl);

        // Append to document
        document.body.appendChild(containerEl);

        // Listen for messages from iframe
        setupMessageListener();
    }

    /**
     * Set up a message listener for communication with the iframe
     */
    function setupMessageListener() {
        window.addEventListener('message', function (event) {
            // Validate origin (should match your API domain)
            const apiDomain = new URL(widgetConfig.apiUrl).origin;
            if (event.origin !== apiDomain) {
                return;
            }

            const message = event.data;

            // Handle different message types
            switch (message.type) {
                case 'widget:ready':
                    // Widget has loaded and is ready
                    break;

                case 'widget:close':
                    // Request to close the widget
                    toggleWidget(false);
                    break;

                case 'widget:notification':
                    // Update notification count
                    if (message.count !== undefined) {
                        unreadCount = message.count;
                        updateNotificationBadge();
                    }
                    break;

                case 'widget:session':
                    // Store session ID
                    if (message.sessionId) {
                        sessionId = message.sessionId;
                        storeSessionInStorage(widgetConfig.widgetId, sessionId);
                    }
                    break;
            }
        });
    }

    /**
     * Toggle the widget open/closed
     * @param {boolean} open - Whether to open or close the widget
     */
    function toggleWidget(open) {
        isOpen = open;

        if (isOpen) {
            // Load iframe content if not already loaded
            if (!iframeEl.src) {
                loadIframeContent();
            }

            // Show iframe
            iframeEl.style.display = 'block';

            // Update button icon
            buttonEl.innerHTML = getCloseIcon();
            buttonEl.title = 'Close Chat';
            buttonEl.setAttribute('aria-label', 'Close Chat');

            // Reset notification count
            unreadCount = 0;
            updateNotificationBadge();

            // Announce to screen readers
            announceForAccessibility('Chat widget opened');
        } else {
            // Hide iframe
            iframeEl.style.display = 'none';

            // Update button icon
            buttonEl.innerHTML = getChatIcon();
            buttonEl.title = 'Open Chat';
            buttonEl.setAttribute('aria-label', 'Open Chat');

            // Announce to screen readers
            announceForAccessibility('Chat widget closed');
        }
    }

    /**
     * Load the iframe content
     */
    function loadIframeContent() {
        const url = new URL(`${widgetConfig.apiUrl}/widget/${widgetConfig.widgetId}`);

        // Add session ID if available
        if (sessionId) {
            url.searchParams.append('session', sessionId);
        }

        // Add custom parameters
        url.searchParams.append('primaryColor', encodeURIComponent(widgetConfig.primaryColor));
        url.searchParams.append('showBranding', widgetConfig.showBranding);

        // Set iframe source
        iframeEl.src = url.toString();
    }

    /**
     * Load widget settings from the server
     * @param {string} widgetId - The widget ID
     */
    function loadWidgetSettings(widgetId) {
        fetch(`${widgetConfig.apiUrl}/widget-client/${widgetId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    const serverConfig = data.data;

                    // Update widget configuration with server values
                    widgetConfig = {
                        ...widgetConfig,
                        primaryColor: serverConfig.appearance?.primaryColor || widgetConfig.primaryColor,
                        position: serverConfig.behavior?.position || widgetConfig.position,
                        autoOpen: serverConfig.behavior?.autoOpen || widgetConfig.autoOpen,
                        autoOpenDelay: (serverConfig.behavior?.autoOpenDelay || 5) * 1000,
                        showBranding: serverConfig.appearance?.showBranding ?? widgetConfig.showBranding
                    };

                    // Update UI with new configuration
                    updateWidgetUI();
                }
            })
            .catch(error => {
                console.error('Error loading widget settings:', error);
            });
    }

    /**
     * Update the widget UI based on current configuration
     */
    function updateWidgetUI() {
        // Update button color
        buttonEl.style.backgroundColor = widgetConfig.primaryColor;

        // Update position
        setPosition(containerEl, widgetConfig.position);
        setIframePosition(iframeEl, widgetConfig.position);

        // Update dimensions
        iframeEl.style.width = widgetConfig.widgetWidth;
        iframeEl.style.height = widgetConfig.widgetHeight;
    }

    /**
     * Update the notification badge
     */
    function updateNotificationBadge() {
        if (unreadCount > 0 && !isOpen) {
            notificationEl.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
            notificationEl.style.display = 'flex';
        } else {
            notificationEl.style.display = 'none';
        }
    }

    /**
     * Set the position of an element
     * @param {HTMLElement} element - The element to position
     * @param {string} position - The position value
     */
    function setPosition(element, position) {
        // Reset all positions
        element.style.top = 'auto';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.left = 'auto';

        // Set position based on value
        switch (position) {
            case 'bottom-right':
                element.style.bottom = '20px';
                element.style.right = '20px';
                break;
            case 'bottom-left':
                element.style.bottom = '20px';
                element.style.left = '20px';
                break;
            case 'top-right':
                element.style.top = '20px';
                element.style.right = '20px';
                break;
            case 'top-left':
                element.style.top = '20px';
                element.style.left = '20px';
                break;
        }
    }

    /**
     * Set the position of the iframe relative to the button
     * @param {HTMLElement} iframe - The iframe element
     * @param {string} position - The position value
     */
    function setIframePosition(iframe, position) {
        const buttonSize = parseInt(widgetConfig.buttonSize) || 60;
        const spacing = 20;

        switch (position) {
            case 'bottom-right':
                iframe.style.bottom = (buttonSize + spacing) + 'px';
                iframe.style.right = '0';
                break;
            case 'bottom-left':
                iframe.style.bottom = (buttonSize + spacing) + 'px';
                iframe.style.left = '0';
                break;
            case 'top-right':
                iframe.style.top = (buttonSize + spacing) + 'px';
                iframe.style.right = '0';
                break;
            case 'top-left':
                iframe.style.top = (buttonSize + spacing) + 'px';
                iframe.style.left = '0';
                break;
        }
    }

    /**
     * Get chat icon SVG
     */
    function getChatIcon() {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    }

    /**
     * Get close icon SVG
     */
    function getCloseIcon() {
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    }

    /**
     * Store session ID in local storage
     * @param {string} widgetId - The widget ID
     * @param {string} sessionId - The session ID
     */
    function storeSessionInStorage(widgetId, sessionId) {
        try {
            const key = `${widgetConfig.storagePrefix}session_${widgetId}`;
            localStorage.setItem(key, sessionId);

            // Store timestamp for expiry check
            localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        } catch (error) {
            console.error('Error storing session:', error);
        }
    }

    /**
     * Get session ID from local storage
     * @param {string} widgetId - The widget ID
     * @returns {string|null} - The session ID or null
     */
    function getSessionFromStorage(widgetId) {
        try {
            const key = `${widgetConfig.storagePrefix}session_${widgetId}`;
            const session = localStorage.getItem(key);
            const timestamp = localStorage.getItem(`${key}_timestamp`);

            // Check if session has expired
            if (session && timestamp) {
                const age = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60 * 24);
                if (age > widgetConfig.sessionExpiryDays) {
                    // Session expired, remove it
                    localStorage.removeItem(key);
                    localStorage.removeItem(`${key}_timestamp`);
                    return null;
                }
            }

            return session;
        } catch (error) {
            console.error('Error retrieving session:', error);
            return null;
        }
    }

    /**
     * Announce a message for screen readers
     * @param {string} message - The message to announce
     */
    function announceForAccessibility(message) {
        const announce = document.createElement('div');
        announce.setAttribute('aria-live', 'polite');
        announce.classList.add('sr-only'); // Screen reader only
        announce.textContent = message;
        document.body.appendChild(announce);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announce);
        }, 1000);
    }

})(window, document); 