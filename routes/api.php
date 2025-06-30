<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\WhatsAppController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Legacy login routes (keep for compatibility)
Route::post('/login', [LoginController::class, 'login']);
Route::post('/v2/login', [LoginController::class, 'login']);

// FastWAPI v2 compatible routes
Route::prefix('v2')->group(function () {
    // Client authentication routes
    Route::prefix('client/auth')->group(function () {
        Route::post('/gettoken', [LoginController::class, 'login']);
        Route::post('/register', [LoginController::class, 'register']);
    });
    
    // Common routes (with api_token parameter)
    Route::middleware('auth:api_token')->prefix('common')->group(function () {
        Route::get('/notifications', [LoginController::class, 'getNotifications']);
        Route::post('/order/update-status', [LoginController::class, 'updateOrderStatus']);
        Route::post('/user/deactivate', [LoginController::class, 'deactivateUser']);
    });
    
    // WhatsApp routes (with api_token parameter)
    Route::middleware('auth:api_token')->prefix('whatsapp')->group(function () {
        Route::get('/messages', [WhatsAppController::class, 'getMessages']);
        Route::post('/send', [WhatsAppController::class, 'sendMessage']);
        Route::get('/templates', [WhatsAppController::class, 'getTemplates']);
    });
    
    // Driver routes (with api_token parameter)
    Route::middleware('auth:api_token')->prefix('driver')->group(function () {
        Route::get('/status', [LoginController::class, 'getDriverStatus']);
        Route::post('/status/set-active', [LoginController::class, 'setActiveStatus']);
        Route::get('/orders', [LoginController::class, 'getDriverOrders']);
        Route::get('/orders-with-location', [LoginController::class, 'getDriverOrdersWithLatLng']);
        Route::get('/earnings', [LoginController::class, 'getDriverEarnings']);
        Route::post('/location/update', [LoginController::class, 'updateDriverLocation']);
    });
});

// WhatsApp Webhook Routes (keep existing)
Route::get('/webhook/whatsapp', [WhatsAppController::class, 'verify']);
Route::post('/webhook/whatsapp', [WhatsAppController::class, 'webhook']);
