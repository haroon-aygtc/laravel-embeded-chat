<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
            'fullName' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()),
            ],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'avatarUrl' => ['sometimes', 'nullable', 'string', 'url'],
            'notifyOnMessage' => ['sometimes', 'boolean'],
            'notifyOnMention' => ['sometimes', 'boolean'],
            'emailDigest' => ['sometimes', 'boolean'],
        ];
    }
}
