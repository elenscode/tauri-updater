import { create } from 'zustand';

interface ProductDataStore {
    // 전체 이미지 데이터
    product: string;
    step: string;
    startDate: string;
    endDate: string;

    // Actions
    setProductData: (product: string, step: string, startDate: string, endDate: string) => void;
    clearData: () => void;
}

export const useProductStore = create<ProductDataStore>((set, get) => ({
    product: 'V1',
    step: 'H',
    startDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0], // 오늘 날짜
    setProductData: (product, step, startDate, endDate) => set({
        product,
        step,
        startDate,
        endDate
    }),
    clearData: () => set({}),

}));