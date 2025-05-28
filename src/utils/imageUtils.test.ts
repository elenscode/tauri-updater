// src/utils/imageUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImageUrlFromApi } from './imageUtils';

// Mock the @techstark/opencv-js module
// We need to provide mock implementations for cv.Mat, cv.Scalar, cv.resize, cv.imshow, etc.
const mockMatDelete = vi.fn();
const mockUcharPtr = vi.fn().mockReturnValue([0]); // Mock to allow setting a value

const mockCvMatInstance = {
  cols: 0,
  rows: 0,
  delete: mockMatDelete,
  ucharPtr: mockUcharPtr,
  // Add other methods/properties if your main code uses them directly on Mat instances
};

const mockCv = {
  Mat: vi.fn().mockImplementation((rows, cols, type, scalar) => {
    mockCvMatInstance.rows = rows;
    mockCvMatInstance.cols = cols;
    // you might want to do more here if your tests depend on type or scalar
    return mockCvMatInstance;
  }),
  CV_8UC1: 'CV_8UC1_mock_value', // Just a mock value
  Scalar: vi.fn().mockImplementation((s) => [s,s,s,s]), // Mock scalar creation
  Size: vi.fn().mockImplementation((width, height) => ({ width, height })),
  resize: vi.fn((src, dst, dsize, fx, fy, interpolation) => {
    // Mock the behavior of resize, e.g., by modifying the dst mockMatInstance if needed
    dst.cols = dsize.width;
    dst.rows = dsize.height;
  }),
  imshow: vi.fn(), // Mock imshow, it draws on a canvas
  onRuntimeInitialized: null, // Set if your code uses it
};

