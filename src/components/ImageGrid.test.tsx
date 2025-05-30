import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ImageGrid from './ImageGrid';
import type { ImageData } from '../types/image';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock SkeletonCard to simplify testing
vi.mock('./SkeletonCard', () => ({
    __esModule: true,
    default: ({ imageData, cachedUrl, isLoading, isSelected, onToggleSelection }: any) => (
        <div data-testid={`skeleton-card-${imageData.id}`} onClick={onToggleSelection}>
            <img src={cachedUrl || imageData.url || ''} alt={imageData.id} />
            {isLoading && <span>Loading...</span>}
            {isSelected && <span>Selected</span>}
        </div>
    ),
}));

// Mock @tanstack/react-virtual
const mockGetVirtualItems = vi.fn();
const mockMeasureElement = vi.fn();
const mockUseVirtualizer = vi.fn();

vi.mock('@tanstack/react-virtual', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-virtual')>();
    return {
        ...actual,
        useVirtualizer: (opts: any) => {
            mockUseVirtualizer(opts); // Call the spy with options
            return {
                getVirtualItems: mockGetVirtualItems,
                getTotalSize: () => (opts.count || 0) * (opts.estimateSize ? opts.estimateSize() : 0),
                measureElement: mockMeasureElement,
            };
        },
    };
});

// Mock global fetch for fetchImageUrl simulation if it were a real API
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}), // Adjust as needed
    })
) as any;

// Mock ResizeObserver, as useVirtualizer might use it internally or the test env might complain
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
global.ResizeObserver = MockResizeObserver;


const mockImages: ImageData[] = Array.from({ length: 20 }, (_, i) => ({
    id: `img${i + 1}`,
    url: `https://example.com/img${i + 1}.jpg`,
    metadata: { name: `Image ${i + 1}` }
}));

const defaultProps = {
    totalCount: mockImages.length,
    images: mockImages,
    apiEndpoint: '/api/test-images',
    cacheVersion: 0,
};

