import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Widget } from '@/types/widget'
import WidgetForm from '@/components/admin/widget/WidgetForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EditWidgetPage = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    // Redirect to widgets list if no ID is provided
    useEffect(() => {
        if (!id) {
            navigate('/admin/widgets')
        }
    }, [id, navigate])

    const handleSuccess = (widget: Widget) => {
        navigate(`/admin/widgets`)
    }

    const handleCancel = () => {
        navigate('/admin/widgets')
    }

    if (!id) {
        return null // Early return while redirecting
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/widgets')}
                    className="mr-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Widgets
                </Button>
                <h1 className="text-3xl font-bold">Edit Widget</h1>
            </div>

            <WidgetForm
                widgetId={id}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    )
}

export default EditWidgetPage