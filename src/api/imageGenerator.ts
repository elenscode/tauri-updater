import { ImageData, PointData } from '../types/image';

// Mock API 함수들
const fetchImageMetadata = async (): Promise<{ totalCount: number; images: ImageData[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const totalCount = 200;
    const images: ImageData[] = Array.from({ length: totalCount }, (_, index) => ({
        id: `image-${index + 1}`,
        key: `key-${index + 1000}`,
        name: `Image ${index + 1}.jpg`
    }));

    return { totalCount, images };
};

const fetchPointData = async (_imageId: string): Promise<PointData[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    // x, y 범위 지정
    const xStart = 20, xEnd = 41;
    const yStart = 30, yEnd = 110;
    const centerX = 150, centerY = 150;

    const radius = 150;
    const data: PointData[] = [];
    const xSize = radius * 2 / (xEnd - xStart + 1);
    const ySize = radius * 2 / (yEnd - yStart + 1);


    for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
            const dist = Math.sqrt(((x - xStart) * xSize - centerX) ** 2 + ((y - yStart) * ySize - centerY) ** 2);
            if (dist <= radius) {
                const value = Math.floor(Math.random() * 600) + 1;
                data.push({ x, y, value: value.toString() });
            }
        }
    }
    return data;
}

export { fetchImageMetadata, fetchPointData }
