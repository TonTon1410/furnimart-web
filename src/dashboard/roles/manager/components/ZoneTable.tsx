/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Paper,
  Tooltip,
  Button,
} from "@mui/material";
import { Edit, Trash2, Power, PowerOff, Plus } from "lucide-react";
import zoneService from "@/service/zoneService";
import ZoneForm from "./ZoneForm";
import ZoneRow from "./ZoneRow";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import LocationForm from "./LocationForm";

interface ZoneTableProps {
  warehouseId: string;
  onParentRefetch?: () => void; // ✅ refetch toàn hệ thống (từ WarehouseForm)
}

const ZoneTable = ({ warehouseId, onParentRefetch }: ZoneTableProps) => {
  const [zones, setZones] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const { showToast } = useToast();

  // ✅ Form tạo LocationItem
  const [openLocationForm, setOpenLocationForm] = useState(false);
  const [selectedLocationZoneId, setSelectedLocationZoneId] = useState<string | null>(null);

  const fetchZones = async () => {
    try {
      const res = await zoneService.getZoneByWarehouse(warehouseId);
      setZones(res.data.data || []);
    } catch (err) {
      showToast({
        type: "error",
        title: "Lỗi tải danh sách khu vực",
        description: "Không thể tải danh sách khu vực." + err,
      });
    }
  };

  useEffect(() => {
    fetchZones();
  }, [warehouseId]);

  const handleCreateZone = () => {
    setSelectedZoneId(null);
    setMode("create");
    setOpenForm(true);
  };

  const handleEditZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setMode("edit");
    setOpenForm(true);
  };

  const handleDisable = async (zoneId: string, status: string) => {
    try {
      await zoneService.disableZone(zoneId);
      showToast({
        type: "success",
        title: "Thành công",
        description:
          status === "ACTIVE"
            ? "Khu vực đã được vô hiệu hóa"
            : "Khu vực đã được kích hoạt lại",
      });
      await fetchZones();
      await onParentRefetch?.(); // ✅ cập nhật toàn hệ thống
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          status === "ACTIVE"
            ? "Không thể vô hiệu hóa khu vực"
            : "Không thể kích hoạt khu vực",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const handleDelete = async (zoneId: string) => {
    try {
      await zoneService.deleteZone(zoneId);
      showToast({
        type: "success",
        title: "Thành công",
        description: "Xóa khu vực thành công!",
      });
      await fetchZones();
      await onParentRefetch?.(); // ✅ cập nhật toàn hệ thống
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể xóa khu vực.",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <Stack direction="row" justifyContent="space-between" mb={1} mt={2}>
        <h3 className="text-xl font-extrabold text-gray-800">Danh sách khu vực</h3>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Plus size={18} />}
          onClick={handleCreateZone}
        >
          Tạo khu vực
        </Button>
      </Stack>

      {zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <img
            src="https://i.pinimg.com/1200x/72/9a/27/729a27bbcd296a80867dc5dd1d73690f.jpg"
            alt="Không có dữ liệu"
            style={{ width: 220, opacity: 0.8, marginBottom: 12 }}
          />
          <p className="text-lg font-medium">Không có dữ liệu</p>
        </div>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Tên khu vực</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Mã khu</TableCell>
                <TableCell>Sức chứa</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {zones.map((zone) => (
                <ZoneRow key={zone.id} zone={zone} onEdit={handleEditZone}>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                  >
                    {/* Chỉnh sửa */}
                    <Tooltip title="Chỉnh sửa">
                      <IconButton color="primary" onClick={() => handleEditZone(zone.id)}>
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>

                    {/* Vô hiệu / kích hoạt */}
                    <Tooltip
                      title={zone.status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"}
                    >
                      <IconButton
                        color={zone.status === "ACTIVE" ? "error" : "success"}
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title:
                              zone.status === "ACTIVE"
                                ? "Xác nhận vô hiệu khu vực"
                                : "Xác nhận kích hoạt khu vực",
                            message:
                              zone.status === "ACTIVE"
                                ? "Bạn có chắc chắn muốn vô hiệu hóa khu vực này không?"
                                : "Bạn có chắc chắn muốn kích hoạt lại khu vực này không?",
                            onConfirm: () => handleDisable(zone.id, zone.status),
                          })
                        }
                      >
                        {zone.status === "ACTIVE" ? (
                          <PowerOff size={18} />
                        ) : (
                          <Power size={18} />
                        )}
                      </IconButton>
                    </Tooltip>

                    {/* ✅ Tạo vị trí */}
                    <Tooltip title="Tạo vị trí">
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedLocationZoneId(zone.id);
                          setOpenLocationForm(true);
                        }}
                      >
                        <Plus size={18} />
                      </IconButton>
                    </Tooltip>

                    {/* Xóa */}
                    <Tooltip title="Xóa">
                      <IconButton
                        color="error"
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title: "Xác nhận xóa khu vực",
                            message:
                              "Bạn có chắc chắn muốn xóa khu vực này không? Hành động này không thể hoàn tác.",
                            onConfirm: () => handleDelete(zone.id),
                          })
                        }
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ZoneRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ✅ ZoneForm */}
      <ZoneForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        mode={mode}
        warehouseId={warehouseId}
        zoneId={selectedZoneId || undefined}
        onSuccess={async () => {
          await fetchZones();
          await onParentRefetch?.(); // ✅ đồng bộ hệ thống
        }}
      />

      {/* ✅ LocationForm */}
      <LocationForm
        key={selectedLocationZoneId}
        open={openLocationForm}
        onClose={() => setOpenLocationForm(false)}
        mode="create"
        zoneId={selectedLocationZoneId || ""}
        onSuccess={async () => {
          await fetchZones();
          await onParentRefetch?.(); // ✅ đồng bộ hệ thống
        }}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default ZoneTable;
