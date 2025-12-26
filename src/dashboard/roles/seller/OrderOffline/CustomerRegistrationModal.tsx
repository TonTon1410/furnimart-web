/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
    Typography, Box, IconButton
} from "@mui/material";
import { Close as CloseIcon, PersonAdd } from "@mui/icons-material";
import { useToast } from "@/context/ToastContext";
import staffOrderService, { type CreateUserRequest } from "@/service/staffOrderService";

interface CustomerRegistrationModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (userId: string, customerName: string, customerPhone: string) => void;
    storeId: string;
}

const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
    open, onClose, onSuccess, storeId
}) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        fullName: "", phone: "", email: "", password: "123456", gender: true, birthday: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.phone.trim()) {
            return showToast({ type: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập tên và SĐT" });
        }
        setIsSubmitting(true);
        try {
            const payload: CreateUserRequest = {
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email || undefined,
                password: formData.password,
                gender: formData.gender,
                birthday: formData.birthday || undefined,
                role: "CUSTOMER",
                status: "ACTIVE",
                storeId: storeId
            };
            const res = await staffOrderService.createUser(payload);
            if (res.data.status === 201 || res.data.status === 200) {
                showToast({ type: "success", title: "Thành công", description: `Đã tạo tài khoản: ${formData.fullName}` });
                onSuccess(res.data.data.id, formData.fullName, formData.phone);
                handleClose();
            }
        } catch (error: any) {
            showToast({ type: "error", title: "Thất bại", description: error.response?.data?.message || "Lỗi tạo tài khoản" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ fullName: "", phone: "", email: "", password: "123456", gender: true, birthday: "" });
        onClose();
    };

    return (
        <Dialog 
            open={open} onClose={handleClose} maxWidth="sm" fullWidth
            PaperProps={{ className: "dark:!bg-gray-800 rounded-3xl p-2" }} // Rounded cao hơn
        >
            <DialogTitle className="dark:!text-white border-b border-gray-100 dark:!border-gray-700/50 pb-4">
                <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-3">
                        <Box className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                             <PersonAdd className="text-emerald-600 dark:!text-emerald-400" />
                        </Box>
                        <Typography variant="h6" className="font-bold">Đăng ký thành viên</Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small" className="dark:text-gray-400"><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent className="dark:!bg-gray-800 pt-8">
                <Stack spacing={3} className="mt-2">
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth label="Họ và tên" variant="outlined" required
                            value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)}
                            InputProps={{ className: "dark:!text-white rounded-xl" }}
                            InputLabelProps={{ className: "dark:!text-gray-400" }}
                            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" } }}
                        />
                        <TextField
                            fullWidth label="Số điện thoại" variant="outlined" required
                            value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)}
                            InputProps={{ className: "dark:!text-white rounded-xl" }}
                            InputLabelProps={{ className: "dark:!text-gray-400" }}
                            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" } }}
                        />
                    </Stack>

                    <TextField
                        fullWidth label="Email (Tùy chọn)" variant="outlined"
                        value={formData.email} onChange={(e) => handleChange("email", e.target.value)}
                        InputProps={{ className: "dark:!text-white rounded-xl" }}
                        InputLabelProps={{ className: "dark:!text-gray-400" }}
                        sx={{ "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" } }}
                    />

                    <Stack direction="row" spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel className="dark:!text-gray-400">Giới tính</InputLabel>
                            <Select
                                value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)}
                                label="Giới tính"
                                className="dark:!text-white rounded-xl"
                                MenuProps={{ PaperProps: { className: "dark:!bg-gray-800 dark:!text-white" } }}
                            >
                                <MenuItem value={true}>Nam</MenuItem>
                                <MenuItem value={false}>Nữ</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth label="Ngày sinh" type="date"
                            value={formData.birthday} onChange={(e) => handleChange("birthday", e.target.value)}
                            InputLabelProps={{ shrink: true, className: "dark:!text-gray-400" }}
                            InputProps={{ className: "dark:!text-white rounded-xl" }}
                            sx={{ "& .MuiOutlinedInput-notchedOutline": { borderRadius: "12px" } }}
                        />
                    </Stack>
                    
                    <Box className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                         <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                             Mật khẩu mặc định cho khách hàng mới là: <span className="font-mono font-bold text-emerald-600">123456</span>
                         </Typography>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions className="dark:!bg-gray-800 p-6 pt-2">
                <Button onClick={handleClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl px-4">Hủy</Button>
                <Button 
                    onClick={handleSubmit} variant="contained" disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2 font-bold shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                    {isSubmitting ? "Đang xử lý..." : "Hoàn tất đăng ký"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomerRegistrationModal;