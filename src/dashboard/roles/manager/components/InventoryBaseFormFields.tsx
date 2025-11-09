// file: InventoryBaseFormFields.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react'; // ✅ Thêm useMemo
import { TextField, FormControl, InputLabel, Select, MenuItem, Grid, Autocomplete } from '@mui/material';
import { productService } from '@/service/homeService';
import warehousesService from '@/service/warehousesService';
import zoneService from '@/service/zoneService';
import locationItemService from '@/service/locationItemService';

interface BaseFormFieldsProps {
  labelPrefix: string; // Ví dụ: "Nguồn" hoặc "Đích"
  onWarehouseChange: (id: string | null) => void;
  onZoneChange: (id: string | null) => void;
  onLocationChange: (id: string | null) => void;
  selectedWarehouseId: string | null;
  selectedZoneId: string | null;
  selectedLocationId: string | null;
  disabled?: boolean;
}

const InventoryBaseFormFields: React.FC<BaseFormFieldsProps> = ({
  labelPrefix,
  onWarehouseChange,
  onZoneChange,
  onLocationChange,
  selectedWarehouseId,
  selectedZoneId,
  selectedLocationId,
  disabled = false,
}) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // 1. Load Kho hàng (Warehouse)
  useEffect(() => {
    const fetchWarehouses = async () => {
      const res = await warehousesService.getWarehouseList(); // Giả định API
      setWarehouses(res.data);
    };
    fetchWarehouses();
  }, []);

  // 2. Load Khu vực (Zone) theo Kho hàng
  useEffect(() => {
    if (selectedWarehouseId) {
      const fetchZones = async () => {
        // Giả định API getZonesByWarehouseId
        const res = await zoneService.getZoneByWarehouse(selectedWarehouseId); //
        setZones(res.data);
        onZoneChange(null); // Reset Zone khi Kho thay đổi
      };
      fetchZones();
    } else {
      setZones([]);
      onZoneChange(null);
    }
  }, [selectedWarehouseId]);

  // 3. Load Vị trí (Location) theo Khu vực
  useEffect(() => {
    if (selectedZoneId) {
      const fetchLocations = async () => {
        // Giả định API getLocationItemsByZoneId
        const res = await locationItemService.getLocationByZone(selectedZoneId); //
        setLocations(res.data);
        onLocationChange(null); // Reset Location khi Zone thay đổi
      };
      fetchLocations();
    } else {
      setLocations([]);
      onLocationChange(null);
    }
  }, [selectedZoneId]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>{labelPrefix} Kho hàng</InputLabel>
          <Select
            label={`${labelPrefix} Kho hàng`}
            value={selectedWarehouseId || ''}
            onChange={(e) => onWarehouseChange(e.target.value as string)}
            required
          >
            {warehouses.map(wh => (
              <MenuItem key={wh.id} value={wh.id}>{wh.warehouseName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled || !selectedWarehouseId}>
          <InputLabel>{labelPrefix} Khu vực</InputLabel>
          <Select
            label={`${labelPrefix} Khu vực`}
            value={selectedZoneId || ''}
            onChange={(e) => onZoneChange(e.target.value as string)}
            required
          >
            {zones.map(zone => (
              <MenuItem key={zone.id} value={zone.id}>{zone.zoneName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={disabled || !selectedZoneId}>
          <InputLabel>{labelPrefix} Vị trí</InputLabel>
          <Select
            label={`${labelPrefix} Vị trí`}
            value={selectedLocationId || ''}
            onChange={(e) => onLocationChange(e.target.value as string)}
            required
          >
            {locations.map(loc => (
              <MenuItem key={loc.id} value={loc.id}>{loc.code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

// =======================================================
// ✅ CẬP NHẬT LOGIC Product Selector
// =======================================================

// Khai báo kiểu dữ liệu cho biến thể ProductColor
interface ProductColorVariant {
  productColorId: string; // ID của biến thể màu sắc (color.id)
  productId: string; // ID của sản phẩm gốc (p.id)
  productName: string; // Tên sản phẩm
  productCode: string; // Mã sản phẩm (thường dùng làm SKU)
  colorName: string; // Tên màu sắc
  // Thêm các trường khác nếu cần
}


// Component riêng cho Product Selector (Tái sử dụng)
interface ProductSelectorProps {
  onSelectProduct: (productColorId: string | null) => void;
  selectedProductColorId: string | null;
  disabled?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelectProduct,
  selectedProductColorId,
  disabled = false,
}) => {
  const [rawProducts, setRawProducts] = useState<any[]>([]); // Lưu trữ dữ liệu thô từ API

  useEffect(() => {
    const fetchProducts = async () => {
      // Giả định API getAllProductColors để lấy danh sách sản phẩm/màu sắc
      const res = await productService.getAll(); 
      setRawProducts(res.data.data || []); // Lấy mảng data từ ProductResponse
    };
    fetchProducts();
  }, []);

  // ✅ LOGIC TẠO MẢNG PHẲNG CÁC BIẾN THỂ MÀU (ProductColorVariant)
  const productVariants = useMemo<ProductColorVariant[]>(() => {
    if (!rawProducts) return [];
    
    // Duyệt qua từng sản phẩm gốc
    return rawProducts.flatMap((product) => {
      // Mỗi sản phẩm có một mảng 'color'
      const colors = product.color || [];
      
      // Tạo ra một biến thể cho mỗi màu sắc
      return colors.map((color: any) => ({
        productColorId: color.id, 
        productId: product.id,
        productName: product.name,
        productCode: product.code, // Sử dụng code làm SKU/Mã sản phẩm
        colorName: color.colorName,
        // Có thể thêm hexCode: color.hexCode nếu cần
      }));
    });
  }, [rawProducts]);

  // ✅ CẬP NHẬT LOGIC TÌM KIẾM SẢN PHẨM ĐƯỢC CHỌN
  const selectedProductVariant = productVariants.find(
    (v) => v.productColorId === selectedProductColorId
  ) || null;

  return (
    <FormControl fullWidth sx={{ mt: 2 }} disabled={disabled}>
      <Autocomplete
        options={productVariants}
        // ✅ CẬP NHẬT: Hiển thị tên biến thể
        getOptionLabel={(option) => 
          `${option.productName} (${option.productCode}) - ${option.colorName}`
        }
        value={selectedProductVariant}
        onChange={(event, newValue) => 
          // ✅ CẬP NHẬT: Trả về productColorId
          onSelectProduct(newValue ? newValue.productColorId : null)
        }
        renderInput={(params) => <TextField {...params} label="Chọn Sản phẩm" required />}
      />
    </FormControl>
  );
};

export default InventoryBaseFormFields;