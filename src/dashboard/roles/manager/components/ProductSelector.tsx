// src/components/ProductSelector.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Autocomplete,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  Paper,
  Grid,
  Tooltip,
  Zoom,
  Divider,
  Fade,
  InputAdornment,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Inventory2 as InventoryIcon, 
  Place as PlaceIcon,
  CheckCircle as CheckCircleIcon,
  ImageNotSupported as ImageIcon
} from '@mui/icons-material';

import { productService } from '@/service/homeService';
import inventoryService, { type InventoryLocationDetail } from '@/service/inventoryService';
import { useWarehouseData } from '../hook/useWarehouseData';

// --- Interfaces (Giữ nguyên) ---
interface Color {
  id: string;
  colorName: string;
  hexCode: string;
}

interface ProductColor {
  id: string;
  color: Color;
}

interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  thumbnailImage: string;
  code: string; // Giả sử có mã sản phẩm
  productColors: ProductColor[];
}

export interface ProductSelectionResult {
  productColorId: string;
  locationItemId: string;
  locationCode?: string;
  productName?: string;
  colorName?: string;
}

interface ProductSelectorProps {
  onSelectionChange?: (result: ProductSelectionResult | null) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelectionChange,
}) => {
  // --- Logic Hooks & State (Giữ nguyên logic cốt lõi) ---
  const { storeId, loading: storeLoading } = useWarehouseData();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductColorId, setSelectedProductColorId] = useState<string | null>(null);
  
  const [locations, setLocations] = useState<InventoryLocationDetail[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocationDetail | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // --- Effects (Giữ nguyên) ---
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

  useEffect(() => {
    setLocations([]);
    setSelectedLocation(null);
    if (!selectedProductColorId || !storeId) return;

    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const res = await inventoryService.getLocationsByWarehouse({
          productColorId: selectedProductColorId,
          storeId: storeId,
        });
        setLocations(res.data?.data?.locations || []);
      } catch (error) {
        console.error("Lỗi lấy vị trí kho:", error);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [selectedProductColorId, storeId]);

  useEffect(() => {
    setSelectedProductColorId(null);
    setSelectedLocation(null);
    setLocations([]);
  }, [selectedProduct]);

  useEffect(() => {
    if (onSelectionChange) {
      if (selectedProductColorId && selectedLocation && selectedProduct) {
        const colorObj = selectedProduct.productColors.find(pc => pc.id === selectedProductColorId);
        onSelectionChange({
          productColorId: selectedProductColorId,
          locationItemId: selectedLocation.locationItemId,
          locationCode: selectedLocation.locationCode,
          productName: selectedProduct.name,
          colorName: colorObj?.color.colorName || ''
        });
      } else {
        onSelectionChange(null);
      }
    }
  }, [selectedProductColorId, selectedLocation, selectedProduct, onSelectionChange]);

  const availableColors = useMemo(() => selectedProduct?.productColors || [], [selectedProduct]);

  // --- Helper Styles ---
  const isLightColor = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return true;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 160;
  };

  // --- Render ---
  if (loadingProducts || storeLoading) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 3 }}>
        <CircularProgress size={30} thickness={4} sx={{ color: '#1976d2' }} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
          Đang khởi tạo dữ liệu kho...
        </Typography>
      </Paper>
    );
  }

  if (error) return <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!storeId) return <Alert severity="warning" variant="filled" sx={{ borderRadius: 2 }}>Chưa xác định được kho làm việc.</Alert>;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 0, 
        overflow: 'hidden', 
        borderRadius: 4, 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        bgcolor: '#ffffff'
      }}
    >
      {/* Header Strip */}
      <Box sx={{ px: 3, py: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid', borderColor: 'divider' }}>
         <Stack direction="row" alignItems="center" spacing={1}>
            <InventoryIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '1rem' }}>
              CHỌN SẢN PHẨM & VỊ TRÍ
            </Typography>
         </Stack>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* 1. SEARCH BAR */}
        <Autocomplete
          options={allProducts}
          getOptionLabel={(product) => product.name}
          value={selectedProduct}
          onChange={(_, newValue) => setSelectedProduct(newValue)}
          popupIcon={<SearchIcon color="action" />}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps} sx={{ py: 1.5, borderBottom: '1px dashed #eee' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar 
                    src={option.thumbnailImage} 
                    variant="rounded" 
                    sx={{ width: 48, height: 48, bgcolor: '#f0f0f0' }}
                  >
                    <ImageIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Mã: {option.code || '---'}</Typography>
                  </Box>
                </Stack>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Tìm tên hoặc mã sản phẩm..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#f8f9fa',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
                  '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)' }
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="disabled" />
                  </InputAdornment>
                )
              }}
            />
          )}
        />

        {/* PRODUCT DETAIL SECTION (Expandable) */}
        <Fade in={!!selectedProduct} mountOnEnter unmountOnExit>
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={4}>
              
              {/* LEFT: Product Image */}
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#f8f9fa', 
                    borderRadius: 3, 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  {selectedProduct?.thumbnailImage ? (
                    <Box 
                      component="img" 
                      src={selectedProduct.thumbnailImage} 
                      alt={selectedProduct.name}
                      sx={{ 
                        width: '100%', 
                        maxWidth: 250, 
                        objectFit: 'contain', 
                        borderRadius: 2,
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
                      }}
                    />
                  ) : (
                    <Stack alignItems="center" color="text.secondary">
                      <ImageIcon sx={{ fontSize: 60, mb: 1, opacity: 0.5 }} />
                      <Typography variant="caption">Không có hình ảnh</Typography>
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {/* RIGHT: Controls */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  
                  {/* Product Name Header */}
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a2027' }}>
                      {selectedProduct?.name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                       <Typography variant="body2" sx={{ px: 1, py: 0.5, bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                          PRODUCT
                       </Typography>
                       <Typography variant="body2" color="text.secondary">
                          Chọn màu sắc và vị trí kho bên dưới
                       </Typography>
                    </Stack>
                  </Box>
                  
                  <Divider />

                  {/* 2. COLOR SELECTION (Swatches) */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      MÀU SẮC <Typography component="span" variant="caption" color="text.secondary">({availableColors.length} tùy chọn)</Typography>
                    </Typography>
                    
                    {availableColors.length === 0 ? (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>Chưa cấu hình màu cho sản phẩm này.</Alert>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1.5}>
                        {availableColors.map((pc) => {
                          const isSelected = selectedProductColorId === pc.id;
                          return (
                            <Tooltip title={pc.color.colorName} key={pc.id} arrow placement="top">
                              <Box
                                onClick={() => setSelectedProductColorId(pc.id)}
                                sx={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: '50%',
                                  bgcolor: pc.color.hexCode,
                                  cursor: 'pointer',
                                  border: isSelected 
                                    ? '3px solid #fff' 
                                    : '1px solid rgba(0,0,0,0.1)',
                                  boxShadow: isSelected 
                                    ? `0 0 0 2px ${pc.color.hexCode}, 0 4px 10px rgba(0,0,0,0.2)` 
                                    : 'none',
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative',
                                  '&:hover': { transform: 'scale(1.1)' },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {isSelected && (
                                  <CheckCircleIcon 
                                    sx={{ 
                                      fontSize: 20, 
                                      color: isLightColor(pc.color.hexCode) ? 'rgba(0,0,0,0.7)' : '#fff' 
                                    }} 
                                  />
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>

                  {/* 3. LOCATION SELECTION */}
                  {selectedProductColorId && (
                    <Zoom in={!!selectedProductColorId}>
                      <Box>
                         <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, mt: 1 }}>
                            VỊ TRÍ LẤY HÀNG
                         </Typography>
                         
                         <Autocomplete
                            options={locations}
                            disabled={loadingLocations}
                            getOptionLabel={(loc) => `${loc.locationCode}`}
                            value={selectedLocation}
                            onChange={(_, val) => setSelectedLocation(val)}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                placeholder={loadingLocations ? "Đang tìm vị trí..." : "Chọn kệ hàng / vị trí"}
                                variant="outlined"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <>
                                      {loadingLocations ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <PlaceIcon color="action" sx={{ mr: 1 }} />}
                                      {params.InputProps.startAdornment}
                                    </>
                                  )
                                }}
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...otherProps } = props;
                              return (
                              <Box component="li" key={key} {...otherProps} sx={{ py: 1.5 }}>
                                <Stack direction="row" alignItems="center" spacing={2} width="100%">
                                  <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} variant="rounded">
                                    <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                      {option.available}
                                    </Typography>
                                  </Avatar>
                                  <Box flex={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{option.locationCode}</Typography>
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      {option.warehouseName} - {option.zoneName}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            )}}
                            noOptionsText="Không tìm thấy vị trí chứa hàng này"
                         />
                         
                         {/* Availability Info Tag */}
                         {locations.length > 0 && !selectedLocation && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'success.main', fontWeight: 500 }}>
                               • Tìm thấy {locations.length} vị trí có sẵn hàng trong kho.
                            </Typography>
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
    </Paper>
  );
};

export default ProductSelector;