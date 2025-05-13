import { LucideAlertTriangle } from 'lucide-react';
import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError() as Error;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <LucideAlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Oops!</h1>
      <p className="text-lg mb-4">Sorry, an unexpected error has occurred.</p>
      <p className="text-sm text-gray-500">
        {error?.message || 'Unknown error'}
      </p>
    </div>
  );
}
