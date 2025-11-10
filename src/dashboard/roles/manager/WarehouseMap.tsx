/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Stack, // Giữ lại Stack nếu cần thiết cho các nút
} from "@mui/material";
// ✅ Import thêm BoxIcon (biểu tượng tồn kho)
import { Edit, Plus, Box as BoxIcon } from "lucide-react";

// Khai báo kiểu dữ liệu cho Entity Type (Giữ nguyên)
type EntityType = 'WAREHOUSE' | 'ZONE' | 'LOCATION';

// Khai báo Props mới (Cập nhật tên prop cho hành động edit kho)
interface WarehouseMapProps {
  warehouses: any[];
  onEditWarehouse: (warehouseId: string) => void; // Đổi tên từ onSelectWarehouse
  onCreateZone: (warehouseId: string) => void;
  onEditZone: (zoneId: string, warehouseId: string) => void;
  onCreateLocation: (zoneId: string) => void;
  onEditLocation: (locationItemId: string, zoneId: string) => void;
  // ✅ PROP MỚI: Handler xem tồn kho (Giữ nguyên)
  onViewInventory: (id: string, name: string, type: EntityType) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "#4caf50",
  INACTIVE: "#9e9e9e",
};

// Hàm chia mảng (Lấy logic từ CODE CŨ)
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
// ✅ Component nội bộ cho nút tạo Zone (Lấy từ CODE CŨ)
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
      p: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      aspectRatio: "3 / 1",
      cursor: "pointer",
      transition: "0.2s",
      "&:hover": { bgcolor: "#f0f0f0", borderColor: "#aaa" },
    }}
  >
    <Tooltip title="Tạo khu vực mới">
      <IconButton size="large" color="primary">
        <Plus size={32} />
      </IconButton>
    </Tooltip>
    <Typography variant="caption" color="text.secondary" mt={-1}>
      Thêm khu vực
    </Typography>
  </Box>
);

// =================================================================
// ✅ Component nội bộ cho nút tạo Location (Lấy từ CODE CŨ)
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
        fontSize: "0.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "2 / 0.8",
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": { bgcolor: "#e9e9e9", color: "black", borderColor: "#777" },
      }}
    >
      <Plus size={16} />
    </Box>
  </Tooltip>
);


