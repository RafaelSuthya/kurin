<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register alias middleware 'admin' so routes can use it
        app('router')->aliasMiddleware('admin', \App\Http\Middleware\AdminMiddleware::class);

        // Customize VerifyEmail notification URL for Admin model to use API route
        VerifyEmail::createUrlUsing(function ($notifiable) {
            if ($notifiable instanceof \App\Models\Admin) {
                return URL::temporarySignedRoute(
                    'admin.verification.verify',
                    now()->addMinutes(60),
                    [
                        'id' => $notifiable->getKey(),
                        'hash' => sha1($notifiable->getEmailForVerification()),
                    ]
                );
            }

            // Fallback to default web route for regular users
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        });
    }
}
