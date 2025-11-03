/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataGrid } from "@mui/x-data-grid";

const WarehouseTable = ({
  warehouses,
  onSelectWarehouse,
}: {
  warehouses: any[];
  onSelectWarehouse: (warehouseId: string) => void;
}) => {
  // ✅ Mỗi kho là 1 dòng duy nhất
  const rows = warehouses.map((wh) => ({
    id: wh.id,
    warehouseId: wh.id,
    warehouseName: wh.warehouseName,
    capacity: wh.capacity,
    status: wh.status,
  }));

  const columns = [
    { field: "warehouseName", headerName: "Tên kho", flex: 2, minWidth: 150 },
    { field: "capacity", headerName: "Sức chứa", flex: 1, width: 150 },
    { field: "status", headerName: "Trạng thái", flex: 1, width: 150 },
  ];

  return (
    <div style={{ height: 'auto', width: "100%" }}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
        onRowClick={(params) => onSelectWarehouse(params.row.warehouseId)}
      />
    </div>
  );
};

export default WarehouseTable;
