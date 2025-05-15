import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { widgetApi } from "@/services/api/features/widget"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, Brush, MessageSquare, GlobeIcon, ArrowLeft, Trash } from "lucide-react"

// Define the form schema
const formSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    description: z.string().optional(),
    title: z.string().min(1, { message: "Title is required" }),
    subtitle: z.string().optional(),
    domain: z.string().optional(),

    // Theme options
    primaryColor: z.string().default("#4F46E5"),
    secondaryColor: z.string().default("#10B981"),
    backgroundColor: z.string().default("#FFFFFF"),
    textColor: z.string().default("#1F2937"),
    fontFamily: z.string().default("Inter, sans-serif"),

    // Positioning options
    position: z.enum(["bottom-right", "bottom-left", "top-right", "top-left"]).default("bottom-right"),

    // Behavior options
    initialState: z.enum(["open", "closed", "minimized"]).default("closed"),
    autoOpen: z.boolean().default(false),
    openDelay: z.number().int().min(0).default(3),

    // Content options
    initialMessage: z.string().default("Hello! How can I assist you today?"),
    placeholderText: z.string().default("Type your message..."),

    // Feature toggles
    allowAttachments: z.boolean().default(true),
    allowVoice: z.boolean().default(true),
    allowEmoji: z.boolean().default(true),

    // Context/AI related options
    contextRuleId: z.string().optional(),
    responseFormattingId: z.string().optional(),
    followUpConfigId: z.string().optional(),

    // Status
    isActive: z.boolean().default(true),

    // Allowed domains
    allowedDomains: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

