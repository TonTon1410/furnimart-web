/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, Autocomplete, Typography, Box, CircularProgress,
  Stack, Avatar, Button, IconButton, InputAdornment, Paper, Chip // <-- Đã thêm Chip vào đây
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart as AddIcon,
  CheckCircle as CheckCircleIcon,
  Remove as RemoveIcon,
  Add as AddIconPlus,
  Inventory2Outlined,
  ColorLensOutlined
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
        setAllProducts(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        setAllProducts([]);
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
    <Paper elevation={0} className="p-6 rounded-3xl border border-gray-100 dark:!border-gray-700 bg-white dark:!bg-gray-800 shadow-sm transition-colors">
      
      {/* Search Bar */}
      <Box className="mb-6 relative z-50">
          <Autocomplete
            options={allProducts}
            loading={loadingProducts}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => `${option.name} - ${option.code}`}
            value={selectedProduct}
            onChange={(_event, newValue) => {
                setSelectedProduct(newValue);
            }}
            popupIcon={null}
            slotProps={{
                paper: { 
                    elevation: 8,
                    className: "mt-2 rounded-xl shadow-xl dark:!bg-gray-800 dark:!text-white border dark:!border-gray-700" 
                }
            }}
            renderInput={(params) => (
                <TextField 
                {...params} 
                placeholder="Tìm kiếm sản phẩm (Tên, Mã SKU)..."
                variant="outlined"
                fullWidth
                InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon className="text-emerald-600 dark:!text-emerald-400 text-3xl ml-2" />
                        </InputAdornment>
                    ),
                    className: "bg-gray-50 dark:!bg-gray-900 rounded-2xl text-lg py-3 dark:!text-white", 
                    sx: { "& fieldset": { border: "none" } } 
                }}
                />
            )}
            renderOption={(props, option) => {
                 const { key, ...otherProps } = props;
                 return (
                    <li key={key} {...otherProps} className="hover:!bg-emerald-50 dark:hover:!bg-emerald-900/20 py-3 px-4 border-b border-gray-100 dark:!border-gray-700 last:border-0 cursor-pointer">
                        <Stack direction="row" spacing={2} alignItems="center" className="w-full">
                            <Avatar 
                                src={option.thumbnailImage} 
                                variant="rounded" 
                                sx={{ width: 50, height: 50 }} 
                                className="bg-white border border-gray-100 dark:!border-gray-600 flex-shrink-0" 
                            />
                            <Box>
                                <Typography className="font-bold text-gray-800 dark:!text-gray-100 text-sm md:text-base">
                                    {option.name}
                                </Typography>
                                <Typography variant="caption" className="text-gray-500 dark:!text-gray-400">
                                    Mã: {option.code} • <span className="text-emerald-600 font-bold">{new Intl.NumberFormat('vi-VN').format(option.price)}đ</span>
                                </Typography>
                            </Box>
                        </Stack>
                    </li>
                 );
            }}
            noOptionsText="Không tìm thấy sản phẩm nào"
          />
      </Box>

      {/* Selected Product Area */}
      {selectedProduct && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} className="bg-gray-50 dark:!bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:!border-gray-700/50">
                
                {/* Left: Image */}
                <Box className="w-full md:w-56 aspect-square flex-shrink-0 bg-white dark:!bg-gray-800 rounded-xl p-4 flex items-center justify-center border border-gray-100 dark:!border-gray-700 shadow-sm relative overflow-hidden">
                    <img 
                        src={currentDisplayImage || ''} 
                        alt="Product" 
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-110" 
                    />
                </Box>

                {/* Right: Info & Actions */}
                <Box className="flex-1 flex flex-col justify-between gap-4">
                    <Box>
                         <Stack direction="row" justifyContent="space-between" alignItems="start">
                            <Box>
                                <Typography variant="h5" className="font-extrabold text-gray-900 dark:!text-white leading-tight">
                                    {selectedProduct.name}
                                </Typography>
                                <Chip label={selectedProduct.code} size="small" className="mt-2 bg-gray-200 dark:!bg-gray-700 dark:!text-gray-300 font-bold" />
                            </Box>
                            <Typography variant="h4" className="font-bold text-emerald-600 dark:!text-emerald-400 whitespace-nowrap">
                                {new Intl.NumberFormat('vi-VN').format(selectedProduct.price)} <span className="text-xl">đ</span>
                            </Typography>
                         </Stack>
                    
                        {/* Colors */}
                        <Box className="mt-6">
                            <Typography className="text-gray-500 dark:!text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                                <ColorLensOutlined fontSize="small"/> Chọn Màu sắc <span className="text-red-500">*</span>
                            </Typography>
                            <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                {selectedProduct.productColors.map((pc) => (
                                    <Box
                                        key={pc.id}
                                        onClick={() => setSelectedColorId(pc.id)}
                                        className={`
                                            cursor-pointer rounded-full w-10 h-10 flex items-center justify-center border-2 transition-all relative group
                                            ${selectedColorId === pc.id 
                                                ? 'border-emerald-500 scale-110 shadow-md ring-2 ring-emerald-100 dark:ring-emerald-900' 
                                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'}
                                        `}
                                        style={{ backgroundColor: pc.color.hexCode }}
                                        title={pc.color.colorName}
                                    >
                                        {selectedColorId === pc.id && <CheckCircleIcon className="text-white drop-shadow-md text-lg" />}
                                    </Box>
                                ))}
                            </Stack>
                            {!selectedColorId && (
                                <Typography variant="caption" className="text-orange-500 mt-2 block animate-pulse">
                                    Vui lòng chọn màu sắc để kiểm tra tồn kho
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Stock & Quantity Control */}
                    <Box className="mt-auto pt-6 border-t border-gray-200 dark:!border-gray-700 flex flex-col sm:flex-row gap-6 items-end sm:items-center">
                        <Stack direction="row" spacing={4} flex={1}>
                             <Box>
                                 <Typography className="text-gray-500 dark:!text-gray-400 text-xs font-bold uppercase mb-2">Số lượng</Typography>
                                 <Box className="flex items-center bg-white dark:!bg-gray-800 border border-gray-200 dark:!border-gray-700 rounded-lg p-1 shadow-sm">
                                    <IconButton size="small" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-gray-500 hover:text-emerald-600 dark:!text-gray-300">
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <Typography className="w-10 text-center font-bold text-gray-800 dark:!text-white">{quantity}</Typography>
                                    <IconButton size="small" onClick={() => setQuantity(q => q + 1)} className="text-gray-500 hover:text-emerald-600 dark:!text-gray-300">
                                        <AddIconPlus fontSize="small" />
                                    </IconButton>
                                 </Box>
                             </Box>

                             <Box>
                                 <Typography className="text-gray-500 dark:!text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                                    <Inventory2Outlined fontSize="small"/> Tồn kho
                                 </Typography>
                                 {loadingStock ? (
                                     <CircularProgress size={20} className="text-emerald-500" />
                                 ) : (
                                     <Typography className={`font-bold text-lg ${stockAvailable && stockAvailable > 0 ? 'text-emerald-600 dark:!text-emerald-400' : 'text-red-500'}`}>
                                         {stockAvailable !== null ? (stockAvailable > 0 ? stockAvailable : 'Hết hàng') : '--'}
                                     </Typography>
                                 )}
                             </Box>
                        </Stack>

                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={handleAdd}
                            disabled={!selectedColorId || !stockAvailable || stockAvailable <= 0 || quantity > stockAvailable}
                            className={`
                                rounded-xl py-3 px-8 text-base font-bold shadow-lg min-w-[200px] transition-all
                                ${(!selectedColorId || !stockAvailable || stockAvailable <= 0) 
                                    ? 'bg-gray-300 text-gray-500 shadow-none' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none'}
                            `}
                        >
                            {stockAvailable === null && !selectedColorId ? "Chọn màu trước" : "Thêm vào đơn"}
                        </Button>
                    </Box>
                </Box>
             </Stack>
          </div>
      )}
    </Paper>
  );
};

export default StaffProductSelector;