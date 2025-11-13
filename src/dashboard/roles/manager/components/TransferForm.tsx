// file: TransferForm.tsx
import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert, Divider, Paper } from '@mui/material';
import { RefreshCw, ArrowRight } from 'lucide-react';
import WarehouseZoneLocationSelector from './WarehouseZoneLocationSelector';
import ProductSelector from './ProductSelector';

import inventoryService from '@/service/inventoryService';
// ✅ THÊM: Import useToast
import { useToast } from '@/context/ToastContext';

interface TransferFormProps {
  onSuccess: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  // ✅ THÊM: Sử dụng useToast
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  // ❌ ĐÃ SỬA/XÓA: Dùng errorMessage cho validation thay vì error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States cho VỊ TRÍ NGUỒN (FROM)
  const [fromWhId, setFromWhId] = useState<string | null>(null);
  const [fromZoneId, setFromZoneId] = useState<string | null>(null);
  const [fromLocationItemId, setFromLocationItemId] = useState<string | null>(null);

  // States cho VỊ TRÍ ĐÍCH (TO)
  const [toWhId, setToWhId] = useState<string | null>(null);
  const [toZoneId, setToZoneId] = useState<string | null>(null);
  const [toLocationItemId, setToLocationItemId] = useState<string | null>(null);

  // States cho Sản phẩm và Số lượng
  const [productColorId, setProductColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>(""); 
  const [note, setNote] = useState<string>('');

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
      setErrorMessage("Vui lòng nhập Số lượng chuyển hợp lệ (lớn hơn 0).");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng nhập Số lượng chuyển hợp lệ (lớn hơn 0)." });
      return;
    } else {
      finalQuantity = Number(quantity);
    }

