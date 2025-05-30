// src/utils/opencvLoader.ts
import { loadOpenCV, type OpenCV } from '@opencvjs/web';

let cvPromise: Promise<typeof OpenCV> | null = null;

/**
 * OpenCV WASM을 한 번만 로드하고, 이후에는 캐시된 인스턴스를 반환합니다.
 */
export function getCV(): Promise<typeof OpenCV> {
    if (!cvPromise) {
        cvPromise = loadOpenCV();
    }
    return cvPromise;
}
