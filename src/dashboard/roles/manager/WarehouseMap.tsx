/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Stack,
  // useTheme, // ✅ Giữ nguyên comment
} from "@mui/material";
// ✅ Import thêm BoxIcon (biểu tượng tồn kho)
import { Edit, Plus, Box as BoxIcon } from "lucide-react";

// Khai báo kiểu dữ liệu cho Entity Type (Giữ nguyên)
type EntityType = "WAREHOUSE" | "ZONE" | "LOCATION";

// Khai báo Props mới (Cập nhật tên prop cho hành động edit kho) (Giữ nguyên)
interface WarehouseMapProps {
  warehouses: any[];
  onEditWarehouse: (warehouseId: string) => void;
  onCreateZone: (warehouseId: string) => void;
  onEditZone: (zoneId: string, warehouseId: string) => void;
  onCreateLocation: (zoneId: string) => void;
  onEditLocation: (locationItemId: string, zoneId: string) => void;
  onViewInventory: (id: string, name: string, type: EntityType) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "#4caf50",
  INACTIVE: "#9e9e9e",
};

// Hàm chia mảng (Giữ nguyên)
const chunkArray = (arr: any[]) => {
  if (!arr || arr.length === 0) return [];

  if (arr.length === 1) {
    return [arr];
  }
  if (arr.length === 2) {
    return [arr];
  }

  const chunkSize = Math.ceil(arr.length / 2);
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

// =================================================================
// Component nội bộ cho nút tạo Zone: (Giữ nguyên)
// =================================================================
const AddZoneButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      position: "relative",
      border: "2px dashed #ccc",
      borderRadius: 2,
      bgcolor: "#f9f9f9",
      p: 2,
      minHeight: 120,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      cursor: "pointer",
      transition: "0.2s",
      "&:hover": { bgcolor: "#f0f0f0", borderColor: "#aaa" },
    }}
  >
    <Tooltip title="Tạo khu vực mới">
      <IconButton size="medium" color="primary">
        <Plus size={24} />
      </IconButton>
    </Tooltip>
    <Typography variant="caption" color="text.secondary" mt={-1}>
      Thêm khu vực
    </Typography>
  </Box>
);

// =================================================================
// Component nội bộ cho nút tạo Location (Giữ nguyên)
// =================================================================
const AddLocationButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) => (
  <Tooltip title="Tạo vị trí mới">
    <Box
      onClick={onClick}
      sx={{
        borderRadius: 1,
        border: "1px dashed #999",
        bgcolor: "#f5f5f5",
        color: "#777",
        textAlign: "center",
        fontSize: "0.7rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "2 / 0.8",
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": { bgcolor: "#e9e9e9", color: "black", borderColor: "#777" },
      }}
    >
      <Plus size={12} />
    </Box>
  </Tooltip>
);


