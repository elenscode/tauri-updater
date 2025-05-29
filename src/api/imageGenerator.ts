import { ImageData } from '../types/image';

// Mock API 함수들
const fetchImageMetadata = async (): Promise<{ totalCount: number; images: ImageData[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const totalCount = 1000;
    const images: ImageData[] = Array.from({ length: totalCount }, (_, index) => ({
        id: `image-${index + 1}`,
        name: `Image ${index + 1}.jpg`
    }));

    return { totalCount, images };
};

export { fetchImageMetadata }
