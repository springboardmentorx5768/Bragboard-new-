import React, { useState, useEffect } from 'react';
import { FaThumbsUp, FaStar, FaRegSmile } from 'react-icons/fa';
import { GiHighFive } from 'react-icons/gi';
import '../animations.css';

export const REACTION_TYPES = [
    {
        type: 'like',
        icon: FaThumbsUp,
        label: 'Like',
        color: 'text-blue-600',
        gradient: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        particleColor: '#3B82F6'
    },
    {
        type: 'clap',
        icon: GiHighFive,
        label: 'Clap',
        color: 'text-green-600',
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

export const ReactionBar = ({ counts = {} }) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    const activeTypes = Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([type]) => type);

    return (
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
            {activeTypes.map(type => {
                const config = REACTION_TYPES.find(r => r.type === type);
                if (!config) return null;
                return (
                    <div key={type} className="flex items-center gap-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${config.bgColor}`}>
                            <config.icon className={`w-3 h-3 ${config.color}`} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {counts[type]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ReactionButton = ({ shoutoutId, userReactions = [], onReact }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [hoverTimer, setHoverTimer] = useState(null);
    const [isBlasting, setIsBlasting] = useState(false);
    const [blastColor, setBlastColor] = useState('#3B82F6');

    // Determine current user reaction (assume single reaction enforced by backend logic, though array is passed)
    const myReactionType = userReactions.length > 0 ? userReactions[0] : null;
    const currentConfig = myReactionType ? REACTION_TYPES.find(r => r.type === myReactionType) : null;

    const handleMouseEnter = () => {
        const timer = setTimeout(() => setShowPicker(true), 500); // 500ms delay before showing picker
        setHoverTimer(timer);
    };

    const handleMouseLeave = () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        setTimeout(() => setShowPicker(false), 300); // Small delay to allow moving to picker
    };

    const handleClick = (e) => {
        e.stopPropagation();
        // If already reacted, remove it (toggle). If not, add default 'like'.
        onReact(shoutoutId, myReactionType || 'like');
        setShowPicker(false);
    };

    const handleReactionSelect = (type, e) => {
        e.stopPropagation();
        const config = REACTION_TYPES.find(r => r.type === type);
        if (config) {
            setBlastColor(config.particleColor);
            setIsBlasting(true);
            setTimeout(() => setIsBlasting(false), 600);
        }
        onReact(shoutoutId, type);
        setShowPicker(false);
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Action Button */}
            <button
                onClick={handleClick}
                className={`
                    flex items-center gap-2 px-2 py-2 rounded transition-colors w-full justify-center sm:justify-start
                    ${currentConfig
                        ? `${currentConfig.color} font-semibold`
                        : 'text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                `}
            >
                {currentConfig ? <currentConfig.icon className="text-xl" /> : <FaThumbsUp className="text-xl" />}
                <span className="text-sm">{currentConfig ? currentConfig.label : 'Like'}</span>
            </button>

            {/* Reaction Picker Popover */}
            {showPicker && (
                <div
                    className="absolute bottom-full left-0 mb-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 flex gap-1 z-50 animate-scale-in origin-bottom-left"
                    style={{ paddingLeft: '8px', paddingRight: '8px' }}
                    onMouseEnter={() => setShowPicker(true)}
                >
                    {REACTION_TYPES.map((reaction) => (
                        <button
                            key={reaction.type}
                            onClick={(e) => handleReactionSelect(reaction.type, e)}
                            className="p-2 transition-transform hover:scale-125 focus:outline-none"
                            title={reaction.label}
                        >
                            <reaction.icon className={`text-2xl ${reaction.color}`} />
                        </button>
                    ))}
                </div>
            )}

            {/* Blast Particles */}
            {isBlasting && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
                    {[...Array(16)].map((_, i) => {
                        const angle = (i * 22.5) * Math.PI / 180;
                        const distance = 80;
                        const tx = Math.cos(angle) * distance;
                        const ty = Math.sin(angle) * distance;
                        return (
                            <div
                                key={i}
                                className="absolute w-4 h-4 rounded-full animate-particle-blast shadow-lg"
                                style={{
                                    backgroundColor: blastColor,
                                    '--tx': `${tx}px`,
                                    '--ty': `${ty}px`,
                                    boxShadow: `0 0 10px ${blastColor}`,
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReactionButton;
