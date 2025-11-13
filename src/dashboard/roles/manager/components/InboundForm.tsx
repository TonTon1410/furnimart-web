// file: InboundForm.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { Save } from 'lucide-react';
import WarehouseZoneLocationSelector from './WarehouseZoneLocationSelector';
import ProductSelector from './ProductSelector';

import inventoryService from '@/service/inventoryService';
// ✅ THÊM: Import useToast
import { useToast } from '@/context/ToastContext';

interface InboundFormProps {
  onSuccess: () => void;
}

const InboundForm: React.FC<InboundFormProps> = ({ onSuccess }) => {
  // ✅ THÊM: Sử dụng useToast
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  // ❌ XÓA: [error, setError] vì sẽ dùng Toast thay thế cho Alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Dùng cho lỗi validation tức thì

  // States cho Vị trí nhập
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [locationItemId, setLocationItemId] = useState<string | null>(null);

  // States cho Sản phẩm và Số lượng
  const [productColorId, setProductColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>("");

  // ✅ HÀM MỚI: Xử lý thay đổi số lượng
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setQuantity("");
    } else {
      const numValue = parseInt(value, 10);
      // Chỉ cập nhật nếu là số hợp lệ và không âm
      if (!isNaN(numValue) && numValue >= 0) {
        setQuantity(numValue);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null); // Reset lỗi validation

    // ✅ THÊM: Kiểm tra số lượng
    let finalQuantity: number;
    if (quantity === "" || Number(quantity) <= 0) {
      setErrorMessage("Vui lòng nhập Số lượng nhập hợp lệ (lớn hơn 0).");
      // Dùng Toast cho lỗi validation
      showToast({
          type: "error",
          title: "Lỗi Validation",
          description: "Vui lòng nhập Số lượng nhập hợp lệ (lớn hơn 0).",
      });
      return;
    } else {
      finalQuantity = Number(quantity);
    }

    // Kiểm tra bắt buộc warehouseId, locationItemId, productColorId
    if (!warehouseId) {
      setErrorMessage("Vui lòng chọn Kho hàng.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Kho hàng." });
      return;
    }

    if (!locationItemId) {
      setErrorMessage("Vui lòng chọn Vị trí.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Vị trí." });
      return;
    }

    if (!productColorId) {
      setErrorMessage("Vui lòng chọn Sản phẩm.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Sản phẩm." });
      return;
    }

    setLoading(true);
    // ❌ ĐÃ XÓA: setError(null); // Không cần nữa vì dùng Toast

    try {
      await inventoryService.importStock(warehouseId, {
        locationItemId,
        productColorId,
        quantity: finalQuantity, // Sử dụng finalQuantity (number)
      });

      // ✅ CẬP NHẬT: Toast thành công
      showToast({
          type: "success",
          title: "Nhập kho Thành công!",
          description: `Đã nhập ${finalQuantity} sản phẩm vào kho.`,
      });

      onSuccess();
      
      // ✅ THÊM: Reset form về trạng thái ban đầu
      setQuantity("");
      setWarehouseId(null);
      setZoneId(null);
      setLocationItemId(null);
      setProductColorId(null);


    } catch (err) {
      console.error(err);
      // ✅ CẬP NHẬT: Toast lỗi
      showToast({
          type: "error",
          title: "Lỗi khi Nhập kho",
          description: "Không thể tạo giao dịch nhập kho. Vui lòng kiểm tra Vị trí Kho và sức chứa.",
      });
      // ❌ ĐÃ XÓA: setErrorMessage("Lỗi khi tạo giao dịch nhập kho. Vui lòng kiểm tra Vị trí Kho và sức chứa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Sử dụng form này để ghi nhận hàng hóa mới vào Kho hàng.
      </Typography>

      {/* ✅ THAY ĐỔI: Chỉ giữ lại Alert cho lỗi Validation tức thì (nếu muốn) hoặc xóa bỏ hoàn toàn */}
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      {/* 1. Vị trí Nhập (Sử dụng WarehouseZoneLocationSelector mới) */}
      <WarehouseZoneLocationSelector
        labelPrefix="Nhập vào"
        onWarehouseChange={setWarehouseId}
        onZoneChange={setZoneId}
        onLocationChange={setLocationItemId}
        selectedWarehouseId={warehouseId}
        selectedZoneId={zoneId}
        selectedLocationId={locationItemId}
      />

      {/* 2. Sản phẩm (Sử dụng ProductSelector mới) */}
      <ProductSelector
        onProductColorSelect={setProductColorId}
        // ✅ THÊM: Truyền state sản phẩm để reset component ProductSelector (Nếu component này hỗ trợ)
        // Vì ProductSelector không có prop selectedProductColorId, nên ta tạm thời không truyền.
      />

      <Grid container spacing={2} mt={1}>
        {/* 3. Số lượng - Đã mở rộng thành 12 cột */}
        <Grid item xs={12}>
          <TextField
            label="Số lượng nhập"
            type="number"
            fullWidth
            value={quantity}
            onChange={handleQuantityChange} // ✅ CẬP NHẬT: Dùng hàm mới
            required
            InputProps={{ inputProps: { min: 0 } }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault();
              }
            }}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
      >
        {loading ? 'Đang ghi nhận...' : 'Hoàn tất Nhập Kho'}
      </Button>
    </Box>
  );
};

export default InboundForm;