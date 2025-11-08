import React, { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import WarehouseMap from "./WarehouseMap";
import WarehouseForm from "./components/WarehouseForm"; // Giả định component tồn tại
import ZoneForm from "./components/ZoneForm"; // Giả định component tồn tại
import LocationForm from "./components/LocationForm"; // Giả định component tồn tại
// import InventoryTableListModal from "./components/InventoryTableListModal"; // ✅ Giữ lại import component mới
import LoadingPage from "@/pages/LoadingPage"; // Giả định component tồn tại

import { useWarehouseData } from "./hook/useWarehouseData"; // Giả định hook tồn tại

// Khai báo kiểu cho entity (Kho, Khu, Vị trí) (Giữ nguyên)
type EntityType = 'WAREHOUSE' | 'ZONE' | 'LOCATION';

const WarehouseManagement: React.FC = () => {
  const { warehouses, loading, refetch, storeId } = useWarehouseData();
  // State cho Warehouse Form (Giữ nguyên)
  const [openForm, setOpenForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(
    null
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // State cho Zone Form (Giữ nguyên)
  const [openZoneForm, setOpenZoneForm] = useState(false);
  const [zoneFormMode, setZoneFormMode] = useState<"create" | "edit">("create");
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<{
    id: string | null;
    warehouseId: string;
  } | null>(null);

  // State cho Location Form (Giữ nguyên)
  const [openLocationForm, setOpenLocationForm] = useState(false);
  const [locationFormMode, setLocationFormMode] = useState<"create" | "edit">(
    "create"
  );
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<{
    id: string | null;
    zoneId: string;
  } | null>(null);

  // Hàm đóng Form Zone (Giữ nguyên)
  const closeZoneForm = () => {
    setOpenZoneForm(false);
    setSelectedZoneInfo(null);
  };

  // Hàm tạo Zone (Giữ nguyên)
  const handleCreateZone = (warehouseId: string) => {
    setZoneFormMode("create");
    setSelectedZoneInfo({ id: null, warehouseId });
    setOpenZoneForm(true);
  };

  // Hàm chỉnh sửa Zone (Giữ nguyên)
  const handleEditZone = (zoneId: string, warehouseId: string) => {
    setZoneFormMode("edit");
    setSelectedZoneInfo({ id: zoneId, warehouseId });
    setOpenZoneForm(true);
  };

  // Hàm đóng Form Location (Giữ nguyên)
  const closeLocationForm = () => {
    setOpenLocationForm(false);
    setSelectedLocationInfo(null);
  };

  // Hàm tạo Location (Giữ nguyên)
  const handleCreateLocation = (zoneId: string) => {
    setLocationFormMode("create");
    setSelectedLocationInfo({ id: null, zoneId });
    setOpenLocationForm(true);
  }

  // Hàm chỉnh sửa Location (Giữ nguyên)
  const handleEditLocation = (locationItemId: string, zoneId: string) => {
    setLocationFormMode("edit");
    setSelectedLocationInfo({ id: locationItemId, zoneId });
    setOpenLocationForm(true);
  };

  // State và handler cho Modal hiển thị tồn kho (MỚI - Giữ nguyên)
  const [openInventoryModal, setOpenInventoryModal] = useState(false);
  const [inventoryEntityType, setInventoryEntityType] = useState<
    EntityType | null
  >(null);
  const [selectedInventoryEntity, setSelectedInventoryEntity] = useState<{
    id: string;
    name: string;
  } | null>(null);

  /**
   * Mở modal hiển thị tồn kho cho một entity (Kho, Khu vực, Vị trí) (Giữ nguyên)
   */
  const handleViewInventory = (
    id: string,
    name: string,
    type: EntityType
  ) => {
    setSelectedInventoryEntity({ id, name });
    setInventoryEntityType(type);
    setOpenInventoryModal(true);
  };

  // Chỉnh sửa handler cho WarehouseEdit để khớp với CODE CŨ (đổi tên biến trong callback)
  const handleEditWarehouse = (id: string) => {
    setSelectedWarehouseId(id);
    setFormMode("edit");
    setOpenForm(true);
  };


  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        {/* Đổi h2 thành Typography h5 để khớp với file gốc được upload */}
        <Typography variant="h5">Quản lý kho hàng</Typography> 
      </Stack>



      {/* HIỂN THỊ SƠ ĐỒ KHO HÀNG */}
      {!loading && warehouses.length > 0 ? (
        <WarehouseMap
          warehouses={warehouses}
          // ✅ Cập nhật prop: đổi onSelectWarehouse thành onEditWarehouse
          onEditWarehouse={handleEditWarehouse} 
          onCreateZone={handleCreateZone}
          onEditZone={handleEditZone}
          onCreateLocation={handleCreateLocation}
          onEditLocation={handleEditLocation}
          onViewInventory={handleViewInventory} // ✅ Giữ lại prop tồn kho
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
              disabled={loading || !storeId}
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

      {/* Form kho hàng (Giữ nguyên) */}
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

      {/* Form khu vực (Giữ nguyên) */}
      {selectedZoneInfo && (
        <ZoneForm
          open={openZoneForm}
          onClose={closeZoneForm}
          mode={zoneFormMode}
          warehouseId={selectedZoneInfo.warehouseId}
          zoneId={selectedZoneInfo.id || undefined}
          onSuccess={() => {
            closeZoneForm();
            refetch();
          }}
        />
      )}

      {/* Form vị trí (Giữ nguyên) */}
      {selectedLocationInfo && (
        <LocationForm
          open={openLocationForm}
          onClose={closeLocationForm}
          mode={locationFormMode}
          zoneId={selectedLocationInfo.zoneId}
          locationItemId={selectedLocationInfo.id || undefined}
          onSuccess={() => {
            closeLocationForm();
            refetch();
          }}
        />
      )}

      {/* 📦 MODAL HIỂN THỊ TỒN KHO (Giữ nguyên) */}
      {selectedInventoryEntity && (
        <InventoryTableListModal
          open={openInventoryModal}
          onClose={() => setOpenInventoryModal(false)}
          entityId={selectedInventoryEntity.id}
          entityName={selectedInventoryEntity.name}
          entityType={inventoryEntityType!}
        />
      )}
    </Box>
  );
};

export default WarehouseManagement;