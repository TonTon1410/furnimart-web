/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, Autocomplete, Typography, Box, CircularProgress, Alert,
  Avatar, Stack, Grid, Tooltip, Zoom, Divider, Fade, useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Place as PlaceIcon,
  CheckCircle as CheckCircleIcon,
  ImageNotSupported as ImageIcon
} from '@mui/icons-material';

import { productService } from '@/service/homeService';
import inventoryService, { type InventoryLocationDetail } from '@/service/inventoryService';
import { useWarehouseData } from '../hook/useWarehouseData';
// [MỚI] Import selector
import WarehouseZoneLocationSelector from './WarehouseZoneLocationSelector';

// --- Interfaces ---
interface ProductImage {
  id: string;
  image: string;
}
interface Color {
  id: string;
  colorName: string;
  hexCode: string;
}
interface ProductColor {
  id: string;
  color: Color;
  images: ProductImage[];
}
interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  thumbnailImage: string;
  code: string;
  productColors: ProductColor[];
}

export interface ProductSelectionResult {
  productColorId: string;
  locationItemId: string;
  locationCode?: string;
  productName?: string;
  colorName?: string;
  imageUrl?: string;
  hexCode?: string;
}

interface ProductSelectorProps {
  onSelectionChange?: (result: ProductSelectionResult | null) => void;
  key?: number;
  // [MỚI] Thêm prop để xác định loại phiếu và ID kho hiện tại
  type?: string; 
  currentWarehouseId?: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelectionChange,
  type = 'IMPORT', // Mặc định import
  currentWarehouseId
}) => {
  const theme = useTheme();
  // Chỉ dùng storeId nếu không có currentWarehouseId truyền vào (hoặc logic cũ)
  const { storeId: storeIdFromHook, loading: storeLoading } = useWarehouseData();
  const activeStoreId = storeIdFromHook; // Vẫn giữ logic lấy storeId nếu cần

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductColorId, setSelectedProductColorId] = useState<string | null>(null);
  
  // State cho EXPORT/TRANSFER (Chọn từ danh sách có sẵn)
  const [locations, setLocations] = useState<InventoryLocationDetail[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocationDetail | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // State cho IMPORT (Chọn WarehouseZoneLocationSelector)
  const [importZoneId, setImportZoneId] = useState<string | null>(null);
  const [importLocationId, setImportLocationId] = useState<string | null>(null);
  const [importLocationCode, setImportLocationCode] = useState<string>('');

  const isImportMode = type === 'IMPORT';

  // --- Logic Hình ảnh hiển thị ---
  const currentDisplayImage = useMemo(() => {
    if (!selectedProduct) return null;
    if (selectedProductColorId) {
        const colorVariant = selectedProduct.productColors.find(pc => pc.id === selectedProductColorId);
        if (colorVariant && colorVariant.images && colorVariant.images.length > 0) {
            return colorVariant.images[0].image;
        }
    }
    return selectedProduct.thumbnailImage;
  }, [selectedProduct, selectedProductColorId]);

  // --- Effects ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setError(null);
      try {
        const res = await productService.getAll();
        setAllProducts(res.data.data as unknown as Product[]);
      } catch (e: any) {
        console.error('Failed to fetch products:', e);
        setError(e?.response?.data?.message || 'Không tải được danh sách sản phẩm');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // [SỬA ĐỔI] Chỉ fetch locations nếu KHÔNG PHẢI là IMPORT
  useEffect(() => {
    setLocations([]);
    setSelectedLocation(null);
    
    // Reset state của Import mode
    setImportZoneId(null);
    setImportLocationId(null);
    setImportLocationCode('');

    if (!selectedProductColorId || !activeStoreId) return;

    // Nếu là IMPORT thì không cần fetch inventory location
    if (isImportMode) return;

    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const res = await inventoryService.getLocationsByWarehouse({
          productColorId: selectedProductColorId,
          storeId: activeStoreId,
        });
        setLocations(res.data?.data?.locations || []);
      } catch (error) {
        console.error("Lỗi lấy vị trí kho:", error);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [selectedProductColorId, activeStoreId, isImportMode]);

  useEffect(() => {
    setSelectedProductColorId(null);
    setSelectedLocation(null);
    setLocations([]);
    setImportZoneId(null);
    setImportLocationId(null);
  }, [selectedProduct]);

  // [SỬA ĐỔI] Logic tổng hợp kết quả trả về parent
  useEffect(() => {
    if (onSelectionChange) {
      if (selectedProduct && selectedProductColorId) {
        const colorObj = selectedProduct.productColors.find(pc => pc.id === selectedProductColorId);
        
        let finalLocationId = '';
        let finalLocationCode = '';

        if (isImportMode) {
            // Logic cho IMPORT
            if (importLocationId) {
                finalLocationId = importLocationId;
                finalLocationCode = importLocationCode;
            }
        } else {
            // Logic cho EXPORT/TRANSFER
            if (selectedLocation) {
                finalLocationId = selectedLocation.locationItemId;
                finalLocationCode = selectedLocation.locationCode;
            }
        }

        if (finalLocationId) {
            onSelectionChange({
              productColorId: selectedProductColorId,
              locationItemId: finalLocationId,
              locationCode: finalLocationCode,
              productName: selectedProduct.name,
              colorName: colorObj?.color.colorName || '',
              imageUrl: currentDisplayImage || '',
              hexCode: colorObj?.color.hexCode
            });
        } else {
            onSelectionChange(null);
        }
      } else {
        onSelectionChange(null);
      }
    }
  }, [
      selectedProductColorId, 
      selectedLocation, // Cho export
      importLocationId, // Cho import
      selectedProduct, 
      onSelectionChange, 
      currentDisplayImage,
      isImportMode
  ]);

  const availableColors = useMemo(() => selectedProduct?.productColors || [], [selectedProduct]);

  const isLightColor = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return true;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 160;
  };

  // ... (Giữ nguyên phần Styles commonInputStyle, dropdownPaperStyle, dropdownOptionClass)
  const commonInputStyle = {
    '& .MuiInputLabel-root': { color: 'text.primary' },
    '.dark & .MuiInputLabel-root': { color: 'white' },
    '& .MuiInputBase-root': { color: 'text.primary' },
    '.dark & .MuiInputBase-root': { color: 'white' },
    '& .MuiSvgIcon-root': { color: 'text.primary' },
    '.dark & .MuiSvgIcon-root': { color: 'white' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(128, 128, 128, 0.5)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.primary' },
    '.dark &:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
  };

  const dropdownPaperStyle = {
    className: "!bg-white dark:!bg-gray-950 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white",
    sx: { backgroundImage: 'none' }
  };

  const dropdownOptionClass = "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 selected:bg-emerald-50 dark:selected:bg-emerald-900/30";


  if (loadingProducts || storeLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={30} thickness={4} color="primary" />
        <Typography variant="body2" sx={{ mt: 2 }} className="text-gray-600 dark:text-gray-300">
          Đang tải dữ liệu...
        </Typography>
      </Box>
    );
  }

  if (error) return <Alert severity="error" variant="outlined">{error}</Alert>;
  if (!activeStoreId) return <Alert severity="warning" variant="outlined">Chưa xác định kho.</Alert>;

  return (
    <Box>
        {/* 1. Ô TÌM KIẾM SẢN PHẨM (Giữ nguyên) */}
        <Autocomplete
          options={allProducts}
          getOptionLabel={(product) => product.name}
          value={selectedProduct}
          onChange={(_, newValue) => setSelectedProduct(newValue)}
          popupIcon={<SearchIcon />}
          slotProps={{ paper: dropdownPaperStyle }}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            const combinedClass = `${otherProps.className || ''} ${dropdownOptionClass}`;
            return (
              <Box component="li" key={key} {...otherProps} className={combinedClass} sx={{ py: 1.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar src={option.thumbnailImage} variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'action.selected' }}>
                    <ImageIcon fontSize="small" className="text-gray-500 dark:text-white" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'inherit' }}>{option.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>Mã: {option.code}</Typography>
                  </Box>
                </Stack>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Chọn sản phẩm"
              placeholder="Tìm tên hoặc mã..."
              variant="outlined"
              sx={commonInputStyle}
            />
          )}
        />

        {/* PHẦN CHI TIẾT SẢN PHẨM */}
        <Fade in={!!selectedProduct} mountOnEnter unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* Ảnh sản phẩm (Giữ nguyên) */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'rgba(128, 128, 128, 0.5)', borderRadius: 1, height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {currentDisplayImage ? (
                    <Box component="img" src={currentDisplayImage} alt={selectedProduct?.name} sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }} />
                  ) : (
                    <Stack alignItems="center" className="text-gray-500 dark:text-white">
                      <ImageIcon sx={{ fontSize: 50, mb: 1, opacity: 0.5 }} />
                      <Typography variant="caption">No Image</Typography>
                    </Stack>
                  )}
                </Box>
              </Grid>

              {/* Thông tin & Chọn màu & Vị trí */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} className="text-gray-900 dark:text-white">
                      {selectedProduct?.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                        Mã: {selectedProduct?.code}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(128, 128, 128, 0.2)' }} />

                  {/* Chọn Màu Sắc */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }} className="text-gray-900 dark:text-white">
                      Màu sắc
                    </Typography>
                    {availableColors.length === 0 ? (
                      <Typography variant="caption" color="warning.main">Chưa cấu hình màu.</Typography>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1.5}>
                        {availableColors.map((pc) => {
                          const isSelected = selectedProductColorId === pc.id;
                          return (
                            <Tooltip title={pc.color.colorName} key={pc.id} arrow placement="top">
                              <Box
                                onClick={() => setSelectedProductColorId(pc.id)}
                                sx={{
                                  width: 36, height: 36, borderRadius: '50%', bgcolor: pc.color.hexCode, cursor: 'pointer',
                                  border: isSelected ? `2px solid ${theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary}` : '1px solid rgba(128,128,128,0.5)',
                                  boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.3)' : 'none',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
                                  '&:hover': { transform: 'scale(1.1)' }
                                }}
                              >
                                {isSelected && (
                                  <CheckCircleIcon sx={{ fontSize: 20, color: isLightColor(pc.color.hexCode) ? 'black' : 'white' }} />
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>

                  {/* [SỬA ĐỔI] Chọn Vị Trí: Switch logic */}
                  {selectedProductColorId && (
                    <Zoom in={!!selectedProductColorId}>
                      <Box>
                         {isImportMode ? (
                            // --- CASE 1: NHẬP HÀNG (Dùng WarehouseZoneLocationSelector) ---
                            currentWarehouseId ? (
                                <Box className="p-3 border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <Typography variant="subtitle2" className="mb-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                                        Chọn vị trí để nhập hàng:
                                    </Typography>
                                    <WarehouseZoneLocationSelector
                                        labelPrefix=""
                                        selectedWarehouseId={currentWarehouseId}
                                        selectedZoneId={importZoneId}
                                        selectedLocationId={importLocationId}
                                        onWarehouseChange={() => {}} // Disabled/Hidden anyway
                                        onZoneChange={(id) => {
                                            setImportZoneId(id);
                                            setImportLocationId(null);
                                        }}
                                        onLocationChange={(id, code) => {
                                            setImportLocationId(id);
                                            setImportLocationCode(code || '');
                                        }}
                                        hideWarehouse={true} // Ẩn Warehouse
                                    />
                                </Box>
                            ) : (
                                <Alert severity="warning">Vui lòng chọn Kho nguồn trước khi chọn sản phẩm.</Alert>
                            )
                         ) : (
                            // --- CASE 2: XUẤT/CHUYỂN (Dùng logic cũ) ---
                            <Autocomplete
                                options={locations}
                                disabled={loadingLocations}
                                getOptionLabel={(loc) => `${loc.locationCode}`}
                                value={selectedLocation}
                                onChange={(_, val) => setSelectedLocation(val)}
                                popupIcon={<PlaceIcon />}
                                slotProps={{ paper: dropdownPaperStyle }}
                                renderInput={(params) => (
                                  <TextField 
                                    {...params} 
                                    label="Chọn Vị trí lấy hàng"
                                    placeholder={loadingLocations ? "Đang tìm..." : "Kệ hàng / Vị trí"}
                                    variant="outlined"
                                    sx={commonInputStyle}
                                    InputProps={{
                                      ...params.InputProps,
                                      startAdornment: (
                                        <>
                                          {loadingLocations && (
                                            <CircularProgress size={20} sx={{ mr: 1 }} className="text-gray-500 dark:text-white" />
                                          )}
                                          {params.InputProps.startAdornment}
                                        </>
                                      )
                                    }}
                                  />
                                )}
                                renderOption={(props, option) => {
                                    const { key, ...otherProps } = props;
                                    const combinedClass = `${otherProps.className || ''} ${dropdownOptionClass}`;
                                    return (
                                      <Box component="li" key={key} {...otherProps} className={combinedClass} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'inherit' }}>{option.locationCode}</Typography>
                                          <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                                            Có sẵn: {option.available}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    );
                                }}
                                noOptionsText={<Typography className="text-gray-500 dark:text-white">Hết hàng hoặc chưa có vị trí</Typography>}
                            />
                         )}
                      </Box>
                    </Zoom>
                  )}

                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Fade>
    </Box>
  );
};

export default ProductSelector;