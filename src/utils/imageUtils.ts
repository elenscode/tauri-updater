import { PointData } from '../types/image';
import { getCV } from './opencvLoaders';


// API response data structure
interface ApiDataItem {
  x: number;
  y: number;
  value: string; // Assuming value comes as a string initially
}

interface ApiResponse {
  state: boolean;
  data: ApiDataItem[];
}

// Mock API endpoint for now
const MOCK_API_ENDPOINT = '/api/image-data';

/**
 * Fetches data from an API, processes it to create an image,
 * resizes the image, and returns it as a data URL.
 *
 * @param apiEndpoint The URL of the API to fetch data from.
 *                    Defaults to a mock endpoint if not provided.
 * @returns A Promise that resolves to a string containing the data URL of the image,
 *          or rejects with an error.
 */
export async function generateImageUrlFromApi(apiEndpoint: string = MOCK_API_ENDPOINT): Promise<string> {
  const cv = await getCV();
  try {
    // 1. Ensure OpenCV is ready (cv object should be available globally)
    // For @techstark/opencv-js, it's typically available after import.
    // A more robust check might involve cv.onRuntimeInitialized if issues arise.
    if (typeof cv === 'undefined' || typeof cv.Mat === 'undefined') {
      console.error('OpenCV is not loaded or not ready.');
      throw new Error('OpenCV is not loaded or not ready.');
    }
    console.log('OpenCV loaded successfully.');

    // 2. Fetch data from the API
    console.log(`Fetching data from ${apiEndpoint}...`);

    // MOCK IMPLEMENTATION:
    // Replace this with an actual fetch call when the API is ready
    const mockApiResponse: ApiResponse = await new Promise(resolve => setTimeout(() => {
      resolve({
        state: true,
        data: [
          { x: 10, y: 20, value: '100' },
          { x: 12, y: 22, value: '150' },
          { x: 10, y: 21, value: '50' },
          { x: 100, y: 150, value: '200' },
          { x: 0, y: 0, value: '255' } // For testing bounds
        ],
      });
    }, 500));

    // const httpResponse = await fetch(apiEndpoint, { method: 'POST' });
    // if (!httpResponse.ok) {
    //   throw new Error(`API request failed with status ${httpResponse.status}`);
    // }
    // const response: ApiResponse = await httpResponse.json();

    const response = mockApiResponse; // Using mock for now

    if (!response.state || !response.data || response.data.length === 0) {
      console.warn('API response indicates no data or failed state.');
      throw new Error('No data received from API or API indicated failure.');
    }

    const { data } = response;

    // 3. Parse data and find dimensions
    let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;

    for (const item of data) {
      if (item.x < x_min) x_min = item.x;
      if (item.x > x_max) x_max = item.x;
      if (item.y < y_min) y_min = item.y;
      if (item.y > y_max) y_max = item.y;
    }

    if (x_min === Infinity || y_min === Infinity) { // handles empty or invalid data points
      throw new Error('No valid data points found to determine image dimensions.');
    }

    const img_width = x_max - x_min + 1;
    const img_height = y_max - y_min + 1;

    if (img_width <= 0 || img_height <= 0) {
      throw new Error('Calculated image dimensions are invalid.');
    }
    console.log(`Original image dimensions: ${img_width}x${img_height}`);


    // 4. Create and populate image matrix (grayscale image, CV_8UC1)
    // Initialize with black (0)
    let src = new cv.Mat(img_height, img_width, cv.CV_8UC1, new cv.Scalar(0));

    for (const item of data) {
      const x = item.x - x_min;
      const y = item.y - y_min;
      const value = parseInt(item.value, 10);

      if (isNaN(value) || value < 0 || value > 255) {
        console.warn(`Invalid pixel value '${item.value}' for point (${item.x}, ${item.y}). Clamping or skipping.`);
        // Option: clamp value or skip. For now, let's clamp.
        const clampedValue = Math.max(0, Math.min(255, value || 0));
        src.ucharPtr(y, x)[0] = clampedValue;
      } else {
        src.ucharPtr(y, x)[0] = value;
      }
    }
    console.log('Image matrix populated.');

    // 5. Resize image to 300x300
    let dst = new cv.Mat();
    let dsize = new cv.Size(300, 300);
    // You can use different interpolation methods: cv.INTER_LINEAR, cv.INTER_NEAREST, cv.INTER_AREA etc.
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_LINEAR);
    console.log('Image resized to 300x300.');

    // 6. Generate Data URL
    // To convert cv.Mat to data URL, we typically draw it on a canvas and then use canvas.toDataURL()
    const canvas = document.createElement('canvas');
    canvas.width = dst.cols;
    canvas.height = dst.rows;
    cv.imshow(canvas, dst); // This function draws the Mat onto the canvas
    const dataUrl = canvas.toDataURL('image/png'); // Or 'image/jpeg'
    console.log('Data URL generated.');

    // 7. Clean up OpenCV Mats
    src.delete();
    dst.delete();
    console.log('OpenCV Mats cleaned up.');

    return dataUrl;

  } catch (error) {
    console.error('Error in generateImageUrlFromApi:', error);
    // Clean up any mats if they were created before error
    // This is tricky as 'src' and 'dst' might not be defined.
    // A more robust way would be to wrap mat creations in try/finally.
    // For now, @techstark/opencv-js might handle some memory internally or via GC.
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Example of how one might call this function (for testing purposes, not part of the util itself)
/*
async function testImageGeneration() {
  try {
    console.log('Testing image generation...');
    // Ensure the DOM is ready if running in a browser context for canvas creation
    if (typeof window !== 'undefined' && document.readyState === 'complete') {
      const imageUrl = await generateImageUrlFromApi();
      console.log('Generated Image URL:', imageUrl);
      // You could then display this image:
      // const imgElement = document.createElement('img');
      // imgElement.src = imageUrl;
      // document.body.appendChild(imgElement);
    } else if (typeof window === 'undefined') {
      // Node.js environment - canvas element will not work here without a polyfill like 'canvas'
      console.warn('Cannot fully test in Node.js without a canvas polyfill for data URL generation.');
      // Partial test (up to matrix creation/resize, skip data URL)
       await generateImageUrlFromApi();


    } else {
      window.onload = async () => {
        const imageUrl = await generateImageUrlFromApi();
        console.log('Generated Image URL (on window.onload):', imageUrl);
      };
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

// Call the test function if not in a strictly module-only environment (e.g. for quick testing)
// if (typeof require !== 'undefined' && require.main === module) { // Basic check for Node.js run
//    testImageGeneration();
// }
// Or for browser, you might call testImageGeneration() from an appropriate place.
*/

export async function generateImageDataUrlFromPoints(
  points: PointData[],
  outputSize: { width: number; height: number } = { width: 250, height: 250 },
  padding: number = 0,
  binaryOptions?: { selectedValues: number[]; isBinary: boolean }
): Promise<string> {
  const cv = await getCV();

  // 1) Bounding box 계산
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  points.forEach(p => {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  });
  const rawWidth = xMax - xMin + 1;
  const rawHeight = yMax - yMin + 1;

  // 전체 Mat 크기에 padding 포함
  const width = rawWidth + padding * 2;
  const height = rawHeight + padding * 2;  // 2) 값 정규화: [minVal,maxVal] -> [0,255] 또는 이진화 처리
  const rawValues = points.map(p => parseInt(p.value, 10));
  const normalizedValues = new Map<string, number>();

  // 이진화 옵션이 있는 경우 처리
  if (binaryOptions?.isBinary && binaryOptions.selectedValues.length > 0) {
    // 이진화: 선택된 값들은 255, 나머지는 0
    points.forEach(p => {
      const raw = parseInt(p.value, 10);
      const key = `${p.x}-${p.y}`;
      normalizedValues.set(key, binaryOptions.selectedValues.includes(raw) ? 255 : 0);
    });
  } else {
    // 일반 정규화 처리
    const minVal = Math.min(...rawValues);
    const maxVal = Math.max(...rawValues);
    points.forEach(p => {
      const raw = parseInt(p.value, 10);
      const key = `${p.x}-${p.y}`;
      const normalized = maxVal !== minVal
        ? Math.round(((raw - minVal) / (maxVal - minVal)) * 255)
        : (raw > 0 ? 255 : 0);
      normalizedValues.set(key, normalized);
    });
  }
  // 3) 그레이스케일 Mat 생성 및 픽셀값 설정 (padding 오프셋 적용)
  const src = cv.Mat.zeros(height, width, cv.CV_8UC1);
  points.forEach(p => {
    const key = `${p.x}-${p.y}`;
    const normalizedValue = normalizedValues.get(key) || 0;
    const x0 = p.x - xMin + padding;
    const y0 = p.y - yMin + padding;
    src.ucharPtr(y0, x0)[0] = normalizedValue;
  });

  // 4) RGBA Mat 생성 및 JET 컬러맵 직접 계산
  const rgbaMat = cv.Mat.zeros(height, width, cv.CV_8UC4);
  const toJet = (i: number) => {
    const t = i / 255;
    const r = Math.round(Math.max(0, Math.min(1.5 - Math.abs(4 * t - 3), 1)) * 255);
    const g = Math.round(Math.max(0, Math.min(1.5 - Math.abs(4 * t - 2), 1)) * 255);
    const b = Math.round(Math.max(0, Math.min(1.5 - Math.abs(4 * t - 1), 1)) * 255);
    return { r, g, b };
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = src.ucharPtr(y, x)[0];
      const pixel = rgbaMat.ucharPtr(y, x);
      if (v === 0) {
        pixel[3] = 0; // alpha 0
      } else {
        const { r, g, b } = toJet(v);
        pixel[0] = b; // B
        pixel[1] = g; // G
        pixel[2] = r; // R
        pixel[3] = 255; // alpha full
      }
    }
  }

  // 5) nearest-neighbor 리사이즈
  const resized = new cv.Mat();
  const dsize = new cv.Size(outputSize.width, outputSize.height);
  cv.resize(rgbaMat, resized, dsize, 0, 0, cv.INTER_NEAREST);

  // 6) Offscreen canvas → Data URL
  const canvas = document.createElement('canvas');
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;
  cv.imshow(canvas, resized);
  const dataUrl = canvas.toDataURL('image/png');

  // 메모리 해제
  src.delete();
  rgbaMat.delete();
  resized.delete();

  return dataUrl;
}
