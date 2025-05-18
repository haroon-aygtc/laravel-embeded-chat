'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    AIProvider,
    AIProviderModel,
    ProviderId,
    ProviderConfig,
    getAIProviders,
    getAIProvider,
    configureAIProvider,
    testAIProviderConnection,
    toggleAIProviderStatus,
    getAIProviderModels,
    setAIProviderDefaultModel
} from '@/services/api/features/aiProvidersfeatures'

interface AIProviderManagementProps {
    initialProvider?: string;
}

export default function AIProviderManagement({ initialProvider = 'openai' }: AIProviderManagementProps) {
    const [providers, setProviders] = useState<AIProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string>(initialProvider)
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [customUrls, setCustomUrls] = useState<Record<string, string>>({})
    const [defaultModels, setDefaultModels] = useState<Record<string, string>>({})
    const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({})
    const [connectionStatus, setConnectionStatus] = useState<Record<string, { success: boolean; message: string }>>({})
    const [providerModels, setProviderModels] = useState<Record<string, AIProviderModel[]>>({})

    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    useEffect(() => {
        console.log("AIProviderManagement - Initial render")
        console.log("Search params:", Object.fromEntries(searchParams.entries()))
        console.log("Current provider param:", searchParams.get('provider'))
        console.log("Initial provider prop:", initialProvider)

        // Update URL if needed to match the initialProvider
        const currentProviderParam = searchParams.get('provider')
        if (initialProvider && (!currentProviderParam || currentProviderParam !== initialProvider)) {
            console.log(`Updating URL with initialProvider: ${initialProvider}`)
            setSearchParams({ provider: initialProvider })
        }

        loadProviders()
    }, [initialProvider, searchParams, setSearchParams])

    const loadProviders = async () => {
        setLoading(true)
        try {
            const response = await getAIProviders()
            if (!response.success || !response.data) {
                throw new Error('Failed to load providers');
            }

            const data = response.data;
            setProviders(data)

            // Initialize state for each provider
            const initialApiKeys: Record<string, string> = {}
            const initialCustomUrls: Record<string, string> = {}
            const initialDefaultModels: Record<string, string> = {}
            const initialConnectionStatus: Record<string, { success: boolean; message: string }> = {}
            const initialIsTestingConnection: Record<string, boolean> = {}

            data.forEach(provider => {
                initialApiKeys[provider.id] = ''
                initialCustomUrls[provider.id] = ''
                initialDefaultModels[provider.id] = provider.defaultModel
                initialConnectionStatus[provider.id] = { success: provider.isConfigured, message: provider.isConfigured ? 'Configured' : 'Not configured' }
                initialIsTestingConnection[provider.id] = false

                // If provider is configured, fetch its models
                if (provider.isConfigured) {
                    fetchProviderModels(provider.id as ProviderId)
                }
            })

            setApiKeys(initialApiKeys)
            setCustomUrls(initialCustomUrls)
            setDefaultModels(initialDefaultModels)
            setConnectionStatus(initialConnectionStatus)
            setIsTestingConnection(initialIsTestingConnection)

            // Determine which provider to show
            console.log("Available providers:", data.map(p => p.id))
            console.log("Initial provider:", initialProvider)

            // First try to use initialProvider
            if (initialProvider && data.some(p => p.id === initialProvider)) {
                console.log(`Using initialProvider: ${initialProvider}`)
                setActiveTab(initialProvider)

                // Make sure URL matches
                const currentParam = searchParams.get('provider')
                if (currentParam !== initialProvider) {
                    console.log(`Updating URL to match initialProvider: ${initialProvider}`)
                    setSearchParams({ provider: initialProvider })
                }
            }
            // Then try URL parameter
            else {
                const providerParam = searchParams.get('provider')
                if (providerParam && data.some(p => p.id === providerParam)) {
                    console.log(`Using provider from URL: ${providerParam}`)
                    setActiveTab(providerParam)
                }
                // Finally default to first provider
                else if (data.length > 0) {
                    console.log(`No valid provider specified, defaulting to first: ${data[0].id}`)
                    setActiveTab(data[0].id)
                    setSearchParams({ provider: data[0].id })
                }
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load providers',
                description: 'There was an error loading the AI providers. Please try again.',
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchProviderModels = async (providerId: ProviderId) => {
        try {
            const response = await getAIProviderModels(providerId)
            if (response.success && response.data) {
                setProviderModels(prev => ({
                    ...prev,
                    [providerId]: response.data
                }))
            }
        } catch (error) {
            console.error(`Failed to fetch models for ${providerId}:`, error)
        }
    }

    const handleTabChange = (value: string) => {
        console.log(`Tab changed to: ${value}`)
        setActiveTab(value)

        // Update URL with the new provider without creating a new history entry
        const newParams = new URLSearchParams(searchParams)
        newParams.set('provider', value)
        setSearchParams(newParams, { replace: true })

        // Alternative approach using navigate
        // navigate(`/admin/ai-providers?provider=${value}`, { replace: true })
    }

    const handleApiKeyChange = (providerId: string, value: string) => {
        setApiKeys(prev => ({
            ...prev,
            [providerId]: value
        }))
    }

    const handleCustomUrlChange = (providerId: string, value: string) => {
        setCustomUrls(prev => ({
            ...prev,
            [providerId]: value
        }))
    }

    const handleDefaultModelChange = (providerId: string, modelId: string) => {
        setDefaultModels(prev => ({
            ...prev,
            [providerId]: modelId
        }))

        // Update the provider's default model
        if (connectionStatus[providerId]?.success) {
            updateDefaultModel(providerId as ProviderId, modelId)
        }
    }

    const updateDefaultModel = async (providerId: ProviderId, modelId: string) => {
        try {
            const response = await setAIProviderDefaultModel(providerId, modelId)

            if (response.success && response.data?.success) {
                toast({
                    title: 'Default model updated',
                    description: `Default model for ${getProviderName(providerId)} has been updated.`,
                })
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to update default model',
                    description: 'There was an error updating the default model. Please try again.',
                })
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to update default model',
                description: 'There was an error updating the default model. Please try again.',
            })
        }
    }

    const testConnection = async (providerId: ProviderId) => {
        setIsTestingConnection(prev => ({
            ...prev,
            [providerId]: true
        }))

        setConnectionStatus(prev => ({
            ...prev,
            [providerId]: { success: false, message: 'Testing connection...' }
        }))

        try {
            const config: ProviderConfig = {
                apiKey: apiKeys[providerId],
                baseUrl: customUrls[providerId] || undefined,
            }

            const response = await testAIProviderConnection(providerId, config)

            if (response.success && response.data) {
                setConnectionStatus(prev => ({
                    ...prev,
                    [providerId]: {
                        success: response.data.success,
                        message: response.data.message
                    }
                }))

                if (response.data.success && response.data.models) {
                    setProviderModels(prev => ({
                        ...prev,
                        [providerId]: response.data.models || []
                    }))

                    // Update the provider in the list
                    setProviders(prev =>
                        prev.map(p =>
                            p.id === providerId
                                ? { ...p, isConfigured: true, models: response.data.models }
                                : p
                        )
                    )

                    toast({
                        title: 'Connection successful',
                        description: `Successfully connected to ${getProviderName(providerId)}.`,
                    })
                }
            } else {
                setConnectionStatus(prev => ({
                    ...prev,
                    [providerId]: {
                        success: false,
                        message: response.error?.message || 'Connection failed'
                    }
                }))

                toast({
                    variant: 'destructive',
                    title: 'Connection failed',
                    description: response.error?.message || 'Failed to connect to the provider. Please check your API key and try again.',
                })
            }
        } catch (error) {
            setConnectionStatus(prev => ({
                ...prev,
                [providerId]: {
                    success: false,
                    message: 'Connection failed'
                }
            }))

            toast({
                variant: 'destructive',
                title: 'Connection failed',
                description: 'There was an error testing the connection. Please try again.',
            })
        } finally {
            setIsTestingConnection(prev => ({
                ...prev,
                [providerId]: false
            }))
        }
    }

    const saveConfiguration = async (providerId: ProviderId) => {
        if (!apiKeys[providerId]) {
            toast({
                variant: 'destructive',
                title: 'API Key Required',
                description: 'Please enter an API key before saving the configuration.',
            })
            return
        }

        setIsTestingConnection(prev => ({
            ...prev,
            [providerId]: true
        }))

        try {
            const config: ProviderConfig = {
                apiKey: apiKeys[providerId],
                baseUrl: customUrls[providerId] || undefined,
                defaultModel: defaultModels[providerId],
            }

            const response = await configureAIProvider(providerId, config)

            if (response.success && response.data?.success) {
                // Refresh the models for this provider
                fetchProviderModels(providerId)

                // Update the provider in the list
                setProviders(prev =>
                    prev.map(p =>
                        p.id === providerId
                            ? { ...p, isConfigured: true, isEnabled: true }
                            : p
                    )
                )

                toast({
                    title: 'Configuration saved',
                    description: `${getProviderName(providerId)} has been configured successfully.`,
                })

                // Clear the API key from the form for security
                setApiKeys(prev => ({
                    ...prev,
                    [providerId]: ''
                }))

                setConnectionStatus(prev => ({
                    ...prev,
                    [providerId]: {
                        success: true,
                        message: 'Configured successfully'
                    }
                }))
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Configuration failed',
                    description: response.error?.message || 'Failed to save the configuration. Please try again.',
                })
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Configuration failed',
                description: 'There was an error saving the configuration. Please try again.',
            })
        } finally {
            setIsTestingConnection(prev => ({
                ...prev,
                [providerId]: false
            }))
        }
    }

    const toggleProviderStatus = async (providerId: ProviderId, isEnabled: boolean) => {
        try {
            const response = await toggleAIProviderStatus(providerId, isEnabled)

            if (response.success && response.data?.success) {
                // Update the provider in the list
                setProviders(prev =>
                    prev.map(p =>
                        p.id === providerId
                            ? { ...p, isEnabled }
                            : p
                    )
                )

                toast({
                    title: isEnabled ? 'Provider enabled' : 'Provider disabled',
                    description: `${getProviderName(providerId)} has been ${isEnabled ? 'enabled' : 'disabled'}.`,
                })
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to update provider status',
                    description: response.error?.message || 'There was an error updating the provider status. Please try again.',
                })
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to update provider status',
                description: 'There was an error updating the provider status. Please try again.',
            })
        }
    }

    const getProviderName = (providerId: string): string => {
        const provider = providers.find(p => p.id === providerId)
        return provider?.name || providerId
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Loading AI providers...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Provider Management</h2>
                <p className="text-muted-foreground">
                    Configure your AI providers and manage API keys for different models.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
                    {providers.map(provider => (
                        <TabsTrigger key={provider.id} value={provider.id}>
                            {provider.name}
                            {provider.isConfigured && (
                                <Badge variant={provider.isEnabled ? "default" : "secondary"} className="ml-2">
                                    {provider.isEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {providers.map(provider => (
                    <TabsContent key={provider.id} value={provider.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    {provider.name}
                                    <a
                                        href={provider.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" /> Website
                                    </a>
                                </CardTitle>
                                <CardDescription>{provider.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Configuration Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">API Configuration</h3>

                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`${provider.id}-api-key`}>API Key</Label>
                                            <Input
                                                id={`${provider.id}-api-key`}
                                                type="password"
                                                placeholder={provider.isConfigured ? "••••••••••••••••••••••" : "Enter your API key"}
                                                value={apiKeys[provider.id] || ''}
                                                onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                {provider.isConfigured
                                                    ? "API key is configured. Enter a new one only if you want to change it."
                                                    : `Enter your ${provider.name} API key to enable this provider.`}
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor={`${provider.id}-base-url`}>Custom Base URL (Optional)</Label>
                                            <Input
                                                id={`${provider.id}-base-url`}
                                                type="text"
                                                placeholder="https://api.example.com/v1"
                                                value={customUrls[provider.id] || ''}
                                                onChange={(e) => handleCustomUrlChange(provider.id, e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Leave empty to use the default API endpoint.
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span>API Status</span>
                                                <div className="flex items-center">
                                                    {connectionStatus[provider.id]?.success ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-amber-600 mr-1" />
                                                    )}
                                                    <span className="text-sm text-muted-foreground">
                                                        {connectionStatus[provider.id]?.message || 'Not configured'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-x-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => testConnection(provider.id as ProviderId)}
                                                    disabled={!apiKeys[provider.id] || isTestingConnection[provider.id]}
                                                >
                                                    {isTestingConnection[provider.id] && (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    Test Connection
                                                </Button>

                                                <Button
                                                    onClick={() => saveConfiguration(provider.id as ProviderId)}
                                                    disabled={!apiKeys[provider.id] || isTestingConnection[provider.id]}
                                                >
                                                    {isTestingConnection[provider.id] && (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    Save Configuration
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Provider Status Toggle - Only show if configured */}
                                {provider.isConfigured && (
                                    <div className="flex items-center space-x-2 pt-4 border-t">
                                        <Switch
                                            id={`${provider.id}-status`}
                                            checked={provider.isEnabled}
                                            onCheckedChange={(checked) => toggleProviderStatus(provider.id as ProviderId, checked)}
                                        />
                                        <Label htmlFor={`${provider.id}-status`}>
                                            {provider.isEnabled ? 'Enabled' : 'Disabled'}
                                        </Label>
                                        <p className="text-sm text-muted-foreground ml-2">
                                            {provider.isEnabled
                                                ? `${provider.name} is currently active and can be used in the application.`
                                                : `${provider.name} is currently disabled and cannot be used.`}
                                        </p>
                                    </div>
                                )}

                                {/* Model Selection - Only show if configured */}
                                {provider.isConfigured && providerModels[provider.id]?.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-lg font-semibold">Available Models</h3>

                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor={`${provider.id}-default-model`}>Default Model</Label>
                                                <Select
                                                    value={defaultModels[provider.id] || ''}
                                                    onValueChange={(value) => handleDefaultModelChange(provider.id, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select default model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {providerModels[provider.id]?.map(model => (
                                                            <SelectItem key={model.id} value={model.id}>
                                                                {model.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-sm text-muted-foreground">
                                                    The default model will be used when no specific model is selected.
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-sm font-medium">Available Models</h4>
                                                <div className="grid gap-2">
                                                    {providerModels[provider.id]?.map(model => (
                                                        <Card key={model.id} className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <h5 className="font-medium">{model.name}</h5>
                                                                    {model.description && (
                                                                        <p className="text-sm text-muted-foreground">{model.description}</p>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {model.capabilities?.map(capability => (
                                                                            <Badge key={capability} variant="outline" className="text-xs">
                                                                                {capability}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-right">
                                                                    <div>Context: {(model.contextWindow / 1000).toFixed(0)}K tokens</div>
                                                                    <div>Max Output: {(model.maxTokens / 1000).toFixed(0)}K tokens</div>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info message if not configured */}
                                {!provider.isConfigured && connectionStatus[provider.id]?.message !== 'Testing connection...' && (
                                    <Alert className="mt-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Not Configured</AlertTitle>
                                        <AlertDescription>
                                            This provider is not yet configured. Enter your API key and save the configuration to enable it.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}