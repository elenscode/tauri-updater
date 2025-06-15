// Heatmap.tsx (TypeScript 버전)
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

// 타입 정의
interface DataPoint {
  x?: number;
  y?: number;
  value: number;
}

interface HeatmapProps {
  layout: DataPoint[];
  selectedCells?: Set<string>;
}

interface Coordinate {
  x: number;
  y: number;
}

type Mode = "toggle" | "select" | "deselect";

const Heatmap: React.FC<HeatmapProps> = ({
  layout,
  selectedCells: propSelectedCells,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(
    new Set(propSelectedCells || [])
  );
  // 세 가지 상호작용 모드(mode) 관리. 'toggle'을 기본값으로 설정
  const [mode, setMode] = useState<Mode>("toggle");
  // 좌표 입력 모달 관련 상태
  const [showModal, setShowModal] = useState<boolean>(false);
  const [coordinatesText, setCoordinatesText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // Y축 반전 및 라벨 개수 제어
  const [reverseY, setReverseY] = useState<boolean>(false);
  const [xLabelSplit, setXLabelSplit] = useState<number>(20);
  const [yLabelSplit, setYLabelSplit] = useState<number>(20);

  useEffect(() => {
    if (!layout || layout.length === 0) return;

    const filteredData = layout.filter(
      (d): d is Required<DataPoint> => d.x != null && d.y != null
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 800 - margin.top - margin.bottom;

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xLabels = [
      ...new Set(filteredData.map((d) => d.x?.toString() ?? "")),
    ].sort((a, b) => parseInt(a) - parseInt(b));
    const yLabels = [
      ...new Set(filteredData.map((d) => d.y?.toString() ?? "")),
    ].sort((a, b) => parseInt(a) - parseInt(b));

    // Y축 반전 처리
    const yDomain = reverseY ? yLabels.slice().reverse() : yLabels;

    const xScale = d3
      .scaleBand<string>()
      .domain(xLabels)
      .range([0, width])
      .padding(0.05);
    const yScale = d3
      .scaleBand<string>()
      .domain(yDomain)
      .range([0, height])
      .padding(0.05);

    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(filteredData, (d) => d.value) as [number, number]);

    const selectedColor = "#FF8F00";

    // 라벨 필터링 함수 (string[] 반환)
    const filterLabels = (labels: string[], splitNumber: number): string[] => {
      if (labels.length <= splitNumber) return labels;
      const step = Math.ceil(labels.length / splitNumber);
      return labels.filter((_, index) => index % step === 0);
    };

    // X축 (상단)
    const xAxis = d3
      .axisTop(xScale)
      .tickValues(filterLabels(xLabels, xLabelSplit));
    chart.append("g").call(xAxis);

    // Y축 (좌측)
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues(filterLabels(yDomain, yLabelSplit));
    chart.append("g").call(yAxis);

    chart
      .selectAll("rect")
      .data(
        filteredData,
        (d: any) => `${d.x?.toString() ?? ""}-${d.y?.toString() ?? ""}`
      )
      .join("rect")
      .attr("x", (d: Required<DataPoint>) => xScale(d.x?.toString() ?? "") || 0)
      .attr("y", (d: Required<DataPoint>) => yScale(d.y?.toString() ?? "") || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", (d: Required<DataPoint>) =>
        selectedCells.has(`${d.x?.toString() ?? ""}-${d.y?.toString() ?? ""}`)
          ? selectedColor
          : colorScale(d.value)
      )
      // 현재 모드가 'toggle'일 때만 커서를 'pointer'로 변경하여 클릭 가능함을 표시
      .style("cursor", mode === "toggle" ? "pointer" : "default")
      .on("click", (_event: any, d: Required<DataPoint>) => {
        if (mode !== "toggle") return;
        const key = `${d.x?.toString() ?? ""}-${d.y?.toString() ?? ""}`;
        setSelectedCells((prev) => {
          const newSelection = new Set(prev);
          if (newSelection.has(key)) {
            newSelection.delete(key);
          } else {
            newSelection.add(key);
          }
          return newSelection;
        });
      });

    // 브러시는 'select' 또는 'deselect' 모드일 때만 활성화
    if (mode === "select" || mode === "deselect") {
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("end", (event: d3.D3BrushEvent<any>) => {
          if (!event.selection) return;
          const [[x0, y0], [x1, y1]] = event.selection as [
            [number, number],
            [number, number]
          ];
          const cellsToUpdate = new Set<string>();

          filteredData.forEach((d) => {
            const cellX0 = xScale(d.x?.toString() ?? "") || 0;
            const cellX1 = cellX0 + xScale.bandwidth();
            const cellY0 = yScale(d.y?.toString() ?? "") || 0;
            const cellY1 = cellY0 + yScale.bandwidth();
            const overlaps =
              cellX0 < x1 && cellX1 > x0 && cellY0 < y1 && cellY1 > y0;

            if (overlaps) {
              cellsToUpdate.add(
                `${d.x?.toString() ?? ""}-${d.y?.toString() ?? ""}`
              );
            }
          });

          if (mode === "select") {
            setSelectedCells((prev) => new Set([...prev, ...cellsToUpdate]));
          } else if (mode === "deselect") {
            setSelectedCells((prev) => {
              const newSelection = new Set(prev);
              cellsToUpdate.forEach((key) => newSelection.delete(key));
              return newSelection;
            });
          }

          brushG.call(brush.move, null);
        });

      const brushG = chart.append("g").attr("class", "brush");
      brushG.call(brush);
    }
  }, [layout, selectedCells, mode, reverseY, xLabelSplit, yLabelSplit]); // 의존성 배열 업데이트

  // 좌표 입력 처리 함수
  const handleCoordinateSubmit = (): void => {
    const lines = coordinatesText.trim().split("\n");
    const invalidLines: string[] = [];
    const validCoordinates: Coordinate[] = [];
    const notFoundCoordinates: string[] = [];

    // 각 줄을 검증
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // 빈 줄 무시

      const parts = trimmedLine.split(",");
      if (parts.length !== 2) {
        invalidLines.push(
          `줄 ${
            index + 1
          }: "${trimmedLine}" - 쉼표로 구분된 X,Y 형식이어야 합니다`
        );
        return;
      }

      const x = parseInt(parts[0].trim());
      const y = parseInt(parts[1].trim());

      if (isNaN(x) || isNaN(y)) {
        invalidLines.push(
          `줄 ${index + 1}: "${trimmedLine}" - 올바른 숫자를 입력해주세요`
        );
        return;
      }

      // 데이터에서 해당 좌표가 존재하는지 확인
      const targetCell = layout.find((d) => d.x === x && d.y === y);
      if (!targetCell) {
        notFoundCoordinates.push(`(${x}, ${y})`);
        return;
      }

      validCoordinates.push({ x, y });
    });

    // 에러 메시지 설정
    let errorMsg = "";
    if (invalidLines.length > 0) {
      errorMsg += "잘못된 형식:\n" + invalidLines.join("\n");
    }
    if (notFoundCoordinates.length > 0) {
      if (errorMsg) errorMsg += "\n\n";
      errorMsg += "존재하지 않는 좌표:\n" + notFoundCoordinates.join(", ");
    }

    if (errorMsg) {
      setErrorMessage(errorMsg);
      return;
    }

    if (validCoordinates.length === 0) {
      setErrorMessage(
        "유효한 좌표를 입력해주세요.\n예시:\n13,40\n23,40\n33,50"
      );
      return;
    }

    // 유효한 좌표들을 모두 선택
    setSelectedCells((prev) => {
      const newSelection = new Set(prev);
      validCoordinates.forEach(({ x, y }) => {
        newSelection.add(`${x}-${y}`);
      });
      return newSelection;
    });

    // 모달 닫기 및 초기화
    setShowModal(false);
    setCoordinatesText("");
    setErrorMessage("");
  };

  // 모달 닫기 함수
  const handleModalClose = (): void => {
    setShowModal(false);
    setCoordinatesText("");
    setErrorMessage("");
  };

  // 선택된 좌표 추출 함수
  const handleExtractCoordinates = (): void => {
    const coordinates = Array.from(selectedCells)
      .map((cellKey) => {
        const [x, y] = cellKey.split("-");
        return { x: parseInt(x), y: parseInt(y) };
      })
      .sort((a, b) => a.x - b.x || a.y - b.y);

    const coordinatesText = coordinates
      .map((coord) => `${coord.x},${coord.y}`)
      .join("\n");

    // 클립보드에 복사
    navigator.clipboard
      .writeText(coordinatesText)
      .then(() => {
        alert(
          `선택된 ${coordinates.length}개의 좌표가 클립보드에 복사되었습니다.\n\n${coordinatesText}`
        );
      })
      .catch(() => {
        // 클립보드 복사 실패 시 텍스트로 표시
        const textarea = document.createElement("textarea");
        textarea.value = coordinatesText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert(
          `선택된 ${coordinates.length}개의 좌표가 클립보드에 복사되었습니다.\n\n${coordinatesText}`
        );
      });
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setMode("toggle")}
          style={{
            backgroundColor: mode === "toggle" ? "#81d4fa" : "#e0e0e0",
            border: "1px solid #ccc",
            padding: "5px 10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          토글 (클릭)
        </button>
        <button
          onClick={() => setMode("select")}
          style={{
            backgroundColor: mode === "select" ? "#aed581" : "#e0e0e0",
            border: "1px solid #ccc",
            padding: "5px 10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Brush (선택)
        </button>
        <button
          onClick={() => setMode("deselect")}
          style={{
            backgroundColor: mode === "deselect" ? "#ffab91" : "#e0e0e0",
            border: "1px solid #ccc",
            padding: "5px 10px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Brush (지우기)
        </button>
        <div
          style={{
            marginLeft: "20px",
            borderLeft: "1px solid #ccc",
            paddingLeft: "20px",
          }}
        >
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: "#e1bee7",
              border: "1px solid #ccc",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            좌표 입력
          </button>
          <button
            onClick={handleExtractCoordinates}
            disabled={selectedCells.size === 0}
            style={{
              backgroundColor: selectedCells.size === 0 ? "#e0e0e0" : "#b39ddb",
              border: "1px solid #ccc",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: selectedCells.size === 0 ? "not-allowed" : "pointer",
              opacity: selectedCells.size === 0 ? 0.6 : 1,
            }}
          >
            추출 ({selectedCells.size})
          </button>
        </div>
      </div>

      {/* 축 및 라벨 설정 - 기능 확장을 위해 주석으로 우선 처리 */}
      {/* <div
        style={{
          marginBottom: "10px",
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={reverseY}
                onChange={(e) => setReverseY(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Y축 반전
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              X축 라벨 개수:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={xLabelSplit}
              onChange={(e) => setXLabelSplit(parseInt(e.target.value) || 1)}
              style={{
                width: "60px",
                padding: "4px 6px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              Y축 라벨 개수:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={yLabelSplit}
              onChange={(e) => setYLabelSplit(parseInt(e.target.value) || 1)}
              style={{
                width: "60px",
                padding: "4px 6px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      </div> */}

      <p>
        현재 모드: <strong>{mode}</strong>
      </p>
      <svg ref={svgRef} width="800" height="800"></svg>

      {/* 좌표 입력 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", textAlign: "center" }}>
              좌표 입력
            </h3>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                좌표 목록 (X,Y 형식으로 한 줄에 하나씩):
              </label>
              <textarea
                value={coordinatesText}
                onChange={(e) => setCoordinatesText(e.target.value)}
                style={{
                  width: "100%",
                  height: "120px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
                placeholder="예시:&#10;13,40&#10;23,40&#10;33,50"
              />
            </div>
            {errorMessage && (
              <div
                style={{
                  color: "red",
                  fontSize: "12px",
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "#ffebee",
                  border: "1px solid #ffcdd2",
                  borderRadius: "4px",
                  whiteSpace: "pre-line",
                  fontFamily: "monospace",
                }}
              >
                {errorMessage}
              </div>
            )}
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={handleCoordinateSubmit}
                style={{
                  backgroundColor: "#4caf50",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                선택
              </button>
              <button
                onClick={handleModalClose}
                style={{
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
