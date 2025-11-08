import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert, Divider, Paper } from '@mui/material';
import { RefreshCw, ArrowRight } from 'lucide-react';
// Import các components chung
import InventoryBaseFormFields, { ProductSelector } from './InventoryBaseFormFields';
// Giả định service đã tồn tại
import inventoryService from '@/service/inventoryService'; 

interface TransferFormProps {
  onSuccess: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocationItemId || !toLocationItemId || !productColorId || quantity <= 0) {
      setError("Vui lòng chọn Vị trí Nguồn, Vị trí Đích, Sản phẩm và Số lượng hợp lệ.");
      return;
    }
    if (fromLocationItemId === toLocationItemId) {
        setError("Vị trí Nguồn và Vị trí Đích phải khác nhau.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      // Gọi API chuyển kho
      await inventoryService.transferInventory({
        fromLocationItemId,
        toLocationItemId,
        productColorId,
        quantity,
        note,
        // Thêm các trường khác: userId, ...
      });
      
      onSuccess();
      // Reset Số lượng và Ghi chú
      setQuantity(1);
      setNote('');
      
    } catch (err) {
      setError("Lỗi khi tạo giao dịch chuyển kho. Vui lòng kiểm tra Tồn kho Khả dụng tại vị trí nguồn.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Thực hiện chuyển hàng hóa giữa các Vị trí trong cùng một Kho hoặc khác Kho.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* 1. Sản phẩm */}
      <ProductSelector 
        onSelectProduct={setProductColorId}
        selectedProductColorId={productColorId}
      />

      {/* 2. Số lượng và Ghi chú */}
      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số lượng chuyển"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Ghi chú/Lý do chuyển"
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
        <InventoryBaseFormFields 
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
        <InventoryBaseFormFields 
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
        color="warning" // Màu vàng/cam cho Chuyển kho
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