/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-as-const */
import React, { useState } from 'react';
import { 
  Modal, Box, Typography, IconButton, Stack, TextField, Button, 
  CircularProgress, Alert, Tooltip, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { X, Save } from 'lucide-react';
import inventoryService from '@/service/inventoryService'; 

interface InventoryItem {
  locationItemId: string; // ID Vị trí
  productColorId: string; // ID sản phẩm/màu
  productName: string;
  productSku: string;
  physicalQty: number;
}

interface InventoryAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  inventoryItem: InventoryItem;
  locationName: string; // Tên vị trí để hiển thị
  onSuccess: () => void; // Hàm refresh list cha
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

const AdjustmentTypes = [
  { value: 'INCREASE', label: 'Tăng tồn kho' },
  { value: 'DECREASE', label: 'Giảm tồn kho' },
  { value: 'SET', label: 'Đặt lại tồn kho' }, // Set tồn kho vật lý về một giá trị
];

const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({ 
  open, 
  onClose, 
  inventoryItem, 
  locationName,
  onSuccess 
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE' | 'SET'>('SET');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 && adjustmentType !== 'SET') {
      setError("Số lượng điều chỉnh phải lớn hơn 0.");
      return;
    }
    if (!reason.trim()) {
      setError("Lý do điều chỉnh là bắt buộc.");
      return;
    }

    setLoading(true);
    setError(null);

    const data = {
      locationItemId: inventoryItem.locationItemId,
      productColorId: inventoryItem.productColorId,
      quantity,
      reason,
      adjustmentType,
      // Thêm các trường dữ liệu cần thiết khác (ví dụ: userId)
    };
    
    try {
      // Giả định có một API chung để xử lý tất cả các loại điều chỉnh tồn kho
      await inventoryService.adjustInventory(data); 
      onSuccess();
      onClose();
    } catch (err) {
      setError("Lỗi điều chỉnh tồn kho. Vui lòng kiểm tra số lượng khả dụng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSetMode = adjustmentType === 'SET';

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={handleSubmit}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Điều chỉnh Tồn kho
          </Typography>
          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        </Stack>

        <Typography variant="body2" mb={2}>
          **{inventoryItem.productName}** (SKU: {inventoryItem.productSku})
          <br />
          Vị trí: **{locationName}** | Tồn Vật lý hiện tại: **{inventoryItem.physicalQty}**
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Loại Điều chỉnh</InputLabel>
            <Select
                value={adjustmentType}
                label="Loại Điều chỉnh"
                onChange={(e) => setAdjustmentType(e.target.value as 'INCREASE' | 'DECREASE' | 'SET')}
                required
            >
                {AdjustmentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
            </Select>
        </FormControl>

        <TextField
          label={isSetMode ? "Số lượng tồn mới" : "Số lượng điều chỉnh"}
          type="number"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
          required
          sx={{ mb: 2 }}
          helperText={isSetMode ? "Đặt tổng số lượng tồn vật lý về giá trị này." : "Số lượng sẽ được cộng/trừ vào tồn vật lý."}
        />
        
        <TextField
          label="Lý do Điều chỉnh"
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
        >
          {loading ? 'Đang lưu...' : 'Xác nhận Điều chỉnh'}
        </Button>
      </Box>
    </Modal>
  );
};

export default InventoryAdjustmentModal;