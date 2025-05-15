<?php

declare(strict_types=1);

namespace App\Http\Requests\Widget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateWidgetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'title' => 'sometimes|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'domain' => 'nullable|string|max:255',
            'context_rule_id' => 'nullable|string|exists:context_rules,id',
            'knowledge_base_ids' => 'nullable|array',
            'knowledge_base_ids.*' => 'string|exists:knowledge_bases,id',
            'visual_settings' => 'sometimes|array',
            'visual_settings.primaryColor' => 'string|max:50',
            'visual_settings.secondaryColor' => 'nullable|string|max:50',
            'visual_settings.backgroundColor' => 'nullable|string|max:50',
            'visual_settings.textColor' => 'nullable|string|max:50',
            'visual_settings.fontFamily' => 'nullable|string|max:100',
            'behavioral_settings' => 'sometimes|array',
            'behavioral_settings.initialState' => 'string|in:open,closed,minimized',
            'behavioral_settings.autoOpen' => 'nullable|boolean',
            'behavioral_settings.openDelay' => 'nullable|integer|min:0',
            'content_settings' => 'sometimes|array',
            'content_settings.initialMessage' => 'nullable|string|max:1000',
            'content_settings.placeholderText' => 'nullable|string|max:255',
            'content_settings.allowAttachments' => 'nullable|boolean',
            'content_settings.allowVoice' => 'nullable|boolean',
            'content_settings.allowEmoji' => 'nullable|boolean',
            'allowed_domains' => 'nullable|array',
            'allowed_domains.*' => 'string|max:255',
            'is_active' => 'nullable|boolean',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'knowledge_base_ids.*' => 'knowledge base',
            'visual_settings.primaryColor' => 'primary color',
            'visual_settings.secondaryColor' => 'secondary color',
            'visual_settings.backgroundColor' => 'background color',
            'visual_settings.textColor' => 'text color',
            'behavioral_settings.initialState' => 'initial state',
            'behavioral_settings.autoOpen' => 'auto open',
            'behavioral_settings.openDelay' => 'open delay',
            'content_settings.initialMessage' => 'initial message',
            'content_settings.placeholderText' => 'placeholder text',
            'content_settings.allowAttachments' => 'allow attachments',
            'content_settings.allowVoice' => 'allow voice',
            'content_settings.allowEmoji' => 'allow emoji',
            'allowed_domains.*' => 'allowed domain',
        ];
    }
}
