<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create {email} {password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $password = $this->argument('password');

        // Check if admin already exists
        if (Admin::where('email', $email)->exists()) {
            $this->error('Admin with this email already exists!');
            return 1;
        }

        // Create admin
        $admin = Admin::create([
            'name' => 'Admin',
            'email' => $email,
            'password' => Hash::make($password),
            'email_verified_at' => now(), // Mark email as verified
        ]);

        $this->info("Admin created successfully!");
        $this->info("Email: {$admin->email}");
        $this->info("ID: {$admin->id}");

        return 0;
    }
}