const WarehouseMap: React.FC<WarehouseMapProps> = ({
  warehouses,
  onEditWarehouse,
  onCreateZone,
  onEditZone,
  onEditLocation,
  onCreateLocation,
  onViewInventory,
}) => {
  const ALLOWED_ZONES = "ABCDEFGH".split("");

  return (
    // Tăng maxWidth lên 1600px và tăng padding
    <Box sx={{ maxWidth: '1600px', mx: 'auto', p: 2 }}> 
      {warehouses.map((wh: any) => {
        const usedZoneCodes =
          wh.zones?.map((z: any) => z.zoneCode?.toUpperCase()) || [];
        const availableZoneLetters = ALLOWED_ZONES.filter(
          (letter) => !usedZoneCodes.includes(letter)
        );
        const hasCapacity = (wh.zones?.length || 0) < (wh.capacity || 8);
        const hasLetters = availableZoneLetters.length > 0;
        const canAddZone = hasCapacity && hasLetters;
        const zoneItems = [...(wh.zones || [])];
        if (canAddZone) {
          zoneItems.push({ id: "ADD_ZONE_BUTTON", warehouseId: wh.id });
        }
        const zoneChunks = chunkArray(zoneItems);

        return (
          <Box key={wh.id} sx={{ width: "100%", mb: 3 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: "#ddd",
                transition: "0.2s",
                "&:hover": { boxShadow: 3 },
                width: "100%",
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                {/* Tiêu đề kho VÀ nút edit kho & nút xem tồn kho (Giữ nguyên) */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {wh.warehouseName} – Sức chứa: {wh.capacity || 8} (Đã dùng:{" "}
                    {wh.zones?.length || 0})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {/* Nút XEM TỒN KHO KHO HÀNG */}
                    <Tooltip title={`Xem tồn kho của Kho hàng: ${wh.warehouseName}`}>
                      <IconButton
                        size="medium" 
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInventory(wh.id, wh.warehouseName, 'WAREHOUSE');
                        }}
                      >
                        <BoxIcon size={20} /> 
                      </IconButton>
                    </Tooltip>

                    {/* Nút EDIT KHO HÀNG */}
                    <Tooltip title="Chỉnh sửa kho">
                      <IconButton
                        size="medium" 
                        color="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWarehouse(wh.id);
                        }}
                      >
                        <Edit size={20} /> 
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Render các hàng khu vực (Giữ nguyên) */}
                {zoneChunks.map((zoneRow: any[], rowIndex: number) => (
                  <Box
                    key={rowIndex}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                      },
                      gap: 2,
                      width: "100%",
                      mb: 2,
                    }}
                  >
                    {/* Render các item trong hàng (Zone hoặc Nút Add) */}
                    {zoneRow.map((zone: any) => {
                      if (zone.id === "ADD_ZONE_BUTTON") {
                        return (
                          <Box key="add-zone" > 
                            <AddZoneButton
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateZone(zone.warehouseId);
                              }}
                            />
                          </Box>
                        );
                      }

                      const locationItems = [...(zone.locations || [])];
                      locationItems.push({
                        id: "ADD_LOCATION_BUTTON",
                        zoneId: zone.id,
                      });

                      return (
                        <Box
                          key={zone.id}
                          sx={{
                            position: "relative",
                            border: 1,
                            borderColor: statusColors[zone.status] || "#ccc",
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                            p: 0.8,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: 120,
                          }}
                        >
                          {/* Stack cho Khu vực (Giữ nguyên) */}
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ 
                              position: "absolute", 
                              top: 2, 
                              right: 4,
                              zIndex: 10, 
                            }}
                          >
                            {/* Nút XEM TỒN KHO KHU VỰC */}
                            <Tooltip title={`Xem tồn kho của Khu vực: ${zone.zoneName}`}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewInventory(zone.id, zone.zoneName, "ZONE");
                                }}
                                sx={{ 
                                  padding: "2px", 
                                  color: "primary.main", 
                                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                                }}
                              >
                                <BoxIcon size={16} /> 
                              </IconButton>
                            </Tooltip>

                            {/* Nút EDIT KHU VỰC */}
                            <Tooltip title="Chỉnh sửa Khu vực">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditZone(zone.id, wh.id);
                                }}
                                sx={{ 
                                  padding: "2px", 
                                  color: "text.secondary", 
                                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                                  '&:hover': { bgcolor: '#f0f0f0', color: 'black' }
                                }}
                              >
                                <Edit size={16} /> 
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          

                          {/* Tiêu đề Khu vực: ĐÃ ĐIỀU CHỈNH */}
                          <Typography
                            fontWeight="bold"
                            sx={{
                              color: "#1976d2",
                              textAlign: "left", // ✅ Căn trái
                              fontSize: "0.85rem",
                              // ✅ Căn chỉnh padding để nằm sát góc trái trên, chừa không gian cho nút bên phải
                              padding: '2px 30px 4px 4px', 
                              lineHeight: 1.2,
                              mb: 0.5,
                            }}
                          >
                            {zone.zoneCode} - {zone.zoneName}
                          </Typography>

                          {/* Lưới vị trí bên trong zone (Giữ nguyên) */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 1,
                              flexGrow: 1,
                              alignContent: "flex-start",
                            }}
                          >
                            {/* Render (Location hoặc Nút Add) */}
                            {locationItems.map((loc: any) => {
                              if (loc.id === "ADD_LOCATION_BUTTON") {
                                return (
                                  <AddLocationButton
                                    key="add-location"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCreateLocation(loc.zoneId);
                                    }}
                                  />
                                );
                              }

                              return (
                                <Tooltip
                                  key={loc.id}
                                  title={`Mã: ${loc.code}\nHàng: ${loc.rowLabel}, Cột: ${loc.columnNumber}`}
                                >
                                  <Box
                                    sx={{
                                      position: "relative",
                                      borderRadius: 1,
                                      bgcolor:
                                        statusColors[loc.status] || "#eeeeee",
                                      color: "#fff",
                                      textAlign: "center",
                                      fontSize: "0.6rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      aspectRatio: "2.5 / 1",
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {loc.code}

                                    {/* Stack cho Vị trí (Giữ nguyên) */}
                                    <Stack
                                        direction="row"
                                        spacing={0} // Giảm spacing
                                        className="location-controls"
                                        sx={{ 
                                            position: "absolute", 
                                            top: 0, 
                                            right: 0, 
                                            zIndex: 5,
                                            // Xóa opacity: 0.5 để nút luôn hiển thị
                                            transition: 'opacity 0.2s',
                                            // Tạo nền tương phản nhẹ
                                            bgcolor: 'rgba(0, 0, 0, 0.2)', 
                                            borderRadius: '0 1px 0 2px'
                                        }}
                                    >
                                        {/* Nút XEM TỒN KHO VỊ TRÍ */}
                                        <Tooltip title={`Xem tồn kho tại Vị trí: ${loc.code}`}>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onViewInventory(loc.id, loc.code, "LOCATION");
                                            }}
                                            sx={{
                                              padding: "1px",
                                              color: 'white', 
                                              '&:hover': { color: 'yellow', bgcolor: 'transparent' } // Màu nổi bật hơn khi hover
                                            }}
                                          >
                                            <BoxIcon size={14} /> 
                                          </IconButton>
                                        </Tooltip>

                                        {/* Nút EDIT VỊ TRÍ */}
                                        <Tooltip title="Chỉnh sửa Vị trí">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEditLocation(loc.id, zone.id);
                                            }}
                                            sx={{
                                              padding: "1px",
                                              color: 'white',
                                              '&:hover': { color: 'lightblue', bgcolor: 'transparent' } // Màu nổi bật hơn khi hover
                                            }}
                                          >
                                            <Edit size={14} /> 
                                          </IconButton>
                                        </Tooltip>
                                    </Stack>
                                    {/* KẾT THÚC ĐIỀU CHỈNH CHO VỊ TRÍ */}
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
};

export default WarehouseMap;