const WarehouseMap: React.FC<WarehouseMapProps> = ({
  warehouses,
  onEditWarehouse, // Đổi tên prop
  onCreateZone,
  onEditZone,
  onEditLocation,
  onCreateLocation,
  onViewInventory // ✅ Giữ nguyên prop tồn kho
}) => {
  // ✅ Các chữ cái được phép (Lấy từ CODE CŨ)
  const ALLOWED_ZONES = "ABCDEFGH".split(""); 
  
  return (
    <>
      {warehouses.map((wh: any) => {
        // =================================================================
        // ✅ Logic kiểm tra xem có thể thêm Zone không (Lấy từ CODE CŨ)
        // =================================================================
        const usedZoneCodes =
          wh.zones?.map((z: any) => z.zoneCode?.toUpperCase()) || [];
        
        const availableZoneLetters = ALLOWED_ZONES.filter(
          (letter) => !usedZoneCodes.includes(letter)
        );

        const hasCapacity = (wh.zones?.length || 0) < (wh.capacity || 8); // Giả định capacity là 8 nếu không có
        const hasLetters = availableZoneLetters.length > 0;

        const canAddZone = hasCapacity && hasLetters;

        // Tạo mảng render (gồm zone + nút add)
        const zoneItems = [...(wh.zones || [])];
        if (canAddZone) {
          zoneItems.push({ id: "ADD_ZONE_BUTTON", warehouseId: wh.id });
        }

        // ✅ Chia mảng (đã bao gồm nút add)
        const zoneChunks = chunkArray(zoneItems);

        return (
          <Box key={wh.id} sx={{ width: "100%", mb: 2 }}>
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
              <CardContent>
                {/* Tiêu đề kho VÀ nút edit kho & nút xem tồn kho */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {wh.warehouseName} – Sức chứa: {wh.capacity || 8} (Đã dùng:{" "}
                    {wh.zones?.length || 0})
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {/* ✅ Nút XEM TỒN KHO KHO HÀNG (GIỮ NGUYÊN TỪ FILE TRƯỚC) */}
                    <Tooltip title={`Xem tồn kho của Kho hàng: ${wh.warehouseName}`}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInventory(wh.id, wh.warehouseName, 'WAREHOUSE');
                        }}
                      >
                        <BoxIcon size={18} /> 
                      </IconButton>
                    </Tooltip>

                    {/* Nút EDIT KHO HÀNG (GIỮ NGUYÊN LOGIC CŨ/MỚI) */}
                    <Tooltip title="Chỉnh sửa kho">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWarehouse(wh.id);
                        }}
                      >
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* ✅ Render các hàng khu vực */}
                {zoneChunks.map((zoneRow: any[], rowIndex: number) => (
                  <Box
                    key={rowIndex}
                    sx={{
                      display: "grid",
                      // Số cột bằng số item trong hàng
                      gridTemplateColumns: `repeat(${zoneRow.length}, 1fr)`,
                      gap: 2,
                      width: "100%",
                      mb: 2,
                    }}
                  >
                    {/* ✅ Render các item trong hàng (Zone hoặc Nút Add) */}
                    {zoneRow.map((zone: any) => {
                      // =================================================================
                      // ✅ Trường hợp 1: Render Nút Add Zone
                      // =================================================================
                      if (zone.id === "ADD_ZONE_BUTTON") {
                        return (
                          <AddZoneButton
                            key="add-zone"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateZone(zone.warehouseId);
                            }}
                          />
                        );
                      }

                      // =================================================================
                      // ✅ Trường hợp 2: Render Zone
                      // =================================================================
                      
                      // Tạo mảng render cho location (locations + nút add)
                      const locationItems = [...(zone.locations || [])];
                      // Nút add location không bị giới hạn
                      locationItems.push({
                        id: "ADD_LOCATION_BUTTON",
                        zoneId: zone.id,
                      });

                      return (
                        <Box
                          key={zone.id}
                          sx={{
                            position: "relative",
                            border: 1, // Thay thế border: "1px solid #ccc"
                            borderColor: statusColors[zone.status] || '#ccc', // Thêm màu trạng thái
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                            p: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            aspectRatio: "3 / 1",
                          }}
                        >
                          {/* Nút điều khiển Khu vực */}
                          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 4, right: 4 }}>
                            {/* ✅ Nút XEM TỒN KHO KHU VỰC (GIỮ NGUYÊN TỪ FILE TRƯỚC) */}
                            <Tooltip title={`Xem tồn kho của Khu vực: ${zone.zoneName}`}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewInventory(zone.id, zone.zoneName, 'ZONE');
                                    }}
                                    sx={{ padding: '2px', color: 'rgba(0, 0, 0, 0.6)' }}
                                >
                                    <BoxIcon size={12} />
                                </IconButton>
                            </Tooltip>

                            {/* Nút EDIT KHU VỰC (GIỮ NGUYÊN LOGIC CŨ/MỚI) */}
                            <Tooltip title="Chỉnh sửa Khu vực">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditZone(zone.id, wh.id);
                                    }}
                                    sx={{ padding: '2px', color: 'rgba(0, 0, 0, 0.6)' }}
                                >
                                    <Edit size={12} />
                                </IconButton>
                            </Tooltip>
                          </Stack>

                          <Typography
                            fontWeight="bold"
                            mb={1}
                            sx={{
                              color: "#1976d2",
                              textAlign: "center",
                              fontSize: "0.95rem",
                              paddingTop: "1.2rem",
                            }}
                          >
                            {zone.zoneCode} - {zone.zoneName}
                          </Typography>

                          {/* ✅ Lưới vị trí bên trong zone (Lấy từ CODE CŨ) */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 0.5,
                              flexGrow: 1,
                              alignContent: "center",
                            }}
                          >
                            {/* ✅ Render (Location hoặc Nút Add) */}
                            {locationItems.map((loc: any) => {
                              // =================================================================
                              // ✅ Render Nút Add Location
                              // =================================================================
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

                              // =================================================================
                              // ✅ Render Location
                              // =================================================================
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
                                      fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      aspectRatio: "2 / 0.8",
                                    }}
                                  >
                                    {/* ✅ Nút XEM TỒN KHO VỊ TRÍ (GIỮ NGUYÊN TỪ FILE TRƯỚC) */}
                                    <Tooltip title={`Xem tồn kho tại Vị trí: ${loc.code}`}>
                                      <IconButton
                                          size="small"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onViewInventory(loc.id, loc.code, 'LOCATION');
                                          }}
                                          sx={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              zIndex: 1,
                                              padding: '1px',
                                              color: 'rgba(255, 255, 255, 0.8)', // Đổi màu icon để dễ nhìn trên nền màu
                                              "&:hover": {
                                                  color: "black",
                                              },
                                          }}
                                      >
                                          <BoxIcon size={12} />
                                      </IconButton>
                                    </Tooltip>

                                    {/* Nút EDIT VỊ TRÍ (GIỮ NGUYÊN LOGIC CŨ/MỚI) */}
                                    <Tooltip title="Chỉnh sửa Vị trí">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditLocation(loc.id, zone.id);
                                        }}
                                        sx={{
                                          position: "absolute",
                                          top: 0,
                                          right: 0,
                                          zIndex: 1,
                                          padding: "1px",
                                          color: "rgba(255, 255, 255, 0.8)", // Đổi màu icon để dễ nhìn trên nền màu
                                          "&:hover": {
                                            color: "black",
                                          },
                                        }}
                                      >
                                        <Edit size={12} />
                                      </IconButton>
                                    </Tooltip>

                                    {loc.code}
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
    </>
  );
};

export default WarehouseMap;