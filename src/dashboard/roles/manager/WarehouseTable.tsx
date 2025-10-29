/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataGrid } from "@mui/x-data-grid";

const WarehouseTable = ({ warehouses }: { warehouses: any[] }) => {
  const rows = warehouses.flatMap((wh) =>
    wh.zones.map((z: any) => ({
      id: `${wh.id}-${z.id}`,
      warehouseName: wh.warehouseName,
      capacity: wh.capacity,
      warehouseStatus: wh.status,
      zoneName: z.zoneName,
      zoneCode: z.zoneCode,
      zoneStatus: z.status,
      quantity: z.quantity,
    }))
  );

  const columns = [
    { field: "warehouseName", headerName: "Kho", flex: 1 },
    { field: "warehouseStatus", headerName: "Trạng thái kho", width: 150 },
    { field: "capacity", headerName: "Sức chứa", width: 120 },
    { field: "zoneCode", headerName: "Mã khu", width: 100 },
    { field: "zoneName", headerName: "Tên khu vực", flex: 1 },
    { field: "zoneStatus", headerName: "Trạng thái khu", width: 150 },
    { field: "quantity", headerName: "Số lượng chứa", width: 150 },
  ];

  return (
    <div style={{ height: 500, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
      />
    </div>
  );
};

export default WarehouseTable;
