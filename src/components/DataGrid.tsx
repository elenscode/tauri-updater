import { useMemo, useCallback } from "react";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ImageData } from '../types/image';
import { useImageDataStore } from '../store/useImageDataStore';

ModuleRegistry.registerModules([AllCommunityModule]);

function DataGrid() {
    const { searchResults, selectedGridItems, setSelectedGridItems } = useImageDataStore();

    // Column Definitions: Defines & controls grid columns.
    const colDefs = useMemo<ColDef<ImageData>[]>(() => [
        {
            field: "id",
            headerName: "ID",
            width: 60
        },
        {
            field: "key",
            headerName: "키",
        },
        {
            field: "name",
            headerName: "이미지 이름",
            flex: 1
        }
    ], []);

    const defaultColDef: ColDef = {
        flex: 1,
        sortable: true,
        filter: true,
    };

    // 선택 변경 핸들러
    const onSelectionChanged = useCallback((event: any) => {
        const selectedRows = event.api.getSelectedRows();
        const selectedIds = new Set<string>(selectedRows.map((row: ImageData) => row.id));
        setSelectedGridItems(selectedIds);
    }, [setSelectedGridItems]);

    // 그리드 준비 완료 시 초기 선택 상태 설정
    const onGridReady = useCallback((params: any) => {
        // 선택된 항목이 있다면 그리드에 반영
        if (selectedGridItems.size > 0) {
            params.api.forEachNode((node: any) => {
                if (selectedGridItems.has(node.data.id)) {
                    node.setSelected(true);
                }
            });
        }
    }, [selectedGridItems]);    // Container: Defines the grid's theme & dimensions.
    return (
        <div style={{ width: "100%", height: "720px" }}>
            <AgGridReact
                rowData={searchResults}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                    mode: "multiRow"
                }}
                onSelectionChanged={onSelectionChanged}
                onGridReady={onGridReady}
            />
        </div>
    );
}

DataGrid.displayName = "DataGrid";
export default DataGrid;