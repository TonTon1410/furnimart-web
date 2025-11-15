// file: OutboundForm.tsx
import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Grid, Button, CircularProgress, Alert, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { Send } from 'lucide-react';
import WarehouseZoneLocationSelector from './WarehouseZoneLocationSelector'; 
import ProductSelector from './ProductSelector'; 

import inventoryService from '@/service/inventoryService'; 
// ✅ THÊM: Import useToast
import { useToast } from '@/context/ToastContext';

interface OutboundFormProps {
  onSuccess: () => void;
}

const reasons = [
    { value: 'SALE', label: 'Xuất bán hàng' },
    { value: 'DAMAGE', label: 'Xuất hủy (Hàng hỏng)' },
    { value: 'SAMPLE', label: 'Xuất mẫu' },
];

const OutboundForm: React.FC<OutboundFormProps> = ({ onSuccess }) => {
  // ✅ THÊM: Sử dụng useToast
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  // ❌ ĐÃ SỬA/XÓA: Dùng errorMessage cho validation thay vì error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States cho Vị trí xuất
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [locationItemId, setLocationItemId] = useState<string | null>(null);
  
  // States cho Sản phẩm và Số lượng
  const [productColorId, setProductColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>(""); 
  const [outboundReason, setOutboundReason] = useState<string>(''); 

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

    // ✅ CẬP NHẬT: Kiểm tra số lượng và dùng Toast
    let finalQuantity: number;
    if (quantity === "" || Number(quantity) <= 0) {
        setErrorMessage("Vui lòng nhập Số lượng xuất hợp lệ (lớn hơn 0).");
        showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng nhập Số lượng xuất hợp lệ (lớn hơn 0)." });
        return;
    } else {
        finalQuantity = Number(quantity);
    }
    
    // ✅ CẬP NHẬT: Kiểm tra các trường bắt buộc và dùng Toast
    if (!warehouseId) {
      setErrorMessage("Vui lòng chọn Kho hàng.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Kho hàng." });
      return;
    }

    if (!locationItemId) {
      setErrorMessage("Vui lòng chọn Vị trí xuất.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Vị trí xuất." });
      return;
    }

    if (!productColorId) {
      setErrorMessage("Vui lòng chọn Sản phẩm.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Sản phẩm." });
      return;
    }

    if (!outboundReason) {
      setErrorMessage("Vui lòng chọn Lý do xuất.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Lý do xuất." });
      return;
    }


    setLoading(true);
    // ❌ ĐÃ XÓA: setError(null);

    try {
      await inventoryService.exportStock(warehouseId, {
        locationItemId,
        productColorId,
        quantity: finalQuantity, // Sử dụng finalQuantity (number)
        outboundReason, // Trường này cần được gửi nếu API yêu cầu
      });
      
      // ✅ CẬP NHẬT: Toast thành công
      showToast({
          type: "success",
          title: "Xuất kho Thành công!",
          description: `Đã xuất ${finalQuantity} sản phẩm khỏi kho.`,
      });
      
      onSuccess();
      
      // ✅ THÊM: Reset toàn bộ form
      setQuantity("");
      setOutboundReason('');
      setWarehouseId(null);
      setZoneId(null);
      setLocationItemId(null);
      setProductColorId(null);
      
    } catch (err) {
      console.error(err);
      // ✅ CẬP NHẬT: Toast lỗi
      showToast({
          type: "error",
          title: "Lỗi khi Xuất kho",
          description: "Không thể tạo giao dịch xuất kho. Vui lòng kiểm tra Tồn kho Khả dụng tại vị trí đã chọn.",
      });
      // ❌ ĐÃ XÓA: setError("Lỗi khi tạo giao dịch xuất kho. Vui lòng kiểm tra Tồn kho Khả dụng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Sử dụng form này để ghi nhận hàng hóa rời khỏi Kho hàng.
      </Typography>

      {/* ✅ CẬP NHẬT: Dùng errorMessage */}
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      
      {/* 1. Vị trí Xuất (Sử dụng WarehouseZoneLocationSelector mới) */}
      <WarehouseZoneLocationSelector 
        labelPrefix="Xuất từ"
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
      />

      <Grid container spacing={2} mt={1}>
        {/* 3. Số lượng - Đã điều chỉnh chiều rộng */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số lượng xuất"
            type="number"
            fullWidth
            value={quantity}
            onChange={handleQuantityChange} 
            required
            InputProps={{ inputProps: { min: 0 } }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault();
              }
            }}
          />
        </Grid>
        {/* 4. Lý do Xuất - Đã điều chỉnh chiều rộng */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Lý do Xuất</InputLabel>
            <Select
              label="Lý do Xuất"
              value={outboundReason}
              onChange={(e) => setOutboundReason(e.target.value as string)}
            >
              {reasons.map(r => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="error"
        sx={{ mt: 3 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
      >
        {loading ? 'Đang xuất kho...' : 'Hoàn tất Xuất Kho'}
      </Button>
    </Box>
  );
};

export default OutboundForm;