/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Grid, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, TextField, Avatar, Chip, Stack
} from "@mui/material";
import {
    Delete as DeleteIcon,
    LocalMallOutlined,
    PersonOutline,
    LocationOnOutlined,
    DescriptionOutlined,
    LocalShipping,
    CreditCard,
    AttachMoney
} from "@mui/icons-material";
import { authService } from "@/service/authService";
import AddressSelector, { type Address } from "@/components/AddressSelector";
import { useToast } from "@/context/ToastContext";
import staffOrderService, { type CreateStaffOrderRequest } from "@/service/staffOrderService";
import StaffProductSelector from "@/dashboard/roles/seller/OrderOffline/StaffProductSelector";

interface CartItem {
    productId: string;
    productColorId: string;
    productName: string;
    colorName: string;
    price: number;
    quantity: number;
    image: string;
    maxStock: number;
}

const StaffOrderPage: React.FC = () => {
    const { showToast } = useToast();
    const [storeId, setStoreId] = useState<string | null>(null);

    // Form States
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [specificAddress, setSpecificAddress] = useState("");
    const [addressDetails, setAddressDetails] = useState<Address | null>(null);
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "VN_PAY">("COD");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const sid = authService.getStoreId();
        if (sid) setStoreId(sid);
        else showToast({ type: "error", title: "Lỗi", description: "Không tìm thấy thông tin cửa hàng." });
    }, [showToast]);

    const handleAddressChange = useCallback((addr: Address) => setAddressDetails(addr), []);

    const handleAddToCart = (item: CartItem) => {
        setCartItems(prev => {
            const existingIdx = prev.findIndex(i => i.productColorId === item.productColorId);
            if (existingIdx >= 0) {
                const newItems = [...prev];
                const newQty = newItems[existingIdx].quantity + item.quantity;
                if (newQty > item.maxStock) {
                    showToast({ type: "warning", title: "Cảnh báo", description: "Vượt quá tồn kho!" });
                    return prev;
                }
                newItems[existingIdx].quantity = newQty;
                return newItems;
            }
            return [...prev, item];
        });
        showToast({ type: "success", title: "Đã thêm", description: item.productName });
    };

    const handleRemoveItem = (id: string) => setCartItems(prev => prev.filter(i => i.productColorId !== id));

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmitOrder = async () => {
        if (!storeId || cartItems.length === 0) return;
        if (!customerName.trim() || !customerPhone.trim()) {
            return showToast({ type: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập tên và SĐT khách hàng" });
        }
        if (!addressDetails || !specificAddress.trim()) {
            return showToast({ type: "warning", title: "Thiếu địa chỉ", description: "Vui lòng nhập địa chỉ giao hàng" });
        }

        setIsSubmitting(true);
        try {
            const payload: CreateStaffOrderRequest = {
                storeId: storeId,
                customerName,
                phone: customerPhone,
                addressLine: `${specificAddress}, ${addressDetails.ward}, ${addressDetails.district}, ${addressDetails.city}`,
                paymentMethod,
                note,
                orderDetails: cartItems.map(i => ({ productColorId: i.productColorId, quantity: i.quantity, price: i.price }))
            };

            const res = await staffOrderService.createOrder(payload);
            if (res.data.status === 201 || res.data.status === 200) {
                if (paymentMethod === "VN_PAY" && res.data.redirectUrl) {
                    window.location.href = res.data.redirectUrl;
                } else {
                    showToast({ type: "success", title: "Thành công", description: "Đơn hàng đã được tạo!" });
                    setCartItems([]);
                    setCustomerName("");
                    setCustomerPhone("");
                    setSpecificAddress("");
                    setNote("");
                }
            }
        } catch (error: any) {
            showToast({ type: "error", title: "Thất bại", description: error.response?.data?.message || "Lỗi tạo đơn" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!storeId) return <Box className="p-8 text-center text-gray-500 dark:text-gray-400">Đang tải dữ liệu cửa hàng...</Box>;

    return (
        <Box className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50/50 dark:!bg-gray-900 min-h-screen font-sans transition-colors duration-200">
            <Box className="mb-6 pb-4 border-b border-gray-200 dark:!border-gray-700">
                <Typography variant="h4" className="font-extrabold text-gray-800 dark:!text-white tracking-tight flex items-center gap-2">
                    <LocalMallOutlined fontSize="large" className="text-emerald-600 dark:!text-emerald-400" />
                    Tạo Đơn Hàng
                </Typography>
            </Box>

            <Grid container spacing={4}>

                {/* --- LEFT COLUMN --- */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Stack spacing={4}>
                        <StaffProductSelector
                            currentStoreId={storeId}
                            onAddProduct={handleAddToCart}
                        />

                        {/* KHỐI GIỎ HÀNG */}
                        <Paper className="rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 overflow-hidden bg-white dark:!bg-gray-800 transition-colors">
                            <Box className="p-5 border-b border-gray-100 dark:!border-gray-700 bg-gray-50/50 dark:!bg-gray-800 flex justify-between items-center">
                                <Typography variant="h6" className="!font-bold text-gray-800 dark:!text-gray-100 flex items-center gap-2">
                                    <LocalShipping className="text-emerald-600 dark:!text-emerald-400" />
                                    Giỏ hàng
                                </Typography>
                                <Chip label={`${cartItems.length} sản phẩm`} color="primary" size="small" className="dark:!bg-blue-900 dark:!text-blue-100" />
                            </Box>

                            {cartItems.length === 0 ? (
                                <Box className="py-12 text-center text-gray-400 dark:!text-gray-500">
                                    <Typography>Chưa có sản phẩm nào</Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{ maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="bg-white dark:!bg-gray-800 !font-bold text-gray-500 dark:!text-gray-400 uppercase text-xs py-4 border-b dark:!border-gray-700">Sản phẩm</TableCell>
                                                <TableCell align="center" className="bg-white dark:!bg-gray-800 !font-bold text-gray-500 dark:!text-gray-400 uppercase text-xs py-4 border-b dark:!border-gray-700">SL</TableCell>
                                                <TableCell align="right" className="bg-white dark:!bg-gray-800 !font-bold text-gray-500 dark:!text-gray-400 uppercase text-xs py-4 border-b dark:!border-gray-700">Đơn giá</TableCell>
                                                <TableCell align="right" className="bg-white dark:!bg-gray-800 !font-bold text-gray-500 dark:!text-gray-400 uppercase text-xs py-4 border-b dark:!border-gray-700">Tổng</TableCell>
                                                <TableCell className="bg-white dark:!bg-gray-800 border-b dark:!border-gray-700" />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cartItems.map((item) => (
                                                <TableRow key={item.productColorId} hover className="hover:!bg-gray-50 dark:hover:!bg-gray-700">
                                                    <TableCell sx={{ py: 3 }} className="dark:!border-gray-700">
                                                        <Box className="flex items-center gap-4">
                                                            <Avatar src={item.image} variant="rounded" sx={{ width: 64, height: 64 }} className="border border-gray-100 dark:!border-gray-600" />
                                                            <Box>
                                                                <Typography variant="body1" className="!font-bold text-gray-800 dark:!text-gray-200">{item.productName}</Typography>
                                                                <Typography variant="body2" className="text-gray-500 dark:!text-gray-400 mt-1">Màu: {item.colorName}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 3 }} className="dark:!border-gray-700">
                                                        <Chip label={item.quantity} size="medium" variant="outlined" className="font-bold bg-white dark:!bg-gray-700 dark:!text-white dark:!border-gray-600" />
                                                    </TableCell>
                                                    <TableCell align="right" className="text-gray-600 dark:!text-gray-300 dark:!border-gray-700" sx={{ py: 3 }}>
                                                        {item.price.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell align="right" className="font-bold text-emerald-600 dark:!text-emerald-400 dark:!border-gray-700" sx={{ py: 3 }}>
                                                        {(item.price * item.quantity).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 3 }} className="dark:!border-gray-700">
                                                        <IconButton onClick={() => handleRemoveItem(item.productColorId)} color="error">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            {cartItems.length > 0 && (
                                <Box className="p-6 bg-emerald-50 dark:!bg-emerald-900/20 border-t border-emerald-100 dark:!border-emerald-800 flex justify-end items-center gap-4">
                                    <Typography className="text-gray-600 dark:!text-emerald-300 font-medium">Tổng tiền:</Typography>
                                    <Typography variant="h4" className="font-bold text-emerald-700 dark:!text-emerald-400">
                                        {totalPrice.toLocaleString()}đ
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* KHỐI THANH TOÁN */}
                        <Paper className="p-6 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 bg-white dark:!bg-gray-800 transition-colors">
                            <Typography variant="h6" className="mb-6 font-bold text-gray-800 dark:!text-white flex items-center gap-2 border-b dark:!border-gray-700 pb-2">
                                <CreditCard className="text-emerald-500" />
                                Thanh toán
                            </Typography>

                            <Stack spacing={2}>
                                <Box
                                    onClick={() => setPaymentMethod("COD")}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-4
                                        ${paymentMethod === "COD"
                                            ? 'border-emerald-500 bg-emerald-50 dark:!bg-emerald-900/30 dark:!border-emerald-400'
                                            : 'border-gray-200 dark:!border-gray-600 hover:bg-gray-50 dark:hover:!bg-gray-700'}
                                    `}
                                >
                                    <AttachMoney color={paymentMethod === "COD" ? "success" : "disabled"} />
                                    <Box>
                                        <Typography fontWeight="bold" color={paymentMethod === "COD" ? "success.main" : "text.primary"} className={paymentMethod !== "COD" ? "dark:!text-gray-300" : ""}>Thanh toán khi nhận (COD)</Typography>
                                    </Box>
                                </Box>

                                <Box
                                    onClick={() => setPaymentMethod("VN_PAY")}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-4
                                        ${paymentMethod === "VN_PAY"
                                            ? 'border-blue-500 bg-blue-50 dark:!bg-blue-900/30 dark:!border-blue-400'
                                            : 'border-gray-200 dark:!border-gray-600 hover:bg-gray-50 dark:hover:!bg-gray-700'}
                                    `}
                                >
                                    <CreditCard color={paymentMethod === "VN_PAY" ? "primary" : "disabled"} />
                                    <Box>
                                        <Typography fontWeight="bold" color={paymentMethod === "VN_PAY" ? "primary.main" : "text.primary"} className={paymentMethod !== "VN_PAY" ? "dark:!text-gray-300" : ""}>VNPAY</Typography>
                                    </Box>
                                </Box>
                            </Stack>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || cartItems.length === 0}
                                className={`
                                    !mt-4 py-4 rounded-xl font-bold text-lg shadow-none hover:shadow-lg transition-all
                                    ${isSubmitting ? 'bg-gray-300 dark:!bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-700'}
                                `}
                            >
                                {isSubmitting ? "Đang xử lý..." : "Hoàn tất đơn hàng"}
                            </Button>
                        </Paper>
                    </Stack>
                </Grid>

                {/* --- RIGHT COLUMN --- */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box className="sticky top-6 space-y-6">

                        {/* THÔNG TIN KHÁCH HÀNG */}
                        <Paper className="p-6 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 bg-white dark:!bg-gray-800 transition-colors">
                            <Typography variant="h6" className="mb-6 font-bold text-gray-800 dark:!text-white flex items-center gap-2 border-b dark:!border-gray-700 pb-2">
                                <PersonOutline className="text-emerald-500" />
                                Thông tin khách hàng
                            </Typography>

                            <Stack spacing={3}>
                                <TextField
                                    fullWidth label="Tên khách hàng" variant="outlined"
                                    value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                    required placeholder="Nhập tên khách..."
                                    InputProps={{
                                        sx: { borderRadius: 2 },
                                        className: "dark:!text-gray-100 dark:!bg-gray-900"
                                    }}
                                    InputLabelProps={{ className: "dark:!text-gray-400" }}
                                    sx={{
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.23)" },
                                        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981" },
                                        ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" }
                                    }}
                                />

                                <TextField
                                    fullWidth label="Số điện thoại" variant="outlined"
                                    value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                                    required placeholder="Nhập số điện thoại..."
                                    InputProps={{
                                        sx: { borderRadius: 2 },
                                        className: "dark:!text-gray-100 dark:!bg-gray-900"
                                    }}
                                    InputLabelProps={{ className: "dark:!text-gray-400" }}
                                    sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                                />

                                <Box>
                                    <Typography variant="h6" className="mb-4 text-gray-600 dark:!text-gray-300 flex items-center gap-1 font-extrabold">
                                        <LocationOnOutlined className="text-emerald-600 dark:!text-emerald-400" fontSize="medium" /> Địa chỉ giao hàng
                                    </Typography>

                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        {/* AddressSelector cần được update từ bên trong component đó, nhưng ta có thể bọc ngoài nếu cần */}
                                        <div className="dark:text-gray-100">
                                            <AddressSelector onChange={handleAddressChange} />
                                        </div>
                                        <TextField
                                            fullWidth placeholder="Số nhà, Tên đường..."
                                            variant="outlined"
                                            value={specificAddress} onChange={(e) => setSpecificAddress(e.target.value)}
                                            InputProps={{
                                                sx: { borderRadius: 2 },
                                                className: "dark:!text-gray-100 dark:!bg-gray-900"
                                            }}
                                            required
                                            sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                                        />
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography variant="h6" className="mb-2 text-gray-600 dark:!text-gray-300 flex items-center gap-1 font-semibold">
                                        <DescriptionOutlined className="text-emerald-600 dark:!text-emerald-400" fontSize="small" /> Ghi chú
                                    </Typography>
                                    <TextField
                                        fullWidth placeholder="Ghi chú thêm..." multiline rows={3}
                                        value={note} onChange={(e) => setNote(e.target.value)}
                                        variant="outlined"
                                        InputProps={{
                                            sx: { borderRadius: 2, mt: 1 },
                                            className: "dark:!text-gray-100 dark:!bg-gray-900"
                                        }}
                                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                                    />
                                </Box>
                            </Stack>
                        </Paper>

                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StaffOrderPage;