const WidgetForm = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("general")
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const isEditing = !!id

    // Initialize form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            title: "Chat Assistant",
            subtitle: "How can I help you?",
            domain: "",
            primaryColor: "#4F46E5",
            secondaryColor: "#10B981",
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
            fontFamily: "Inter, sans-serif",
            position: "bottom-right",
            initialState: "closed",
            autoOpen: false,
            openDelay: 3,
            initialMessage: "Hello! How can I assist you today?",
            placeholderText: "Type your message...",
            allowAttachments: true,
            allowVoice: true,
            allowEmoji: true,
            isActive: true,
            allowedDomains: [],
        },
    })

    // Load widget data if in edit mode
    useEffect(() => {
        if (id) {
            loadWidgetData(id)
        }
    }, [id])

    const loadWidgetData = async (widgetId: string) => {
        setIsLoading(true)
        try {
            const response = await widgetApi.getWidgetById(widgetId)

            if (response.success && response.data) {
                const widget = response.data

                // Transform the API data structure to match our form schema
                form.reset({
                    name: widget.name,
                    description: widget.description || "",
                    title: widget.title,
                    subtitle: widget.subtitle || "",
                    domain: widget.domain,
                    primaryColor: widget.visualSettings?.primaryColor || "#4F46E5",
                    secondaryColor: widget.visualSettings?.secondaryColor || "#10B981",
                    backgroundColor: widget.visualSettings?.backgroundColor || "#FFFFFF",
                    textColor: widget.visualSettings?.textColor || "#1F2937",
                    fontFamily: widget.visualSettings?.fontFamily || "Inter, sans-serif",
                    position: "bottom-right",
                    initialState: widget.behavioralSettings?.initialState || "closed",
                    initialMessage: widget.contentSettings?.initialMessage || "Hello! How can I assist you today?",
                    placeholderText: widget.contentSettings?.placeholderText || "Type your message...",
                    contextRuleId: widget.contextRuleId,
                    responseFormattingId: widget.responseFormattingId || "",
                    followUpConfigId: widget.followUpConfigId || "",
                    allowAttachments: widget.contentSettings?.allowAttachments || true,
                    allowVoice: widget.contentSettings?.allowVoice || true,
                    allowEmoji: widget.contentSettings?.allowEmoji || true,
                    isActive: widget.isActive,
                    allowedDomains: widget.allowedDomains || [],
                    autoOpen: false,
                    openDelay: 3,
                })
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load widget data",
                    variant: "destructive",
                })
                navigate("/admin/widgets")
            }
        } catch (error) {
            console.error("Error loading widget:", error)
            toast({
                title: "Error",
                description: "Failed to load widget data. Please try again later.",
                variant: "destructive",
            })
            navigate("/admin/widgets")
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: FormValues) => {
        setIsSaving(true)

        try {
            // Transform form data to match API expectations
            const widgetData = {
                name: data.name,
                description: data.description,
                userId: "current-user", // This would normally come from auth context
                domain: data.domain,
                title: data.title,
                subtitle: data.subtitle,
                theme: {
                    primaryColor: data.primaryColor,
                    secondaryColor: data.secondaryColor,
                    backgroundColor: data.backgroundColor,
                    textColor: data.textColor,
                    fontFamily: data.fontFamily,
                },
                position: data.position,
                initialState: data.initialState,
                initialMessage: data.initialMessage,
                placeholderText: data.placeholderText,
                contextRuleId: data.contextRuleId,
                responseFormattingId: data.responseFormattingId,
                followUpConfigId: data.followUpConfigId,
                allowAttachments: data.allowAttachments,
                allowVoice: data.allowVoice,
                allowEmoji: data.allowEmoji,
                isActive: data.isActive,
                allowedDomains: data.allowedDomains,
            }

            let response

            if (isEditing) {
                // Update existing widget
                response = await widgetApi.updateWidget(id!, widgetData)
            } else {
                // Create new widget
                response = await widgetApi.createWidget(widgetData)
            }

            if (response.success) {
                toast({
                    title: "Success",
                    description: `Widget ${isEditing ? "updated" : "created"} successfully`,
                })
                navigate("/admin/widgets")
            } else {
                toast({
                    title: "Error",
                    description: `Failed to ${isEditing ? "update" : "create"} widget`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(`Error ${isEditing ? "updating" : "creating"} widget:`, error)
            toast({
                title: "Error",
                description: `Failed to ${isEditing ? "update" : "create"} widget. Please try again later.`,
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteWidget = async () => {
        if (!id) return

        try {
            const response = await widgetApi.deleteWidget(id)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Widget deleted successfully",
                })
                navigate("/admin/widgets")
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete widget",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error deleting widget:", error)
            toast({
                title: "Error",
                description: "Failed to delete widget. Please try again later.",
                variant: "destructive",
            })
        } finally {
            setShowDeleteDialog(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate("/admin/widgets")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{isEditing ? "Edit Widget" : "Create Widget"}</h1>
                </div>

                {isEditing && (
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Widget
                    </Button>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mb-6">
                            <TabsTrigger value="general" className="flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">General</span>
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="flex items-center gap-2">
                                <Brush className="h-4 w-4" />
                                <span className="hidden sm:inline">Appearance</span>
                            </TabsTrigger>
                            <TabsTrigger value="content" className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">Content</span>
                            </TabsTrigger>
                            <TabsTrigger value="domains" className="flex items-center gap-2">
                                <GlobeIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Domains</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* General Settings */}
                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                    <CardDescription>
                                        Configure the basic settings of your chat widget
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Widget Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Customer Support" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    An internal name to identify this widget
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Chat widget for the main website"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional description for your reference
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Widget Position</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select position" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                                        <SelectItem value="top-right">Top Right</SelectItem>
                                                        <SelectItem value="top-left">Top Left</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Position of the widget on the page
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="initialState"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Initial State</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select initial state" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="open">Open</SelectItem>
                                                        <SelectItem value="closed">Closed</SelectItem>
                                                        <SelectItem value="minimized">Minimized</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    How the widget appears when the page loads
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Active Widget</FormLabel>
                                                    <FormDescription>
                                                        Enable or disable this widget
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Appearance Settings */}
                        <TabsContent value="appearance">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance Settings</CardTitle>
                                    <CardDescription>
                                        Customize how your chat widget looks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Color</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border"
                                                        style={{ backgroundColor: field.value }}
                                                    />
                                                    <FormControl>
                                                        <Input type="color" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormDescription>
                                                    Used for buttons, headers, and accents
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="secondaryColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Secondary Color</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border"
                                                        style={{ backgroundColor: field.value }}
                                                    />
                                                    <FormControl>
                                                        <Input type="color" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormDescription>
                                                    Used for secondary elements and highlights
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="backgroundColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Background Color</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border"
                                                        style={{ backgroundColor: field.value }}
                                                    />
                                                    <FormControl>
                                                        <Input type="color" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormDescription>
                                                    Main background color of the widget
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="textColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Text Color</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border"
                                                        style={{ backgroundColor: field.value }}
                                                    />
                                                    <FormControl>
                                                        <Input type="color" {...field} />
                                                    </FormControl>
                                                </div>
                                                <FormDescription>
                                                    Color for most text in the widget
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="fontFamily"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Font Family</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select font" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                                                        <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                                                        <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                                                        <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                                                        <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Font used throughout the widget
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Content Settings */}
                        <TabsContent value="content">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content Settings</CardTitle>
                                    <CardDescription>
                                        Customize the text and features of your chat widget
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Widget Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Chat Assistant" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Title displayed in the chat header
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="subtitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Widget Subtitle</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="How can I help you?" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Optional subtitle displayed below the title
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="initialMessage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Initial Message</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Hello! How can I assist you today?"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    First message shown when chat is opened
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="placeholderText"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Input Placeholder</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Type your message..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Placeholder text for the message input field
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="allowAttachments"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow File Attachments</FormLabel>
                                                    <FormDescription>
                                                        Let users upload files in the chat
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowVoice"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow Voice Input</FormLabel>
                                                    <FormDescription>
                                                        Let users send voice messages
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allowEmoji"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Allow Emoji Picker</FormLabel>
                                                    <FormDescription>
                                                        Enable emoji picker in the chat
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Domain Settings */}
                        <TabsContent value="domains">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Domain Settings</CardTitle>
                                    <CardDescription>
                                        Configure which domains can use this widget
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="domain"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Domain</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="example.com" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The main domain where this widget will be used
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* This would ideally be a more complex component that allows
                      adding/removing multiple domains. For simplicity, we'll just 
                      use a text input with comma-separated values. */}
                                    <FormField
                                        control={form.control}
                                        name="allowedDomains"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Allowed Domains (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="domain1.com, domain2.com, *.subdomain.com"
                                                        value={field.value?.join(", ") || ""}
                                                        onChange={(e) => {
                                                            // Parse comma-separated domains and trim whitespace
                                                            const domains = e.target.value
                                                                .split(",")
                                                                .map(d => d.trim())
                                                                .filter(d => d.length > 0)
                                                            field.onChange(domains)
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    List of domains allowed to embed this widget. Leave empty to allow all domains.
                                                    Use comma to separate multiple domains. Use * for wildcard subdomains (e.g., *.example.com).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-between mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/admin/widgets")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <span className="animate-spin mr-2">⊝</span>
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                isEditing ? "Update Widget" : "Create Widget"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the widget
                            and all associated chat sessions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWidget} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default WidgetForm 