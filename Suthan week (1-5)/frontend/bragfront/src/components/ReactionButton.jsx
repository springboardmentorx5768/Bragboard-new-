import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaStar, FaRegSmile } from 'react-icons/fa';
import { GiHighFive } from 'react-icons/gi';
import '../animations.css';

const REACTION_TYPES = [
    {
        type: 'like',
        icon: FaThumbsUp,
        label: 'Like',
        color: 'text-blue-500',
        gradient: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        particleColor: '#3B82F6'
    },
    {
        type: 'clap',
        icon: GiHighFive,
        label: 'Clap',
        color: 'text-green-500',
        gradient: 'from-green-400 to-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        particleColor: '#22C55E'
    },
    {
        type: 'star',
        icon: FaStar,
        label: 'Star',
        color: 'text-yellow-500',
        gradient: 'from-yellow-400 to-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        particleColor: '#EAB308'
    }
];

const ReactionButton = ({ shoutoutId, counts = {}, userReactions = [], onReact }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [particles, setParticles] = useState([]);

    // Safety check for userReactions to ensure it's always an array
    const activeReactions = Array.isArray(userReactions) ? userReactions : [];

    // Clear particles after they fade out
    useEffect(() => {
        if (particles.length > 0) {
            const timer = setTimeout(() => {
                setParticles(prev => prev.slice(1));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [particles]);

    const handleReact = (type, e) => {
        if (e) e.stopPropagation();

        // Add particle effect if adding reaction
        if (!activeReactions.includes(type)) {
            const config = REACTION_TYPES.find(r => r.type === type);
            if (config) {
                const newParticle = {
                    id: Date.now(),
                    icon: config.icon,
                    color: config.color,
                    left: '50%',
                };
                setParticles(prev => [...prev, newParticle]);
            }
        }

        onReact(shoutoutId, type);
        setShowPicker(false);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Active Reaction Pills */}
            {Object.entries(counts).map(([type, count]) => {
                if (count <= 0) return null;
                const config = REACTION_TYPES.find(r => r.type === type);
                if (!config) return null;
                const isActive = activeReactions.includes(type);

                return (
                    <button
                        key={type}
                        onClick={(e) => handleReact(type, e)}
                        className={`
                            relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105
                            ${isActive
                                ? `${config.bgColor} ${config.color} border border-${config.color.split('-')[1]}-200 shadow-sm`
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <config.icon className={`${isActive ? 'animate-bounce-gentle' : ''}`} />
                        <span>{count}</span>
                    </button>
                );
            })}

            {/* Main "React" Button / Picker Trigger */}
            <div
                className="relative inline-block"
                onMouseEnter={() => setShowPicker(true)}
                onMouseLeave={() => setShowPicker(false)}
            >
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 animate-float-up-fade-out"
                        >
                            <p.icon className={`text-2xl ${p.color}`} />
                        </div>
                    ))}
                </div>

                <button
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200
                        ${showPicker ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    `}
                >
                    <FaRegSmile className="text-lg" />
                    <span className="hidden sm:inline">React</span>
                </button>

                {/* Reaction Picker */}
                {showPicker && (
                    <div
                        className="absolute bottom-full left-0 mb-2 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-xl border border-gray-100 dark:border-gray-600 flex gap-1 animate-fade-in-up z-50 ring-1 ring-black/5"
                        style={{ minWidth: 'max-content' }}
                    >
                        {REACTION_TYPES.map((reaction) => {
                            const isActive = activeReactions.includes(reaction.type);
                            return (
                                <button
                                    key={reaction.type}
                                    onClick={(e) => handleReact(reaction.type, e)}
                                    className={`
                                        group relative p-2.5 rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-110
                                        ${isActive ? 'bg-gray-100 dark:bg-gray-700 shadow-inner' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                                    `}
                                >
                                    <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-gradient-to-tr ${reaction.gradient}`}></div>
                                    <reaction.icon className={`text-2xl ${reaction.color} transform transition-transform group-hover:rotate-12`} />

                                    {/* Tooltip */}
                                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {reaction.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReactionButton;
