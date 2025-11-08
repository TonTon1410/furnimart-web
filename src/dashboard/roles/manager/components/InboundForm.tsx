import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { Save } from 'lucide-react';
// Import các components chung
import InventoryBaseFormFields, { ProductSelector } from './InventoryBaseFormFields';
// Giả định service đã tồn tại
import inventoryService from '@/service/inventoryService'; 

interface InboundFormProps {
  onSuccess: () => void;
}

const InboundForm: React.FC<InboundFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States cho Vị trí nhập
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [locationItemId, setLocationItemId] = useState<string | null>(null);
  
  // States cho Sản phẩm và Số lượng
  const [productColorId, setProductColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState<string>(''); // Ví dụ: Mã đơn mua hàng (PO)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationItemId || !productColorId || quantity <= 0) {
      setError("Vui lòng điền đầy đủ thông tin: Sản phẩm, Vị trí và Số lượng hợp lệ.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Giả định API tạo phiếu nhập/ghi nhận nhập kho
      await inventoryService.createInboundTransaction({
        locationItemId,
        productColorId,
        quantity,
        reference,
        // Thêm các trường khác: userId, note, ...
      });
      
      onSuccess();
      // Reset form
      setQuantity(1);
      setReference('');
      // Giữ lại vị trí nếu người dùng muốn nhập nhiều sản phẩm vào cùng 1 chỗ
      
    } catch (err) {
      setError("Lỗi khi tạo giao dịch nhập kho. Vui lòng kiểm tra lại dữ liệu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Sử dụng form này để ghi nhận hàng hóa mới vào Kho hàng.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* 1. Vị trí Nhập */}
      <InventoryBaseFormFields 
        labelPrefix="Nhập vào"
        onWarehouseChange={setWarehouseId}
        onZoneChange={setZoneId}
        onLocationChange={setLocationItemId}
        selectedWarehouseId={warehouseId}
        selectedZoneId={zoneId}
        selectedLocationId={locationItemId}
      />

      {/* 2. Sản phẩm */}
      <ProductSelector 
        onSelectProduct={setProductColorId}
        selectedProductColorId={productColorId}
      />

      <Grid container spacing={2} mt={1}>
        {/* 3. Số lượng */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Số lượng nhập"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        {/* 4. Tham chiếu */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Mã Tham chiếu (PO/Invoice)"
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
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