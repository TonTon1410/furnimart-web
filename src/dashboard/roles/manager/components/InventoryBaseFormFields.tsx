/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Grid, Autocomplete } from '@mui/material';
import { productService } from '@/service/productService';
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
      const res = await warehousesService.getAllWarehouses(); // Giả định API
      setWarehouses(res.data);
    };
    fetchWarehouses();
  }, []);

  // 2. Load Khu vực (Zone) theo Kho hàng
  useEffect(() => {
    if (selectedWarehouseId) {
      const fetchZones = async () => {
        // Giả định API getZonesByWarehouseId
        const res = await zoneService.getZonesByWarehouseId(selectedWarehouseId); 
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
        const res = await locationItemService.getLocationItemsByZoneId(selectedZoneId); 
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
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      // Giả định API getAllProductColors để lấy danh sách sản phẩm/màu sắc
      const res = await productService.getAllProductColors(); 
      setProducts(res.data);
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductColorId) || null;

  return (
    <FormControl fullWidth sx={{ mt: 2 }} disabled={disabled}>
      <Autocomplete
        options={products}
        getOptionLabel={(option) => `${option.name} (${option.sku}) - ${option.colorName}`}
        value={selectedProduct}
        onChange={(event, newValue) => onSelectProduct(newValue ? newValue.id : null)}
        renderInput={(params) => <TextField {...params} label="Chọn Sản phẩm" required />}
      />
    </FormControl>
  );
};

export default InventoryBaseFormFields;