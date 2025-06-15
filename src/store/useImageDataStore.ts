import { create } from 'zustand';
import { ImageData, ImageSubitem } from '../types/image';
// import { initializeSimilarityDataset } from '../api/similarityApi';

interface ImageDataStore {
    // 전체 이미지 데이터
    totalCount: number;
    images: ImageData[];

    // 검색 결과 데이터
    searchResults: ImageData[];

    // DataGrid에서 선택된 항목들
    selectedGridItems: Set<string>;    // 필터된 이미지 (그리기 버튼으로 생성)
    filteredImages: ImageData[];
    filteredTotalCount: number;
    filteredSubitems: ImageSubitem[];

    // ImageGrid 상태 관리
    selectedImages: Set<string>;
    selectedOption: { value: number | string; label: string }[];
    columns: number;

    // 캐시 새로고침을 위한 버전
    cacheVersion: number;    // Actions
    setImageData: (totalCount: number, images: ImageData[]) => void;
    setSearchResults: (searchResults: ImageData[]) => void;
    setSelectedGridItems: (selectedItems: Set<string>) => void;
    setSelectedSubitems: (subitems: ImageSubitem[]) => void;
      // ImageGrid Actions
    setSelectedImages: (selectedImages: Set<string>) => void;
    toggleImageSelection: (imageId: string) => void;
    clearImageSelection: () => void;
    setSelectedOption: (options: { value: number | string; label: string }[]) => void;
    setColumns: (columns: number) => void;
    initializeSelectedOption: (subitems?: { value: number | string; label: string }[]) => void;
    
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
    filteredSubitems: [],
    filteredTotalCount: 0,
    
    // ImageGrid 상태
    selectedImages: new Set<string>(),
    selectedOption: [],
    columns: 3,
    
    cacheVersion: 0,

    // Actions
    setImageData: (totalCount, images) => set({
        totalCount,
        images,
        searchResults: images, // 검색 결과도 함께 설정
    }),

    setSearchResults: (searchResults) => set({ searchResults }),

    setSelectedGridItems: (selectedItems) => set({ selectedGridItems: selectedItems }),    setSelectedSubitems: (subitems) => set({
        filteredSubitems: subitems}),

    // ImageGrid Actions
    setSelectedImages: (selectedImages) => set({ selectedImages }),
    
    toggleImageSelection: (imageId) => set((state) => {
        const newSelectedImages = new Set(state.selectedImages);
        if (newSelectedImages.has(imageId)) {
            newSelectedImages.delete(imageId);
        } else {
            newSelectedImages.add(imageId);
        }
        return { selectedImages: newSelectedImages };
    }),
    
    clearImageSelection: () => set({ selectedImages: new Set<string>() }),
    
    setSelectedOption: (options) => set({ selectedOption: options }),
    
    setColumns: (columns) => set({ columns }),
    
    initializeSelectedOption: (subitems) => {
        if (subitems && subitems.length > 0) {
            set({ selectedOption: subitems });
        }
    },

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
    }),    clearData: () => set({
        totalCount: 0,
        images: [],
        searchResults: [],
        selectedGridItems: new Set<string>(),
        filteredImages: [],
        filteredTotalCount: 0,
        selectedImages: new Set<string>(),
        selectedOption: [],
        columns: 3,
        cacheVersion: 0,
    }),
}));