    // Kiểm tra bắt buộc các ID Kho hàng và Vị trí chi tiết nhất
    // 1. Kiểm tra Kho hàng Nguồn
    if (!fromWhId) {
      setErrorMessage("Vui lòng chọn **Kho hàng Nguồn**.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Kho hàng Nguồn." });
      return;
    }

    // 2. Kiểm tra Kho hàng Đích
    if (!toWhId) {
      setErrorMessage("Vui lòng chọn **Kho hàng Đích**.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Kho hàng Đích." });
      return;
    }

    // 3. Kiểm tra Sản phẩm
    if (!productColorId) {
      setErrorMessage("Vui lòng chọn **Sản phẩm**.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vui lòng chọn Sản phẩm." });
      return;
    }

    // 4. Kiểm tra Vị trí Nguồn: Cần chọn ít nhất fromZoneId HOẶC fromLocationItemId.
    if (!fromZoneId && !fromLocationItemId) {
      setErrorMessage("Kho hàng Nguồn cần chọn ít nhất **Khu vực** hoặc **Vị trí**.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Kho hàng Nguồn cần chọn ít nhất Khu vực hoặc Vị trí." });
      return;
    }

    // 5. Kiểm tra Vị trí Đích: Cần chọn ít nhất toZoneId HOẶC toLocationItemId.
    if (!toZoneId && !toLocationItemId) {
      setErrorMessage("Kho hàng Đích cần chọn ít nhất **Khu vực** hoặc **Vị trí**.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Kho hàng Đích cần chọn ít nhất Khu vực hoặc Vị trí." });
      return;
    }

    // 6. Kiểm tra trùng lặp (chỉ cần kiểm tra Location Item nếu cả hai được chọn)
    if (fromLocationItemId && toLocationItemId && fromLocationItemId === toLocationItemId) {
      setErrorMessage("Vị trí Nguồn và Vị trí Đích phải khác nhau.");
      showToast({ type: "error", title: "Lỗi Validation", description: "Vị trí Nguồn và Vị trí Đích phải khác nhau." });
      return;
    }

    setLoading(true);
    // ❌ ĐÃ XÓA: setError(null);

    try {
      const transferData = {
        productColorId: productColorId,
        quantity: finalQuantity, // Sử dụng finalQuantity (number)

        // VỊ TRÍ NGUỒN (FROM)
        fromWarehouseId: fromWhId,
        ...(fromZoneId && { fromZoneId: fromZoneId }),
        ...(fromLocationItemId && { fromLocationItemId: fromLocationItemId }),

        // VỊ TRÍ ĐÍCH (TO)
        toWarehouseId: toWhId,
        ...(toZoneId && { toZoneId: toZoneId }),
        ...(toLocationItemId && { toLocationItemId: toLocationItemId }),
        // ✅ THÊM: Ghi chú nếu có
        ...(note.trim() && { note: note.trim() }),
      };

      await inventoryService.transferInventory(transferData);

      // ✅ CẬP NHẬT: Toast thành công
      showToast({
          type: "success",
          title: "Chuyển kho Thành công!",
          description: `Đã chuyển ${finalQuantity} sản phẩm.`,
      });

      onSuccess();
      
      // ✅ THÊM: Reset toàn bộ form
      setQuantity("");
      setNote('');
      setProductColorId(null);
      
      // Reset Vị trí Nguồn
      setFromWhId(null);
      setFromZoneId(null);
      setFromLocationItemId(null);
      
      // Reset Vị trí Đích
      setToWhId(null);
      setToZoneId(null);
      setToLocationItemId(null);

    } catch (err) {
      console.error(err);
      // ✅ CẬP NHẬT: Toast lỗi
      showToast({
          type: "error",
          title: "Lỗi khi Chuyển kho",
          description: "Không thể tạo giao dịch chuyển kho. Vui lòng kiểm tra Tồn kho Khả dụng tại nguồn và sức chứa tại đích.",
      });
      // ❌ ĐÃ XÓA: setError("Lỗi khi tạo giao dịch chuyển kho. Vui lòng kiểm tra Tồn kho Khả dụng tại vị trí nguồn và sức chứa tại vị trí đích.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Thực hiện chuyển hàng hóa giữa các Vị trí trong cùng một Kho hoặc khác Kho.
      </Typography>

      {/* ✅ CẬP NHẬT: Dùng errorMessage */}
      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

      {/* 1. Sản phẩm (Sử dụng ProductSelector mới) */}
      <ProductSelector
        onProductColorSelect={setProductColorId}
      />

      {/* 2. Số lượng và Ghi chú */}
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số lượng chuyển"
            type="number"
            fullWidth
            value={quantity}
            onChange={handleQuantityChange}
            required
            InputProps={{
              inputProps: { min: 0 },
            }}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                e.preventDefault();
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Ghi chú/Lý do chuyển (Lưu nội bộ)"
            fullWidth
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }}>
        <ArrowRight size={24} color="#1976d2" />
      </Divider>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Vị trí Nguồn (FROM)</Typography>
        <WarehouseZoneLocationSelector
          labelPrefix="Nguồn"
          onWarehouseChange={setFromWhId}
          onZoneChange={setFromZoneId}
          onLocationChange={setFromLocationItemId}
          selectedWarehouseId={fromWhId}
          selectedZoneId={fromZoneId}
          selectedLocationId={fromLocationItemId}
        />
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Vị trí Đích (TO)</Typography>
        <WarehouseZoneLocationSelector
          labelPrefix="Đích"
          onWarehouseChange={setToWhId}
          onZoneChange={setToZoneId}
          onLocationChange={setToLocationItemId}
          selectedWarehouseId={toWhId}
          selectedZoneId={toZoneId}
          selectedLocationId={toLocationItemId}
        />
      </Paper>

      <Button
        type="submit"
        variant="contained"
        color="warning"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshCw size={20} />}
      >
        {loading ? 'Đang chuyển hàng...' : 'Hoàn tất Chuyển Kho'}
      </Button>
    </Box>
  );
};

export default TransferForm;