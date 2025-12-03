/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Stack,
  Typography,
  IconButton,
  Divider,
  Box,
  InputAdornment,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CompareArrows as TransferIcon,
  Description as NoteIcon,
  ArrowBack,
  ImageNotSupported as ImageIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";

import { useNavigate, useLocation } from "react-router-dom";
import { DP } from "@/router/paths";

// Services & Hooks
import { useToast } from "@/context/ToastContext";
import inventoryService, {
  type CreateInventoryRequest,
} from "@/service/inventoryService";
import warehousesService from "@/service/warehousesService";
import { authService } from "@/service/authService";

// Components
import ProductSelector, {
  type ProductSelectionResult,
} from "./components/ProductSelector";
import WarehouseZoneLocationSelector from "./components/WarehouseZoneLocationSelector";
import CustomDropdown from "@/components/CustomDropdown";

// --- Constants ---
const TYPE_OPTIONS = [
  { value: "IMPORT", label: "Nhập kho", icon: <InputIcon color="success" /> },
  { value: "EXPORT", label: "Xuất kho", icon: <OutputIcon color="error" /> },
  {
    value: "TRANSFER",
    label: "Chuyển kho",
    icon: <TransferIcon color="warning" />,
  },
];

const PURPOSE_OPTIONS = [
  { value: "STOCK_IN", label: "Nhập hàng" },
  { value: "STOCK_OUT", label: "Xuất bán hàng" },
  { value: "MOVE", label: "Xuất điều chuyển" }, // Quan trọng: Value là MOVE
  { value: "REQUEST", label: "Yêu cầu chuyển kho" },
];

interface CartItem extends ProductSelectionResult {
  tempId: string;
  quantity: number;
}

const CreateInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(
    location.state?.warehouseId || null
  );
  const [loadingWarehouse, setLoadingWarehouse] = useState(!currentWarehouseId);

  // --- Form State ---
  const [type, setType] = useState<string>("IMPORT");
  const [purpose, setPurpose] = useState<string>("STOCK_IN");
  const [orderId, setOrderId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
  const [toZoneId, setToZoneId] = useState<string | null>(null);
  const [toLocationId, setToLocationId] = useState<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);

  const [tempSelection, setTempSelection] =
    useState<ProductSelectionResult | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("");
  const [selectorKey, setSelectorKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const dropdownOptions = TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // --- Effects ---
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (currentWarehouseId) {
        setLoadingWarehouse(false);
        return;
      }

      try {
        const storeId = authService.getStoreId();
        if (!storeId) {
          showToast({
            type: "error",
            title: "Lỗi",
            description: "Không tìm thấy thông tin cửa hàng",
          });
          navigate(DP("inventory"));
          return;
        }

        const response = await warehousesService.getWarehouseByStore(storeId);
        const warehouseData = response.data?.data || response.data;
        const warehouseId = warehouseData?.id;

        if (warehouseId) {
          setCurrentWarehouseId(warehouseId.toString());
        } else {
          showToast({
            type: "error",
            title: "Lỗi",
            description: "Không tìm thấy kho hàng cho cửa hàng này",
          });
          navigate(DP("inventory"));
        }
      } catch (error) {
        console.error("Error fetching warehouse:", error);
        showToast({
          type: "error",
          title: "Lỗi",
          description: "Không thể tải thông tin kho hàng",
        });
        navigate(DP("inventory"));
      } finally {
        setLoadingWarehouse(false);
      }
    };

    fetchWarehouse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Tự động set purpose khi type thay đổi
    if (type === "IMPORT") setPurpose("STOCK_IN");
    if (type === "EXPORT") setPurpose("STOCK_OUT");
    if (type === "TRANSFER") setPurpose("REQUEST");

    if (type !== "TRANSFER" && type !== "EXPORT") {
      setToWarehouseId(null);
      setToZoneId(null);
      setToLocationId(null);
    }
    
    // Nếu đổi sang loại khác không phải Xuất kho thì reset orderId
    if (type !== "EXPORT") {
      setOrderId("");
    }
  }, [type]);

  useEffect(() => {
    if (purpose !== "STOCK_OUT") {
      setOrderId("");
    }
  }, [purpose]);

  // --- Helpers ---
  const getAvailablePurposeOptions = () => {
    if (type === "IMPORT") {
      return PURPOSE_OPTIONS.filter((opt) =>
        ["STOCK_IN", "TRANSFER_IN"].includes(opt.value)
      );
    }
    if (type === "EXPORT") {
      return PURPOSE_OPTIONS.filter((opt) =>
        ["STOCK_OUT", "MOVE"].includes(opt.value)
      );
    }
    return [];
  };

  // --- Handlers ---
  const handleAddItem = () => {
    // 1. Kiểm tra sản phẩm
    if (!tempSelection) {
      showToast({
        type: "warning",
        title: "Chưa chọn sản phẩm",
        description: "Vui lòng chọn sản phẩm.",
      });
      return;
    }

    // 2. Kiểm tra vị trí: Chỉ bắt buộc nếu KHÔNG PHẢI là TRANSFER
    if (type !== 'TRANSFER' && !tempSelection.locationItemId) {
         showToast({
            type: "warning",
            title: "Chưa chọn vị trí",
            description: "Vui lòng chọn vị trí trong kho.",
          });
          return;
    }

    // 3. Kiểm tra số lượng
    if (!tempQuantity || Number(tempQuantity) <= 0) {
      showToast({
        type: "warning",
        title: "Số lượng không hợp lệ",
        description: "Vui lòng nhập số lượng > 0.",
      });
      return;
    }

    // 4. Logic tìm sản phẩm trùng để cộng dồn
    const exists = items.find((i) => {
        if (type === 'TRANSFER') {
            return i.productColorId === tempSelection.productColorId;
        }
        return i.productColorId === tempSelection.productColorId &&
               i.locationItemId === tempSelection.locationItemId;
    });

    if (exists) {
      showToast({
        type: "info",
        title: "Đã gộp số lượng",
        description:
          "Sản phẩm này đã có trong danh sách, đã cộng dồn số lượng.",
      });
      setItems((prev) =>
        prev.map((item) => {
            const isMatch = type === 'TRANSFER' 
                ? item.productColorId === tempSelection.productColorId
                : (item.productColorId === tempSelection.productColorId && item.locationItemId === tempSelection.locationItemId);
            
            return isMatch
            ? { ...item, quantity: item.quantity + Number(tempQuantity) }
            : item;
        })
      );
    } else {
      const newItem: CartItem = {
        ...tempSelection,
        locationItemId: tempSelection.locationItemId || "", 
        locationCode: tempSelection.locationCode || "---",
        quantity: Number(tempQuantity),
        tempId: Date.now().toString(),
      };
      setItems([...items, newItem]);
    }

    setTempSelection(null);
    setTempQuantity("");
    setSelectorKey((prev) => prev + 1);
  };

  const handleRemoveItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const handleSaveTicket = async () => {
    if (!currentWarehouseId) {
      showToast({
        type: "error",
        title: "Lỗi",
        description:
          "Không xác định được kho nguồn. Vui lòng quay lại danh sách.",
      });
      return;
    }
    if (items.length === 0) {
      showToast({
        type: "warning",
        title: "Danh sách trống",
        description: "Vui lòng thêm ít nhất 1 sản phẩm.",
      });
      return;
    }

    const isTransferMode = type === "TRANSFER";
    // Sửa logic check Xuất điều chuyển (dùng MOVE thay vì TRANSFER_OUT)
    const isExportTransfer = type === "EXPORT" && purpose === "MOVE";

    if ((isTransferMode || isExportTransfer) && !toWarehouseId) {
      showToast({
        type: "warning",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn Kho đích để chuyển hàng.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateInventoryRequest = {
        id: 0,
        type,
        purpose,
        warehouseId: currentWarehouseId,
        toWarehouseId:
          (isTransferMode || isExportTransfer) && toWarehouseId
            ? toWarehouseId
            : undefined,
        note: note,
        // Chỉ gửi orderId khi là STOCK_OUT (Xuất bán)
        orderId:
          type === "EXPORT" && purpose === "STOCK_OUT" && orderId
            ? Number(orderId)
            : undefined,
        items: items.map((item) => ({
          productColorId: item.productColorId,
          locationItemId: item.locationItemId,
          quantity: item.quantity,
        })),
      };

      const res = await inventoryService.createOrUpdateInventory(payload);
      const resData = res.data;

      if (resData && resData.status === 1211) {
        showToast({
          type: "error",
          title: "Lỗi nhập kho",
          description: "Không thể nhập: Vị trí kho đã đầy (Location Full).",
        });
        return;
      }

      if (resData && resData.status && resData.status !== 200) {
        showToast({
          type: "error",
          title: "Thất bại",
          description: resData.message || "Có lỗi xảy ra khi xử lý.",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Thành công",
        description: "Đã tạo phiếu kho thành công!",
      });
      navigate(DP("inventory"));
    } catch (error: any) {
      console.error(error);
      showToast({
        type: "error",
        title: "Thất bại",
        description:
          error?.response?.data?.message || "Có lỗi hệ thống xảy ra.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const cardBgClass =
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl";
  const textTitleClass = "text-gray-900 dark:text-white font-bold";

  // --- Loading State ---
  if (loadingWarehouse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
        <Typography className="ml-4">Đang tải thông tin kho...</Typography>
      </div>
    );
  }

  if (!currentWarehouseId)
    return (
      <div className="p-10 text-center text-red-500">
        <Typography variant="h6">Lỗi: Không tìm thấy ID kho</Typography>
        <Button onClick={() => navigate(DP("inventory"))}>
          Quay về danh sách
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      
      {/* === 1. PHẦN DANH SÁCH SẢN PHẨM === */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 order-2 lg:order-none bg-gray-50 dark:bg-gray-900">
        
        {/* Product Selector */}
        <div className={`${cardBgClass}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2 rounded-t-xl">
            <SearchIcon color="primary" />
            <Typography variant="subtitle1" className={textTitleClass}>
              TÌM KIẾM SẢN PHẨM
            </Typography>
          </div>

          <div className="p-4">
            <ProductSelector
              key={selectorKey}
              onSelectionChange={setTempSelection}
              type={type}
              currentWarehouseId={currentWarehouseId}
            />
          </div>
        </div>

        {/* Khối nhập số lượng */}
        {tempSelection && (
          <div className="p-4 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 shadow-sm rounded-xl animate-in fade-in slide-in-from-top-2">
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  className="text-emerald-700 dark:text-emerald-400 font-semibold"
                >
                  Đang chọn: <b>{tempSelection.productName}</b>
                </Typography>
                <Typography
                  variant="caption"
                  className="text-gray-600 dark:text-gray-400"
                >
                  Màu: {tempSelection.colorName} | Vị trí:{" "}
                  {tempSelection.locationCode || "---"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <TextField
                  label="Nhập số lượng"
                  value={tempQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^[0-9]+$/.test(val))
                      setTempQuantity(val);
                  }}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography className="dark:text-white!">
                          cái
                        </Typography>
                      </InputAdornment>
                    ),
                    className: "bg-white dark:!bg-gray-900 dark:!text-white",
                  }}
                  InputLabelProps={{ className: "dark:!text-white" }}
                  inputProps={{
                    className:
                      "placeholder:text-gray-400 dark:placeholder:!text-gray-300",
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

        {/* Danh sách sản phẩm đã thêm */}
        <div className={`${cardBgClass}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center rounded-t-xl">
            <Typography variant="subtitle1" className={textTitleClass}>
              DANH SÁCH CHỜ ({items.length})
            </Typography>
            {items.length > 0 && (
              <Button size="small" color="error" onClick={() => setItems([])}>
                Xóa tất cả
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-300!">
              <Typography>Chưa có sản phẩm nào trong phiếu.</Typography>
              <Typography variant="caption">
                Vui lòng chọn sản phẩm ở trên và ấn "Thêm".
              </Typography>
            </div>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow className="bg-gray-100 dark:bg-gray-700 [&_th]:dark:text-gray-300!">
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
                    <TableRow
                      key={item.tempId}
                      hover
                      sx={{ "&:hover": { bgcolor: "action.hover" } }}
                    >
                      <TableCell>
                        <Avatar
                          src={item.imageUrl}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "action.selected",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <ImageIcon fontSize="small" />
                        </Avatar>
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 500, color: "text.primary" }}
                        className="dark:text-white!"
                      >
                        {item.productName}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              bgcolor: item.hexCode || "#ccc",
                              borderRadius: "50%",
                              border: "1px solid rgba(0,0,0,0.1)",
                            }}
                          />
                          <Typography
                            variant="body2"
                            className="text-gray-600 dark:text-gray-300!"
                          >
                            {item.colorName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell className="dark:text-white!">
                        {item.locationCode || "---"}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {item.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.tempId)}
                        >
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

      {/* === 2. PHẦN THÔNG TIN PHIẾU === */}
      <div className="w-full lg:w-[400px] shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-auto lg:h-full shadow-xl z-20 order-1 lg:order-none max-h-[60vh] lg:max-h-none">
        
        {/* Header Thông tin phiếu */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <NoteIcon color="primary" />
            <Typography variant="h6" className={textTitleClass}>
              THÔNG TIN PHIẾU
            </Typography>
          </div>
          <div className="lg:hidden">
             <IconButton onClick={() => navigate(-1)} size="small">
                <ArrowBack />
             </IconButton>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <Stack spacing={3}>
            {/* 1. Loại phiếu */}
            <CustomDropdown
              id="inventory-type-select"
              label="Loại phiếu"
              value={type}
              options={dropdownOptions}
              onChange={(newValue) => setType(newValue)}
              fullWidth={true}
              placeholder="Chọn loại phiếu"
            />

            {/* 2. Mục đích */}
            {type === "EXPORT" && (
              <CustomDropdown
                id="inventory-purpose-select"
                label="Mục đích"
                value={purpose}
                options={getAvailablePurposeOptions()}
                onChange={(newValue) => setPurpose(newValue)}
                fullWidth={true}
                placeholder="Chọn mục đích"
              />
            )}

            {/* 3. Mã đơn hàng (CHỈ HIỆN KHI XUẤT BÁN - STOCK_OUT) */}
            {type === "EXPORT" && purpose === "STOCK_OUT" && (
              <TextField
                label="Mã đơn hàng (Order ID)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                type="number"
                fullWidth
                helperText="Nhập nếu phiếu này liên quan đến đơn hàng"
                InputProps={{
                  className: "bg-white dark:!bg-gray-900 dark:!text-white",
                }}
                InputLabelProps={{ className: "dark:!text-white" }}
                inputProps={{
                  className:
                    "placeholder:text-gray-400 dark:placeholder:!text-gray-300",
                }}
                FormHelperTextProps={{ className: "dark:!text-gray-400" }}
              />
            )}

            {/* 4. Ghi chú */}
            <TextField
              label="Ghi chú nội bộ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Nhập ghi chú chi tiết..."
              InputProps={{
                className: "bg-white dark:!bg-gray-900 dark:!text-white",
              }}
              InputLabelProps={{ className: "dark:!text-white" }}
              inputProps={{
                className:
                  "placeholder:text-gray-400 dark:placeholder:!text-gray-300",
              }}
            />

            {/* 5. Kho Đích (Hiện khi: Chuyển kho HOẶC Xuất điều chuyển) */}
            {/* CHỈNH SỬA: Thay TRANSFER_OUT thành MOVE để khớp với PURPOSE_OPTIONS */}
            {(type === "TRANSFER" ||
              (type === "EXPORT" && purpose === "MOVE")) && (
              <div className="p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-lg space-y-3">
                <Typography
                  variant="subtitle2"
                  color="warning.main"
                  fontWeight="bold"
                >
                  {type === "EXPORT" && purpose === "MOVE"
                    ? "XUẤT ĐẾN KHO"
                    : "CHUYỂN ĐẾN KHO"}
                </Typography>
                <Divider className="border-orange-200 dark:border-orange-800" />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <WarehouseZoneLocationSelector
                    labelPrefix="Đến"
                    selectedWarehouseId={toWarehouseId}
                    selectedZoneId={toZoneId}
                    selectedLocationId={toLocationId}
                    onWarehouseChange={(id) => {
                      setToWarehouseId(id);
                      setToZoneId(null);
                      setToLocationId(null);
                    }}
                    onZoneChange={(id) => {
                      setToZoneId(id);
                      setToLocationId(null);
                    }}
                    onLocationChange={(id) => setToLocationId(id)}
                    hideZoneAndLocation={true}
                  />
                </Box>
              </div>
            )}
          </Stack>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
          <Button
            variant="contained"
            size="large"
            onClick={handleSaveTicket}
            disabled={submitting || items.length === 0}
            startIcon={
              submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            className="text-white! dark:bg-gray-700! dark:hover:bg-gray-600!"
            sx={{ py: 1.5, fontWeight: "bold" }}
          >
            {submitting ? "ĐANG LƯU..." : "HOÀN TẤT & LƯU PHIẾU"}
          </Button>
          
          <Button
             variant="contained"
             color="error"
             onClick={() => navigate(DP("inventory"))}
             sx={{ borderColor: "divider", fontWeight: "bold", color: "white" }}
             className="lg:flex hidden"
          >
            Hủy bỏ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateInventoryPage;