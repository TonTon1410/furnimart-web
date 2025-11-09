/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/warehouses/WarehouseForm.tsx
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
import warehousesService from "@/service/warehousesService";
import ConfirmDialog from "./ConfirmDialog";

interface WarehouseFormProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  storeId: string; // ID của cửa hàng (từ người dùng)
  warehouseId?: string;
  onSuccess?: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({
  open,
  onClose,
  mode,
  storeId,
  warehouseId,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    warehouseName: "",
    status: "ACTIVE",
    capacity: 0, // Giá trị khởi tạo là số
    storeId: storeId, // Luôn khởi tạo với storeId từ props
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Lấy dữ liệu khi edit (hoặc reset khi create)
  useEffect(() => {
    if (mode === "edit" && warehouseId) {
      warehousesService
        .getWarehouseByID(warehouseId)
        .then((res) => {
          const data = res.data?.data;
          if (data) {
            setFormData({
              warehouseName: data.warehouseName || "",
              status: data.status || "ACTIVE",
              capacity: data.capacity || 0, // Đảm bảo là số
              storeId: data.store?.id || storeId,
            });
          }
        })
        .catch(() =>
          showToast({
            type: "error",
            title: "Lỗi",
            description: "Không thể tải dữ liệu kho hàng",
          })
        );
    } else if (mode === "create") {
      // Khi tạo mới, đảm bảo dùng storeId của người dùng
      setFormData({
        warehouseName: "",
        status: "ACTIVE",
        capacity: 0,
        storeId: storeId,
      });
    }
  }, [warehouseId, mode, storeId]);

  // Sửa handleChange để xử lý số âm cho Sức chứa
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "capacity") {
      if (value === "") {
        // Nếu người dùng xóa hết, set giá trị về 0
        setFormData({ ...formData, [name]: 0 });
      } else {
        const numValue = parseInt(value, 10);
        // Chỉ cập nhật state nếu là số hợp lệ và không âm
        if (!isNaN(numValue) && numValue >= 0) {
          setFormData({ ...formData, [name]: numValue });
        }
      }
    } else {
      // Xử lý cho các trường khác
      setFormData({ ...formData, [name]: value });
    }
  };

  // Gửi yêu cầu tạo hoặc cập nhật
  const handleConfirmSubmit = async () => {
    try {
      if (mode === "create") {
        await warehousesService.createWarehouse(formData.storeId, formData);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Tạo kho hàng thành công!",
        });
      } else if (mode === "edit" && warehouseId) {
        await warehousesService.updateWarehouseInfo(
          formData.storeId,
          warehouseId,
          formData
        );
        showToast({
          type: "success",
          title: "Thành công",
          description: "Cập nhật kho hàng thành công!",
        });
      }
      setConfirmDialog((prev) => ({ ...prev, open: false }));
      onClose();
      onSuccess?.();
    } catch {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Có lỗi xảy ra khi lưu kho hàng",
      });
    }
  };

  // Vô hiệu / kích hoạt kho hàng
  const handleDisableWarehouse = async () => {
    try {
      if (warehouseId) {
        await warehousesService.disableWarehouse(warehouseId);
        showToast({
          type: "success",
          title: "Thành công",
          description:
            formData.status === "ACTIVE"
              ? "Kho hàng đã được vô hiệu hóa"
              : "Kho hàng đã được kích hoạt lại",
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
            ? "Không thể vô hiệu hóa kho hàng"
            : "Không thể kích hoạt kho hàng",
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Xóa kho hàng
  const handleDeleteWarehouse = async () => {
    try {
      if (warehouseId) {
        await warehousesService.deleteWarehouse(warehouseId);
        showToast({
          type: "success",
          title: "Thành công",
          description: "Xóa kho hàng thành công!",
        });
        onClose();
        onSuccess?.();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Lỗi",
        description: "Không thể xóa kho hàng." + (error as any).message,
      });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Mở dialog xác nhận tạo/chỉnh sửa
  const handleSubmit = () => {
    setConfirmDialog({
      open: true,
      title: mode === "create" ? "Xác nhận tạo kho hàng" : "Xác nhận chỉnh sửa",
      message:
        mode === "create"
          ? "Bạn có chắc chắn muốn tạo kho hàng mới không?"
          : "Bạn có chắc chắn muốn lưu các thay đổi không?",
      onConfirm: handleConfirmSubmit,
    });
  };

  // Mở dialog xác nhận đổi trạng thái
  const handleToggleConfirm = () => {
    const isActive = formData.status === "ACTIVE";
    setConfirmDialog({
      open: true,
      title: isActive
        ? "Xác nhận vô hiệu kho hàng"
        : "Xác nhận kích hoạt kho hàng",
      message: isActive
        ? "Bạn có chắc chắn muốn vô hiệu hóa kho hàng này không?"
        : "Bạn có chắc chắn muốn kích hoạt lại kho hàng này không?",
      onConfirm: handleDisableWarehouse,
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
            width: "60vw",
            height: "100%",
            p: 3,
            boxSizing: "border-box",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" fontWeight="bold">
            {mode === "create" ? "Tạo kho hàng mới" : "Thông tin kho hàng"}
          </Typography>
          <Button onClick={onClose} color="inherit">
            Đóng
          </Button>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2} direction="column">
          <Grid item xs={12}>
            <TextField
              label="Tên kho hàng"
              name="warehouseName"
              value={formData.warehouseName}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* Sửa trường Sức chứa */}
          <Grid item xs={12}>
            <TextField
              label="Sức chứa"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              fullWidth
              InputProps={{
                inputProps: { 
                  min: 0 
                } 
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Trạng thái"
              value={formData.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          
        </Grid>

        {/* Các nút hành động */}
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
          {mode === "edit" && (
            <>
              <Button
                variant="outlined"
                color={formData.status === "ACTIVE" ? "error" : "success"}
                onClick={handleToggleConfirm}
              >
                {formData.status === "ACTIVE" ? "Vô hiệu" : "Ho động"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: "Xác nhận xóa kho hàng",
                    message:
                      "Bạn có chắc chắn muốn xóa kho hàng này không? Hành động này không thể hoàn tác.",
                    onConfirm: handleDeleteWarehouse,
                  })
                }
              >
                Xóa
              </Button>
            </>
          )}

          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {mode === "create" ? "Tạo kho hàng" : "Lưu chỉnh sửa"}
          </Button>
        </Stack>
      </Drawer>

      {/* ConfirmDialog dùng chung */}
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

export default WarehouseForm;