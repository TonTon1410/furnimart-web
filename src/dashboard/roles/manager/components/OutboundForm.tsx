import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Grid, Button, CircularProgress, Alert, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { Send } from 'lucide-react';
// Import các components chung
import InventoryBaseFormFields, { ProductSelector } from './InventoryBaseFormFields';
// Giả định service đã tồn tại
import inventoryService from '@/service/inventoryService'; 

interface OutboundFormProps {
  onSuccess: () => void;
}

const reasons = [
    { value: 'SALE', label: 'Xuất bán hàng' },
    { value: 'DAMAGE', label: 'Xuất hủy (Hàng hỏng)' },
    { value: 'SAMPLE', label: 'Xuất mẫu' },
];

const OutboundForm: React.FC<OutboundFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States cho Vị trí xuất
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [locationItemId, setLocationItemId] = useState<string | null>(null);
  
  // States cho Sản phẩm và Số lượng
  const [productColorId, setProductColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [outboundReason, setOutboundReason] = useState<string>(''); 
  const [reference, setReference] = useState<string>(''); // Ví dụ: Mã đơn hàng (SO)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationItemId || !productColorId || quantity <= 0 || !outboundReason) {
      setError("Vui lòng điền đầy đủ thông tin: Sản phẩm, Vị trí, Số lượng và Lý do xuất.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Giả định API tạo phiếu xuất/ghi nhận xuất kho
      await inventoryService.createOutboundTransaction({
        locationItemId,
        productColorId,
        quantity,
        outboundReason,
        reference,
        // Thêm các trường khác: userId, ...
      });
      
      onSuccess();
      // Reset form (giữ lại vị trí nếu cần xuất nhiều sản phẩm)
      setQuantity(1);
      setReference('');
      
    } catch (err) {
      setError("Lỗi khi tạo giao dịch xuất kho. Vui lòng kiểm tra Tồn kho Khả dụng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
        Sử dụng form này để ghi nhận hàng hóa rời khỏi Kho hàng.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* 1. Vị trí Xuất */}
      <InventoryBaseFormFields 
        labelPrefix="Xuất từ"
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
        <Grid item xs={12} sm={4}>
          <TextField
            label="Số lượng xuất"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            required
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Grid>
        {/* 4. Lý do Xuất */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required>
            <InputLabel>Lý do Xuất</InputLabel>
            <Select
              label="Lý do Xuất"
              value={outboundReason}
              onChange={(e) => setOutboundReason(e.target.value)}
            >
              {reasons.map(r => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* 5. Tham chiếu */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Mã Tham chiếu (SO/Hủy)"
            fullWidth
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="error" // Màu đỏ cho Xuất kho
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