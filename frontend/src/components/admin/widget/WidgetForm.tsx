import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { widgetService } from '@/services/widgetService'
import { CreateWidgetRequest, UpdateWidgetRequest, Widget } from '@/types/widget'
import { Brush, Settings, MessageSquare, Database } from 'lucide-react'

interface WidgetFormProps {
    widgetId?: string
    onSuccess?: (widget: Widget) => void
    onCancel?: () => void
}

const WidgetForm = ({ widgetId, onSuccess, onCancel }: WidgetFormProps) => {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('appearance')
    const [contextRules, setContextRules] = useState<{ id: string, name: string }[]>([])
    const [knowledgeBases, setKnowledgeBases] = useState<{ id: string, name: string }[]>([])

    const form = useForm<CreateWidgetRequest | UpdateWidgetRequest>({
        defaultValues: {
            name: '',
            description: '',
            title: '',
            subtitle: '',
            visual_settings: {
                position: 'bottom-right',
                theme: 'light',
                colors: {
                    primary: '#4F46E5',
                    secondary: '#10B981',
                    background: '#FFFFFF',
                    text: '#1F2937'
                },
                style: 'rounded',
                width: '380px',
                height: '600px',
                showHeader: true,
                showFooter: true
            },
            behavioral_settings: {
                initialState: 'closed',
                autoOpen: false,
                openDelay: 3,
                notification: true,
                mobileBehavior: 'standard',
                sounds: false
            },
            content_settings: {
                welcomeMessage: 'Hello! How can I assist you today?',
                placeholderText: 'Type your message...',
                botName: 'AI Assistant',
                avatarUrl: null,
                allowAttachments: true,
                allowVoice: false,
                allowEmoji: true
            },
            allowed_domains: [],
            is_active: true
        }
    })

    const { watch, setValue, handleSubmit, formState: { errors } } = form

    // Load context rules and knowledge bases
    useEffect(() => {
        const loadFormResources = async () => {
            try {
                // Load context rules and knowledge bases from API
                // These would need to be implemented in their respective services
                // For now, using placeholder data
                setContextRules([
                    { id: 'cr1', name: 'General Context' },
                    { id: 'cr2', name: 'Technical Support' },
                    { id: 'cr3', name: 'Sales Inquiries' }
                ])

                setKnowledgeBases([
                    { id: 'kb1', name: 'Product Documentation' },
                    { id: 'kb2', name: 'FAQ Database' },
                    { id: 'kb3', name: 'Support Articles' }
                ])
            } catch (error) {
                console.error('Error loading form resources:', error)
            }
        }

        loadFormResources()
    }, [])

    // Load widget data if editing
    useEffect(() => {
        const loadWidget = async () => {
            if (!widgetId) return

            setIsLoading(true)
            try {
                const response = await widgetService.getWidgetById(widgetId)
                const widget = response.data

                // Populate form with widget data
                Object.keys(widget).forEach(key => {
                    // @ts-ignore - dynamic key access
                    setValue(key, widget[key])
                })

            } catch (error) {
                console.error('Error loading widget:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load widget data.',
                    variant: 'destructive'
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadWidget()
    }, [widgetId, setValue, toast])

    const onSubmit = async (data: CreateWidgetRequest | UpdateWidgetRequest) => {
        setIsLoading(true)

        try {
            let response

            if (widgetId) {
                // Update existing widget
                response = await widgetService.updateWidget(widgetId, data)
            } else {
                // Create new widget
                response = await widgetService.createWidget(data as CreateWidgetRequest)
            }

            toast({
                title: 'Success',
                description: widgetId ? 'Widget updated successfully' : 'Widget created successfully'
            })

            // Call success callback
            if (onSuccess) {
                onSuccess(response.data)
            }

        } catch (error) {
            console.error('Error saving widget:', error)
            toast({
                title: 'Error',
                description: 'Failed to save widget.',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{widgetId ? 'Edit Widget' : 'Create New Widget'}</CardTitle>
                <CardDescription>
                    Configure your chat widget's appearance, behavior, and content.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Widget Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter widget name"
                                    value={watch('name')}
                                    onChange={e => setValue('name', e.target.value)}
                                    required
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Internal name for identifying this widget
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="title">Widget Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter widget title"
                                    value={watch('title')}
                                    onChange={e => setValue('title', e.target.value)}
                                    required
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Title displayed to users in the widget header
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter widget description"
                                value={watch('description') || ''}
                                onChange={e => setValue('description', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={watch('is_active')}
                                onCheckedChange={value => setValue('is_active', value)}
                            />
                            <Label htmlFor="is_active">Widget Active</Label>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="appearance">
                                <Brush className="mr-2 h-4 w-4" />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger value="behavior">
                                <Settings className="mr-2 h-4 w-4" />
                                Behavior
                            </TabsTrigger>
                            <TabsTrigger value="content">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Content
                            </TabsTrigger>
                            <TabsTrigger value="connections">
                                <Database className="mr-2 h-4 w-4" />
                                Connections
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="appearance" className="space-y-4">
                            {/* Appearance settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="position">Position</Label>
                                    <Select
                                        value={watch('visual_settings.position')}
                                        onValueChange={value => setValue('visual_settings.position', value as any)}
                                    >
                                        <SelectTrigger id="position">
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                            <SelectItem value="top-right">Top Right</SelectItem>
                                            <SelectItem value="top-left">Top Left</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="theme">Theme</Label>
                                    <Select
                                        value={watch('visual_settings.theme')}
                                        onValueChange={value => setValue('visual_settings.theme', value as any)}
                                    >
                                        <SelectTrigger id="theme">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="auto">Auto (System)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="style">Style</Label>
                                    <Select
                                        value={watch('visual_settings.style')}
                                        onValueChange={value => setValue('visual_settings.style', value as any)}
                                    >
                                        <SelectTrigger id="style">
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rounded">Rounded</SelectItem>
                                            <SelectItem value="square">Square</SelectItem>
                                            <SelectItem value="soft">Soft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="primaryColor">Primary Color</Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            id="primaryColor"
                                            type="color"
                                            value={watch('visual_settings.colors.primary')}
                                            onChange={e => setValue('visual_settings.colors.primary', e.target.value)}
                                            className="w-12 p-1 h-10"
                                        />
                                        <Input
                                            value={watch('visual_settings.colors.primary')}
                                            onChange={e => setValue('visual_settings.colors.primary', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="behavior" className="space-y-4">
                            {/* Behavior settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="initialState">Initial State</Label>
                                    <Select
                                        value={watch('behavioral_settings.initialState')}
                                        onValueChange={value => setValue('behavioral_settings.initialState', value as any)}
                                    >
                                        <SelectTrigger id="initialState">
                                            <SelectValue placeholder="Select initial state" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                            <SelectItem value="minimized">Minimized</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="mobileBehavior">Mobile Behavior</Label>
                                    <Select
                                        value={watch('behavioral_settings.mobileBehavior')}
                                        onValueChange={value => setValue('behavioral_settings.mobileBehavior', value as any)}
                                    >
                                        <SelectTrigger id="mobileBehavior">
                                            <SelectValue placeholder="Select mobile behavior" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="compact">Compact</SelectItem>
                                            <SelectItem value="full">Full Screen</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="autoOpen"
                                        checked={watch('behavioral_settings.autoOpen')}
                                        onCheckedChange={value => setValue('behavioral_settings.autoOpen', value)}
                                    />
                                    <Label htmlFor="autoOpen">Auto Open</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="notifications"
                                        checked={watch('behavioral_settings.notification')}
                                        onCheckedChange={value => setValue('behavioral_settings.notification', value)}
                                    />
                                    <Label htmlFor="notifications">Show Notifications</Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4">
                            {/* Content settings */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                                    <Textarea
                                        id="welcomeMessage"
                                        placeholder="Enter welcome message"
                                        value={watch('content_settings.welcomeMessage')}
                                        onChange={e => setValue('content_settings.welcomeMessage', e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="botName">Bot Name</Label>
                                    <Input
                                        id="botName"
                                        placeholder="Enter bot name"
                                        value={watch('content_settings.botName')}
                                        onChange={e => setValue('content_settings.botName', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="placeholderText">Input Placeholder</Label>
                                    <Input
                                        id="placeholderText"
                                        placeholder="Enter input placeholder"
                                        value={watch('content_settings.placeholderText')}
                                        onChange={e => setValue('content_settings.placeholderText', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allowAttachments"
                                            checked={watch('content_settings.allowAttachments')}
                                            onCheckedChange={value => setValue('content_settings.allowAttachments', value)}
                                        />
                                        <Label htmlFor="allowAttachments">Allow Attachments</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allowVoice"
                                            checked={watch('content_settings.allowVoice')}
                                            onCheckedChange={value => setValue('content_settings.allowVoice', value)}
                                        />
                                        <Label htmlFor="allowVoice">Allow Voice</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="allowEmoji"
                                            checked={watch('content_settings.allowEmoji')}
                                            onCheckedChange={value => setValue('content_settings.allowEmoji', value)}
                                        />
                                        <Label htmlFor="allowEmoji">Allow Emoji</Label>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="connections" className="space-y-4">
                            {/* Connections settings */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="contextRule">Context Rule</Label>
                                    <Select
                                        value={watch('context_rule_id') || ''}
                                        onValueChange={value => setValue('context_rule_id', value)}
                                    >
                                        <SelectTrigger id="contextRule">
                                            <SelectValue placeholder="Select context rule" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {contextRules.map(rule => (
                                                <SelectItem key={rule.id} value={rule.id}>
                                                    {rule.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Note: This is a simplification - you would need a proper multi-select component */}
                                <div>
                                    <Label htmlFor="knowledgeBase">Knowledge Base</Label>
                                    <Select>
                                        <SelectTrigger id="knowledgeBase">
                                            <SelectValue placeholder="Select knowledge base" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {knowledgeBases.map(kb => (
                                                <SelectItem key={kb.id} value={kb.id}>
                                                    {kb.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Note: Multi-select would be implemented in a production version
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (widgetId ? 'Update Widget' : 'Create Widget')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

export default WidgetForm 