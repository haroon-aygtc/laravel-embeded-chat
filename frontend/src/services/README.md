# API Services Architecture

This document explains the organization of the API services in the frontend.

## Architectural Patterns

The API services in this application follow a three-layer pattern:

1. **API Endpoints** - Define the URL structure for API endpoints
2. **API Features** - Implement type-safe API calls with structured interfaces
3. **Service Wrappers** - Provide simplified interfaces for components

## Directory Structure

```
services/
├── api/
│   ├── middleware/
│   │   └── apiMiddleware.ts     # Base API client with auth and error handling
│   ├── endpoints/
│   │   ├── aiEndpoints.ts       # AI API endpoint definitions
│   │   ├── notificationEndpoints.ts # Notification endpoint definitions
│   │   └── databaseEndpoints.ts # Database API endpoint definitions
│   └── features/
│       ├── aifeatures.ts        # AI API implementation
│       ├── notificationfeatures.ts # Notification API implementation
│       └── databasefeatures.ts  # Database API implementation
├── aiService.ts                 # AI service wrapper
├── notificationService.ts       # Notification service wrapper
└── databaseService.ts           # Database service wrapper
```

## Layer Responsibilities

### 1. Endpoints Layer (`api/endpoints/`)

- Defines all API endpoint paths as constants
- Uses functions for parametrized endpoints
- Contains no business logic or API calls
- Example: `aiEndpoints.ts`, `notificationEndpoints.ts`, `databaseEndpoints.ts`

### 2. Features Layer (`api/features/`)

- Implements API calls using the endpoints
- Defines TypeScript interfaces for request/response data
- Handles request formatting
- Returns ApiResponse<T> objects
- Example: `aifeatures.ts`, `notificationfeatures.ts`, `databasefeatures.ts`

### 3. Service Layer (Root `services/`)

- Provides a simplified interface for components
- Handles common error cases and response processing
- Implements retry logic and fallback mechanisms
- Returns direct values (not ApiResponse objects)
- Example: `aiService.ts`, `notificationService.ts`, `databaseService.ts`

## Usage Example

### Component Usage

```typescript
import notificationService from "@/services/notificationService";

// In a React component
const MyComponent = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const loadNotifications = async () => {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    };
    
    loadNotifications();
  }, []);
  
  // Rest of component...
};
```

### WebSocket Example

The notification service also provides WebSocket functionality:

```typescript
// Subscribe to notifications
const unsubscribe = notificationService.subscribeToNotifications(
  userId,
  (notification) => {
    // Handle new notification
    console.log('New notification:', notification);
  }
);

// Later, clean up the subscription
unsubscribe();
```

## Database Access

Instead of connecting directly to the database from the frontend (which is a security risk and architectural anti-pattern), all database access should go through the Laravel API. The `databaseService` provides methods for:

1. **Fetching configuration data** - Getting context rules, AI model configs, etc.
2. **Exporting data** - Generating exports of logs, interactions, etc.
3. **Administrative operations** - Performing admin-only database operations

This approach ensures:
- Proper authentication and authorization for all database operations
- Consistent error handling and logging
- No database credentials in the frontend
- Type safety for all database operations

### Example Usage

```typescript
import databaseService from "@/services/databaseService";

// Get context rules
const contextRules = await databaseService.getContextRules();

// Export logs with filters
const exportResult = await databaseService.exportLogs({
  startDate: "2023-01-01",
  endDate: "2023-01-31",
  modelUsed: "gpt-4"
});

// Download the export
if (exportResult) {
  databaseService.downloadFile(exportResult.url, exportResult.filename);
}
```

## Benefits of This Architecture

1. **Separation of Concerns**
   - Each layer has a clear responsibility
   - Changes to endpoints don't require changes to business logic

2. **Type Safety**
   - All requests and responses are fully typed
   - TypeScript interfaces ensure proper data structure

3. **Testability**
   - Each layer can be tested independently
   - Service layer can be mocked for component testing

4. **Consistency**
   - Uniform error handling across all API calls
   - Consistent response patterns

5. **Maintainability**
   - Centralized endpoint definitions
   - Easy to find and update API implementations 