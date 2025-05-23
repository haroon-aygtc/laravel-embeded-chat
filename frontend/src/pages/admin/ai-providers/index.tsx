import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/admin/layout/AdminLayout'
import AIProviderManagement from '@/components/admin/AIProviderManagement'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'

const AIProvidersPage = () => {
    const [isLoading, setIsLoading] = useState(true)
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin'

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/auth/login?redirect=/admin/ai-providers')
            } else if (!isAdmin) {
                navigate('/admin/access-denied')
            } else {
                setIsLoading(false)
            }
        }
    }, [isAuthenticated, isAdmin, authLoading, navigate])

    if (isLoading || authLoading) {
        return (
            <AdminLayout title="AI Providers" subtitle="Manage your AI provider integrations">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="AI Providers" subtitle="Manage your AI provider integrations">
            <AIProviderManagement />
        </AdminLayout>
    )
}

export default AIProvidersPage 