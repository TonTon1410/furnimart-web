/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-as-const */
import React, { useState } from 'react';
import { 
  Modal, Box, Typography, IconButton, Stack, TextField, Button, 
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { X, Save } from 'lucide-react';
import inventoryService from '@/service/inventoryService'; 

interface InventoryItem {
  locationItemId: string; // ID Vị trí
  productColorId: string; // ID sản phẩm/màu
  productName: string;
  productSku: string;
  physicalQty: number;
  warehouseId: string; // ✅ GIẢ ĐỊNH: Thêm warehouseId để gọi API import/export
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
  // ✅ ĐÃ XÓA: Loại bỏ 'SET' do API mới không hỗ trợ điều chỉnh tuyệt đối
];

const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({ 
  open, 
  onClose, 
  inventoryItem, 
  locationName,
  onSuccess 
}) => {
  // ✅ CẬP NHẬT: Loại bỏ 'SET' khỏi kiểu dữ liệu và giá trị khởi tạo
  const [adjustmentType, setAdjustmentType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState<number>(1); // Bắt đầu từ 1
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ CẬP NHẬT: Chỉ kiểm tra quantity > 0
    if (quantity <= 0) {
      setError("Số lượng điều chỉnh phải lớn hơn 0.");
      return;
    }
    if (!reason.trim()) {
      setError("Lý do điều chỉnh là bắt buộc.");
      return;
    }
    // ✅ THÊM KIỂM TRA: Đảm bảo có warehouseId
    if (!inventoryItem.warehouseId) {
      setError("Thiếu thông tin Kho hàng để thực hiện điều chỉnh.");
      return;
    }

    setLoading(true);
    setError(null);

    const dataToSend = {
      locationItemId: inventoryItem.locationItemId,
      productColorId: inventoryItem.productColorId,
      quantity,
    };
    
    try {
      if (adjustmentType === 'INCREASE') {
        // ✅ SỬ DỤNG importStock cho INCREASE
        await inventoryService.importStock(inventoryItem.warehouseId, dataToSend); 
      } else if (adjustmentType === 'DECREASE') {
        // ✅ SỬ DỤNG exportStock cho DECREASE
        await inventoryService.exportStock(inventoryItem.warehouseId, dataToSend); 
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError("Lỗi khi tạo giao dịch điều chỉnh. Vui lòng kiểm tra lại số lượng và vị trí.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ĐÃ XÓA: isSetMode

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
                onChange={(e) => setAdjustmentType(e.target.value as 'INCREASE' | 'DECREASE')}
                required
            >
                {AdjustmentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
            </Select>
        </FormControl>

        <TextField
          // ✅ CẬP NHẬT: Bỏ logic SET
          label={"Số lượng điều chỉnh"} 
          type="number"
          fullWidth
          value={quantity}
          // ✅ CẬP NHẬT: Số lượng điều chỉnh phải >= 1
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          required
          sx={{ mb: 2 }}
          // ✅ CẬP NHẬT: Bỏ helperText của SET
          helperText={"Số lượng sẽ được cộng/trừ vào tồn vật lý."} 
          InputProps={{ inputProps: { min: 1 } }}
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
          color={adjustmentType === 'INCREASE' ? 'primary' : 'error'}
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
        >
          {loading ? 'Đang lưu...' : (adjustmentType === 'INCREASE' ? 'Xác nhận Tăng tồn' : 'Xác nhận Giảm tồn')}
        </Button>
      </Box>
    </Modal>
  );
};

export default InventoryAdjustmentModal;