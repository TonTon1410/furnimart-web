/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Grid, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, TextField, Avatar, Chip, Stack, Tabs, Tab, Divider, InputAdornment, CircularProgress
} from "@mui/material";
import {
    DeleteOutline as DeleteIcon,
    LocalMallOutlined,
    PersonOutline,
    LocationOnOutlined,
    DescriptionOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    AttachMoney,
    LocalAtm,
    Search as SearchIcon,
    PersonAddOutlined,
    AccountCircleOutlined,
    PhoneIphone,
    BadgeOutlined,
    AddCircleOutline,
    CheckCircle as CheckCircleIcon,
    QrCode2Outlined,
    LocalShipping // <-- Đã thêm import này để fix lỗi
} from "@mui/icons-material";
import { authService } from "@/service/authService";
import AddressSelector, { type Address } from "@/components/AddressSelector";
import { useToast } from "@/context/ToastContext";
import staffOrderService, {
    type CreateStaffOrderRequest,
    type CreateAddressRequest
} from "@/service/staffOrderService";
import StaffProductSelector from "./StaffProductSelector";
import CustomerRegistrationModal from "./CustomerRegistrationModal";

// --- Types ---
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

interface FoundCustomer {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatar: string;
    role: string;
}

const StaffOrderPage: React.FC = () => {
    const { showToast } = useToast();
    const [storeId, setStoreId] = useState<string | null>(null);

    // --- State Management ---
    const [customerTab, setCustomerTab] = useState(0);
    const [searchPhone, setSearchPhone] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundCustomer, setFoundCustomer] = useState<FoundCustomer | null>(null);

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // State cho khách hàng mới
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    
    const [specificAddress, setSpecificAddress] = useState("");
    const [addressDetails, setAddressDetails] = useState<Address | null>(null);
    const [note, setNote] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "VN_PAY" | "CASH">("CASH");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

    useEffect(() => {
        const sid = authService.getStoreId();
        if (sid) setStoreId(sid);
        else showToast({ type: "error", title: "Lỗi", description: "Không tìm thấy thông tin cửa hàng." });
    }, [showToast]);

    const handleAddressChange = useCallback((addr: Address) => setAddressDetails(addr), []);

    // --- Handlers ---
    const handleSearchCustomer = async () => {
        if (!searchPhone.trim()) {
            showToast({ type: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập số điện thoại" });
            return;
        }
        setIsSearching(true);
        setFoundCustomer(null);
        try {
            const res = await staffOrderService.getUserByPhone(searchPhone.trim());
            if (res.data && res.data.data) {
                setFoundCustomer(res.data.data);
                showToast({ type: "success", title: "Thành công", description: "Đã tìm thấy khách hàng" });
            }
        } catch (error: any) {
            console.error(error);
            showToast({ type: "error", title: "Không tìm thấy", description: "Không có khách hàng với số điện thoại này" });
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchPhone("");
        setFoundCustomer(null);
    };

    const handleResetNewCustomer = () => {
        setRegisteredUserId(null);
        setCustomerName("");
        setCustomerPhone("");
    };

    const handleAddToCart = (item: CartItem) => {
        setCartItems(prev => {
            const existingIdx = prev.findIndex(i => i.productColorId === item.productColorId);
            if (existingIdx >= 0) {
                const newItems = [...prev];
                const newQty = newItems[existingIdx].quantity + item.quantity;
                if (newQty > item.maxStock) {
                    showToast({ type: "warning", title: "Kho không đủ", description: `Chỉ còn ${item.maxStock} sản phẩm` });
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

    const handleRegistrationSuccess = (userId: string, name: string, phone: string) => {
        setRegisteredUserId(userId);
        setCustomerName(name);
        setCustomerPhone(phone);
    };

    const handleSubmitOrder = async () => {
        if (!storeId || cartItems.length === 0) return;

        if (customerTab === 0 && !foundCustomer) {
            return showToast({ type: "warning", title: "Chưa chọn khách", description: "Vui lòng tìm kiếm khách hàng trước" });
        }
        
        if (customerTab === 1 && !registeredUserId) {
             return showToast({ type: "warning", title: "Chưa tạo khách hàng", description: "Vui lòng đăng ký thành viên trước khi tạo đơn" });
        }

        if (!addressDetails || !specificAddress.trim()) {
            return showToast({ type: "warning", title: "Thiếu địa chỉ", description: "Vui lòng nhập địa chỉ giao hàng" });
        }

        setIsSubmitting(true);
        try {
            let userId: string;
            
            if (customerTab === 0 && foundCustomer) {
                userId = foundCustomer.id;
            } else if (customerTab === 1 && registeredUserId) {
                userId = registeredUserId;
            } else {
                throw new Error("Thông tin khách hàng không hợp lệ");
            }

            const recipientName = customerTab === 0 && foundCustomer ? foundCustomer.fullName : customerName;
            const recipientPhone = customerTab === 0 && foundCustomer ? foundCustomer.phone : customerPhone;

            const addressPayload: CreateAddressRequest = {
                name: recipientName,
                phone: recipientPhone,
                city: addressDetails.city,
                district: addressDetails.district,
                ward: addressDetails.ward,
                street: specificAddress,
                addressLine: `${specificAddress}, ${addressDetails.ward}, ${addressDetails.district}, ${addressDetails.city}`,
                isDefault: true,
                userId: userId,
                latitude: 0,
                longitude: 0
            };

            const addressRes = await staffOrderService.createAddress(addressPayload);
            if (addressRes.data.status !== 201 && addressRes.data.status !== 200) throw new Error("Không thể tạo địa chỉ");
            const addressId = addressRes.data.data.id;

            const orderPayload: CreateStaffOrderRequest = {
                storeId, userId, addressId, paymentMethod, note,
                orderDetails: cartItems.map(i => ({ productColorId: i.productColorId, quantity: i.quantity, price: i.price }))
            };

            const res = await staffOrderService.createOrder(orderPayload);
            if (res.data.status === 201 || res.data.status === 200) {
                if (paymentMethod === "VN_PAY" && res.data.redirectUrl) {
                    window.location.href = res.data.redirectUrl;
                } else {
                    showToast({ type: "success", title: "Thành công", description: `Đơn hàng #${res.data.data.id} đã được tạo!` });
                    setCartItems([]);
                    setNote("");
                    setSpecificAddress("");
                    if (customerTab === 1) handleResetNewCustomer();
                    else handleClearSearch();
                }
            }
        } catch (error: any) {
            console.error("Error:", error);
            showToast({ type: "error", title: "Thất bại", description: error.response?.data?.message || "Lỗi tạo đơn" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!storeId) return <Box className="h-screen flex items-center justify-center text-gray-500">Đang tải dữ liệu cửa hàng...</Box>;

    return (
        <Box className="max-w-[1600px] mx-auto p-4 lg:p-8 bg-gray-50 dark:!bg-gray-900 min-h-screen transition-colors duration-300">
            {/* --- Header --- */}
            <Box className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Box>
                    <Typography variant="h4" className="font-extrabold text-gray-800 dark:!text-white tracking-tight flex items-center gap-3">
                        <LocalMallOutlined className="text-emerald-600 text-4xl" />
                        Tạo Đơn Hàng Tại Quầy
                    </Typography>
                    <Typography className="text-gray-500 dark:!text-gray-400 mt-1 pl-1">
                        Hệ thống bán hàng nội bộ Furnimart
                    </Typography>
                </Box>
                <Chip 
                    icon={<BadgeOutlined className="!text-emerald-700 dark:!text-emerald-300"/>} 
                    label="Nhân viên bán hàng" 
                    className="bg-white border border-emerald-100 dark:!border-emerald-800 dark:!bg-emerald-900/30 text-emerald-700 dark:!text-emerald-300 font-bold py-4 px-3 rounded-xl shadow-sm" 
                />
            </Box>

            <Grid container spacing={4}>
                {/* --- LEFT COLUMN --- */}
                <Grid size={{ xs: 12, lg: 8 }} className="space-y-6">
                    <StaffProductSelector currentStoreId={storeId} onAddProduct={handleAddToCart} />

                    {/* Cart Table */}
                    <Paper elevation={0} className="rounded-3xl border border-gray-100 dark:!border-gray-700 overflow-hidden bg-white dark:!bg-gray-800 shadow-sm">
                        <Box className="p-6 border-b border-gray-100 dark:!border-gray-700 flex justify-between items-center bg-white dark:!bg-gray-800">
                            <Typography variant="h6" className="font-bold text-gray-800 dark:!text-white flex items-center gap-2">
                                <ShoppingCartOutlined className="text-emerald-600" />
                                Giỏ hàng <span className="text-gray-400 font-normal text-sm ml-1">({cartItems.length} sản phẩm)</span>
                            </Typography>
                        </Box>

                        <TableContainer sx={{ maxHeight: 600 }} className="custom-scrollbar">
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="bg-gray-50/50 dark:!bg-gray-800 text-gray-500 dark:!text-gray-400 font-bold border-b dark:!border-gray-700 pl-6 py-4">SẢN PHẨM</TableCell>
                                        <TableCell align="center" className="bg-gray-50/50 dark:!bg-gray-800 text-gray-500 dark:!text-gray-400 font-bold border-b dark:!border-gray-700 py-4">SL</TableCell>
                                        <TableCell align="right" className="bg-gray-50/50 dark:!bg-gray-800 text-gray-500 dark:!text-gray-400 font-bold border-b dark:!border-gray-700 py-4">ĐƠN GIÁ</TableCell>
                                        <TableCell align="right" className="bg-gray-50/50 dark:!bg-gray-800 text-gray-500 dark:!text-gray-400 font-bold border-b dark:!border-gray-700 pr-6 py-4">THÀNH TIỀN</TableCell>
                                        <TableCell className="bg-gray-50/50 dark:!bg-gray-800 border-b dark:!border-gray-700 py-4" />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cartItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" className="py-20 text-gray-400 border-none">
                                                <Stack alignItems="center" spacing={2}>
                                                    <Box className="p-4 bg-gray-50 rounded-full dark:bg-gray-700">
                                                        <ShoppingCartOutlined style={{ fontSize: 40, opacity: 0.3 }} />
                                                    </Box>
                                                    <Typography className="text-gray-400 dark:!text-gray-500">Giỏ hàng đang trống</Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cartItems.map((item) => (
                                            <TableRow key={item.productColorId} hover className="hover:bg-gray-50 dark:hover:!bg-gray-700/50 transition-colors">
                                                <TableCell className="pl-6 border-b border-gray-50 dark:!border-gray-700 py-4">
                                                    <Box className="flex items-center gap-4">
                                                        <Avatar src={item.image} variant="rounded" sx={{ width: 64, height: 64 }} className="border border-gray-100 dark:!border-gray-600 bg-white" />
                                                        <Box>
                                                            <Typography className="font-bold text-gray-900 dark:!text-white line-clamp-1 text-base">{item.productName}</Typography>
                                                            <Typography variant="caption" className="text-gray-500 dark:!text-gray-400 mt-1 block">
                                                                Màu: {item.colorName}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" className="border-b border-gray-50 dark:!border-gray-700">
                                                    <Box className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold">
                                                        {item.quantity}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" className="border-b border-gray-50 dark:!border-gray-700 text-gray-600 dark:!text-gray-300 font-medium">
                                                    {item.price.toLocaleString()}đ
                                                </TableCell>
                                                <TableCell align="right" className="border-b border-gray-50 dark:!border-gray-700 pr-6">
                                                    <span className="font-bold text-emerald-600 dark:!text-emerald-400 text-lg">
                                                        {(item.price * item.quantity).toLocaleString()}đ
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right" className="border-b border-gray-50 dark:!border-gray-700 pr-6">
                                                    <IconButton onClick={() => handleRemoveItem(item.productColorId)} size="small" className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Box className="p-6 bg-gray-50/50 dark:!bg-gray-800/50 border-t border-gray-100 dark:!border-gray-700 flex justify-end items-center gap-4">
                            <Typography className="text-gray-500 dark:!text-gray-400 font-medium">Tổng tiền hàng:</Typography>
                            <Typography variant="h4" className="font-extrabold text-emerald-600 dark:!text-emerald-400">
                                {totalPrice.toLocaleString()} <span className="text-xl align-top text-emerald-500">đ</span>
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Payment Methods - Cleaned UI */}
                    <Paper elevation={0} className="p-6 rounded-3xl border border-gray-100 dark:!border-gray-700 bg-white dark:!bg-gray-800 shadow-sm">
                        <Typography variant="h6" className="mb-4 font-bold text-gray-800 dark:!text-white flex items-center gap-2">
                            <CreditCardOutlined className="text-emerald-600" />
                            Phương thức thanh toán
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                { 
                                    id: "CASH", 
                                    label: "Tiền mặt", 
                                    icon: <LocalAtm />, 
                                    // Sửa: Màu nền nhẹ nhàng khi chọn, không dùng màu đậm
                                    activeClass: "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-400 dark:text-green-400",
                                    defaultClass: "border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/50"
                                },
                                { 
                                    id: "VN_PAY", 
                                    label: "VNPAY QR", 
                                    icon: <QrCode2Outlined />, 
                                    activeClass: "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400",
                                    defaultClass: "border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-blue-50/50"
                                },
                                { 
                                    id: "COD", 
                                    label: "COD (Giao hàng)", 
                                    icon: <LocalShipping />, // Icon này giờ đã được import
                                    activeClass: "bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:border-orange-400 dark:text-orange-400",
                                    defaultClass: "border-gray-200 text-gray-500 hover:border-orange-200 hover:bg-orange-50/50"
                                }
                            ].map((method) => (
                                <Grid size={{ xs: 12, md: 4 }} key={method.id}>
                                    <Box
                                        onClick={() => setPaymentMethod(method.id as any)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 h-full
                                            ${paymentMethod === method.id ? method.activeClass : method.defaultClass}
                                            dark:border-opacity-50
                                        `}
                                    >
                                        <Box className={paymentMethod === method.id ? "scale-110 transition-transform" : ""}>
                                            {method.icon}
                                        </Box>
                                        <Typography fontWeight={paymentMethod === method.id ? 700 : 500}>
                                            {method.label}
                                        </Typography>
                                        {paymentMethod === method.id && (
                                            <CheckCircleIcon className="ml-auto" fontSize="small" />
                                        )}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting || cartItems.length === 0}
                            className={`!mt-6 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 dark:shadow-none normal-case transition-transform active:scale-[0.99]
                                ${isSubmitting 
                                    ? 'bg-gray-100 text-gray-400 shadow-none' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                            {isSubmitting ? "Đang xử lý..." : `Thanh toán ${totalPrice.toLocaleString()}đ`}
                        </Button>
                    </Paper>
                </Grid>

                {/* --- RIGHT COLUMN --- */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box className="sticky top-6 space-y-6">
                        <Paper elevation={0} className="rounded-3xl border border-gray-100 dark:!border-gray-700 bg-white dark:!bg-gray-800 shadow-sm overflow-hidden">
                            <Box className="border-b border-gray-100 dark:!border-gray-700">
                                <Tabs
                                    value={customerTab}
                                    onChange={(_, v) => setCustomerTab(v)}
                                    variant="fullWidth"
                                    TabIndicatorProps={{ style: { backgroundColor: "#10b981", height: 3 } }}
                                    className="bg-gray-50/30 dark:!bg-gray-900/50"
                                >
                                    <Tab 
                                        icon={<SearchIcon />} iconPosition="start" label="Tìm khách" 
                                        className={`font-bold py-4 min-h-[64px] ${customerTab === 0 ? 'text-emerald-600 dark:!text-emerald-400' : 'text-gray-500 dark:!text-gray-400'}`} 
                                    />
                                    <Tab 
                                        icon={<PersonAddOutlined />} iconPosition="start" label="Tạo mới" 
                                        className={`font-bold py-4 min-h-[64px] ${customerTab === 1 ? 'text-emerald-600 dark:!text-emerald-400' : 'text-gray-500 dark:!text-gray-400'}`} 
                                    />
                                </Tabs>
                            </Box>

                            <Box className="p-6 space-y-5">
                                {/* Option 1: Search */}
                                {customerTab === 0 && (
                                    <>
                                        <Box className="relative">
                                            <TextField
                                                fullWidth placeholder="Nhập SĐT khách hàng..."
                                                value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                                                variant="outlined"
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><PhoneIphone className="text-gray-400" /></InputAdornment>,
                                                    endAdornment: <InputAdornment position="end">
                                                        <IconButton onClick={handleSearchCustomer} disabled={isSearching} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
                                                        </IconButton>
                                                    </InputAdornment>,
                                                    className: "rounded-xl bg-gray-50 dark:!bg-gray-900 dark:!text-white pr-1"
                                                }}
                                                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" } }}
                                            />
                                        </Box>

                                        {foundCustomer ? (
                                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg p-5">
                                                <div className="absolute -top-4 -right-4 p-4 opacity-10"><AccountCircleOutlined style={{ fontSize: 120 }} /></div>
                                                <div className="relative z-10 flex items-center gap-4 mb-4">
                                                    <Avatar src={foundCustomer.avatar} sx={{ width: 60, height: 60, border: '3px solid rgba(255,255,255,0.3)', bgcolor: 'white', color: '#059669' }} />
                                                    <div>
                                                        <Typography className="font-bold text-lg">{foundCustomer.fullName}</Typography>
                                                        <Typography className="text-emerald-50 text-sm opacity-90">{foundCustomer.role}</Typography>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 space-y-1">
                                                    <div className="flex items-center gap-2 text-white/90 text-sm font-medium bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                                        <PhoneIphone fontSize="small"/> {foundCustomer.phone}
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="small" variant="contained" 
                                                    onClick={handleClearSearch}
                                                    className="mt-4 bg-white/20 hover:bg-white/30 text-white w-full shadow-none border border-white/20"
                                                >
                                                    Chọn khách khác
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:!text-gray-500 border border-gray-100 dark:!border-gray-700 bg-gray-50/50 dark:!bg-gray-800 rounded-2xl">
                                                <PersonOutline style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
                                                <Typography variant="body2" className="font-medium">Nhập số điện thoại để tìm kiếm</Typography>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Option 2: Create New */}
                                {customerTab === 1 && (
                                    <>
                                        {!registeredUserId ? (
                                            // Sửa lại giao diện trạng thái chưa tạo user
                                            <Box className="flex flex-col items-center justify-center py-8 px-6 border border-gray-100 dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                                                <Box className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                                     <PersonAddOutlined className="text-emerald-600 dark:text-emerald-400" sx={{ fontSize: 40 }} />
                                                </Box>
                                                
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    onClick={() => setShowRegistrationModal(true)}
                                                    startIcon={<AddCircleOutline />}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 dark:shadow-none py-3 px-6 w-full"
                                                >
                                                    Đăng ký ngay
                                                </Button>
                                            </Box>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                 <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-200 dark:shadow-none p-5">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10"><PersonAddOutlined style={{ fontSize: 100 }} /></div>
                                                    
                                                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/20">
                                                        <CheckCircleIcon style={{ fontSize: 14 }} className="text-green-300" /> Tạo thành công
                                                    </div>

                                                    <div className="relative z-10 flex items-center gap-4 mb-4">
                                                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'white', color: '#4f46e5', fontWeight: 'bold', fontSize: '24px' }}>
                                                            {customerName.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <div>
                                                            <Typography className="font-bold text-lg">{customerName}</Typography>
                                                            <Typography className="text-blue-100 text-sm font-medium">Thành viên mới</Typography>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative z-10 space-y-2 bg-black/20 rounded-xl p-3 mb-4 backdrop-blur-sm">
                                                        <div className="flex items-center gap-3 text-white text-sm">
                                                            <PhoneIphone fontSize="small" className="text-white/70"/> 
                                                            <span className="font-mono text-base font-medium">{customerPhone}</span>
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        size="small" variant="contained" 
                                                        onClick={handleResetNewCustomer}
                                                        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-none text-white"
                                                    >
                                                        Xóa & Tạo khách khác
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <Divider className="dark:!border-gray-700 opacity-50" />

                                {/* Address & Note */}
                                <Box>
                                    <Typography className="mb-3! mt-3! text-gray-800 dark:!text-white font-bold text-sm uppercase flex items-center gap-2">
                                        <LocationOnOutlined className="text-emerald-500" /> Thông tin giao hàng
                                    </Typography>
                                    <Stack spacing={2}>
                                        <div className="dark:text-white [&_.MuiInputBase-root]:dark:bg-gray-900 [&_.MuiInputBase-root]:dark:text-white">
                                            <AddressSelector onChange={handleAddressChange} />
                                        </div>
                                        <TextField
                                            fullWidth placeholder="Số nhà, đường..."
                                            variant="outlined" size="small"
                                            value={specificAddress} onChange={(e) => setSpecificAddress(e.target.value)}
                                            className="bg-gray-50 dark:!bg-gray-900 rounded-lg"
                                            InputProps={{ className: "dark:!text-white rounded-lg bg-gray-50 dark:!bg-gray-900" }}
                                            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" } }}
                                        />
                                    </Stack>
                                </Box>

                                <Box>
                                    <Typography className="mb-3 text-gray-800 dark:!text-white font-bold text-sm uppercase flex items-center gap-2">
                                        <DescriptionOutlined className="text-emerald-500" /> Ghi chú
                                    </Typography>
                                    <TextField
                                        fullWidth placeholder="Ghi chú đơn hàng..." multiline rows={3}
                                        value={note} onChange={(e) => setNote(e.target.value)}
                                        className="bg-gray-50 dark:!bg-gray-900 rounded-xl"
                                        InputProps={{ className: "dark:!text-white rounded-xl bg-gray-50 dark:!bg-gray-900" }}
                                        sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" } }}
                                    />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Modal */}
            <CustomerRegistrationModal
                open={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
                onSuccess={handleRegistrationSuccess}
                storeId={storeId || ""}
            />
        </Box>
    );
};

export default StaffOrderPage;