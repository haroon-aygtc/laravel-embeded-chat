import { LucideInfo } from 'lucide-react';

export default function About() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <LucideInfo className="w-6 h-6" />
        About Page
      </h1>
    </div>
  );
}
