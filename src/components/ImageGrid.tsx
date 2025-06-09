import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router-dom';
import type { ImageData, ImageGridProps } from '../types/image';
import { generateImageDataUrlFromPoints } from '../utils/imageUtils';
import SkeletonCard from './SkeletonCard';
import { fetchPointData } from '../api/imageGenerator';
import { usePatternStore } from '../store/usePatternStore';
import { cacheImageFeatures } from '../api/similarityApi';
import MultiSelect from './MultiSelect';

const options = Array.from({ length: 699 }, (_, i) => i + 1).map(num => ({
    value: num, label: `BIN${num.toString().padStart(3, '0')}`
}));


const ImageGrid: React.FC<ImageGridProps> = React.memo(({
    totalCount: propTotalCount,
    images: propImages,
    apiEndpoint = '/api/images',
    cacheVersion = 0,
    onSimilarityAnalysis
}) => {
    const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
    const [columns, setColumns] = useState(3); const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isCreatingPattern, setIsCreatingPattern] = useState(false);
    const [isBinaryMode, setIsBinaryMode] = useState(false);

    const [selectedOption, setSelectedOption] = useState<{ value: number | string; label: string }[]>([]);

    const navigate = useNavigate();
    const { generatePatternFromImages, threshold } = usePatternStore();

    const totalCount = propTotalCount;
    const images = propImages;

    const containerRef = useRef<HTMLDivElement>(null);

    const imageCacheRef = useRef(imageCache);
    const loadingImagesRef = useRef(loadingImages);

    const COLUMNS = columns;
    const ITEM_HEIGHT = 300;
    const GAP = 16;
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

    const fetchImageUrl = useCallback(async (imageId: string, binaryOptions?: { selectedValues: number[]; isBinary: boolean }): Promise<string> => {
        const cacheKey = binaryOptions?.isBinary ? `${imageId}_binary_${binaryOptions.selectedValues.join(',')}` : imageId;

        if (imageCacheRef.current.has(cacheKey)) {
            return imageCacheRef.current.get(cacheKey)!;
        }
        if (loadingImagesRef.current.has(cacheKey)) {
            return '';
        }
        const imageData = images.find(img => img.id === imageId);
        if (imageData && imageData.url && !binaryOptions?.isBinary) {
            setImageCache(prev => new Map(prev).set(cacheKey, imageData.url!));
            return imageData.url;
        } try {
            setLoadingImages(prev => new Set(prev).add(cacheKey));

            //await new Promise(r => setTimeout(r, 100)); // Simulate API call
            //const url = `https://picsum.photos/300/300?random=${imageId}`;
            // const url = await generateImageUrlFromApi(apiEndpoint + `?id=${imageId}`);
            const points = await fetchPointData(imageId);
            const url = await generateImageDataUrlFromPoints(points, undefined, undefined, binaryOptions);
            // Cache features in Rust backend for similarity calculation
            try {
                const pointsArray: Array<[number, number, number]> = points.map(p => [
                    parseFloat(p.x.toString()),
                    parseFloat(p.y.toString()),
                    parseFloat(p.value)
                ]);
                // await cacheImageFeatures(imageId, pointsArray);
                // console.log(`Features cached for image: ${imageId}`);
            } catch (error) {
                console.warn(`Failed to cache features for image ${imageId}:`, error);
            }

            setImageCache(prev => new Map(prev).set(cacheKey, url));
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(cacheKey);
                return newSet;
            });
            return url;
        } catch (error) {
            setLoadingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(cacheKey);
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

    const virtualItems = rowVirtualizer.getVirtualItems(); const loadVisibleImages = useCallback(async () => {
        const visibleImageIds: string[] = [];
        virtualItems.forEach(virtualRow => {
            for (let col = 0; col < COLUMNS; col++) {
                const imageIndex = virtualRow.index * COLUMNS + col;
                if (imageIndex < actualImageCount) {
                    visibleImageIds.push(images[imageIndex].id);
                }
            }
        });

        // 이진화 모드에서는 캐시 키가 다르므로 별도로 체크
        const imagesToLoad = visibleImageIds.filter(id => {
            const binaryOptions = isBinaryMode ? {
                selectedValues: selectedOption.map(opt => Number(opt.value)),
                isBinary: true
            } : undefined;

            const cacheKey = binaryOptions?.isBinary ?
                `${id}_binary_${binaryOptions.selectedValues.join(',')}` :
                id;

            return !imageCacheRef.current.has(cacheKey) && !loadingImagesRef.current.has(cacheKey);
        });

        if (imagesToLoad.length === 0) return;
        console.log(`Loading ${imagesToLoad.length} images...`);
        const loadPromises = imagesToLoad.slice(0, 10).map(async (imageId) => {
            try {
                const binaryOptions = isBinaryMode ? {
                    selectedValues: selectedOption.map(opt => Number(opt.value)),
                    isBinary: true
                } : undefined;

                const url = await fetchImageUrl(imageId, binaryOptions);
                if (url) {
                    console.log(`Image ${imageId} loaded successfully`);
                }
            } catch (error) {
                console.error(`Failed to load image ${imageId}:`, error);
            }
        });
        await Promise.all(loadPromises);
    }, [virtualItems, COLUMNS, actualImageCount, images, fetchImageUrl, isBinaryMode, selectedOption]); useEffect(() => {
        if (virtualItems.length > 0 || isBinaryMode) {
            loadVisibleImages();
        }
    }, [virtualItems, loadVisibleImages, isBinaryMode]);

    // isBinaryMode 변경 시 가상화 강제 업데이트
    useEffect(() => {
        if (isBinaryMode) {
            // 스크롤 위치 초기화
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }

            // 가상화 요소들 강제 재측정
            setTimeout(() => {
                const virtualElements = document.querySelectorAll('[data-index]');
                virtualElements.forEach((element) => {
                    if (rowVirtualizer.measureElement) {
                        rowVirtualizer.measureElement(element as HTMLElement);
                    }
                });
            }, 100);
        }
    }, [isBinaryMode, rowVirtualizer]);


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
    }, []); const handleCreatePattern = useCallback(async () => {
        if (selectedImages.size === 0) return;

        setIsCreatingPattern(true);
        try {
            const selectedImageIds = Array.from(selectedImages);

            // 이진화 모드인 경우 이진화 옵션을 함께 전달
            if (isBinaryMode && selectedOption.length > 0) {
                const binaryOptions = {
                    selectedValues: selectedOption.map(opt => Number(opt.value)),
                    isBinary: true
                };
                console.log('이진화 모드로 패턴 생성:', selectedImageIds, binaryOptions);
                await generatePatternFromImages(selectedImageIds, threshold, binaryOptions);
            } else {
                console.log('일반 모드로 패턴 생성:', selectedImageIds);
                await generatePatternFromImages(selectedImageIds, threshold);
            }

            // 패턴 생성 완료 후 Draw 페이지로 이동
            navigate('/draw');
        } catch (error) {
            console.error('패턴 생성 중 오류 발생:', error);
            alert('패턴 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingPattern(false);
        }
    }, [selectedImages, threshold, generatePatternFromImages, navigate, isBinaryMode, selectedOption]); const handleAnalyzeSimilarity = useCallback(async () => {
        if (selectedImages.size === 0) return;

        setIsCreatingPattern(true);
        try {
            const selectedImageIds = Array.from(selectedImages);

            // 이진화 모드인 경우 이진화 옵션을 함께 전달
            if (isBinaryMode && selectedOption.length > 0) {
                const binaryOptions = {
                    selectedValues: selectedOption.map(opt => Number(opt.value)),
                    isBinary: true
                };
                console.log('이진화 모드로 유사도 분석:', selectedImageIds, binaryOptions);
                await generatePatternFromImages(selectedImageIds, threshold, binaryOptions);
            } else {
                console.log('일반 모드로 유사도 분석:', selectedImageIds);
                await generatePatternFromImages(selectedImageIds, threshold);
            }

            // 패턴 생성 완료 후 Gallery의 콜백 호출
            if (onSimilarityAnalysis) {
                onSimilarityAnalysis(selectedImageIds);
            }
        } catch (error) {
            console.error('패턴 생성 중 오류 발생:', error);
            alert('패턴 생성 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingPattern(false);
        }
    }, [selectedImages, threshold, generatePatternFromImages, onSimilarityAnalysis, isBinaryMode, selectedOption]);

    // 캐시 정리 함수
    const clearBinaryCache = useCallback(() => {
        setImageCache(prev => {
            const newCache = new Map();
            prev.forEach((value, key) => {
                if (!key.includes('_binary_')) {
                    newCache.set(key, value);
                }
            });
            return newCache;
        });
        imageCacheRef.current = new Map(Array.from(imageCacheRef.current.entries()).filter(([key]) => !key.includes('_binary_')));
    }, []);

    const clearNormalCache = useCallback(() => {
        setImageCache(prev => {
            const newCache = new Map();
            prev.forEach((value, key) => {
                if (key.includes('_binary_')) {
                    newCache.set(key, value);
                }
            });
            return newCache;
        });
        imageCacheRef.current = new Map(Array.from(imageCacheRef.current.entries()).filter(([key]) => key.includes('_binary_')));
    }, []);

    const handleBinarizeImages = useCallback(async () => {
        if (selectedOption.length === 0) return; setIsCreatingPattern(true);
        try {
            // 이진화 모드로 전환 시 일반 캐시만 정리 (선택적)
            if (!isBinaryMode) {
                clearNormalCache();
            }

            // 현재 이진화 설정과 다른 이진화 캐시 정리
            const currentBinaryKey = `_binary_${selectedOption.map(opt => opt.value).join(',')}`;
            setImageCache(prev => {
                const newCache = new Map();
                prev.forEach((value, key) => {
                    // 일반 캐시 또는 현재 이진화 설정과 일치하는 캐시만 유지
                    if (!key.includes('_binary_') || key.includes(currentBinaryKey)) {
                        newCache.set(key, value);
                    }
                });
                return newCache;
            });

            // 이진화 모드 활성화
            setIsBinaryMode(true);

            // 가상화 요소들 강제 재측정 및 스크롤 초기화
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }

            // 다음 렌더링 사이클에서 가상화 요소들을 강제로 다시 측정
            setTimeout(() => {
                virtualItems.forEach((virtualRow) => {
                    const element = document.querySelector(`[data-index="${virtualRow.index}"]`) as HTMLElement;
                    if (element && rowVirtualizer.measureElement) {
                        rowVirtualizer.measureElement(element);
                    }
                });
            }, 0);

            console.log('이진화 처리 시작 - 선택된 BIN 값들:', selectedOption.map(opt => opt.value));

        } catch (error) {
            console.error('이진화 처리 중 오류 발생:', error);
            alert('이진화 처리 중 오류가 발생했습니다.');
        } finally {
            setIsCreatingPattern(false);
        }
    }, [selectedOption, virtualItems, rowVirtualizer]);

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
            <div className="mb-4 p-4 shadow-sm rounded-lg">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer
                    flex items-center gap-1">                        <span className="text-xs font-medium rounded-md  px-2 py-1 bg-blue-100 text-primary">
                            이미지{actualImageCount} 개
                        </span>
                        <span className={`text-xs font-medium rounded-md px-2 py-1 ${isBinaryMode ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                            {isBinaryMode ? '이진화 모드' : '일반 모드'}
                        </span><span className="text-xs font-medium rounded-md  px-2 py-1 bg-blue-100 text-primary">
                            일반캐시 {Array.from(imageCache.keys()).filter(key => !key.includes('_binary_')).length}
                        </span>                        <span className="text-xs font-medium rounded-md  px-2 py-1 bg-green-100 text-primary">
                            이진캐시 {Array.from(imageCache.keys()).filter(key => key.includes('_binary_')).length}
                        </span>
                        <button className="btn btn-xs btn-ghost"
                            onClick={clearBinaryCache}
                            disabled={Array.from(imageCache.keys()).filter(key => key.includes('_binary_')).length === 0}
                            title="이진화 캐시 정리"
                        >이진캐시 정리</button>
                        <button className="btn btn-xs btn-ghost"
                            onClick={clearNormalCache}
                            disabled={Array.from(imageCache.keys()).filter(key => !key.includes('_binary_')).length === 0}
                            title="일반 캐시 정리"
                        >일반캐시 정리</button>
                        <span className="text-xs font-medium rounded-md  px-2 py-1 bg-blue-100 text-primary">
                            로딩 {loadingImages.size}
                        </span>
                        <span className="text-xs font-medium rounded-md  px-2 py-1 bg-warning text-primary">
                            선택 {selectedImages.size}개
                        </span>                        <button className="btn btn-xs btn-warning"
                            onClick={clearSelection}
                            disabled={selectedImages.size === 0}
                        >선택 해제</button>
                        {isBinaryMode && (
                            <button className="btn btn-xs btn-info"
                                onClick={() => setIsBinaryMode(false)}
                                title="일반 모드로 전환"
                            >일반 모드</button>
                        )}
                    </div>
                    <MultiSelect value={selectedOption}
                        options={options} onChange={setSelectedOption} placeholder="BIN 선택" isDisabled={isCreatingPattern} />

                    <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer
                    flex items-center gap-1">                        <button
                            className="btn btn-xs btn-primary"
                            disabled={selectedOption.length === 0 || isCreatingPattern}
                            onClick={handleBinarizeImages}
                        >
                            {isCreatingPattern ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    처리 중...
                                </>
                            ) : (
                                '영상 이진화'
                            )}
                        </button>                        <button
                            onClick={handleCreatePattern}
                            disabled={selectedImages.size === 0 || isCreatingPattern || (isBinaryMode && selectedOption.length === 0)}
                            className="btn btn-xs btn-primary"
                        >
                            {isCreatingPattern ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    패턴 생성 중...
                                </>
                            ) : (
                                '패턴 만들기'
                            )}
                        </button>                        <button
                            onClick={handleAnalyzeSimilarity}
                            disabled={selectedImages.size === 0 || isCreatingPattern || (isBinaryMode && selectedOption.length === 0)}
                            className="btn btn-xs btn-secondary"
                        >
                            {isCreatingPattern ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    분석 중...
                                </>
                            ) : (
                                '유사도 분석'
                            )}
                        </button>

                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="columns-select" className="font-medium text-gray-700 mr-2">
                            컬럼
                        </label>
                        <select
                            id="columns-select"
                            value={columns}
                            onChange={(e) => handleColumnsChange(Number(e.target.value))}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                                {rowImages.map((imageData) => {
                                    const binaryOptions = isBinaryMode ? {
                                        selectedValues: selectedOption.map(opt => Number(opt.value)),
                                        isBinary: true
                                    } : undefined;
                                    const cacheKey = binaryOptions?.isBinary ?
                                        `${imageData.id}_binary_${binaryOptions.selectedValues.join(',')}` :
                                        imageData.id;

                                    return (
                                        <SkeletonCard
                                            key={imageData.id}
                                            imageData={imageData}
                                            isLoading={loadingImages.has(cacheKey)}
                                            cachedUrl={imageCache.get(cacheKey)}
                                            isSelected={selectedImages.has(imageData.id)}
                                            onToggleSelection={() => toggleImageSelection(imageData.id)}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
});

export default ImageGrid;
