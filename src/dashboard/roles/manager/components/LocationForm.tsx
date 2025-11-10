/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import { useToast } from "@/context/ToastContext";
import locationItemService from "@/service/locationItemService";
import ConfirmDialog from "./ConfirmDialog";
import zoneService from "@/service/zoneService";

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  zoneId: string;
  locationItemId?: string;
  onSuccess?: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({
  open,
  onClose,
  mode,
  zoneId,
  locationItemId,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    zoneId,
    rowLabel: "",
    columnNumber: 0,
    code: "",
    quantity: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    description: "",
  });

  const [zoneInfo, setZoneInfo] = useState<{ name: string; id: string }>({
    name: "",
    id: zoneId,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // ✅ Reset form khi zoneId thay đổi và load thông tin zone
  useEffect(() => {
    if (zoneId) {
      setFormData({
        zoneId,
        rowLabel: "",
        columnNumber: 0,
        code: "",
        quantity: 0,
        status: "ACTIVE",
        description: "",
      });

      zoneService
        .getZoneByID(zoneId)
        .then((res) => {
          const zone = res.data?.data;
          if (zone)
            setZoneInfo({
              name: zone.zoneName || "Không rõ tên khu vực",
              id: zone.id,
            });
        })
        .catch(() =>
          showToast({
            type: "error",
            title: "Lỗi tải khu vực",
            description: "Không thể lấy thông tin khu vực.",
          })
        );
    }
  }, [zoneId]);

  // Load dữ liệu vị trí khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (mode === "edit" && locationItemId) {
      locationItemService
        .getLocationByID(locationItemId)
        .then((res) => {
          const data = res.data?.data;
          if (data) {
            setFormData({
              zoneId: data.zone?.id || zoneId,
              rowLabel: data.rowLabel || "",
              columnNumber: data.columnNumber || 0,
              code: data.code || "",
              quantity: data.quantity || 0,
              status: data.status || "ACTIVE",
              description: data.description || "",
            });
          }
        })
        .catch(() =>
          showToast({
            type: "error",
            title: "Lỗi",
            description: "Không thể tải dữ liệu vị trí",
          })
        );
    } else if (mode === "create") {
      setFormData({
        zoneId,
        rowLabel: "",
        columnNumber: 0,
        code: "",
        quantity: 0,
        status: "ACTIVE",
        description: "",
      });
    }
  }, [locationItemId, mode]);

  // Xử lý thay đổi trong form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "columnNumber" || name === "quantity"
          ? Number(value)
          : value,
    });
  };

  // Xử lý xác nhận lưu form
  const handleConfirmSubmit = async () => {
    if (!formData.zoneId) {
      showToast({
        type: "error",
        title: "Thiếu khu vực",
        description: "Vui lòng chọn khu vực trước khi tạo vị trí!",
      });
      return;
    }

    const payload = { ...formData, quantity: formData.quantity ?? 0 };

    try {
      if (mode === "create") {
        await locationItemService.createLocationItem(payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Tạo vị trí thành công!",
        });
      } else if (mode === "edit" && locationItemId) {
        await locationItemService.updateLocationItem(locationItemId, payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Cập nhật vị trí thành công!",
        });
      }

      setConfirmDialog((prev) => ({ ...prev, open: false }));
      onClose();
      onSuccess?.();
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể lưu thông tin vị trí",
      });
    }
  };

  // Xử lý khi nhấn nút lưu
  const handleSubmit = () => {
    setConfirmDialog({
      open: true,
      title: mode === "create" ? "Xác nhận tạo vị trí" : "Xác nhận chỉnh sửa",
      message:
        mode === "create"
          ? "Bạn có chắc chắn muốn tạo vị trí mới không?"
          : "Bạn có chắc chắn muốn lưu các thay đổi không?",
      onConfirm: handleConfirmSubmit,
    });
  };

  // Xử lý vô hiệu hóa / kích hoạt vị trí
  const handleDisableLocation = async () => {
    try {
      if (locationItemId) {
        await locationItemService.disableLocationItem(locationItemId);
        showToast({
          type: "success",
          title: "Thành công",
          description:
            formData.status === "ACTIVE"
              ? "Vị trí đã được vô hiệu hóa"
              : "Vị trí đã được kích hoạt lại",
        });
        onClose();
        onSuccess?.();
      }
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          formData.status === "ACTIVE"
            ? "Không thể vô hiệu hóa vị trí"
            : "Không thể kích hoạt lại vị trí",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Xử lý xóa vị trí
  const handleDeleteLocation = async () => {
    try {
      if (locationItemId) {
        await locationItemService.deleteLocationItem(locationItemId);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Xóa vị trí thành công!",
        });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể xóa vị trí. " + (error as any).message,
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Các hộp thoại xác nhận
  const handleToggleConfirm = () => {
    const isActive = formData.status === "ACTIVE";
    setConfirmDialog({
      open: true,
      title: isActive
        ? "Xác nhận vô hiệu vị trí"
        : "Xác nhận kích hoạt vị trí",
      message: isActive
        ? "Bạn có chắc chắn muốn vô hiệu hóa vị trí này không?"
        : "Bạn có chắc chắn muốn kích hoạt lại vị trí này không?",
      onConfirm: handleDisableLocation,
    });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: "40vw",
            p: 3,
            boxSizing: "border-box",
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {mode === "create" ? "Tạo vị trí mới" : "Chỉnh sửa vị trí"}
          </Typography>
          <Button onClick={onClose}>Đóng</Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} direction="column">
          <Grid item>
            <TextField
              label="Mã vị trí"
              name="code"
              value={formData.code}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Hàng (Row Label)"
              name="rowLabel"
              value={formData.rowLabel}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Cột (Column Number)"
              name="columnNumber"
              type="number"
              value={formData.columnNumber}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Số lượng (Quantity)"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Trạng thái"
              value={formData.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item>
            <TextField
              label="Khu vực"
              value={zoneInfo.name}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          {/* Left side: Disable / Delete buttons */}
          <Stack direction="row" spacing={1}>
            {mode === "edit" && (
              <>
                <Button
                  variant="outlined"
                  color={formData.status === "ACTIVE" ? "error" : "success"}
                  onClick={handleToggleConfirm}
                >
                  {formData.status === "ACTIVE" ? "Vô hiệu" : "Hoạt động"}
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: "Xác nhận xóa vị trí",
                      message:
                        "Bạn có chắc chắn muốn xóa vị trí này không? Hành động này không thể hoàn tác.",
                      onConfirm: handleDeleteLocation,
                    })
                  }
                >
                  Xóa
                </Button>
              </>
            )}
          </Stack>

          {/* Right side: Save button */}
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              {mode === "create" ? "Tạo vị trí" : "Lưu chỉnh sửa"}
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
      />
    </>
  );
};

export default LocationForm;