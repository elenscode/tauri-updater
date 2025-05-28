use base64::{engine::general_purpose, Engine as _};
use image::{ImageBuffer, ImageFormat, Rgb};
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Debug, Deserialize)]
pub struct DataPoint {
    pub x: f32,
    pub y: f32,
    pub value: f32,
}

#[derive(Debug, Deserialize)]
pub struct ApiResponse {
    pub data: Vec<DataPoint>,
}

#[derive(Debug, Serialize)]
pub struct ImageResult {
    pub success: bool,
    pub image_base64: Option<String>,
    pub error: Option<String>,
}

pub struct ImageGenerator {
    width: u32,
    height: u32,
}

impl Default for ImageGenerator {
    fn default() -> Self {
        Self::new(150, 150)
    }
}

impl ImageGenerator {
    pub fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }

    /// 이미지 키를 받아서 API 호출 후 이미지를 생성합니다.
    pub async fn generate_image_from_data(&self, image_key: String) -> Result<ImageResult, String> {
        // 테스트를 위해 샘플 데이터를 생성하거나 실제 API 호출을 수행
        let api_data = if image_key == "sample_test_key" {
            // 샘플 데이터 생성
            self.generate_sample_data()
        } else {
            // 실제 API 호출
            match self.call_external_api(&image_key).await {
                Ok(data) => data,
                Err(e) => {
                    return Ok(ImageResult {
                        success: false,
                        image_base64: None,
                        error: Some(format!("API 호출 실패: {}", e)),
                    })
                }
            }
        };

        // 데이터 포인트로부터 이미지 생성
        let image_result = self
            .create_image_from_points(&api_data.data)
            .map_err(|e| format!("이미지 생성 실패: {}", e))?;

        Ok(ImageResult {
            success: true,
            image_base64: Some(image_result),
            error: None,
        })
    }

    /// 샘플 데이터 생성 함수
    fn generate_sample_data(&self) -> ApiResponse {
        let mut data = Vec::new();

        // 원형 패턴 생성
        for i in 0..30 {
            let angle = (i as f32) * 2.0 * std::f32::consts::PI / 30.0;
            let radius = 30.0 + (i as f32) * 2.0;
            data.push(DataPoint {
                x: 50.0 + radius * angle.cos(),
                y: 50.0 + radius * angle.sin(),
                value: (i as f32) / 10.0,
            });
        }

        // 랜덤 포인트 추가
        for i in 0..20 {
            data.push(DataPoint {
                x: (i as f32 * 7.5) % 100.0,
                y: (i as f32 * 11.3) % 100.0,
                value: (i as f32) % 8.0,
            });
        }

        ApiResponse { data }
    }

    /// 실제 API 호출 함수
    async fn call_external_api(
        &self,
        image_key: &str,
    ) -> Result<ApiResponse, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();

        // TODO: 실제 엔드포인트 URL로 변경해야 합니다
        let api_url = "http://localhost:3000/generator";

        let response = client
            .post(api_url)
            .json(&serde_json::json!({ "imagekey": image_key }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("API 응답 오류: {}", response.status()).into());
        }

        let api_data: ApiResponse = response.json().await?;
        Ok(api_data)
    }
    /// 데이터 포인트들로부터 이미지를 생성합니다.
    fn create_image_from_points(
        &self,
        points: &[DataPoint],
    ) -> Result<String, Box<dyn std::error::Error>> {
        if points.is_empty() {
            let img =
                ImageBuffer::from_fn(self.width, self.height, |_x, _y| Rgb([255u8, 255u8, 255u8]));
            return self.encode_image_to_base64(&img);
        }

        // 데이터 포인트의 범위 계산
        let bounds = self.calculate_bounds(points);

        // 데이터 범위 크기를 기반으로 기본 해상도 결정 (최소 50x50, 최대 500x500)
        let base_width = ((bounds.x_range * 10.0) as u32).clamp(50, 500);
        let base_height = ((bounds.y_range * 10.0) as u32).clamp(50, 500);

        // 기본 해상도로 이미지 생성 (흰색 배경)
        let mut base_img =
            ImageBuffer::from_fn(base_width, base_height, |_x, _y| Rgb([255u8, 255u8, 255u8]));

        // 각 포인트를 기본 이미지에 그리기
        for point in points {
            self.draw_point_to_base_image(&mut base_img, point, &bounds, base_width, base_height);
        }

        // 기본 이미지를 최종 크기로 리사이즈
        let resized_img = self.resize_image(base_img, self.width, self.height)?;

        self.encode_image_to_base64(&resized_img)
    }

    /// 데이터 포인트들의 경계값을 계산합니다.
    fn calculate_bounds(&self, points: &[DataPoint]) -> DataBounds {
        let min_x = points.iter().map(|p| p.x).fold(f32::INFINITY, f32::min);
        let max_x = points.iter().map(|p| p.x).fold(f32::NEG_INFINITY, f32::max);
        let min_y = points.iter().map(|p| p.y).fold(f32::INFINITY, f32::min);
        let max_y = points.iter().map(|p| p.y).fold(f32::NEG_INFINITY, f32::max);
        let min_value = points.iter().map(|p| p.value).fold(f32::INFINITY, f32::min);
        let max_value = points
            .iter()
            .map(|p| p.value)
            .fold(f32::NEG_INFINITY, f32::max);

        // 범위가 0인 경우 처리
        let x_range = if (max_x - min_x).abs() < f32::EPSILON {
            1.0
        } else {
            max_x - min_x
        };
        let y_range = if (max_y - min_y).abs() < f32::EPSILON {
            1.0
        } else {
            max_y - min_y
        };
        let value_range = if (max_value - min_value).abs() < f32::EPSILON {
            1.0
        } else {
            max_value - min_value
        };

        DataBounds {
            min_x,
            min_y,
            min_value,
            x_range,
            y_range,
            value_range,
        }
    }
    /// 하나의 데이터 포인트를 기본 이미지에 그립니다.
    fn draw_point_to_base_image(
        &self,
        img: &mut ImageBuffer<Rgb<u8>, Vec<u8>>,
        point: &DataPoint,
        bounds: &DataBounds,
        img_width: u32,
        img_height: u32,
    ) {
        // 좌표 정규화 (0.0 ~ 1.0)
        let norm_x = (point.x - bounds.min_x) / bounds.x_range;
        let norm_y = (point.y - bounds.min_y) / bounds.y_range;
        let norm_value = (point.value - bounds.min_value) / bounds.value_range;

        // 기본 이미지 좌표로 변환
        let pixel_x = (norm_x * (img_width - 1) as f32) as u32;
        let pixel_y = (norm_y * (img_height - 1) as f32) as u32;

        // value를 색상으로 변환
        let color = self.value_to_color(norm_value);

        // 기본 이미지 크기에 따른 점 크기 계산 (최소 1, 최대 이미지 크기의 10%)
        let point_size = std::cmp::max(1, std::cmp::min(img_width / 10, img_height / 10)) as i32;
        let half_size = point_size / 2;

        // 점의 중심을 기준으로 채우기
        for dx in -half_size..=half_size {
            for dy in -half_size..=half_size {
                let new_x = pixel_x as i32 + dx;
                let new_y = pixel_y as i32 + dy;

                // 이미지 범위 내에 있는지 확인
                if new_x >= 0 && new_x < img_width as i32 && new_y >= 0 && new_y < img_height as i32
                {
                    img.put_pixel(new_x as u32, new_y as u32, color);
                }
            }
        }
    }

    /// 이미지를 지정된 크기로 리사이즈합니다.
    fn resize_image(
        &self,
        img: ImageBuffer<Rgb<u8>, Vec<u8>>,
        target_width: u32,
        target_height: u32,
    ) -> Result<ImageBuffer<Rgb<u8>, Vec<u8>>, Box<dyn std::error::Error>> {
        use image::{imageops::FilterType, DynamicImage};

        let dynamic_img = DynamicImage::ImageRgb8(img);
        let resized = dynamic_img.resize(target_width, target_height, FilterType::Lanczos3);

        match resized {
            DynamicImage::ImageRgb8(rgb_img) => Ok(rgb_img),
            _ => {
                // 다른 형식일 경우 RGB로 변환
                let rgb_img = resized.to_rgb8();
                Ok(rgb_img)
            }
        }
    }
    /// 정규화된 값을 RGB 색상으로 변환합니다.
    fn value_to_color(&self, normalized_value: f32) -> Rgb<u8> {
        // value에 따라 색상 그라디언트 생성 (파란색 -> 초록색 -> 빨간색)
        let value = normalized_value.clamp(0.0, 1.0);

        if value < 0.5 {
            // 파란색 -> 초록색
            let t = value * 2.0;
            Rgb([0, (t * 255.0) as u8, ((1.0 - t) * 255.0) as u8])
        } else {
            // 초록색 -> 빨간색
            let t = (value - 0.5) * 2.0;
            Rgb([(t * 255.0) as u8, ((1.0 - t) * 255.0) as u8, 0])
        }
    }

    /// 이미지를 Base64 문자열로 인코딩합니다.
    fn encode_image_to_base64(
        &self,
        img: &ImageBuffer<Rgb<u8>, Vec<u8>>,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);

        // JPEG 형식으로 인코딩
        img.write_to(&mut cursor, ImageFormat::Jpeg)?;

        // Base64로 인코딩
        let base64_string = general_purpose::STANDARD.encode(&buffer);
        Ok(format!("data:image/jpeg;base64,{}", base64_string))
    }
}

