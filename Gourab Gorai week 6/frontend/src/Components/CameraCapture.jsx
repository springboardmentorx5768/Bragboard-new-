import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCamera, FaTimes, FaCheck, FaRedo } from 'react-icons/fa';

export default function CameraCapture({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [error, setError] = useState('');
    const streamRef = useRef(null);

    // Manage Camera Lifecycle
    useEffect(() => {
        let isMounted = true;

        const startCamera = async () => {
            if (capturedImage) return;

            try {
                stopTracks();

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 640 }
                });

                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    try {
                        await videoRef.current.play();
                    } catch (playErr) {
                        console.warn("Autoplay blocked or failed:", playErr);
                    }
                }
                setError('');
            } catch (err) {
                if (isMounted) {
                    console.error("Camera Error:", err);
                    setError("Unable to access camera. Please allow permissions.");
                }
            }
        };

        const stopTracks = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

        startCamera();

        return () => {
            isMounted = false;
            stopTracks();
        };
    }, [capturedImage]);

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const size = Math.min(video.videoWidth, video.videoHeight);
        if (size === 0) return;

        canvas.width = size;
        canvas.height = size;

        const xOffset = (video.videoWidth - size) / 2;
        const yOffset = (video.videoHeight - size) / 2;

        context.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                setCapturedImage({ blob: blob, file: file, url: URL.createObjectURL(blob) });
            }
        }, 'image/jpeg');
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const confirm = () => {
        if (capturedImage) {
            onCapture(capturedImage.file);
            onClose();
        }
    };

    // Render via Portal to break out of stacking contexts
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md flex flex-col items-center relative animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="w-full p-4 flex justify-between items-center bg-gray-50 border-b">
                    <h3 className="font-bold text-gray-700">Take Profile Photo</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 w-full flex flex-col items-center">
                    {error ? (
                        <div className="text-red-500 font-medium py-10 text-center">{error}</div>
                    ) : (
                        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden shadow-inner">
                            {!capturedImage ? (
                                <video
                                    ref={videoRef}
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                                    onLoadedMetadata={() => {
                                        if (videoRef.current) videoRef.current.play().catch(e => console.log("Play failed", e));
                                    }}
                                />
                            ) : (
                                <img
                                    src={capturedImage.url}
                                    alt="Captured"
                                    className="w-full h-full object-cover transform -scale-x-100" // Mirror consistency
                                />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex gap-4 mt-6 mb-2">
                        {!capturedImage ? (
                            <button
                                onClick={takePhoto}
                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition shadow-lg font-semibold"
                                disabled={!!error}
                            >
                                <FaCamera /> Capture
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={retake}
                                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-300 transition font-semibold"
                                >
                                    <FaRedo /> Retake
                                </button>
                                <button
                                    onClick={confirm}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition shadow-lg font-semibold"
                                >
                                    <FaCheck /> Use Photo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