describe('ImageGrid', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for getVirtualItems - typically an empty array or a few items
        mockGetVirtualItems.mockReturnValue([]);
        // Default mock for useVirtualizer options spy
        mockUseVirtualizer.mockImplementation((opts) => {
            // This allows us to assert on the options passed to useVirtualizer
        });
    });

    test('renders correctly with initial props and images', () => {
        mockGetVirtualItems.mockReturnValue([
            { index: 0, start: 0, size: 316, key: '0' },
            { index: 1, start: 316, size: 316, key: '1' },
        ]);
        render(<ImageGrid {...defaultProps} />);
        expect(screen.getByText(/이미지 갤러리 \(React Virtual\)/i)).toBeInTheDocument();
        expect(screen.getByText((content, element) => content.startsWith(`총 ${defaultProps.totalCount}개의 이미지 표시 중`))).toBeInTheDocument();
    });

    test('renders empty state when totalCount is 0', () => {
        render(<ImageGrid {...defaultProps} totalCount={0} images={[]} />);
        expect(screen.getByText(/이미지 데이터를 기다리는 중.../i)).toBeInTheDocument();
    });

    test('renders empty state when images array is empty', () => {
        render(<ImageGrid {...defaultProps} images={[]} />);
        expect(screen.getByText(/이미지 데이터를 기다리는 중.../i)).toBeInTheDocument();
    });

    test('useVirtualizer is called with correct parameters', () => {
        const columns = 3;
        const expectedRowCount = Math.ceil(defaultProps.totalCount / columns);
        const ITEM_HEIGHT = 300;
        const GAP = 16;

        render(<ImageGrid {...defaultProps} />);
        
        expect(mockUseVirtualizer).toHaveBeenCalledWith(
            expect.objectContaining({
                count: expectedRowCount,
                estimateSize: expect.any(Function),
                overscan: 2, // OVERSCAN constant
            })
        );
        // Check estimateSize return value
        const passedOptions = mockUseVirtualizer.mock.calls[0][0];
        expect(passedOptions.estimateSize()).toBe(ITEM_HEIGHT + GAP);
    });

    test('renders virtual items provided by useVirtualizer', async () => {
        const columns = 3;
        mockGetVirtualItems.mockReturnValue([
            { index: 0, start: 0, size: 316, key: '0' }, // Represents row 0
            { index: 1, start: 316, size: 316, key: '1' }, // Represents row 1
        ]);

        render(<ImageGrid {...defaultProps} />);

        // Row 0 items (img1, img2, img3)
        await waitFor(() => expect(screen.getByTestId('skeleton-card-img1')).toBeInTheDocument());
        expect(screen.getByTestId('skeleton-card-img2')).toBeInTheDocument();
        expect(screen.getByTestId('skeleton-card-img3')).toBeInTheDocument();

        // Row 1 items (img4, img5, img6)
        expect(screen.getByTestId('skeleton-card-img4')).toBeInTheDocument();
        expect(screen.getByTestId('skeleton-card-img5')).toBeInTheDocument();
        expect(screen.getByTestId('skeleton-card-img6')).toBeInTheDocument();
    });
    
    test('fetchImageUrl is called for visible, non-cached images', async () => {
        const columns = 1; // Simplify to 1 column for easier tracking
        const initialImages = [
            { id: 'img1', url: undefined, metadata: { name: 'Image 1'} }, // No initial URL
            { id: 'img2', url: 'https://example.com/img2-preloaded.jpg', metadata: { name: 'Image 2'} }, // Preloaded
        ];
         mockGetVirtualItems.mockReturnValue([
            { index: 0, start: 0, size: 316, key: '0' }, // Renders img1
            { index: 1, start: 316, size: 316, key: '1' }, // Renders img2
        ]);

        // Spy on fetchImageUrl by temporarily modifying the component's import or using a more complex mock
        // For simplicity here, we assume fetchImageUrl internally calls global.fetch for non-cached items
        // and we check if the loading state appears for img1.

        render(
            <ImageGrid
                totalCount={initialImages.length}
                images={initialImages}
                cacheVersion={0}
            />
        );
        
        // Wait for img1 to attempt loading (since its URL is undefined)
        await waitFor(() => {
            const img1Card = screen.getByTestId('skeleton-card-img1');
            // Check for loading indicator if SkeletonCard shows it
            // For this test, we'll assume fetchImageUrl gets called, which then updates loadingImages state
            // and that SkeletonCard displays "Loading..."
            expect(img1Card).toHaveTextContent("Loading...");
        });

        // img2 should not be loading as it has a URL
        const img2Card = screen.getByTestId('skeleton-card-img2');
        expect(img2Card).not.toHaveTextContent("Loading...");

        // Verify fetch was called for img1 (simulated by picsum URL construction)
        // This part of the test is a bit indirect because fetchImageUrl is internal.
        // A more direct test would involve spying on fetchImageUrl if it were exported or passed as a prop.
    });


    test('image selection updates selectedImages state and reflects in UI', async () => {
        mockGetVirtualItems.mockReturnValue([
            { index: 0, start: 0, size: 316, key: '0' },
        ]);
        render(<ImageGrid {...defaultProps} images={[mockImages[0]]} totalCount={1} />);

        const imageCard = screen.getByTestId('skeleton-card-img1');
        expect(imageCard).not.toHaveTextContent('Selected');
        expect(screen.getByText(/선택된 이미지: 0개/i)).toBeInTheDocument();

        fireEvent.click(imageCard);
        await waitFor(() => expect(imageCard).toHaveTextContent('Selected'));
        expect(screen.getByText(/선택된 이미지: 1개/i)).toBeInTheDocument();

        fireEvent.click(imageCard);
        await waitFor(() => expect(imageCard).not.toHaveTextContent('Selected'));
        expect(screen.getByText(/선택된 이미지: 0개/i)).toBeInTheDocument();
    });

    test('dynamic column changes update useVirtualizer parameters', async () => {
        const initialColumns = 3;
        const newColumns = 4;
        render(<ImageGrid {...defaultProps} />);

        const initialExpectedRowCount = Math.ceil(defaultProps.totalCount / initialColumns);
        expect(mockUseVirtualizer).toHaveBeenCalledWith(
            expect.objectContaining({ count: initialExpectedRowCount })
        );
        
        mockUseVirtualizer.mockClear(); // Clear previous calls before changing columns

        const columnSelect = screen.getByLabelText(/컬럼 수/i);
        fireEvent.change(columnSelect, { target: { value: newColumns.toString() } });

        const newExpectedRowCount = Math.ceil(defaultProps.totalCount / newColumns);
        
        // Wait for the state update and re-render to propagate to useVirtualizer
        await waitFor(() => {
            expect(mockUseVirtualizer).toHaveBeenCalledWith(
                expect.objectContaining({ count: newExpectedRowCount })
            );
        });
    });
    
    test('cache is cleared when cacheVersion changes', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log');
        const { rerender } = render(<ImageGrid {...defaultProps} cacheVersion={0} />);
        
        // Initial render, cache should be normal
        expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Cache refreshed'));

        rerender(<ImageGrid {...defaultProps} cacheVersion={1} />);

        await waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalledWith('Cache refreshed due to version change:', 1);
        });
        consoleLogSpy.mockRestore();
    });
});
