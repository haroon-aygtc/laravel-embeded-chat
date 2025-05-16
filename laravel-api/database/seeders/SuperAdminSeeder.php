<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get super admin role
        $superAdminRole = Role::where('slug', 'super_admin')->first();

        if (!$superAdminRole) {
            $this->command->error('Super Admin role not found. Please run RoleSeeder first.');
            return;
        }

        // Create super admin user
        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'), // Change this in production!
                'role_id' => $superAdminRole->id,
                'role' => 'admin', // For backward compatibility
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Super Admin user created successfully.');
    }
}
