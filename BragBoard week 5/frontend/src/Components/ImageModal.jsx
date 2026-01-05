import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';

const ImageModal = ({ isOpen, onClose, imageSrc }) => {
    // Only render if open and image source is available
    if (!isOpen || !imageSrc) return null;

    // Use standard div elements instead of motion.div for reliability
    // Using inline styles for overlay to guarantee visibility over everything
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // Max safe integer
        padding: '1rem'
    };

    return createPortal(
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            style={overlayStyle}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Image View</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-500 cursor-pointer"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Image Container */}
                <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100/50">
                    <img
                        src={imageSrc}
                        alt="Full view"
                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageModal;
