import { useState } from 'react';
import type { ImageData } from '../types/image';

// 전역 ImageData 배열을 관리하는 커스텀 훅
let globalImageData: ImageData[] = [];
let listeners: Array<(data: ImageData[]) => void> = [];

export function useImageDataStore(): [ImageData[], (data: ImageData[]) => void] {
    const [imageData, setImageData] = useState<ImageData[]>(globalImageData);

    // setter: 전역 데이터와 모든 구독자 동기화
    const setGlobalImageData = (data: ImageData[]) => {
        globalImageData = data;
        setImageData(data);
        listeners.forEach(fn => fn(data));
    };

    // mount/unmount 시 구독 관리
    if (!listeners.includes(setImageData)) {
        listeners.push(setImageData);
    }
    // cleanup
    // (실제 앱에서는 useEffect로 구독 해제 필요)

    return [imageData, setGlobalImageData];
}
