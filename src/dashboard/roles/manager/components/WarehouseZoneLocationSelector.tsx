// file: WarehouseZoneLocationSelector.tsx
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import warehousesService from '@/service/warehousesService';
import zoneService from '@/service/zoneService';
import locationItemService from '@/service/locationItemService';

interface WarehouseZoneLocationSelectorProps {
  labelPrefix: string; // Ví dụ: "Nguồn" hoặc "Đích"
  onWarehouseChange: (id: string | null) => void;
  onZoneChange: (id: string | null) => void;
  onLocationChange: (id: string | null) => void;
  selectedWarehouseId: string | null;
  selectedZoneId: string | null;
  selectedLocationId: string | null;
  disabled?: boolean;
}

const WarehouseZoneLocationSelector: React.FC<WarehouseZoneLocationSelectorProps> = ({
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
      try {
        const res = await warehousesService.getWarehouseList();
        const warehouseList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setWarehouses(warehouseList);
      } catch (error) {
        console.error("Failed to fetch warehouses:", error);
        setWarehouses([]); 
      }
    };
    fetchWarehouses();
  }, []);

  // 2. Load Khu vực (Zone) theo Kho hàng
  useEffect(() => {
    if (selectedWarehouseId) {
      const fetchZones = async () => {
        const res = await zoneService.getZoneByWarehouse(selectedWarehouseId);
        const zoneList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setZones(zoneList);
        // Reset Zone khi Kho thay đổi
        onZoneChange(null); 
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
        const res = await locationItemService.getLocationByZone(selectedZoneId);
        const locationList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setLocations(locationList);
        // Reset Location khi Zone thay đổi
        onLocationChange(null); 
      };
      fetchLocations();
    } else {
      setLocations([]);
      onLocationChange(null);
    }
  }, [selectedZoneId]);

  return (
    <Grid container spacing={2}>
      {/* Đã thay đổi kích thước thành xs={6} sm={6} để tăng chiều rộng */}
      <Grid item xs={6} sm={6}> 
        {/* Thêm sx={{ minWidth: 200 }} để đảm bảo select có chiều rộng tối thiểu, tránh label bị cắt */}
        <FormControl fullWidth disabled={disabled} sx={{ minWidth: 200 }}>
          <InputLabel>{labelPrefix} Kho hàng</InputLabel>
          <Select
            label={`${labelPrefix} Kho hàng`}
            value={selectedWarehouseId || ''}
            onChange={(e) => onWarehouseChange(e.target.value as string)}
            required
          >
            {Array.isArray(warehouses) && warehouses.map(wh => (
              <MenuItem key={wh.id} value={wh.id}>{wh.warehouseName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Đã thay đổi kích thước thành xs={6} sm={6} để tăng chiều rộng */}
      <Grid item xs={6} sm={6}> 
        {/* Thêm sx={{ minWidth: 200 }} */}
        <FormControl fullWidth disabled={disabled || !selectedWarehouseId} sx={{ minWidth: 200 }}>
          <InputLabel>{labelPrefix} Khu vực</InputLabel>
          <Select
            label={`${labelPrefix} Khu vực`}
            value={selectedZoneId || ''}
            onChange={(e) => onZoneChange(e.target.value as string)}
            required
          >
            {Array.isArray(zones) && zones.map(zone => (
              <MenuItem key={zone.id} value={zone.id}>{zone.zoneName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      {/* Đã thay đổi kích thước thành xs={6} sm={6} để tăng chiều rộng */}
      <Grid item xs={6} sm={6}>
        {/* Thêm sx={{ minWidth: 200 }} */}
        <FormControl fullWidth disabled={disabled || !selectedZoneId} sx={{ minWidth: 200 }}>
          <InputLabel>{labelPrefix} Vị trí</InputLabel>
          <Select
            label={`${labelPrefix} Vị trí`}
            value={selectedLocationId || ''}
            onChange={(e) => onLocationChange(e.target.value as string)}
            required
          >
            {Array.isArray(locations) && locations.map(loc => (
              <MenuItem key={loc.id} value={loc.id}>{loc.code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default WarehouseZoneLocationSelector;