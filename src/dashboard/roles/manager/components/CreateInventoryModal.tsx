/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Divider,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  CompareArrows as TransferIcon,
  Input as ImportIcon,
  Output as ExportIcon,
  Description as NoteIcon
} from '@mui/icons-material';

// 1. Thay thế import notistack bằng useToast của bạn
// import { useSnackbar } from 'notistack'; <--- Xóa dòng này
import { useToast } from '@/context/ToastContext'; //
import ProductSelector, { type ProductSelectionResult } from './ProductSelector';
import inventoryService, { type CreateInventoryRequest } from '@/service/inventoryService';
import { useWarehouseData } from '../hook/useWarehouseData';

// --- Constants & Mappings (Giữ nguyên) ---
const TYPE_OPTIONS = [
  { value: 'IMPORT', label: 'Nhập hàng', icon: <ImportIcon color="success" /> },
  { value: 'EXPORT', label: 'Xuất hàng', icon: <ExportIcon color="error" /> },
  { value: 'TRANSFER', label: 'Chuyển kho', icon: <TransferIcon color="warning" /> },
  { value: 'RESERVE', label: 'Giữ hàng', icon: <NoteIcon color="info" /> },
];

const PURPOSE_OPTIONS = [
  { value: 'STOCK_IN', label: 'Nhập kho' },
  { value: 'STOCK_OUT', label: 'Xuất kho' },
  { value: 'MOVE', label: 'Điều chuyển nội bộ' },
];

// --- Interface ---
interface CreateInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; 
}

