import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaHandsClapping, FaStar } from 'react-icons/fa6';

const ReactionButton = ({ shoutoutId, reactions, currentUserId, onReact, disabled }) => {
    // Count distinct reactions by type
    const getCounts = () => {
        const counts = { like: 0, clap: 0, star: 0 };
        reactions.forEach(r => {
            if (counts[r.type] !== undefined) counts[r.type]++;
        });
        return counts;
    };

    // Determine my active reaction
    const getMyReaction = () => {
        return reactions.find(r => r.user_id === currentUserId)?.type || null;
    };

    const counts = getCounts();
    const myReaction = getMyReaction();

    const handleReact = (type) => {
        if (disabled) return;
        onReact(shoutoutId, type);
    };

    const reactionConfig = [
        { type: 'like', icon: FaHeart, color: 'text-red-500', bg: 'bg-red-50' },
        { type: 'clap', icon: FaHandsClapping, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { type: 'star', icon: FaStar, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex gap-2">
            {reactionConfig.map(({ type, icon: Icon, color, bg }) => {
                const isActive = myReaction === type;
                const count = counts[type] || 0;

                return (
                    <motion.button
                        key={type}
                        whileHover={!disabled ? { scale: 1.1 } : {}}
                        whileTap={!disabled ? { scale: 0.9 } : {}}
                        onClick={() => handleReact(type)}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors border 
                            ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                            ${isActive ? `${bg} ${color} border-${color.split('-')[1]}-200` : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}
                            `}
                    >
                        <Icon className={isActive ? 'opacity-100' : 'opacity-60'} />
                        {count > 0 && <span className="text-xs font-semibold">{count}</span>}
                    </motion.button>
                );
            })}
        </div>
    );
};

export default ReactionButton;
