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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'context_rule_id' => ['nullable', 'uuid', 'exists:context_rules,id'],
            'knowledge_base_ids' => ['nullable', 'array'],
            'knowledge_base_ids.*' => ['uuid', 'exists:knowledge_bases,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'visual_settings' => ['sometimes', 'array'],
            'visual_settings.position' => ['sometimes', 'string', 'in:bottom-right,bottom-left,top-right,top-left'],
            'visual_settings.theme' => ['sometimes', 'string', 'in:light,dark,auto'],
            'visual_settings.colors' => ['sometimes', 'array'],
            'visual_settings.colors.primary' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.secondary' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.background' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.text' => ['sometimes', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.style' => ['sometimes', 'string', 'in:rounded,square,soft'],
            'visual_settings.width' => ['sometimes', 'string'],
            'visual_settings.height' => ['sometimes', 'string'],
            'visual_settings.showHeader' => ['sometimes', 'boolean'],
            'visual_settings.showFooter' => ['sometimes', 'boolean'],
            'behavioral_settings' => ['sometimes', 'array'],
            'behavioral_settings.autoOpen' => ['sometimes', 'boolean'],
            'behavioral_settings.openDelay' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'behavioral_settings.notification' => ['sometimes', 'boolean'],
            'behavioral_settings.mobileBehavior' => ['sometimes', 'string', 'in:standard,compact,full'],
            'behavioral_settings.sounds' => ['sometimes', 'boolean'],
            'content_settings' => ['sometimes', 'array'],
            'content_settings.welcomeMessage' => ['sometimes', 'string', 'max:500'],
            'content_settings.placeholderText' => ['sometimes', 'string', 'max:100'],
            'content_settings.botName' => ['sometimes', 'string', 'max:50'],
            'content_settings.avatarUrl' => ['nullable', 'string', 'url'],
            'allowed_domains' => ['nullable', 'array'],
            'allowed_domains.*' => ['string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
} 