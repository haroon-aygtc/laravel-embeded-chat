import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, Edit, Trash, Copy, EyeOff, Eye, Code } from "lucide-react"
import { widgetApi } from "@/services/api/features/widget"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import EmbedCodeGenerator from "./EmbedCodeGenerator"

interface Widget {
    id: string
    name: string
    domain?: string
    title: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const WidgetList = () => {
    const [widgets, setWidgets] = useState<Widget[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null)
    const [showEmbedCodeDialog, setShowEmbedCodeDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const navigate = useNavigate()
    const { toast } = useToast()

    // Load widgets on component mount
    useEffect(() => {
        loadWidgets()
    }, [])

    const loadWidgets = async () => {
        setLoading(true)
        try {
            const response = await widgetApi.getAllWidgets()
            if (response.success && response.data) {
                setWidgets(response.data)
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load widgets",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Error loading widgets:", error)
            toast({
                title: "Error",
                description: "Failed to load widgets. Please try again later.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWidget = () => {
        navigate("/admin/widgets/create")
    }

    const handleEditWidget = (widgetId: string) => {
        navigate(`/admin/widgets/edit/${widgetId}`)
    }

    const handleToggleWidgetStatus = async (widget: Widget) => {
        try {
            const response = widget.isActive
                ? await widgetApi.deactivateWidget(widget.id)
                : await widgetApi.activateWidget(widget.id)

            if (response.success) {
                toast({
                    title: "Success",
                    description: `Widget ${widget.isActive ? "deactivated" : "activated"} successfully`,
                })
                loadWidgets()
            } else {
                toast({
                    title: "Error",
                    description: `Failed to ${widget.isActive ? "deactivate" : "activate"} widget`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error(`Error toggling widget status:`, error)
            toast({
                title: "Error",
                description: `Failed to update widget status`,
                variant: "destructive",
            })
        }
    }

    const handleGenerateEmbedCode = (widget: Widget) => {
        setSelectedWidget(widget)
        setShowEmbedCodeDialog(true)
    }

    const handleDeleteWidget = async () => {
        if (!selectedWidget) return

        try {
            const response = await widgetApi.deleteWidget(selectedWidget.id)

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Widget deleted successfully",
                })
                setShowDeleteDialog(false)
                loadWidgets()
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
        }
    }

    const filteredWidgets = widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-2xl font-bold">Chat Widgets</CardTitle>
                        <CardDescription>
                            Manage all your chat widgets in one place
                        </CardDescription>
                    </div>
                    <Button onClick={handleCreateWidget}>
                        <Plus className="mr-2 h-4 w-4" /> Create Widget
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search widgets by name or domain..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredWidgets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "No widgets matching your search." : "No widgets found. Create your first widget to get started!"}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Domain</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWidgets.map((widget) => (
                                        <TableRow key={widget.id}>
                                            <TableCell className="font-medium">{widget.name}</TableCell>
                                            <TableCell>{widget.title}</TableCell>
                                            <TableCell>{widget.domain}</TableCell>
                                            <TableCell>
                                                <Badge variant={widget.isActive ? "default" : "secondary"}>
                                                    {widget.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(widget.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEditWidget(widget.id)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleWidgetStatus(widget)}>
                                                            {widget.isActive ? (
                                                                <>
                                                                    <EyeOff className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleGenerateEmbedCode(widget)}>
                                                            <Code className="mr-2 h-4 w-4" />
                                                            Embed Code
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedWidget(widget)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Embed Code Dialog */}
            <Dialog open={showEmbedCodeDialog} onOpenChange={setShowEmbedCodeDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Widget Embed Code</DialogTitle>
                        <DialogDescription>
                            Use this code to embed your chat widget on your website.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedWidget && (
                        <EmbedCodeGenerator widgetId={selectedWidget.id} />
                    )}
                </DialogContent>
            </Dialog>

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

export default WidgetList 