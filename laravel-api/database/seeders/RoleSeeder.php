<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super_admin',
                'description' => 'Super administrator with unrestricted access to all features',
                'is_default' => false,
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Administrator with access to all features',
                'is_default' => false,
            ],
            [
                'name' => 'Editor',
                'slug' => 'editor',
                'description' => 'Can create and edit content, but cannot manage users',
                'is_default' => false,
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to analytics and content',
                'is_default' => false,
            ],
            [
                'name' => 'User',
                'slug' => 'user',
                'description' => 'Standard user with limited permissions',
                'is_default' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }
}
