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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'context_rule_id' => 'nullable|uuid|exists:context_rules,id',
            'knowledge_base_ids' => 'nullable|array',
            'knowledge_base_ids.*' => 'uuid|exists:knowledge_bases,id',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'visual_settings' => 'nullable|array',
            'visual_settings.position' => 'nullable|string|in:bottom-right,bottom-left,top-right,top-left',
            'visual_settings.theme' => 'nullable|string|in:light,dark,auto',
            'visual_settings.colors' => 'nullable|array',
            'visual_settings.colors.primary' => 'nullable|string',
            'visual_settings.colors.secondary' => 'nullable|string',
            'visual_settings.colors.background' => 'nullable|string',
            'visual_settings.colors.text' => 'nullable|string',
            'visual_settings.style' => 'nullable|string|in:rounded,square,minimal',
            'visual_settings.width' => 'nullable|string',
            'visual_settings.height' => 'nullable|string',
            'visual_settings.showHeader' => 'nullable|boolean',
            'visual_settings.showFooter' => 'nullable|boolean',
            'behavioral_settings' => 'nullable|array',
            'behavioral_settings.autoOpen' => 'nullable|boolean',
            'behavioral_settings.openDelay' => 'nullable|integer|min:0',
            'behavioral_settings.notification' => 'nullable|boolean',
            'behavioral_settings.mobileBehavior' => 'nullable|string|in:standard,full-screen,minimized',
            'behavioral_settings.sounds' => 'nullable|boolean',
            'content_settings' => 'nullable|array',
            'content_settings.welcomeMessage' => 'nullable|string|max:1000',
            'content_settings.placeholderText' => 'nullable|string|max:255',
            'content_settings.botName' => 'nullable|string|max:255',
            'content_settings.avatarUrl' => 'nullable|string|max:2000',
            'allowed_domains' => 'nullable|array',
            'allowed_domains.*' => 'nullable|string|max:255',
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
            'visual_settings.colors.primary' => 'primary color',
            'visual_settings.colors.secondary' => 'secondary color',
            'visual_settings.colors.background' => 'background color',
            'visual_settings.colors.text' => 'text color',
            'visual_settings.showHeader' => 'show header',
            'visual_settings.showFooter' => 'show footer',
            'behavioral_settings.autoOpen' => 'auto open',
            'behavioral_settings.openDelay' => 'open delay',
            'behavioral_settings.mobileBehavior' => 'mobile behavior',
            'content_settings.welcomeMessage' => 'welcome message',
            'content_settings.placeholderText' => 'placeholder text',
            'content_settings.botName' => 'bot name',
            'content_settings.avatarUrl' => 'avatar URL',
            'allowed_domains.*' => 'allowed domain',
        ];
    }
}
