import React, { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import WarehouseMap from "./WarehouseMap";
import WarehouseForm from "./components/WarehouseForm";
import { useWarehouseData } from "./hook/useWarehouseData";
import LoadingPage from "@/pages/LoadingPage";
import ZoneForm from "./components/ZoneForm";
import LocationForm from "./components/LocationForm";

const WarehouseManagement: React.FC = () => {
  const { warehouses, loading, refetch, storeId } = useWarehouseData();

  // State cho Warehouse Form
  const [openForm, setOpenForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // State cho Zone Form (✅ Cập nhật)
  const [openZoneForm, setOpenZoneForm] = useState(false);
  const [zoneFormMode, setZoneFormMode] = useState<"create" | "edit">("create");
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<{
    id: string | null; // ID có thể null khi tạo mới
    warehouseId: string;
  } | null>(null);

  // State cho Location Form (✅ Cập nhật)
  const [openLocationForm, setOpenLocationForm] = useState(false);
  const [locationFormMode, setLocationFormMode] = useState<"create" | "edit">(
    "create"
  );
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<{
    id: string | null; // ID có thể null khi tạo mới
    zoneId: string;
  } | null>(null);

  if (loading) return <LoadingPage />;
  console.log("STORE ID:", storeId);

  // Hàm: Xử lý mở form chỉnh sửa Zone (✅ Cập nhật)
  const handleEditZone = (id: string, warehouseId: string) => {
    setSelectedZoneInfo({ id, warehouseId });
    setZoneFormMode("edit");
    setOpenZoneForm(true);
  };

  // ✅ Hàm mới: Xử lý mở form tạo Zone
  const handleCreateZone = (warehouseId: string) => {
    setSelectedZoneInfo({ id: null, warehouseId });
    setZoneFormMode("create");
    setOpenZoneForm(true);
  };

  // Hàm: Xử lý mở form chỉnh sửa Location (✅ Cập nhật)
  const handleEditLocation = (id: string, zoneId: string) => {
    setSelectedLocationInfo({ id, zoneId });
    setLocationFormMode("edit");
    setOpenLocationForm(true);
  };

  // ✅ Hàm mới: Xử lý mở form tạo Location
  const handleCreateLocation = (zoneId: string) => {
    setSelectedLocationInfo({ id: null, zoneId });
    setLocationFormMode("create");
    setOpenLocationForm(true);
  };

  // ✅ Hàm chung để đóng và reset form
  const closeZoneForm = () => {
    setOpenZoneForm(false);
    setSelectedZoneInfo(null);
  };

  const closeLocationForm = () => {
    setOpenLocationForm(false);
    setSelectedLocationInfo(null);
  };

  return (
    <Box p={3}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <h2>Quản lý kho hàng</h2>
      </Stack>

      {!loading && warehouses.length > 0 ? (
        // Nếu có kho hàng, hiển thị bản đồ
        <WarehouseMap
          warehouses={warehouses}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            setFormMode("edit");
            setOpenForm(true);
          }}
          onEditZone={handleEditZone}
          onEditLocation={handleEditLocation}
          onCreateZone={handleCreateZone} // ✅ Mới
          onCreateLocation={handleCreateLocation} // ✅ Mới
        />
      ) : (
        // ... (phần code trạng thái trống giữ nguyên) ...
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mt={5}
          p={3}
          sx={{ border: "1px dashed #ccc", borderRadius: 2, bgcolor: "#f9f9f9" }}
        >
          <Box
            component="img"
            src="https://i.pinimg.com/1200x/72/9a/27/729a27bbcd296a80867dc5dd1d73690f.jpg"
            alt="Không tìm thấy kho hàng"
            sx={{
              width: { xs: "200px", md: "300px" },
              height: "auto",
              mb: 3,
              borderRadius: "8px",
              boxShadow: 3,
            }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <Typography variant="h6" textAlign="center" color="text.secondary">
              Không tìm thấy kho hàng của bạn. Nếu chưa có hãy tạo kho hàng
            </Typography>
            <Button
              disabled={loading || !storeId} // Giữ logic disable
              variant="contained"
              color="primary"
              onClick={() => {
                setSelectedWarehouseId(null);
                setFormMode("create");
                setOpenForm(true);
              }}
            >
              + Tạo kho hàng
            </Button>
          </Stack>
        </Box>
      )}

      {/* Form kho hàng (đã có) */}
      {storeId && (
        <WarehouseForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          mode={formMode}
          warehouseId={selectedWarehouseId || undefined}
          storeId={storeId}
          onSuccess={refetch}
        />
      )}

      {/* Form khu vực (✅ Cập nhật) */}
      {selectedZoneInfo && (
        <ZoneForm
          open={openZoneForm}
          onClose={closeZoneForm}
          mode={zoneFormMode} // Sử dụng mode
          warehouseId={selectedZoneInfo.warehouseId}
          zoneId={selectedZoneInfo.id || undefined} // Id chỉ có khi edit
          onSuccess={() => {
            closeZoneForm();
            refetch(); // Tải lại toàn bộ dữ liệu
          }}
        />
      )}

      {/* Form vị trí (✅ Cập nhật) */}
      {selectedLocationInfo && (
        <LocationForm
          open={openLocationForm}
          onClose={closeLocationForm}
          mode={locationFormMode} // Sử dụng mode
          zoneId={selectedLocationInfo.zoneId}
          locationItemId={selectedLocationInfo.id || undefined} // Id chỉ có khi edit
          onSuccess={() => {
            closeLocationForm();
            refetch(); // Tải lại toàn bộ dữ liệu
          }}
        />
      )}
    </Box>
  );
};

export default WarehouseManagement;