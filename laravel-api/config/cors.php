
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    /*
     * Paths that should be allowed to access cross-origin resources
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register', '/'],

    /*
     * Allowed request methods
     */
    'allowed_methods' => ['*'],

    /*
     * Allowed origins - include all your frontend URLs
     */
    'allowed_origins' => [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:5173',
        'http://localhost:3000',
        env('FRONTEND_URL', 'http://localhost:8080'),
    ],

    'allowed_origins_patterns' => [],

    /*
     * Allowed headers in requests
     */
    'allowed_headers' => ['*'],

    /*
     * Headers that will be exposed to JavaScript
     */
    'exposed_headers' => ['*'],

    /*
     * Maximum age of the CORS preflight response (in seconds)
     */
    'max_age' => 0,

    /*
     * Indicates whether the CORS request can include credentials like cookies
     * This MUST be true for Sanctum to work with SPA authentication
     */
    'supports_credentials' => true,
];
