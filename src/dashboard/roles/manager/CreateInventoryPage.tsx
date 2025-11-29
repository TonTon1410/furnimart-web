/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
    Grid, TextField, Stack, Typography,
    IconButton, Divider, Box, InputAdornment, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Avatar
} from '@mui/material';
import {
    Save as SaveIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    CompareArrows as TransferIcon,
    Input as ImportIcon,
    Output as ExportIcon,
    Description as NoteIcon,
    ArrowBack,
    ImageNotSupported as ImageIcon,
    Search as SearchIcon // [Mới] Thêm icon tìm kiếm
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Services & Hooks
import { useToast } from '@/context/ToastContext';
import inventoryService, { type CreateInventoryRequest } from '@/service/inventoryService';

// Components
import ProductSelector, { type ProductSelectionResult } from './components/ProductSelector';
import WarehouseZoneLocationSelector from './components/WarehouseZoneLocationSelector';
import CustomDropdown from '@/components/CustomDropdown';

// --- Constants ---
const TYPE_OPTIONS = [
    { value: 'IMPORT', label: 'Nhập hàng', icon: <ImportIcon color="success" /> },
    { value: 'EXPORT', label: 'Xuất hàng', icon: <ExportIcon color="error" /> },
    { value: 'TRANSFER', label: 'Chuyển kho', icon: <TransferIcon color="warning" /> },
];

interface CartItem extends ProductSelectionResult {
    tempId: string;
    quantity: number;
}

const CreateInventoryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const currentWarehouseId = location.state?.warehouseId;

    // --- Form State ---
    const [type, setType] = useState<string>('IMPORT');
    const [purpose, setPurpose] = useState<string>('STOCK_IN');
    const [orderId, setOrderId] = useState<string>('');
    const [note, setNote] = useState<string>('');

    const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
    const [toZoneId, setToZoneId] = useState<string | null>(null);
    const [toLocationId, setToLocationId] = useState<string | null>(null);

    const [items, setItems] = useState<CartItem[]>([]);

    const [tempSelection, setTempSelection] = useState<ProductSelectionResult | null>(null);
    const [tempQuantity, setTempQuantity] = useState<string>('');
    const [selectorKey, setSelectorKey] = useState(0);

    const [submitting, setSubmitting] = useState(false);

    const dropdownOptions = TYPE_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label
    }));

    // --- Effects ---
    useEffect(() => {
        if (type === 'IMPORT') setPurpose('STOCK_IN');
        if (type === 'EXPORT') setPurpose('STOCK_OUT');
        if (type === 'TRANSFER') setPurpose('MOVE');

        if (type !== 'TRANSFER') {
            setToWarehouseId(null);
            setToZoneId(null);
            setToLocationId(null);
        }

        if (type !== 'EXPORT') {
            setOrderId('');
        }
    }, [type]);

    // --- Handlers ---

    const handleAddItem = () => {
        if (!tempSelection) {
            showToast({ type: 'warning', title: 'Chưa chọn sản phẩm', description: 'Vui lòng chọn sản phẩm và vị trí.' });
            return;
        }
        if (!tempQuantity || Number(tempQuantity) <= 0) {
            showToast({ type: 'warning', title: 'Số lượng không hợp lệ', description: 'Vui lòng nhập số lượng > 0.' });
            return;
        }

        const exists = items.find(i =>
            i.productColorId === tempSelection.productColorId &&
            i.locationItemId === tempSelection.locationItemId
        );

        if (exists) {
            showToast({ type: 'info', title: 'Đã gộp số lượng', description: 'Sản phẩm này đã có trong danh sách, đã cộng dồn số lượng.' });
            setItems(prev => prev.map(item =>
                (item.productColorId === tempSelection.productColorId && item.locationItemId === tempSelection.locationItemId)
                    ? { ...item, quantity: item.quantity + Number(tempQuantity) }
                    : item
            ));
        } else {
            const newItem: CartItem = {
                ...tempSelection,
                quantity: Number(tempQuantity),
                tempId: Date.now().toString()
            };
            setItems([...items, newItem]);
        }

        setTempSelection(null);
        setTempQuantity('');
        setSelectorKey(prev => prev + 1);
    };

    const handleRemoveItem = (tempId: string) => {
        setItems(prev => prev.filter(i => i.tempId !== tempId));
    };

    const handleSaveTicket = async () => {
        if (!currentWarehouseId) {
            showToast({ type: 'error', title: 'Lỗi', description: 'Không xác định được kho nguồn. Vui lòng quay lại danh sách.' });
            return;
        }
        if (items.length === 0) {
            showToast({ type: 'warning', title: 'Danh sách trống', description: 'Vui lòng thêm ít nhất 1 sản phẩm.' });
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
                items: items.map(item => ({
                    productColorId: item.productColorId,
                    locationItemId: item.locationItemId,
                    quantity: item.quantity
                })),
            };

            await inventoryService.createOrUpdateInventory(payload);

            showToast({ type: 'success', title: 'Thành công', description: 'Đã tạo phiếu kho thành công!' });
            navigate('/inventory');
        } catch (error: any) {
            console.error(error);
            showToast({
                type: 'error',
                title: 'Thất bại',
                description: error?.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Styles
    const cardBgClass = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl";
    const textTitleClass = "text-gray-900 dark:text-white font-bold";

    if (!currentWarehouseId) return (
        <div className="p-10 text-center text-red-500">
            <Typography variant="h6">Lỗi: Không tìm thấy ID kho</Typography>
            <Button onClick={() => navigate('/inventory')}>Quay về danh sách</Button>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">

            {/* === CỘT TRÁI: DANH SÁCH SẢN PHẨM === */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                {/* Header Mobile */}
                <div className="lg:hidden flex items-center justify-between mb-4">
                    <Typography variant="h6" className="dark:text-white">Tạo phiếu kho</Typography>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Quay lại</Button>
                </div>

                {/* 1. Product Selector (Đã được bọc giao diện - MỚI) */}
                <div className={`${cardBgClass} overflow-hidden`}>
                    {/* Header Box */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                        <SearchIcon color="primary" />
                        <Typography variant="subtitle1" className={textTitleClass}>
                            TÌM KIẾM SẢN PHẨM
                        </Typography>
                    </div>

                    {/* Content Box */}
                    <div className="p-4">
                        <ProductSelector
                            key={selectorKey}
                            onSelectionChange={setTempSelection}
                            // [MỚI] Truyền props để switch logic
                            type={type}
                            currentWarehouseId={currentWarehouseId}
                        />
                    </div>
                </div>

                {/* Khối nhập số lượng (Chỉ hiện khi đã chọn sản phẩm) */}
                {tempSelection && (
                    <div className="p-4 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 shadow-sm rounded-xl animate-in fade-in slide-in-from-top-2">
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                    Đang chọn: <b>{tempSelection.productName}</b>
                                </Typography>
                                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                    Màu: {tempSelection.colorName} | Vị trí: {tempSelection.locationCode}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, md: 4 }}>
                                <TextField
                                    label="Nhập số lượng"
                                    value={tempQuantity}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '' || /^[0-9]+$/.test(val)) setTempQuantity(val);
                                    }}
                                    fullWidth
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Typography className="dark:!text-white">cái</Typography>
                                            </InputAdornment>
                                        ),
                                        // !bg-gray-900: Ép nền đen
                                        // !text-white: Ép chữ trắng
                                        className: "bg-white dark:!bg-gray-900 dark:!text-white"
                                    }}
                                    InputLabelProps={{
                                        // !text-white: Ép nhãn (Label) màu trắng
                                        className: "dark:!text-white"
                                    }}
                                    inputProps={{
                                        // Ép màu placeholder
                                        className: "placeholder:text-gray-400 dark:placeholder:!text-gray-300"
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { bgcolor: 'bg-white dark:bg-gray-900' }
                                    }}
                                    autoFocus
                                />
                            </Grid>
                            <Grid size={{ xs: 6, md: 2 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    fullWidth
                                    onClick={handleAddItem}
                                    startIcon={<AddIcon />}
                                    disabled={!tempQuantity}
                                >
                                    Thêm
                                </Button>
                            </Grid>
                        </Grid>
                    </div>
                )}

                {/* 2. Danh sách sản phẩm đã thêm */}
                <div className={`${cardBgClass} overflow-hidden`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                        <Typography variant="subtitle1" className={textTitleClass}>
                            DANH SÁCH CHỜ ({items.length})
                        </Typography>
                        {items.length > 0 && (
                            <Button size="small" color="error" onClick={() => setItems([])}>Xóa tất cả</Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 dark:!text-gray-300">
                            <Typography>Chưa có sản phẩm nào trong phiếu.</Typography>
                            <Typography variant="caption">Vui lòng chọn sản phẩm ở trên và ấn "Thêm".</Typography>
                        </div>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow className="bg-gray-100 dark:bg-gray-700 [&_th]:dark:!text-gray-300">
                                        <TableCell>Hình ảnh</TableCell>
                                        <TableCell>Sản phẩm</TableCell>
                                        <TableCell>Màu sắc</TableCell>
                                        <TableCell>Vị trí</TableCell>
                                        <TableCell align="right">Số lượng</TableCell>
                                        <TableCell align="center">Xóa</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.tempId} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                            <TableCell>
                                                <Avatar
                                                    src={item.imageUrl}
                                                    variant="rounded"
                                                    sx={{
                                                        width: 40, height: 40,
                                                        bgcolor: 'action.selected',
                                                        border: '1px solid', borderColor: 'divider'
                                                    }}
                                                >
                                                    <ImageIcon fontSize="small" />
                                                </Avatar>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500, color: 'text.primary' }} className="dark:!text-white" >{item.productName}</TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Box sx={{ width: 16, height: 16, bgcolor: item.hexCode || '#ccc', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' }} />
                                                    <Typography variant="body2" className="text-gray-600 dark:!text-gray-300">{item.colorName}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell className="dark:!text-white">{item.locationCode}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                {item.quantity.toLocaleString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.tempId)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </div>
            </div>

            {/* === CỘT PHẢI: THÔNG TIN PHIẾU === */}
            <div className="w-full lg:w-[400px] flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-auto lg:h-full shadow-xl z-20">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
                    <NoteIcon color="primary" />
                    <Typography variant="h6" className={textTitleClass}>THÔNG TIN PHIẾU</Typography>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <Stack spacing={3}>
                        <CustomDropdown
                            id="inventory-type-select"
                            label="Loại phiếu"
                            value={type}
                            options={dropdownOptions}
                            onChange={(newValue) => setType(newValue)}
                            fullWidth={true}
                            placeholder="Chọn loại phiếu"
                        />

                        {type === 'EXPORT' && (
                            <TextField
                                label="Mã đơn hàng (Order ID)"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                type="number"
                                fullWidth
                                helperText="Nhập nếu phiếu này liên quan đến đơn hàng"
                                InputProps={{
                                    className: "bg-white dark:!bg-gray-900 dark:!text-white"
                                }}
                                InputLabelProps={{
                                    className: "dark:!text-white"
                                }}
                                inputProps={{
                                    className: "placeholder:text-gray-400 dark:placeholder:!text-gray-300"
                                }}
                                FormHelperTextProps={{
                                    className: "dark:!text-gray-400"
                                }}
                            />
                        )}

                        <TextField
                            label="Ghi chú nội bộ"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            placeholder="Nhập ghi chú chi tiết..."
                            InputProps={{
                                className: "bg-white dark:!bg-gray-900 dark:!text-white"
                            }}
                            InputLabelProps={{
                                className: "dark:!text-white"
                            }}
                            inputProps={{
                                className: "placeholder:text-gray-400 dark:placeholder:!text-gray-300"
                            }}
                        />

                        {/* Khối Chuyển kho */}
                        {type === 'TRANSFER' && (
                            <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-lg space-y-3">
                                <Typography variant="subtitle2" color="warning.main" fontWeight="bold">
                                    CHUYỂN ĐẾN (DESTINATION)
                                </Typography>
                                <Divider className="border-orange-200 dark:border-orange-800" />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <WarehouseZoneLocationSelector
                                        labelPrefix="Đích"
                                        selectedWarehouseId={toWarehouseId}
                                        selectedZoneId={toZoneId}
                                        selectedLocationId={toLocationId}
                                        onWarehouseChange={(id) => { setToWarehouseId(id); setToZoneId(null); setToLocationId(null); }}
                                        onZoneChange={(id) => { setToZoneId(id); setToLocationId(null); }}
                                        onLocationChange={(id) => setToLocationId(id)}

                                        hideZoneAndLocation={true} // <--- [MỚI] Thêm dòng này
                                    />
                                </Box>
                            </div>
                        )}
                    </Stack>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSaveTicket}
                        disabled={submitting || items.length === 0}
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        // [Sửa đổi]: Thêm !text-white để chữ trắng
                        // [Sửa đổi]: Thêm dark:!bg-gray-700 (xám sáng hơn nền 900) và dark:hover:!bg-gray-600
                        className="!text-white dark:!bg-gray-700 dark:hover:!bg-gray-600"
                        sx={{ py: 1.5, fontWeight: 'bold' }}
                    >
                        {submitting ? 'ĐANG LƯU...' : 'HOÀN TẤT & LƯU PHIẾU'}
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => navigate('/inventory')}
                        // [Sửa đổi]: Xóa 'text.secondary', ép màu trắng và in đậm
                        sx={{
                            borderColor: 'divider',
                            fontWeight: 'bold',
                            color: 'white'
                        }}
                    >
                        Hủy bỏ
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateInventoryPage;