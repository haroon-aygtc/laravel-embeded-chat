<?php

use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

Route::get('/', function () {
    return view('welcome');
});

// Sanctum routes
Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
