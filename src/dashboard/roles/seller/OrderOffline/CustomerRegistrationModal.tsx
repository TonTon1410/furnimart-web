/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    IconButton
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
    open,
    onClose,
    onSuccess,
    storeId
}) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "123456",
        gender: true,
        birthday: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.fullName.trim()) {
            return showToast({ type: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập họ tên" });
        }
        if (!formData.phone.trim()) {
            return showToast({ type: "warning", title: "Thiếu thông tin", description: "Vui lòng nhập số điện thoại" });
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
                const userId = res.data.data.id;
                showToast({
                    type: "success",
                    title: "Thành công",
                    description: `Đã tạo tài khoản: ${formData.fullName}`
                });
                onSuccess(userId, formData.fullName, formData.phone);
                handleClose();
            }
        } catch (error: any) {
            console.error("Create user error:", error);
            showToast({
                type: "error",
                title: "Thất bại",
                description: error.response?.data?.message || "Không thể tạo tài khoản"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            fullName: "",
            phone: "",
            email: "",
            password: "123456",
            gender: true,
            birthday: ""
        });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                className: "dark:!bg-gray-800 rounded-2xl"
            }}
        >
            <DialogTitle className="dark:!text-white border-b dark:!border-gray-700 pb-4">
                <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-2">
                        <PersonAdd className="text-emerald-600 dark:!text-emerald-400" />
                        <Typography variant="h6" className="font-bold">
                            Đăng ký tài khoản khách hàng
                        </Typography>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent className="dark:!bg-gray-800 pt-6">
                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        label="Họ và tên"
                        variant="outlined"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        required
                        placeholder="Nguyễn Văn A"
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
                        fullWidth
                        label="Số điện thoại"
                        variant="outlined"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        required
                        placeholder="0912345678"
                        InputProps={{
                            sx: { borderRadius: 2 },
                            className: "dark:!text-gray-100 dark:!bg-gray-900"
                        }}
                        InputLabelProps={{ className: "dark:!text-gray-400" }}
                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                    />

                    <TextField
                        fullWidth
                        label="Email (tùy chọn)"
                        variant="outlined"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="example@gmail.com"
                        InputProps={{
                            sx: { borderRadius: 2 },
                            className: "dark:!text-gray-100 dark:!bg-gray-900"
                        }}
                        InputLabelProps={{ className: "dark:!text-gray-400" }}
                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                    />

                    <FormControl
                        fullWidth
                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                    >
                        <InputLabel className="dark:!text-gray-400">Giới tính</InputLabel>
                        <Select
                            value={formData.gender}
                            onChange={(e) => handleChange("gender", e.target.value)}
                            label="Giới tính"
                            className="dark:!text-gray-100 dark:!bg-gray-900"
                            sx={{ borderRadius: 2 }}
                        >
                            <MenuItem value={true}>Nam</MenuItem>
                            <MenuItem value={false}>Nữ</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Ngày sinh (tùy chọn)"
                        variant="outlined"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleChange("birthday", e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                            className: "dark:!text-gray-400"
                        }}
                        InputProps={{
                            sx: { borderRadius: 2 },
                            className: "dark:!text-gray-100 dark:!bg-gray-900"
                        }}
                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                    />

                    <TextField
                        fullWidth
                        label="Mật khẩu"
                        variant="outlined"
                        type="text"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        required
                        helperText="Mật khẩu mặc định: 123456"
                        InputProps={{
                            sx: { borderRadius: 2 },
                            className: "dark:!text-gray-100 dark:!bg-gray-900"
                        }}
                        InputLabelProps={{ className: "dark:!text-gray-400" }}
                        FormHelperTextProps={{ className: "dark:!text-gray-500" }}
                        sx={{ ".dark & .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23) !important" } }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions className="dark:!bg-gray-800 border-t dark:!border-gray-700 p-4">
                <Button
                    onClick={handleClose}
                    className="dark:!text-gray-300"
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 !text-white"
                >
                    {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomerRegistrationModal;
