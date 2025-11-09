/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  Drawer,
  // Box,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
import { useToast } from "@/context/ToastContext";
import zoneService from "@/service/zoneService";
import warehousesService from "@/service/warehousesService";
import ConfirmDialog from "./ConfirmDialog";

interface ZoneFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  warehouseId: string;
  zoneId?: string;
  onSuccess?: () => void;
}

const ZoneForm: React.FC<ZoneFormProps> = ({
  open,
  onClose,
  mode,
  warehouseId,
  zoneId,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    zoneName: "",
    description: "",
    zoneCode: "",
    quantity: 0,
    status: "ACTIVE",
    warehouseId,
  });

  const [warehouseInfo, setWarehouseInfo] = useState<{ name: string; id: string }>({
    name: "",
    id: warehouseId,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Lấy thông tin kho hàng để hiển thị trong form
  useEffect(() => {
    if (warehouseId) {
      warehousesService
        .getWarehouseByID(warehouseId)
        .then((res) => {
          const wh = res.data?.data;
          if (wh)
            setWarehouseInfo({
              name: wh.warehouseName || "Không rõ tên kho",
              id: wh.id,
            });
        })
        .catch(() =>
          showToast({
            type: "error",
            title: "Lỗi tải kho hàng",
            description: "Không thể lấy thông tin kho hàng.",
          })
        );
    }
  }, [warehouseId]);

  // Lấy dữ liệu khi chỉnh sửa Zone
  useEffect(() => {
    if (mode === "edit" && zoneId) {
      zoneService
        .getZoneByID(zoneId)
        .then((res) => {
          const data = res.data?.data;
          if (data) {
            setFormData({
              zoneName: data.zoneName || "",
              description: data.description || "",
              zoneCode: data.zoneCode || "",
              quantity: data.quantity || 0,
              status: data.status || "ACTIVE",
              warehouseId: data.warehouse?.id || warehouseId,
            });
            if (data.warehouse) {
              setWarehouseInfo({
                name: data.warehouse.warehouseName || "Không rõ tên kho",
                id: data.warehouse.id,
              });
            }
          }
        })
        .catch(() =>
          showToast({
            type: "error",
            title: "Lỗi",
            description: "Không thể tải dữ liệu khu vực",
          })
        );
    } else if (mode === "create") {
      setFormData({
        zoneName: "",
        description: "",
        zoneCode: "",
        quantity: 0,
        status: "ACTIVE",
        warehouseId,
      });
    }
  }, [zoneId, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý xác nhận tạo / cập nhật
  const handleConfirmSubmit = async () => {
    try {
      // ép kiểu quantity về number để đúng định dạng backend yêu cầu
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
      };

      if (mode === "create") {
        await zoneService.createZone(payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Tạo khu vực thành công!",
        });
      } else if (mode === "edit" && zoneId) {
        await zoneService.updateZone(zoneId, payload);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Cập nhật khu vực thành công!",
        });
      }

      setConfirmDialog((prev) => ({ ...prev, open: false }));
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("❌ API Error:", error);
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể lưu thông tin khu vực",
      });
    }
  };

  // Xử lý vô hiệu hóa / kích hoạt khu vực
  const handleDisableZone = async () => {
    try {
      if (zoneId) {
        await zoneService.disableZone(zoneId);
        showToast({
          type: "success",
          title: "Thành công",
          description:
            formData.status === "ACTIVE"
              ? "Khu vực đã được vô hiệu hóa"
              : "Khu vực đã được kích hoạt lại",
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
            ? "Không thể vô hiệu hóa khu vực"
            : "Không thể kích hoạt khu vực",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Xử lý xóa khu vực
  const handleDeleteZone = async () => {
    try {
      if (zoneId) {
        await zoneService.deleteZone(zoneId);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Xóa khu vực thành công!",
        });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể xóa khu vực. " + (error as any).message,
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Dialog xác nhận 
  const handleSubmit = () => {
    setConfirmDialog({
      open: true,
      title: mode === "create" ? "Xác nhận tạo khu vực" : "Xác nhận chỉnh sửa",
      message:
        mode === "create"
          ? "Bạn có chắc chắn muốn tạo khu vực mới không?"
          : "Bạn có chắc chắn muốn lưu các thay đổi không?",
      onConfirm: handleConfirmSubmit,
    });
  };

  const handleToggleConfirm = () => {
    const isActive = formData.status === "ACTIVE";
    setConfirmDialog({
      open: true,
      title: isActive
        ? "Xác nhận vô hiệu khu vực"
        : "Xác nhận kích hoạt khu vực",
      message: isActive
        ? "Bạn có chắc chắn muốn vô hiệu hóa khu vực này không?"
        : "Bạn có chắc chắn muốn kích hoạt lại khu vực này không?",
      onConfirm: handleDisableZone,
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
            width: "45vw",
            p: 3,
            boxSizing: "border-box",
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            {mode === "create" ? "Tạo khu vực mới" : "Thông tin khu vực"}
          </Typography>
          <Button onClick={onClose}>Đóng</Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Form */}
        <Grid container spacing={2} direction="column">
          <Grid item>
            <TextField
              label="Tên khu vực"
              name="zoneName"
              value={formData.zoneName}
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
              label="Mã khu vực"
              name="zoneCode"
              value={formData.zoneCode}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item>
            <TextField
              label="Sức chứa"
              name="quantity"
              type="number"
              value={formData.quantity}
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

          {/* ✅ Hiển thị thông tin kho hàng */}
          <Grid item>
            <TextField
              label="Kho hàng"
              value={warehouseInfo.name}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        {/* ================================================================= */}
        {/* ✅ (MỚI) Cập nhật khu vực nút bấm */}
        {/* ================================================================= */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          {/* Left side: Delete/Disable buttons (only in edit mode) */}
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
                      title: "Xác nhận xóa khu vực",
                      message:
                        "Bạn có chắc chắn muốn xóa khu vực này không? Hành động này không thể hoàn tác.",
                      onConfirm: handleDeleteZone,
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
              {mode === "create" ? "Tạo khu vực" : "Lưu chỉnh sửa"}
            </Button>
          </Stack>
        </Stack>
      </Drawer>

      {/* ✅ ConfirmDialog dùng chung */}
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

export default ZoneForm;