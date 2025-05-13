<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSecurityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'enableMFA' => ['required', 'boolean'],
            'loginNotifications' => ['required', 'boolean'],
            'sessionTimeout' => [
                'required',
                'string',
                Rule::in(['15min', '30min', '1hour', '4hours', '8hours', '1day', '1week']),
            ],
        ];
    }
}
