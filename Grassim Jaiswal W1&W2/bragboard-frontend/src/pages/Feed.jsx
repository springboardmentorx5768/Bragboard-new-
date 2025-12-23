import { User } from 'lucide-react';

export default function Feed({ departmentFilter }) {
    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                    {departmentFilter} Feed
                </h2>
                <p className="text-gray-500">See what's happening in your team.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Feed Area */}
                <div className="lg:col-span-2 space-y-6">
                    
                </div>
                
                
            </div>
        </div>
    );
}