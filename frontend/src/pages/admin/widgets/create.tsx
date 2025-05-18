import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Widget } from '@/types/widget'
import WidgetForm from '@/components/admin/widget/WidgetForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CreateWidgetPage = () => {
    const navigate = useNavigate()

    const handleSuccess = (widget: Widget) => {
        navigate(`/admin/widgets`)
    }

    const handleCancel = () => {
        navigate('/admin/widgets')
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
                <h1 className="text-3xl font-bold">Create New Widget</h1>
            </div>

            <WidgetForm
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        </div>
    )
}

export default CreateWidgetPage