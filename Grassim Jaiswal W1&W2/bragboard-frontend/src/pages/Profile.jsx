import { useAuth } from '../contexts/AuthContext';
import { Mail, Briefcase, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="flex justify-center items-start pt-10 min-h-[500px]">
      
      {/* Compact Container */}
      <div className="relative w-full max-w-md group">
        
        {/* Vibrant Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-rose-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Glass Card */}
        <div className="relative bg-white/90 backdrop-blur-xl rounded-[1.7rem] shadow-xl overflow-hidden border border-white/50">
            
            {/* Vibrant Header Gradient */}
            <div className="h-32 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 skew-y-6 transform origin-bottom-left"></div>
            </div>

            <div className="px-6 pb-8 text-center">
                
                {/* Avatar */}
                <div className="relative -mt-16 mb-4 inline-block">
                    <div className="w-32 h-32 rounded-full border-[5px] border-white shadow-lg bg-orange-50 flex items-center justify-center">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-rose-600">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Identity */}
                <h2 className="text-2xl font-bold text-stone-800 tracking-tight mb-1">{user?.name}</h2>
                <div className="flex items-center justify-center gap-2 text-stone-500 text-sm font-medium mb-8">
                    <Mail className="w-4 h-4 text-orange-500" />
                    <span>{user?.email}</span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Department */}
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 group/item hover:bg-orange-100 transition-colors">
                        <div className="flex justify-center mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover/item:bg-white transition-colors">
                                <Briefcase className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Department</p>
                        <p className="font-bold text-stone-700">{user?.department || 'N/A'}</p>
                    </div>

                    {/* Role */}
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 group/item hover:bg-rose-100 transition-colors">
                         <div className="flex justify-center mb-2">
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600 group-hover/item:bg-white transition-colors">
                                <Shield className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Role</p>
                        <p className="font-bold text-stone-700 capitalize">{user?.role}</p>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}