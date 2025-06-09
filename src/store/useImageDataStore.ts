import { create } from 'zustand';
import { ImageData } from '../types/image';
import { initializeSimilarityDataset } from '../api/similarityApi';

interface ImageDataStore {
    // 전체 이미지 데이터
    totalCount: number;
    images: ImageData[];

    // 검색 결과 데이터
    searchResults: ImageData[];

    // DataGrid에서 선택된 항목들
    selectedGridItems: Set<string>;

    // 필터된 이미지 (그리기 버튼으로 생성)
    filteredImages: ImageData[];
    filteredTotalCount: number;

    // 캐시 새로고침을 위한 버전
    cacheVersion: number;

    // Actions
    setImageData: (totalCount: number, images: ImageData[]) => void;
    setSearchResults: (searchResults: ImageData[]) => void;
    setSelectedGridItems: (selectedItems: Set<string>) => void;
    applyFilter: () => void;
    clearData: () => void;
    refreshCache: () => void;
}

export const useImageDataStore = create<ImageDataStore>((set, get) => ({
    // Initial state
    totalCount: 0,
    images: [],
    searchResults: [],
    selectedGridItems: new Set<string>(),
    filteredImages: [],
    filteredTotalCount: 0,
    cacheVersion: 0,

    // Actions
    setImageData: (totalCount, images) => set({
        totalCount,
        images,
        searchResults: images, // 검색 결과도 함께 설정
    }),

    setSearchResults: (searchResults) => set({ searchResults }),

    setSelectedGridItems: (selectedItems) => set({ selectedGridItems: selectedItems }),

    applyFilter: async () => {
        const { images, selectedGridItems } = get();
        const filtered = images.filter(image => selectedGridItems.has(image.id));
        // await initializeSimilarityDataset();

        set({
            filteredImages: filtered,
            filteredTotalCount: filtered.length,
            cacheVersion: Date.now(), // 캐시 버전 업데이트
        });
    },
    refreshCache: () => set({
        cacheVersion: Date.now(),
    }),

    clearData: () => set({
        totalCount: 0,
        images: [],
        searchResults: [],
        selectedGridItems: new Set<string>(),
        filteredImages: [],
        filteredTotalCount: 0,
        cacheVersion: 0,
    }),
}));