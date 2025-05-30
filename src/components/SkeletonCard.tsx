import React from 'react';
import type { ImageData } from '../types/image';

interface SkeletonCardProps {
    imageData: ImageData;
    isLoading: boolean;
    cachedUrl?: string;
    isSelected?: boolean;
    onToggleSelection?: () => void;
}

const SkeletonCard: React.FC<SkeletonCardProps> = React.memo(({
    imageData,
    isLoading,
    cachedUrl,
    isSelected = false,
    onToggleSelection
}) => {
    const hasUrl = Boolean(cachedUrl || imageData.url);
    const imageUrl = cachedUrl || imageData.url; return (
        <div
            className={`relative bg-gray-200 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer ${isSelected ? 'ring-4 ring-blue-500' : ''
                }`}
            onClick={onToggleSelection}
        >
            {isSelected && (
                <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    ✓
                </div>
            )}
            {hasUrl ? (
                <div className="w-full h-full">
                    <img
                        src={imageUrl}
                        alt={imageData.name}
                        className="w-full h-full object-cover transition-opacity duration-200"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Error';
                        }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-sm font-medium truncate">{imageData.name}</p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col justify-end p-3">
                    {/* 스켈레톤 애니메이션 */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${isLoading ? 'animate-pulse' : 'animate-pulse opacity-50'}`}></div>
                    <div className="relative z-10">
                        <div className="h-4 bg-gray-400 rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-400 rounded animate-pulse w-2/3"></div>
                    </div>
                    {isLoading && (
                        <div className="absolute top-2 right-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

SkeletonCard.displayName = 'SkeletonCard';

export default SkeletonCard;
