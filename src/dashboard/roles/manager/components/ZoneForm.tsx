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
import { useToastRadix } from "@/context/useToastRadix";
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
  const { showToast } = useToastRadix();

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

  // ✅ Lấy thông tin kho để hiển thị (dùng khi tạo & chỉnh sửa)
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

  // ✅ Lấy dữ liệu khi chỉnh sửa Zone
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

  // ✅ Xử lý xác nhận tạo / cập nhật
  const handleConfirmSubmit = async () => {
  try {
    // ✅ ép kiểu quantity về number để đúng định dạng backend yêu cầu
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

  // ✅ Dialog xác nhận tạo/chỉnh sửa
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

        {/* Buttons */}
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {mode === "create" ? "Tạo khu vực" : "Lưu chỉnh sửa"}
          </Button>
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