const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({ open, onClose, onSuccess }) => {
  const { storeId } = useWarehouseData();
  
  // 2. Sử dụng hook useToast thay vì useSnackbar
  const { showToast } = useToast(); //

  // --- Form State ---
  const [type, setType] = useState<string>('IMPORT');
  const [purpose, setPurpose] = useState<string>('STOCK_IN');
  const [orderId, setOrderId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [toWarehouseId, setToWarehouseId] = useState<string>('');
  
  // --- Product Selection State ---
  const [selection, setSelection] = useState<ProductSelectionResult | null>(null);
  const [quantity, setQuantity] = useState<string>(''); 
  const [submitting, setSubmitting] = useState(false);

  // Reset form khi mở modal
  useEffect(() => {
    if (open) {
      setType('IMPORT');
      setPurpose('STOCK_IN');
      setOrderId('');
      setNote('');
      setToWarehouseId('');
      setQuantity('');
      setSelection(null);
    }
  }, [open]);

  // Tự động gợi ý Purpose
  useEffect(() => {
    if (type === 'IMPORT') setPurpose('STOCK_IN');
    if (type === 'EXPORT') setPurpose('STOCK_OUT');
    if (type === 'TRANSFER') setPurpose('MOVE');
  }, [type]);

  const handleSave = async () => {
    // 1. Validate cơ bản & Thay thế enqueueSnackbar bằng showToast
    if (!storeId) {
      showToast({ 
        type: 'error', 
        title: 'Lỗi hệ thống', 
        description: 'Không xác định được kho nguồn (Store ID)' 
      });
      return;
    }
    if (!selection) {
      showToast({ 
        type: 'warning', 
        title: 'Thiếu thông tin', 
        description: 'Vui lòng chọn sản phẩm, màu sắc và vị trí kho' 
      });
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      showToast({ 
        type: 'warning', 
        title: 'Dữ liệu không hợp lệ', 
        description: 'Vui lòng nhập số lượng lớn hơn 0' 
      });
      return;
    }
    if (type === 'TRANSFER' && !toWarehouseId) {
      showToast({ 
        type: 'warning', 
        title: 'Thiếu thông tin', 
        description: 'Vui lòng nhập ID kho đích để chuyển hàng' 
      });
      return;
    }

    setSubmitting(true);
    try {
      // 2. Chuẩn bị payload
      const payload: CreateInventoryRequest = {
        id: 0,
        type,
        purpose,
        warehouseId: storeId,
        toWarehouseId: type === 'TRANSFER' ? toWarehouseId : undefined,
        note: note,
        orderId: orderId ? Number(orderId) : undefined,
        items: [
          {
            productColorId: selection.productColorId,
            locationItemId: selection.locationItemId,
            quantity: Number(quantity),
          },
        ],
      };

      // 3. Gọi API
      await inventoryService.createOrUpdateInventory(payload);
      
      // Thông báo thành công
      showToast({ 
        type: 'success', 
        title: 'Thành công', 
        description: 'Đã tạo phiếu kho mới thành công!' 
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      // Thông báo lỗi từ API
      showToast({ 
        type: 'error', 
        title: 'Tạo phiếu thất bại', 
        description: error?.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              width: 32, 
              height: 32, 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <NoteIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={700}>TẠO PHIẾU KHO MỚI</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
        <Grid container spacing={3}>
          
          {/* CỘT TRÁI: THÔNG TIN CHUNG */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                1. Thông tin phiếu
              </Typography>

              {/* Type Select */}
              <TextField
                select
                label="Loại phiếu"
                value={type}
                onChange={(e) => setType(e.target.value)}
                fullWidth
                size="medium"
              >
                {TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {option.icon}
                      <Typography>{option.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>

              {/* Purpose Select */}
              <TextField
                select
                label="Mục đích nghiệp vụ"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                fullWidth
                size="medium"
                helperText="Chọn mục đích hạch toán tồn kho"
              >
                {PURPOSE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Input Kho đích (Chỉ hiện khi Transfer) */}
              {type === 'TRANSFER' && (
                <Box sx={{ p: 2, border: '1px dashed orange', borderRadius: 2, bgcolor: '#fffbf2' }}>
                  <Typography variant="caption" color="warning.main" fontWeight="bold">KHO ĐÍCH ĐẾN</Typography>
                  <TextField
                    label="Nhập ID Kho đích (Destination Warehouse)"
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    fullWidth
                    margin="dense"
                    required
                    placeholder="VD: WH-HCM-02"
                  />
                </Box>
              )}

              <Divider />

              <TextField
                label="Mã đơn hàng (Order ID)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                type="number"
                fullWidth
                placeholder="Để trống nếu không có"
              />

              <TextField
                label="Ghi chú nội bộ"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="VD: Nhập bù hàng bị vỡ..."
              />
            </Stack>
          </Grid>

          {/* CỘT PHẢI: CHỌN SẢN PHẨM */}
          <Grid item xs={12} md={7}>
             <Box sx={{ height: '100%', borderLeft: { md: '1px solid #eee' }, pl: { md: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
                  2. Chi tiết hàng hóa
                </Typography>

                {/* Component Product Selector */}
                <ProductSelector onSelectionChange={setSelection} />

                {/* Input Số lượng (Chỉ hiện khi đã chọn xong Product + Location) */}
                {selection && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                       <Box flex={1}>
                          <Typography variant="subtitle2" color="success.main">
                            Đã chọn: <b>{selection.productName}</b>
                          </Typography>
                          <Typography variant="caption" display="block">
                            Màu: {selection.colorName} | Vị trí: {selection.locationCode}
                          </Typography>
                       </Box>
                       
                       <TextField
                          label="Số lượng"
                          value={quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^[0-9]+$/.test(val)) {
                              setQuantity(val);
                            }
                          }}
                          sx={{ width: 120, bgcolor: 'white' }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">cái</InputAdornment>,
                          }}
                          autoFocus
                       />
                    </Stack>
                  </Box>
                )}
             </Box>
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee', bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Hủy bỏ
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="success"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={submitting || !selection || !quantity}
          sx={{ 
            px: 4, 
            textTransform: 'none', 
            fontWeight: 700, 
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' 
          }}
        >
          {submitting ? 'Đang xử lý...' : 'Lưu phiếu kho'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInventoryModal;