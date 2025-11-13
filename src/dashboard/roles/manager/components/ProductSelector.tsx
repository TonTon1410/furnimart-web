// src/components/ProductSelector.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  FormControl,
  Autocomplete,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { productService } from '@/service/homeService';

// Cập nhật Product interface để bao gồm productColors
interface Color {
  id: string;
  colorName: string;
  hexCode: string;
}

interface ProductColor {
  id: string; // Đây là ProductColorId cần lưu
  color: Color;
  // ... các trường khác như images, models3D, status
}

interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  thumbnailImage: string;
  // Thêm trường productColors từ response mẫu
  productColors: ProductColor[];
}

interface ProductSelectorProps {
  // Props có thể thêm vào nếu cần truyền state lên component cha
  onProductColorSelect?: (productColorId: string | null) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  onProductColorSelect,
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho sản phẩm và màu đã chọn
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productColorId, setProductColorId] = useState<string | null>(null);

  // Lấy danh sách tất cả sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // productService.getAll() trả về ProductResponse
        const res = await productService.getAll();
        // Cần ép kiểu để thêm productColors, do homeService.ts chưa định nghĩa trường này
        setAllProducts(res.data.data as unknown as Product[]);
      } catch (e: any) {
        console.error('Failed to fetch products:', e);
        setError(
          e?.response?.data?.message ||
            e?.message ||
            'Không tải được danh sách sản phẩm',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Đồng bộ state lên component cha khi productColorId thay đổi
  useEffect(() => {
    if (onProductColorSelect) {
      onProductColorSelect(productColorId);
    }
  }, [productColorId, onProductColorSelect]);

  // Reset màu đã chọn khi sản phẩm thay đổi
  useEffect(() => {
    setProductColorId(null);
  }, [selectedProduct]);

  // Các màu (ProductColor) của sản phẩm đã chọn
  const availableColors = useMemo(() => {
    return selectedProduct?.productColors || [];
  }, [selectedProduct]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải sản phẩm...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Lỗi: {error}
      </Alert>
    );
  }

  return (
    <FormControl fullWidth sx={{ mb: 4 }}>
      {/* 1. Chọn Sản phẩm */}
      <Typography variant="h6" gutterBottom>
        Chọn sản phẩm
      </Typography>
      <Autocomplete
        options={allProducts}
        getOptionLabel={(product) => product.name}
        value={selectedProduct}
        onChange={(_, newValue) => {
          setSelectedProduct(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tìm kiếm sản phẩm"
            variant="outlined"
            size="small"
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="Không tìm thấy sản phẩm"
      />

      {/* 2. Chọn Màu sắc của Sản phẩm đã chọn */}
      {selectedProduct && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chọn Màu Sắc
          </Typography>
          {availableColors.length === 0 ? (
            <Alert severity="warning">
              Sản phẩm **{selectedProduct.name}** chưa có thông tin màu sắc.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableColors.map((pc) => (
                <Chip
                  key={pc.id}
                  label={pc.color.colorName}
                  onClick={() => setProductColorId(pc.id)}
                  sx={{
                    bgcolor: pc.color.hexCode,
                    color:
                      pc.id === productColorId
                        ? '#ffffff'
                        : isLightColor(pc.color.hexCode)
                        ? '#000000'
                        : '#ffffff',
                    border:
                      pc.id === productColorId
                        ? '3px solid #10b981' // Màu viền khi được chọn (Emerald-600)
                        : `1px solid ${pc.color.hexCode}`,
                    fontWeight: pc.id === productColorId ? 'bold' : 'normal',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* 3. Hiển thị ID màu đã chọn (Để kiểm tra) */}
      {/* <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          ID Màu Sản Phẩm Đã Chọn (productColorId):
        </Typography>
        <Typography color="primary">
          {productColorId || 'Chưa chọn màu'}
        </Typography>
      </Box> */}
    </FormControl>
  );
};

export default ProductSelector;

// Hàm kiểm tra màu sáng hay tối để chọn màu chữ phù hợp
const isLightColor = (hex: string) => {
  const c = hex.substring(1); // bỏ '#'
  const rgb = parseInt(c, 16); // chuyển sang số
  const r = (rgb >> 16) & 0xff; // lấy R
  const g = (rgb >> 8) & 0xff; // lấy G
  const b = (rgb >> 0) & 0xff; // lấy B
  // Tính toán độ sáng (Luminance) theo công thức ITU-R BT.709
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 160; // Ngưỡng độ sáng
};