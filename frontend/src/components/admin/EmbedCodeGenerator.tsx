import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { widgetService } from '@/services/widgetService'
import { EmbedType, Widget } from '@/types/widget'
import { Clipboard, Code2, Globe } from 'lucide-react'

const EmbedCodeGenerator = () => {
    const { toast } = useToast()
    const [widgets, setWidgets] = useState<Widget[]>([])
    const [selectedWidget, setSelectedWidget] = useState<string>('')
    const [selectedWidgetData, setSelectedWidgetData] = useState<Widget | null>(null)
    const [embedType, setEmbedType] = useState<EmbedType>('script')
    const [embedCode, setEmbedCode] = useState<string>('')
    const [domain, setDomain] = useState<string>('')
    const [isValidating, setIsValidating] = useState(false)
    const [isDomainValid, setIsDomainValid] = useState<boolean | null>(null)
    const [activeTab, setActiveTab] = useState('generate')

    // Load widgets on component mount
    useEffect(() => {
        loadWidgets()
    }, [])

    // Generate code when widget or embed type changes
    useEffect(() => {
        if (selectedWidget && embedType) {
            generateEmbedCode()
        }
    }, [selectedWidget, embedType])

    // Load widget list from API
    const loadWidgets = async () => {
        try {
            const response = await widgetService.getAllWidgets()
            setWidgets(response.data)

            // Select first widget if available
            if (response.data.length > 0) {
                setSelectedWidget(response.data[0].id)
                setSelectedWidgetData(response.data[0])
            }
        } catch (error) {
            console.error('Error loading widgets:', error)
            toast({
                title: 'Error',
                description: 'Failed to load widgets. Please try again.',
                variant: 'destructive'
            })
        }
    }

    // Get widget data by ID
    const getWidgetDetails = async (id: string) => {
        try {
            const response = await widgetService.getWidgetById(id)
            setSelectedWidgetData(response.data)
        } catch (error) {
            console.error('Error loading widget details:', error)
            toast({
                title: 'Error',
                description: 'Failed to load widget details.',
                variant: 'destructive'
            })
        }
    }

    // Handle widget selection change
    const handleWidgetChange = (id: string) => {
        setSelectedWidget(id)
        getWidgetDetails(id)
    }

    // Generate embed code
    const generateEmbedCode = async () => {
        if (!selectedWidget) return

        try {
            const response = await widgetService.generateEmbedCode(selectedWidget, embedType)
            // Make sure we're accessing the correct property in the response
            if (response.data && response.data.embed_code) {
                setEmbedCode(response.data.embed_code)
            } else {
                // Fallback if the embed_code property is missing
                throw new Error('Invalid response format from server')
            }
        } catch (error) {
            console.error('Error generating embed code:', error)

            // Fallback to client-side generation if API fails
            const domain = window.location.origin
            let clientCode = ''

            switch (embedType) {
                case 'script':
                    clientCode = `<script src="${domain}/widget.js" data-widget-id="${selectedWidget}"></script>`
                    break
                case 'iframe':
                    clientCode = `<iframe src="${domain}/widget-frame/${selectedWidget}" width="100%" height="600px" frameborder="0"></iframe>`
                    break
                case 'webcomponent':
                    clientCode = `<script src="${domain}/widget-component.js"></script>\n<chat-widget widget-id="${selectedWidget}"></chat-widget>`
                    break
            }

            setEmbedCode(clientCode)
        }
    }

    // Copy embed code to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(embedCode).then(
            () => {
                toast({
                    title: 'Copied!',
                    description: 'Embed code copied to clipboard.',
                })
            },
            (err) => {
                console.error('Could not copy text: ', err)
                toast({
                    title: 'Error',
                    description: 'Failed to copy to clipboard.',
                    variant: 'destructive'
                })
            }
        )
    }

    // Validate domain
    const validateDomain = async () => {
        if (!selectedWidget || !domain) return

        setIsValidating(true)

        try {
            const response = await widgetService.validateDomain(selectedWidget, domain)
            setIsDomainValid(response.data.isAllowed)

            toast({
                title: response.data.isAllowed ? 'Domain Allowed' : 'Domain Restricted',
                description: response.data.isAllowed
                    ? 'This domain is allowed to embed the widget.'
                    : 'This domain is not in the allowed list.',
                variant: response.data.isAllowed ? 'default' : 'destructive'
            })
        } catch (error) {
            console.error('Error validating domain:', error)
            setIsDomainValid(false)
            toast({
                title: 'Error',
                description: 'Failed to validate domain.',
                variant: 'destructive'
            })
        } finally {
            setIsValidating(false)
        }
    }

    // Add domain to allowed list
    const addAllowedDomain = async () => {
        if (!selectedWidget || !domain) return

        try {
            const response = await widgetService.addAllowedDomain(selectedWidget, domain)

            if (response.status === 'success') {
                toast({
                    title: 'Domain Added',
                    description: `${domain} has been added to the allowed domains.`
                })

                // Refresh widget details
                getWidgetDetails(selectedWidget)
                setIsDomainValid(true)
            }
        } catch (error) {
            console.error('Error adding domain:', error)
            toast({
                title: 'Error',
                description: 'Failed to add domain to allowed list.',
                variant: 'destructive'
            })
        }
    }

    // Remove domain from allowed list
    const removeAllowedDomain = async (domainToRemove: string) => {
        if (!selectedWidget) return

        try {
            const response = await widgetService.removeAllowedDomain(selectedWidget, domainToRemove)

            if (response.status === 'success') {
                toast({
                    title: 'Domain Removed',
                    description: `${domainToRemove} has been removed from the allowed domains.`
                })

                // Refresh widget details
                getWidgetDetails(selectedWidget)

                // Update validation state if the current domain is the removed one
                if (domain === domainToRemove) {
                    setIsDomainValid(false)
                }
            }
        } catch (error) {
            console.error('Error removing domain:', error)
            toast({
                title: 'Error',
                description: 'Failed to remove domain from allowed list.',
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Widget Embed Code Generator</CardTitle>
                    <CardDescription>
                        Generate embed code to add your AI widget to any website.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="generate">
                                <Code2 className="mr-2 h-4 w-4" />
                                Generate Code
                            </TabsTrigger>
                            <TabsTrigger value="domains">
                                <Globe className="mr-2 h-4 w-4" />
                                Manage Domains
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="generate" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="widget-select">Select Widget</Label>
                                        <Select
                                            value={selectedWidget}
                                            onValueChange={handleWidgetChange}
                                        >
                                            <SelectTrigger id="widget-select">
                                                <SelectValue placeholder="Select a widget" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {widgets.map(widget => (
                                                    <SelectItem key={widget.id} value={widget.id}>
                                                        {widget.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="embed-type">Embed Type</Label>
                                        <Select
                                            value={embedType}
                                            onValueChange={(value) => setEmbedType(value as EmbedType)}
                                        >
                                            <SelectTrigger id="embed-type">
                                                <SelectValue placeholder="Choose embed type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="script">JavaScript Snippet</SelectItem>
                                                <SelectItem value="iframe">Iframe</SelectItem>
                                                <SelectItem value="webcomponent">Web Component</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Button onClick={generateEmbedCode} className="mr-2">
                                            Generate Code
                                        </Button>
                                        {embedCode && (
                                            <Button onClick={copyToClipboard} variant="outline">
                                                <Clipboard className="mr-2 h-4 w-4" />
                                                Copy to Clipboard
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    {embedCode && (
                                        <div className="space-y-2">
                                            <Label>Embed Code</Label>
                                            <div className="relative">
                                                <pre className="bg-secondary p-4 rounded-md overflow-x-auto text-xs">
                                                    {embedCode}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="domains" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="domain-input">Validate Domain</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                id="domain-input"
                                                placeholder="example.com"
                                                value={domain}
                                                onChange={(e) => setDomain(e.target.value)}
                                            />
                                            <Button
                                                onClick={validateDomain}
                                                disabled={!domain || isValidating}
                                            >
                                                Validate
                                            </Button>
                                        </div>
                                        {isDomainValid !== null && (
                                            <p className={`text-sm mt-2 ${isDomainValid ? 'text-green-600' : 'text-red-600'}`}>
                                                {isDomainValid
                                                    ? 'This domain is allowed to embed the widget.'
                                                    : 'This domain is not in the allowed list.'}
                                            </p>
                                        )}
                                    </div>

                                    {isDomainValid === false && (
                                        <Button
                                            onClick={addAllowedDomain}
                                            disabled={!domain || isValidating}
                                        >
                                            Add to Allowed Domains
                                        </Button>
                                    )}
                                </div>

                                <div>
                                    <Label>Allowed Domains</Label>
                                    {selectedWidgetData?.allowed_domains && selectedWidgetData.allowed_domains.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                            {selectedWidgetData.allowed_domains.map(allowedDomain => (
                                                <li key={allowedDomain} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                                    <span>{allowedDomain}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAllowedDomain(allowedDomain)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {selectedWidgetData ? 'No domains are currently allowed. Add domains to restrict widget usage.' : 'Select a widget to see allowed domains.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

export default EmbedCodeGenerator 