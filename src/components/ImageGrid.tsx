import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ImageData, ImageGridProps } from '../types/image';
import SkeletonCard from './SkeletonCard';

const ImageGrid: React.FC<ImageGridProps> = ({
    totalCount: propTotalCount,
    images: propImages,
    apiEndpoint = '/api/images',
    cacheVersion = 0
}) => {
    const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const [columns, setColumns] = useState(3);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

    const totalCount = propTotalCount;
    const images = propImages;

    const containerRef = useRef<HTMLDivElement>(null);

    const imageCacheRef = useRef(imageCache);
    const loadingImagesRef = useRef(loadingImages);

    const COLUMNS = columns;
    const ITEM_HEIGHT = 300;
    const GAP = 16;
    const PADDING = 16;
    const OVERSCAN = 2;

    console.log('API Endpoint:', apiEndpoint);

    useEffect(() => {
        imageCacheRef.current = imageCache;
    }, [imageCache]);

    useEffect(() => {
        loadingImagesRef.current = loadingImages;
    }, [loadingImages]);

    useEffect(() => {
        if (cacheVersion > 0) {
            console.log('Cache refreshed due to version change:', cacheVersion);
            setImageCache(new Map());
            setLoadingImages(new Set());
            imageCacheRef.current = new Map();
            loadingImagesRef.current = new Set();
        }
    }, [cacheVersion]);

    const fetchImageUrl = useCallback(async (imageId: string): Promise<string> => {
        if (imageCacheRef.current.has(imageId)) {
            return imageCacheRef.current.get(imageId)!;
        }
        if (loadingImagesRef.current.has(imageId)) {
            return '';
        }
        const imageData = images.find(img => img.id === imageId);
        if (imageData && imageData.url) {
            setImageCache(prev => new Map(prev).set(imageId, imageData.url!));
            return imageData.url;
        }
        try {
            setLoadingImages(prev => new Set(prev).add(imageId));
            await new Promise(r => setTimeout(r, 300)); // Simulate API call
            const url = `https://picsum.photos/300/300?random=${imageId}`;
            setImageCache(prev => new Map(prev).set(imageId, url));
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });
            return url;
        } catch (error) {
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(imageId);
                return newSet;
            });
            throw error;
        }
    }, [images]);

    const actualImageCount = Math.min(totalCount, images.length);
    const rowCount = Math.ceil(actualImageCount / COLUMNS);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => containerRef.current,
        estimateSize: () => ITEM_HEIGHT + GAP,
        overscan: OVERSCAN,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    const loadVisibleImages = useCallback(async () => {
        const visibleImageIds: string[] = [];
        virtualItems.forEach(virtualRow => {
            for (let col = 0; col < COLUMNS; col++) {
                const imageIndex = virtualRow.index * COLUMNS + col;
                if (imageIndex < actualImageCount) {
                    visibleImageIds.push(images[imageIndex].id);
                }
            }
        });

        const imagesToLoad = visibleImageIds.filter(id =>
            !imageCacheRef.current.has(id) && !loadingImagesRef.current.has(id)
        );

        if (imagesToLoad.length === 0) return;
        console.log(`Loading ${imagesToLoad.length} images...`);

        const loadPromises = imagesToLoad.slice(0, 20).map(async (imageId) => {
            try {
                const url = await fetchImageUrl(imageId);
                if (url) {
                    console.log(`Image ${imageId} loaded successfully`);
                }
            } catch (error) {
                console.error(`Failed to load image ${imageId}:`, error);
            }
        });
        await Promise.all(loadPromises);
    }, [virtualItems, COLUMNS, actualImageCount, images, fetchImageUrl]);

    useEffect(() => {
        if (virtualItems.length > 0) {
            loadVisibleImages();
        }
    }, [virtualItems, loadVisibleImages]);
    
    const handleColumnsChange = useCallback((newColumns: number) => {
        setColumns(newColumns);
        // When columns change, virtualizer updates automatically due to changed `rowCount`
        // We might want to scroll to top as well
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, []);

    const toggleImageSelection = useCallback((imageId: string) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedImages(new Set());
    }, []);


    if (totalCount === 0 || images.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">이미지 데이터를 기다리는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">이미지 갤러리 (React Virtual)</h2>
                        <p className="text-gray-600">총 {actualImageCount}개의 이미지 표시 중 • React Virtual로 성능 최적화</p>
                        <p className="text-sm text-gray-500 mt-1">
                            캐시된 이미지: {imageCache.size} / 로딩 중: {loadingImages.size} / 렌더링된 행: {virtualItems.length}
                        </p>
                        <p className="text-sm text-blue-600 mt-1 font-medium">
                            선택된 이미지: {selectedImages.size}개
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            {selectedImages.size > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    선택 해제 ({selectedImages.size})
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <label htmlFor="columns-select" className="text-sm font-medium text-gray-700">
                                컬럼 수
                            </label>
                            <select
                                id="columns-select"
                                value={columns}
                                onChange={(e) => handleColumnsChange(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                        {num}개
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="w-full h-[80vh] overflow-y-auto scroll-smooth border border-gray-300 rounded-lg p-4" // Added PADDING here
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC',
                }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualItems.map(virtualRow => {
                        const rowImages: ImageData[] = [];
                        for (let col = 0; col < COLUMNS; col++) {
                            const imageIndex = virtualRow.index * COLUMNS + col;
                            if (imageIndex < actualImageCount) {
                                rowImages.push(images[imageIndex]);
                            }
                        }

                        if (rowImages.length === 0) {
                            return null;
                        }

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                                    gap: `${GAP}px`,
                                    paddingBottom: `${GAP}px`, // Ensure gap below the row
                                }}
                            >
                                {rowImages.map((imageData) => (
                                    <SkeletonCard
                                        key={imageData.id}
                                        imageData={imageData}
                                        isLoading={loadingImages.has(imageData.id)}
                                        cachedUrl={imageCache.get(imageData.id)}
                                        isSelected={selectedImages.has(imageData.id)}
                                        onToggleSelection={() => toggleImageSelection(imageData.id)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ImageGrid;
