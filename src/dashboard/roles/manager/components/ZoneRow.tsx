/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  Stack,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Edit, Trash2, Power, PowerOff } from "lucide-react";
import locationItemService from "@/service/locationItemService";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "@/context/ToastContext";
import LocationForm from "./LocationForm";

const ZoneRow = ({
  zone,
  children,
}: {
  zone: any;
  onEdit: (zoneId: string) => void;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const { showToast } = useToast();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await locationItemService.getLocationByZone(zone.id);
      setLocations(res.data.data || []);
    } catch (err) {
      showToast({
        type: "error",
        title: "Lỗi tải vị trí",
        description: "Không thể tải danh sách vị trí." + err,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = () => {
    setOpen(!open);
    if (!open && locations.length === 0) fetchLocations();
  };

  const handleDisable = async (id: string, status: string) => {
    try {
      await locationItemService.disableLocationItem(id);
      showToast({
        type: "success",
        title: "Thành công",
        description:
          status === "ACTIVE"
            ? "Vị trí đã được vô hiệu hóa"
            : "Vị trí đã được kích hoạt lại",
      });
      fetchLocations();
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          status === "ACTIVE"
            ? "Không thể vô hiệu hóa vị trí"
            : "Không thể kích hoạt lại vị trí",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await locationItemService.deleteLocationItem(id);
      showToast({
        type: "success",
        title: "Thành công",
        description: "Xóa vị trí thành công!",
      });
      fetchLocations();
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể xóa vị trí.",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={toggleCollapse}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{zone.zoneName}</TableCell>
        <TableCell>{zone.description}</TableCell>
        <TableCell>{zone.zoneCode}</TableCell>
        <TableCell>{zone.quantity}</TableCell>
        <TableCell>{zone.status}</TableCell>
        <TableCell align="center">{children}</TableCell>
      </TableRow>

      {/* Bảng con hiển thị danh sách vị trí */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Danh sách vị trí trong khu vực
              </Typography>

              {loading ? (
                <Stack direction="row" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <span>Đang tải...</span>
                </Stack>
              ) : locations.length === 0 ? (
                <Typography color="text.secondary">
                  Không có vị trí nào trong khu vực này.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã vị trí</TableCell>
                      <TableCell>Hàng</TableCell>
                      <TableCell>Cột</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="center">Hoạt động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locations.map((loc) => (
                      <TableRow key={loc.id}>
                        <TableCell>{loc.code}</TableCell>
                        <TableCell>{loc.rowLabel}</TableCell>
                        <TableCell>{loc.columnNumber}</TableCell>
                        <TableCell>{loc.description}</TableCell>
                        <TableCell>{loc.quantity}</TableCell>
                        <TableCell>{loc.status}</TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                            alignItems="center"
                          >
                            {/* Chỉnh sửa */}
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  setSelectedLocation(loc);
                                  setOpenForm(true);
                                }}
                              >
                                <Edit size={18} />
                              </IconButton>
                            </Tooltip>

                            {/* Vô hiệu / kích hoạt */}
                            <Tooltip
                              title={
                                loc.status === "ACTIVE"
                                  ? "Vô hiệu hóa"
                                  : "Kích hoạt"
                              }
                            >
                              <IconButton
                                color={
                                  loc.status === "ACTIVE" ? "error" : "success"
                                }
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title:
                                      loc.status === "ACTIVE"
                                        ? "Xác nhận vô hiệu vị trí"
                                        : "Xác nhận kích hoạt vị trí",
                                    message:
                                      loc.status === "ACTIVE"
                                        ? "Bạn có chắc chắn muốn vô hiệu hóa vị trí này không?"
                                        : "Bạn có chắc chắn muốn kích hoạt lại vị trí này không?",
                                    onConfirm: () =>
                                      handleDisable(loc.id, loc.status),
                                  })
                                }
                              >
                                {loc.status === "ACTIVE" ? (
                                  <PowerOff size={18} />
                                ) : (
                                  <Power size={18} />
                                )}
                              </IconButton>
                            </Tooltip>

                            {/* Xóa */}
                            <Tooltip title="Xóa">
                              <IconButton
                                color="error"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title: "Xác nhận xóa vị trí",
                                    message:
                                      "Bạn có chắc chắn muốn xóa vị trí này không? Hành động này không thể hoàn tác.",
                                    onConfirm: () => handleDelete(loc.id),
                                  })
                                }
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Form chỉnh sửa vị trí */}
      {selectedLocation && (
        <LocationForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          mode="edit"
          zoneId={zone.id}
          locationItemId={selectedLocation.id}
          onSuccess={fetchLocations}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
      />
    </>
  );
};

export default ZoneRow;
