<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Ensure the authenticated API token belongs to an Admin model.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow only Admin model tokens
        if (! $user || ! ($user instanceof \App\Models\Admin)) {
            return response()->json(['message' => 'Admin authentication required'], 403);
        }

        return $next($request);
    }
}