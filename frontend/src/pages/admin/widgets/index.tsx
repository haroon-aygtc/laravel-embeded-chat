import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { widgetService } from '@/services/widgetService'
import { Widget } from '@/types/widget'
import { Edit, Trash, PlusCircle, Code, Power } from 'lucide-react'

const WidgetListPage = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [widgets, setWidgets] = useState<Widget[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Load widgets on mount
    useEffect(() => {
        loadWidgets()
    }, [])

    // Load widgets from API
    const loadWidgets = async () => {
        setIsLoading(true)
        try {
            const response = await widgetService.getAllWidgets()
            setWidgets(response.data)
        } catch (error) {
            console.error('Error loading widgets:', error)
            toast({
                title: 'Error',
                description: 'Failed to load widgets. Please try again.',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Delete widget
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this widget?')) return

        try {
            await widgetService.deleteWidget(id)
            toast({
                title: 'Success',
                description: 'Widget deleted successfully.'
            })
            // Refresh widget list
            loadWidgets()
        } catch (error) {
            console.error('Error deleting widget:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete widget.',
                variant: 'destructive'
            })
        }
    }

    // Toggle widget status
    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await widgetService.toggleWidgetStatus(id)
            toast({
                title: 'Success',
                description: `Widget ${currentStatus ? 'deactivated' : 'activated'} successfully.`
            })
            // Refresh widget list
            loadWidgets()
        } catch (error) {
            console.error('Error toggling widget status:', error)
            toast({
                title: 'Error',
                description: 'Failed to update widget status.',
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Widgets</h1>
                <Button onClick={() => navigate('/admin/widgets/create')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Widget
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Widget Management</CardTitle>
                    <CardDescription>
                        Manage your AI chat widgets. Create, edit, and deploy widgets to your websites.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-sm text-muted-foreground">Loading widgets...</p>
                        </div>
                    ) : widgets.length === 0 ? (
                        <div className="text-center py-10">
                            <h3 className="text-lg font-medium mb-2">No widgets found</h3>
                            <p className="text-muted-foreground mb-6">
                                You haven't created any widgets yet. Create your first widget to get started.
                            </p>
                            <Button onClick={() => navigate('/admin/widgets/create')}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Your First Widget
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {widgets.map((widget) => (
                                    <TableRow key={widget.id}>
                                        <TableCell className="font-medium">{widget.name}</TableCell>
                                        <TableCell>{widget.title}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={widget.is_active ? "default" : "secondary"}
                                                className={widget.is_active ? "bg-green-600" : ""}
                                            >
                                                {widget.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(widget.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleStatus(widget.id, widget.is_active)}
                                                    title={widget.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/embed-code?widgetId=${widget.id}`)}
                                                    title="Get Embed Code"
                                                >
                                                    <Code className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/admin/widgets/edit/${widget.id}`)}
                                                    title="Edit Widget"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(widget.id)}
                                                    title="Delete Widget"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default WidgetListPage 