/// 데이터 포인트들의 경계값을 저장하는 구조체
#[derive(Debug)]
struct DataBounds {
    min_x: f32,
    min_y: f32,
    min_value: f32,
    x_range: f32,
    y_range: f32,
    value_range: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_generator_creation() {
        let generator = ImageGenerator::new(100, 100);
        assert_eq!(generator.width, 100);
        assert_eq!(generator.height, 100);
    }

    #[test]
    fn test_sample_data_generation() {
        let generator = ImageGenerator::default();
        let data = generator.generate_sample_data();
        assert_eq!(data.data.len(), 50); // 30 + 20 points
    }
    #[test]
    fn test_value_to_color() {
        let generator = ImageGenerator::default();

        // 테스트: 0.0 -> 파란색
        let blue = generator.value_to_color(0.0);
        assert_eq!(blue, Rgb([0, 0, 255]));

        // 테스트: 0.5 -> 초록색
        let green = generator.value_to_color(0.5);
        assert_eq!(green, Rgb([0, 255, 0]));

        // 테스트: 1.0 -> 빨간색
        let red = generator.value_to_color(1.0);
        assert_eq!(red, Rgb([255, 0, 0]));
    }

    #[test]
    fn test_resize_image() {
        let generator = ImageGenerator::new(100, 100);

        // 작은 크기의 테스트 이미지 생성 (10x10)
        let small_img = ImageBuffer::from_fn(10, 10, |x, y| {
            if x == 5 && y == 5 {
                Rgb([255, 0, 0]) // 중앙에 빨간 점
            } else {
                Rgb([255, 255, 255]) // 흰색 배경
            }
        });

        // 100x100으로 리사이즈
        let resized = generator.resize_image(small_img, 100, 100);
        assert!(resized.is_ok());

        let resized_img = resized.unwrap();
        assert_eq!(resized_img.width(), 100);
        assert_eq!(resized_img.height(), 100);
    }

    #[test]
    fn test_draw_point_to_base_image() {
        let generator = ImageGenerator::default();
        let mut img = ImageBuffer::from_fn(50, 50, |_x, _y| Rgb([255u8, 255u8, 255u8]));

        let point = DataPoint {
            x: 25.0,
            y: 25.0,
            value: 0.5,
        };

        let bounds = DataBounds {
            min_x: 0.0,
            min_y: 0.0,
            min_value: 0.0,
            x_range: 50.0,
            y_range: 50.0,
            value_range: 1.0,
        };

        generator.draw_point_to_base_image(&mut img, &point, &bounds, 50, 50);

        // 중앙 부근에 색상이 변경되었는지 확인
        let center_pixel = img.get_pixel(25, 25);
        assert_ne!(*center_pixel, Rgb([255, 255, 255])); // 흰색이 아님을 확인
    }
}
