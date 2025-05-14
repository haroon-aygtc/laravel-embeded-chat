<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:8000',
            'http://localhost:8000',
            env('APP_URL'),
            $request->header('Origin')
        ];

        $origin = in_array($request->header('Origin'), $allowedOrigins, true) 
            ? $request->header('Origin') 
            : $allowedOrigins[0];

        $headers = [
            'Access-Control-Allow-Origin'      => $origin,
            'Access-Control-Allow-Methods'     => 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN, X-Request-ID, Accept, X-CSRF-TOKEN, X-Socket-ID',
        ];

        if ($request->isMethod('OPTIONS')) {
            return response()->json(['method' => 'OPTIONS'], 200, $headers);
        }


        $response = $next($request);
        
        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}