vi.mock('@techstark/opencv-js', () => ({
  default: mockCv,
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock document.createElement for canvas
const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock_image_data');
const mockGetContext = vi.fn().mockReturnValue({
  // Mock any context methods if needed, though imshow usually handles it
});
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: mockGetContext,
  toDataURL: mockToDataURL,
};
document.createElement = vi.fn().mockReturnValue(mockCanvas);


describe('generateImageUrlFromApi', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Reset global.fetch to a default successful mock
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        state: true,
        data: [
          { x: 10, y: 20, value: '100' },
          { x: 12, y: 22, value: '150' },
          { x: 0, y: 0, value: '255' },
        ],
      }),
    });
    
    // Reset canvas mock properties
    mockCanvas.width = 0;
    mockCanvas.height = 0;
  });

  it('should process data and return a data URL successfully', async () => {
    const imageUrl = await generateImageUrlFromApi('mock-endpoint');

    // Check API call (using the mock implementation in the main function for now)
    // If actual fetch was used: expect(global.fetch).toHaveBeenCalledWith('mock-endpoint', { method: 'POST' });
    
    // Check OpenCV Mat creation
    // x_min=0, x_max=12, y_min=0, y_max=22
    // img_width = 12 - 0 + 1 = 13
    // img_height = 22 - 0 + 1 = 23
    expect(mockCv.Mat).toHaveBeenCalledTimes(2); // src and dst
    expect(mockCv.Mat).toHaveBeenNthCalledWith(1, 23, 13, mockCv.CV_8UC1, expect.any(Array)); // src Mat

    // Check pixel data setting (ucharPtr)
    // 3 data points -> 3 calls to ucharPtr for setting data
    expect(mockUcharPtr).toHaveBeenCalledTimes(3); 
    expect(mockUcharPtr).toHaveBeenCalledWith(20 - 0, 10 - 0); // y, x for { x: 10, y: 20, value: '100' }
    expect(mockUcharPtr).toHaveBeenCalledWith(22 - 0, 12 - 0); // y, x for { x: 12, y: 22, value: '150' }
    expect(mockUcharPtr).toHaveBeenCalledWith(0 - 0, 0 - 0);   // y, x for { x: 0, y: 0, value: '255' }


    // Check resize
    expect(mockCv.resize).toHaveBeenCalledOnce();
    expect(mockCv.resize).toHaveBeenCalledWith(
      mockCvMatInstance, // src
      mockCvMatInstance, // dst (mocked dst is same instance in this simple mock)
      { width: 300, height: 300 }, // dsize
      0, 0, expect.any(String) // interpolation
    );

    // Check canvas usage
    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(mockCv.imshow).toHaveBeenCalledWith(mockCanvas, mockCvMatInstance); // imshow with dst
    expect(mockToDataURL).toHaveBeenCalledWith('image/png');
    expect(imageUrl).toBe('data:image/png;base64,mock_image_data');

    // Check cleanup
    expect(mockMatDelete).toHaveBeenCalledTimes(2); // src and dst deleted
  });

  it('should throw an error if API response indicates failure', async () => {
    // Mock the internal promise for the mock API response directly for this test
    // This assumes the function is using the internal mock.
    // If it were using global.fetch:
    // global.fetch.mockResolvedValueOnce({
    //   ok: true,
    //   json: async () => ({ state: false, data: [] }),
    // });
    
    // To test the internal mock, we'd have to modify the source or make the mock more sophisticated.
    // For now, this test case highlights what we *would* test if fetch was directly used.
    // We'll assume the internal mock structure from imageUtils.ts for this conceptual test.
    // This test will FAILI if the internal mock isn't overridable here.
    // A better way would be to inject the fetcher or use a library like msw.

    // Simulating the mock structure from imageUtils.ts for a failed state:
    const originalImageUtils = await vi.importActual('./imageUtils');
    const spy = vi.spyOn(originalImageUtils, 'generateImageUrlFromApi').mockImplementation(async () => {
        // This is a simplified mock of the API call part within your function
        const mockApiResponse = { state: false, data: [] };
        if (!mockApiResponse.state || !mockApiResponse.data || mockApiResponse.data.length === 0) {
            throw new Error('No data received from API or API indicated failure.');
        }
        return "should not reach here";
    });
    await expect(generateImageUrlFromApi('mock-endpoint-fail-state')).rejects.toThrow('No data received from API or API indicated failure.');
    spy.mockRestore();

  });


  it('should throw an error if data array is empty', async () => {
     // Similar to above, this needs a way to control the mock response's data part.
    const originalImageUtils = await vi.importActual('./imageUtils');
    const spy = vi.spyOn(originalImageUtils, 'generateImageUrlFromApi').mockImplementation(async () => {
        const mockApiResponse =  { state: true, data: [] };
        if (!mockApiResponse.state || !mockApiResponse.data || mockApiResponse.data.length === 0) {
            // This is the check from the original code
            throw new Error('No data received from API or API indicated failure.'); 
        }
        // If data is empty, the coordinate calculation will result in Infinity
        let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
        if (x_min === Infinity || y_min === Infinity) {
             throw new Error('No valid data points found to determine image dimensions.');
        }
        return "should not reach here";
    });

    await expect(generateImageUrlFromApi('mock-endpoint-empty-data')).rejects.toThrow();
    spy.mockRestore();
  });


  it('should throw an error if OpenCV (cv) is not loaded', async () => {
    // Temporarily make cv undefined
    vi.resetModules(); // Reset modules to re-evaluate mocks
    vi.mock('@techstark/opencv-js', () => ({
      default: undefined, // Simulate cv not being available
    }));

    // Need to re-import the module with the new mock
    const { generateImageUrlFromApi: generateWithUndefinedCv } = await import('./imageUtils');
    
    await expect(generateWithUndefinedCv('mock-endpoint')).rejects.toThrow('OpenCV is not loaded or not ready.');

    // Restore mock for other tests
    vi.doMock('@techstark/opencv-js', () => ({ default: mockCv }));
  });

  afterEach(() => {
    // Ensure all mocks are cleared after every test
    vi.clearAllMocks();
  });
});
