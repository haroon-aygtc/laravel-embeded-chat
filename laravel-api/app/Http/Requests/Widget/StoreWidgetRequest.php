<?php

declare(strict_types=1);

namespace App\Http\Requests\Widget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreWidgetRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'context_rule_id' => ['nullable', 'uuid', 'exists:context_rules,id'],
            'knowledge_base_ids' => ['nullable', 'array'],
            'knowledge_base_ids.*' => ['uuid', 'exists:knowledge_bases,id'],
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'visual_settings' => ['required', 'array'],
            'visual_settings.position' => ['required', 'string', 'in:bottom-right,bottom-left,top-right,top-left'],
            'visual_settings.theme' => ['required', 'string', 'in:light,dark,auto'],
            'visual_settings.colors' => ['required', 'array'],
            'visual_settings.colors.primary' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.secondary' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.background' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.colors.text' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'visual_settings.style' => ['required', 'string', 'in:rounded,square,soft'],
            'visual_settings.width' => ['required', 'string'],
            'visual_settings.height' => ['required', 'string'],
            'visual_settings.showHeader' => ['required', 'boolean'],
            'visual_settings.showFooter' => ['required', 'boolean'],
            'behavioral_settings' => ['required', 'array'],
            'behavioral_settings.autoOpen' => ['required', 'boolean'],
            'behavioral_settings.openDelay' => ['required', 'integer', 'min:0', 'max:60'],
            'behavioral_settings.notification' => ['required', 'boolean'],
            'behavioral_settings.mobileBehavior' => ['required', 'string', 'in:standard,compact,full'],
            'behavioral_settings.sounds' => ['required', 'boolean'],
            'content_settings' => ['required', 'array'],
            'content_settings.welcomeMessage' => ['required', 'string', 'max:500'],
            'content_settings.placeholderText' => ['required', 'string', 'max:100'],
            'content_settings.botName' => ['required', 'string', 'max:50'],
            'content_settings.avatarUrl' => ['nullable', 'string', 'url'],
            'allowed_domains' => ['nullable', 'array'],
            'allowed_domains.*' => ['string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
} 