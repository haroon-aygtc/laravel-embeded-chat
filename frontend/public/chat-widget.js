/**
 * AI Chat Widget - Lightweight, cross-platform chat widget
 * 
 * This script creates a minimalistic loader (< 5KB) that dynamically loads 
 * the full widget functionality when needed. It uses Shadow DOM for style
 * isolation and supports both iframe and web component embedding methods.
 */

(function () {
  // Configuration
  const API_BASE_URL = window.WIDGET_API_URL || 'http://localhost:9000/api';
  const FRONTEND_URL = window.WIDGET_FRONTEND_URL || 'http://localhost:3000';
  const STORAGE_PREFIX = 'ai_chat_widget_';

  // Create the Web Component for the chat widget
  class AIChatWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.isLoaded = false;
      this.widgetId = this.getAttribute('widget-id');
      this.sessionId = localStorage.getItem(`${STORAGE_PREFIX}session_${this.widgetId}`);
      this.config = null;
    }

    async connectedCallback() {
      if (!this.widgetId) {
        console.error('AI Chat Widget: No widget-id attribute provided');
        return;
      }

      // Initial minimal UI with loading state
      this.renderInitialUI();

      try {
        // Fetch widget configuration
        await this.loadWidgetConfig();

        // Initialize session if needed
        if (!this.sessionId) {
          await this.createChatSession();
        }

        // Render widget button
        this.renderWidgetButton();

        // Add event listeners
        this.addEventListeners();
      } catch (error) {
        console.error('AI Chat Widget: Failed to initialize widget', error);
        this.renderErrorState();
      }
    }

    renderInitialUI() {
      // Add base styles to shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        :host {
          --primary-color: #4F46E5;
          --secondary-color: #10B981;
          --background-color: #FFFFFF;
          --text-color: #1F2937;
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          --border-radius: 12px;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          
          all: initial;
          display: block;
          font-family: var(--font-family);
          color: var(--text-color);
          z-index: 99999;
        }
        
        .widget-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 99999;
          font-family: var(--font-family);
        }
        
        .widget-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow);
          transition: transform 0.2s ease;
          border: none;
        }
        
        .widget-button:hover {
          transform: scale(1.05);
        }
        
        .widget-button svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        
        .widget-frame {
          position: fixed;
          bottom: 100px;
          right: 20px;
          width: 380px;
          height: 600px;
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
          border: none;
        }
        
        .widget-frame.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }
        
        .widget-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          z-index: 100000;
          display: none;
        }
        
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid white;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-state {
          padding: 20px;
          text-align: center;
          color: #EF4444;
        }
      `;

      // Create container
      const container = document.createElement('div');
      container.className = 'widget-container';

      // Create button with loading state
      const button = document.createElement('button');
      button.className = 'widget-button';
      button.innerHTML = '<div class="loader"></div>';
      button.setAttribute('aria-label', 'Open chat widget');
      container.appendChild(button);

      // Create iframe container (hidden initially)
      const frame = document.createElement('iframe');
      frame.className = 'widget-frame';
      frame.setAttribute('title', 'AI Chat Widget');
      frame.setAttribute('frameborder', '0');
      container.appendChild(frame);

      // Append to shadow DOM
      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(container);

      // Save references
      this.container = container;
      this.button = button;
      this.frame = frame;
    }

    async loadWidgetConfig() {
      try {
        const response = await fetch(`${API_BASE_URL}/public/widgets/${this.widgetId}/config`);

        if (!response.ok) {
          throw new Error(`Failed to load widget configuration: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to load widget configuration');
        }

        this.config = data.data;
        this.applyWidgetStyles();

        return this.config;
      } catch (error) {
        console.error('Error loading widget config:', error);
        throw error;
      }
    }

    async createChatSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/public/widgets/${this.widgetId}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to create chat session: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Failed to create chat session');
        }

        this.sessionId = data.data.session_id;
        localStorage.setItem(`${STORAGE_PREFIX}session_${this.widgetId}`, this.sessionId);

        return this.sessionId;
      } catch (error) {
        console.error('Error creating chat session:', error);
        throw error;
      }
    }

    applyWidgetStyles() {
      if (!this.config || !this.config.visual_settings) return;

      const visual = this.config.visual_settings;
      const style = document.createElement('style');

      // Apply colors
      style.textContent = `
      :host {
          --primary-color: ${visual.colors.primary};
          --secondary-color: ${visual.colors.secondary};
          --background-color: ${visual.colors.background};
          --text-color: ${visual.colors.text};
          --border-radius: ${visual.style === 'rounded' ? '12px' : visual.style === 'square' ? '4px' : '8px'};
        }
        
        .widget-frame {
          width: ${visual.width};
          height: ${visual.height};
          ${this.getPositionStyles(visual.position)}
        }
        
        .widget-container {
          ${this.getPositionStyles(visual.position, true)}
        }
      `;

      this.shadowRoot.appendChild(style);
    }

    getPositionStyles(position, forButton = false) {
      const offset = forButton ? '20px' : '100px';

      switch (position) {
        case 'bottom-left':
          return `bottom: 20px; left: 20px; right: auto;`;
        case 'top-right':
          return `top: 20px; right: 20px; bottom: auto;`;
        case 'top-left':
          return `top: 20px; left: 20px; right: auto; bottom: auto;`;
        case 'bottom-right':
        default:
          return `bottom: 20px; right: 20px;`;
      }
    }

    renderWidgetButton() {
      if (!this.config) return;

      // Update button with proper icon
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 12.25H13V16.75H11V12.25H8V10.75H11V7.25H13V10.75H16V12.25Z" fill="white"/>
        </svg>
      `;
    }

    renderErrorState() {
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
        </svg>
      `;

      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-state';
      errorDiv.textContent = 'Unable to load chat widget. Please try again later.';
      this.container.appendChild(errorDiv);
    }

    loadChatInterface() {
      // Set the iframe source with the widget and session IDs
      const url = `${FRONTEND_URL}/chat-embed?widgetId=${this.widgetId}&sessionId=${this.sessionId}`;
      this.frame.setAttribute('src', url);
      this.isLoaded = true;
    }

    toggleWidget() {
      this.isOpen = !this.isOpen;

      if (this.isOpen) {
        this.frame.classList.add('open');
        this.button.innerHTML = `
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white"/>
          </svg>
        `;

        // Load the chat interface if not already loaded
        if (!this.isLoaded) {
          this.loadChatInterface();
        }
      } else {
        this.frame.classList.remove('open');
        this.renderWidgetButton();
      }
    }

    addEventListeners() {
      this.button.addEventListener('click', () => {
        this.toggleWidget();
      });

      // Handle messages from iframe
      window.addEventListener('message', (event) => {
        // Verify origin for security
        if (event.origin !== FRONTEND_URL) return;

        const { action, payload } = event.data;

        switch (action) {
          case 'close-widget':
            this.toggleWidget();
            break;
          case 'widget-loaded':
            // Iframe is fully loaded
            break;
          // Add more message handlers as needed
        }
      });
    }
  }

  // Register the web component
  customElements.define('ai-chat-widget', AIChatWidget);
})();
