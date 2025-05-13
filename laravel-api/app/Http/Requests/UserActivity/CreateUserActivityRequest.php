<?php

declare(strict_types=1);

namespace App\Http\Requests\UserActivity;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // For now, any authenticated user can create an activity
    }

    public function rules(): array
    {
        return [
            'userId' => ['required', 'exists:users,id'],
            'action' => ['required', 'string', 'max:255'],
        ];
    }

    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated();

        // Convert camelCase to snake_case for database consistency
        return [
            'user_id' => $validated['userId'],
            'action' => $validated['action'],
            'timestamp' => now(),
        ];
    }
}
