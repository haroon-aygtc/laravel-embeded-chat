<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ApiResponseMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $response = $next($request);

        // Only modify JSON responses
        if ($response instanceof JsonResponse) {
            $data = $response->getData(true);

            // If response is already standardized, return as is
            if (isset($data['success'])) {
                return $response;
            }

            // Get the status code
            $statusCode = $response->getStatusCode();
            $success = $statusCode >= 200 && $statusCode < 300;

            // Standard response format
            $standardizedData = [
                'success' => $success,
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'requestId' => $request->header('X-Request-ID', uniqid('req-')),
                ],
            ];

            if ($success) {
                $standardizedData['data'] = $data;
            } else {
                $standardizedData['error'] = [
                    'code' => "ERR_{$statusCode}",
                    'message' => $data['message'] ?? 'An error occurred',
                    'details' => $data,
                ];
            }

            $response->setData($standardizedData);
        }

        return $response;
    }
} 