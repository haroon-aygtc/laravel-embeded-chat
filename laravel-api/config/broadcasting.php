<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcast Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. You may set this to
    | any of the connections defined in the "connections" array below.
    |
    */

    'default' => env('BROADCAST_DRIVER', 'reverb'),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the broadcast connections that will be used
    | to broadcast events to other systems or over websockets. Samples of
    | each available type of connection are provided inside this array.
    |
    */

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'app_id' => env('REVERB_APP_ID', 'laravel-chat-app'),
            'key' => env('REVERB_APP_KEY', 'laravel-chat-key'),
            'secret' => env('REVERB_APP_SECRET', 'laravel-chat-secret'),
            'client_options' => [
                'host' => env('REVERB_HOST', '127.0.0.1'),
                'port' => env('REVERB_PORT', 9001),
                'scheme' => env('REVERB_SCHEME', 'http'),
            ],
            'ping_interval' => env('REVERB_PING_INTERVAL', 60),
            'debug' => env('REVERB_DEBUG', false),
        ],

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'host' => env('PUSHER_HOST', '127.0.0.1'),
                'port' => env('PUSHER_PORT', 9001),
                'scheme' => env('PUSHER_SCHEME', 'http'),
                'useTLS' => env('PUSHER_USE_TLS', false),
            ],
            'client_options' => [
                // Guzzle client options: https://docs.guzzlephp.org/en/stable/request-options.html
            ],
        ],

        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
