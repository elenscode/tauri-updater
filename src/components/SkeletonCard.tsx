import React from 'react';
import type { ImageData } from '../types/image';

interface SkeletonCardProps {
    imageData: ImageData;
    isLoading: boolean;
    cachedUrl?: string; // 캐시된 URL을 추가로 받음
    isSelected?: boolean; // 선택 상태
    onToggleSelection?: () => void; // 선택 토글 함수
}

const SkeletonCard: React.FC<SkeletonCardProps> = React.memo(({
    imageData,
    isLoading,
    cachedUrl,
    isSelected = false,
    onToggleSelection
}) => {
    const hasUrl = Boolean(cachedUrl || imageData.url);

    return (
        <div
            className={`relative bg-gray-200 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-75' : ''
                }`}
            onClick={onToggleSelection}
        >            {hasUrl ? (
            <div className="w-full h-full">
                <img
                    src={cachedUrl || imageData.url}
                    alt={imageData.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Error';
                    }}
                />
                {/* 선택 표시 */}
                {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">{imageData.name}</p>
                </div>
            </div>) : (
            <div className="w-full h-full flex flex-col justify-end p-3">
                {/* 스켈레톤 애니메이션 */}
                <div className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${isLoading ? 'animate-pulse' : 'animate-pulse opacity-50'}`}></div>
                {/* 선택 표시 */}
                {isSelected && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-20">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
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
