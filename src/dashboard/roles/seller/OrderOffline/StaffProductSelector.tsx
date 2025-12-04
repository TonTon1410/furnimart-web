/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, Autocomplete, Typography, Box, CircularProgress,
  Stack, Avatar, Button, Chip, Divider, IconButton, InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  ImageNotSupported as ImageIcon,
  AddShoppingCart as AddIcon,
  CheckCircle as CheckCircleIcon,
  Remove as RemoveIcon,
  Add as AddIconPlus
} from '@mui/icons-material';
import { productService, type Product } from '@/service/homeService';
import inventoryService from '@/service/inventoryService';

interface StaffProductSelectorProps {
  currentStoreId: string;
  onAddProduct: (product: any) => void;
}

const StaffProductSelector: React.FC<StaffProductSelectorProps> = ({
  currentStoreId,
  onAddProduct
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [stockAvailable, setStockAvailable] = useState<number | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productService.getAll();
        setAllProducts(res.data.data);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct || !selectedColorId || !currentStoreId) {
      setStockAvailable(null);
      return;
    }
    const checkStock = async () => {
      setLoadingStock(true);
      try {
        const res = await inventoryService.getLocationsByWarehouse({
            productColorId: selectedColorId,
            storeId: currentStoreId
        });
        const locations = res.data?.data?.locations || [];
        const total = locations.reduce((sum: number, loc: any) => sum + loc.available, 0);
        setStockAvailable(total);
      } catch (error) {
        setStockAvailable(0);
      } finally {
        setLoadingStock(false);
      }
    };
    checkStock();
  }, [selectedProduct, selectedColorId, currentStoreId]);

  useEffect(() => {
    setSelectedColorId(null);
    setStockAvailable(null);
    setQuantity(1);
  }, [selectedProduct]);

  const handleAdd = () => {
    if (!selectedProduct || !selectedColorId) return;
    const colorObj = selectedProduct.productColors.find(pc => pc.id === selectedColorId);
    const displayImage = colorObj?.images?.[0]?.image || selectedProduct.thumbnailImage;

    onAddProduct({
      productId: selectedProduct.id,
      productColorId: selectedColorId,
      productName: selectedProduct.name,
      colorName: colorObj?.color.colorName,
      price: selectedProduct.price,
      quantity: quantity,
      image: displayImage,
      maxStock: stockAvailable
    });
    setSelectedProduct(null);
  };

  const currentDisplayImage = useMemo(() => {
    if (!selectedProduct) return null;
    if (selectedColorId) {
        const colorVariant = selectedProduct.productColors.find(pc => pc.id === selectedColorId);
        return colorVariant?.images?.[0]?.image || selectedProduct.thumbnailImage;
    }
    return selectedProduct.thumbnailImage;
  }, [selectedProduct, selectedColorId]);

  return (
    <Box className="p-6 bg-white dark:!bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:!border-gray-700 transition-colors duration-200">
      <Typography variant="h6" className="!mb-2 !font-bold text-gray-800 dark:!text-gray-100 flex items-center gap-2">
         <SearchIcon className="text-emerald-600 dark:!text-emerald-400" /> 
         Tìm kiếm sản phẩm
      </Typography>

      <Stack spacing={4}>
        <Autocomplete
          options={allProducts}
          loading={loadingProducts}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          value={selectedProduct}
          onChange={(_, val) => setSelectedProduct(val)}
          // Style cho phần Dropdown menu (Paper)
          slotProps={{
            paper: {
                className: "dark:!bg-gray-800 dark:!text-gray-100 dark:!border dark:!border-gray-700"
            }
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder="Nhập tên sản phẩm hoặc mã SKU..."
              variant="outlined"
              className="bg-gray-50 dark:!bg-gray-900 rounded-xl"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                    <>
                        <InputAdornment position="start"><SearchIcon color="action" className="dark:!text-gray-400"/></InputAdornment>
                        {loadingProducts && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.startAdornment}
                    </>
                ),
                className: "dark:!text-gray-100", // Text input color
                sx: { borderRadius: 3, paddingY: 1 } 
              }}
              // Label và Placeholder style
              InputLabelProps={{ className: "dark:!text-gray-400" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "transparent" }, // Ẩn border mặc định
                    "&:hover fieldset": { borderColor: "#10b981" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981" },
                }
              }}
            />
          )}
          renderOption={(props, option) => {
             const { key, ...otherProps } = props;
             return (
                <li key={option.id} {...otherProps} className="hover:bg-emerald-50 dark:hover:!bg-emerald-900/20 !py-4 border-b border-dashed border-gray-100 dark:!border-gray-700 last:border-0 transition-colors">
                    <Stack direction="row" spacing={3} alignItems="center" width="100%">
                        <Avatar src={option.thumbnailImage} variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'transparent' }} className="border border-gray-100 dark:!border-gray-600" />
                        <Box flex={1}>
                            <Typography variant="body1" fontWeight={600} className="text-gray-800 dark:!text-gray-200">{option.name}</Typography>
                            <Stack direction="row" spacing={2} className="mt-1">
                                <Typography variant="caption" className="text-gray-500 dark:!text-gray-400 bg-gray-100 dark:!bg-gray-700 px-2 py-0.5 rounded">
                                    {option.code}
                                </Typography>
                                <Typography variant="caption" className="text-emerald-600 dark:!text-emerald-400 font-bold">
                                    {new Intl.NumberFormat('vi-VN').format(option.price)}đ
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </li>
             );
          }}
        />

        {selectedProduct && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <Divider className="mb-6 dark:!border-gray-700">
                 <Chip label="Thông tin chi tiết" size="small" className="bg-gray-100 dark:!bg-gray-700 dark:!text-gray-300 font-medium" />
             </Divider>

             <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                
                {/* Product Image */}
                <Box className="w-full md:w-48 h-48 flex-shrink-0 border border-gray-100 dark:!border-gray-700 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 dark:!bg-gray-900 p-2">
                    <img 
                        src={currentDisplayImage || ''} 
                        alt="Product" 
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" // Dark mode không dùng mix-blend-multiply để tránh mất ảnh trên nền tối
                    />
                </Box>

                {/* Controls */}
                <Box className="flex-1 flex flex-col justify-between">
                    <Box>
                         <Typography variant="h5" className="text-gray-900 dark:!text-white font-bold">
                            {selectedProduct.name}
                         </Typography>
                         <Typography variant="h6" className="text-emerald-600 dark:!text-emerald-400 font-bold mt-2 mb-4">
                             {new Intl.NumberFormat('vi-VN').format(selectedProduct.price)} đ
                         </Typography>
                    
                        {/* Color Selector */}
                        <Box className="mb-5">
                            <Typography variant="body2" className="mb-2 text-gray-500 dark:!text-gray-400 font-semibold uppercase text-xs tracking-wider">Chọn Màu sắc</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                {selectedProduct.productColors.map((pc) => (
                                    <Box
                                        key={pc.id}
                                        onClick={() => setSelectedColorId(pc.id)}
                                        className={`
                                            cursor-pointer rounded-full w-10 h-10 flex items-center justify-center border transition-all relative
                                            ${selectedColorId === pc.id ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-emerald-500 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-sm'}
                                        `}
                                        style={{ backgroundColor: pc.color.hexCode }}
                                        title={pc.color.colorName}
                                    >
                                        {selectedColorId === pc.id && <CheckCircleIcon sx={{ fontSize: 20, color: 'white', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' }} />}
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Box>

                    {/* Stock & Action */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={4} className="mb-4">
                             <Box>
                                 <Typography variant="body2" className="mb-1 text-gray-500 dark:!text-gray-400 font-semibold uppercase text-xs tracking-wider">Số lượng</Typography>
                                 <Box className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                                    <IconButton size="small" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-gray-500 dark:!text-gray-300 hover:text-black dark:hover:!text-white">
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Typography className="w-10 text-center font-bold text-gray-800 dark:!text-white">{quantity}</Typography>
                                    <IconButton size="small" onClick={() => setQuantity(q => q + 1)} className="text-gray-500 dark:!text-gray-300 hover:text-black dark:hover:!text-white">
                                        <AddIconPlus fontSize="small" />
                                    </IconButton>
                                 </Box>
                             </Box>

                             <Box>
                                 <Typography variant="body2" className="mb-1 text-gray-500 dark:!text-gray-400 font-semibold uppercase text-xs tracking-wider">Tồn kho</Typography>
                                 {loadingStock ? (
                                     <CircularProgress size={20} className="text-emerald-500" />
                                 ) : (
                                     <Typography className={`font-bold ${stockAvailable && stockAvailable > 0 ? 'text-emerald-600 dark:!text-emerald-400' : 'text-red-500 dark:!text-red-400'}`}>
                                         {stockAvailable !== null ? (stockAvailable > 0 ? `${stockAvailable} sản phẩm` : 'Hết hàng') : '---'}
                                     </Typography>
                                 )}
                             </Box>
                        </Stack>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={handleAdd}
                            disabled={!stockAvailable || stockAvailable <= 0 || quantity > stockAvailable}
                            className="bg-gray-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 rounded-xl py-3 shadow-lg normal-case text-base font-bold text-white"
                        >
                            Thêm vào đơn hàng
                        </Button>
                    </Box>
                </Box>
             </Stack>
          </div>
        )}
      </Stack>
    </Box>
  );
};

export default StaffProductSelector;
