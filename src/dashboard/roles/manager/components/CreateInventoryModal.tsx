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

import { useToast } from '@/context/ToastContext';
import ProductSelector, { type ProductSelectionResult } from './ProductSelector';
import inventoryService, { type CreateInventoryRequest } from '@/service/inventoryService';
import WarehouseZoneLocationSelector from './WarehouseZoneLocationSelector';

// --- Constants & Mappings ---
const TYPE_OPTIONS = [
  { value: 'IMPORT', label: 'Nhập hàng', icon: <ImportIcon color="success" /> },
  { value: 'EXPORT', label: 'Xuất hàng', icon: <ExportIcon color="error" /> },
  { value: 'TRANSFER', label: 'Chuyển kho', icon: <TransferIcon color="warning" /> },
  { value: 'RESERVE', label: 'Hàng đang đặt', icon: <NoteIcon color="info" /> },
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
  currentWarehouseId: string | null;
}

const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({ 
  open, 
  onClose, 
  onSuccess,
  currentWarehouseId 
}) => {
  const { showToast } = useToast();

  // --- Form State ---
  const [type, setType] = useState<string>('IMPORT');
  const [purpose, setPurpose] = useState<string>('STOCK_IN');
  const [orderId, setOrderId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // --- Destination Warehouse State (Cho Transfer) ---
  const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
  const [toZoneId, setToZoneId] = useState<string | null>(null);
  const [toLocationId, setToLocationId] = useState<string | null>(null);
  
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
      setQuantity('');
      setSelection(null);
      
      // Reset Destination
      setToWarehouseId(null);
      setToZoneId(null);
      setToLocationId(null);
    }
  }, [open]);

  // Tự động gợi ý Purpose
  useEffect(() => {
    if (type === 'IMPORT') setPurpose('STOCK_IN');
    if (type === 'EXPORT') setPurpose('STOCK_OUT');
    if (type === 'TRANSFER') setPurpose('MOVE');
  }, [type]);

  const handleSave = async () => {
    if (!currentWarehouseId) {
      showToast({ type: 'error', title: 'Lỗi', description: 'Không xác định được kho nguồn.' });
      return;
    }
    if (!selection) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', description: 'Vui lòng chọn sản phẩm (Mục 1).' });
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', description: 'Vui lòng nhập số lượng hợp lệ.' });
      return;
    }
    if (type === 'TRANSFER' && !toWarehouseId) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', description: 'Vui lòng chọn Kho đích để chuyển hàng.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateInventoryRequest = {
        id: 0,
        type,
        purpose,
        warehouseId: currentWarehouseId,
        toWarehouseId: (type === 'TRANSFER' && toWarehouseId) ? toWarehouseId : undefined,
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

      await inventoryService.createOrUpdateInventory(payload);
      
      showToast({ type: 'success', title: 'Thành công', description: 'Đã tạo phiếu kho mới thành công!' });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      showToast({ 
        type: 'error', 
        title: 'Tạo phiếu thất bại', 
        description: error?.response?.data?.message || 'Có lỗi xảy ra' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" // Đổi thành MD cho form dọc gọn gàng hơn
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 0.5, borderRadius: 1 }}>
            <NoteIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={700}>TẠO PHIẾU KHO MỚI</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#fff' }}>
        <Stack divider={<Divider />}>
          
          {/* --- PHẦN 1: CHỌN SẢN PHẨM & VỊ TRÍ (Đưa lên đầu) --- */}
          <Box sx={{ p: 3, bgcolor: '#fcfcfc' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', mb: 2 }}>
              1. Chọn sản phẩm & Vị trí
            </Typography>

            <ProductSelector onSelectionChange={setSelection} />

            {/* Hiển thị tóm tắt và nhập số lượng */}
            {selection && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box flex={1}>
                      <Typography variant="subtitle2" color="success.main">
                        Đã chọn: <b>{selection.productName}</b>
                      </Typography>
                      <Typography variant="caption" display="block">
                        Màu: {selection.colorName} | Kho nguồn: {selection.locationCode}
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
                      sx={{ width: 150, bgcolor: 'white' }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">cái</InputAdornment>,
                      }}
                      autoFocus
                      required
                    />
                </Stack>
              </Box>
            )}
          </Box>

          {/* --- PHẦN 2: THÔNG TIN PHIẾU (Đưa xuống dưới) --- */}
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 2 }}>
              2. Thông tin phiếu
            </Typography>

            {/* Grid container để chia cột trong phần thông tin phiếu cho gọn */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                 <Stack spacing={3}>
                    <TextField
                      select
                      label="Loại phiếu"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      fullWidth
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

                    <TextField
                      select
                      label="Mục đích nghiệp vụ"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      fullWidth
                    >
                      {PURPOSE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                 </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                 <Stack spacing={3}>
                    <TextField
                        label="Mã đơn hàng (Order ID)"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        type="number"
                        fullWidth
                    />
                     <TextField
                      label="Ghi chú nội bộ"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      multiline
                      rows={1.5} // Giảm row xuống một chút cho cân đối
                      fullWidth
                      placeholder="Nhập ghi chú chi tiết..."
                    />
                 </Stack>
              </Grid>

              {/* SELECTOR KHO ĐÍCH (Full width nếu là Transfer) */}
              {type === 'TRANSFER' && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, border: '1px dashed #ed6c02', borderRadius: 2, bgcolor: '#fff3e0' }}>
                    <Typography variant="caption" color="warning.main" fontWeight="bold" display="block" mb={1}>
                      CHUYỂN ĐẾN KHO (DESTINATION)
                    </Typography>
                    <WarehouseZoneLocationSelector 
                      labelPrefix="Đích"
                      selectedWarehouseId={toWarehouseId}
                      selectedZoneId={toZoneId}
                      selectedLocationId={toLocationId}
                      onWarehouseChange={(id) => { setToWarehouseId(id); setToZoneId(null); setToLocationId(null); }}
                      onZoneChange={(id) => { setToZoneId(id); setToLocationId(null); }}
                      onLocationChange={(id) => setToLocationId(id)}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee', bgcolor: '#f8f9fa' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Hủy bỏ
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={submitting || !selection || !quantity}
          sx={{ px: 4, textTransform: 'none', fontWeight: 700 }}
        >
          Lưu phiếu kho
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInventoryModal;