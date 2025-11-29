/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import warehousesService from '@/service/warehousesService';
import zoneService from '@/service/zoneService';
import locationItemService from '@/service/locationItemService';
import CustomDropdown from '@/components/CustomDropdown'; 

interface WarehouseZoneLocationSelectorProps {
  labelPrefix: string;
  onWarehouseChange: (id: string | null) => void;
  onZoneChange: (id: string | null) => void;
  // [CẬP NHẬT] Thêm tham số code vào callback để lấy tên hiển thị
  onLocationChange: (id: string | null, code?: string) => void; 
  selectedWarehouseId: string | null;
  selectedZoneId: string | null;
  selectedLocationId: string | null;
  disabled?: boolean;
  hideZoneAndLocation?: boolean;
  // [MỚI] Prop để ẩn Warehouse select
  hideWarehouse?: boolean;
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
  hideZoneAndLocation = false,
  // [MỚI] Mặc định false
  hideWarehouse = false,
}) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // 1. Load Kho hàng (Chỉ load nếu không ẩn)
  useEffect(() => {
    if (!hideWarehouse) {
        const fetchWarehouses = async () => {
        try {
            const res = await warehousesService.getWarehouseList();
            const warehouseList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setWarehouses(warehouseList);
        } catch (error) {
            setWarehouses([]);
        }
        };
        fetchWarehouses();
    }
  }, [hideWarehouse]);

  // 2. Load Khu vực
  useEffect(() => {
    if (selectedWarehouseId) {
      const fetchZones = async () => {
        try {
          const res = await zoneService.getZoneByWarehouse(selectedWarehouseId);
          const zoneList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setZones(zoneList);
        } catch (error) {
          setZones([]);
        }
        // Reset zone khi warehouse đổi
        onZoneChange(null);
      };
      fetchZones();
    } else {
      setZones([]);
      onZoneChange(null);
    }
  }, [selectedWarehouseId]);

  // 3. Load Vị trí
  useEffect(() => {
    if (selectedZoneId) {
      const fetchLocations = async () => {
        try {
          const res = await locationItemService.getLocationByZone(selectedZoneId);
          const locationList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setLocations(locationList);
        } catch (error) {
          setLocations([]);
        }
        onLocationChange(null);
      };
      fetchLocations();
    } else {
      setLocations([]);
      onLocationChange(null);
    }
  }, [selectedZoneId]);

  const mapToOptions = (data: any[], valueKey: string, labelKey: string) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      value: item[valueKey],
      label: item[labelKey]
    }));
  };

  const isWarehouseDisabled = disabled;
  const isZoneDisabled = disabled || !selectedWarehouseId;
  const isLocationDisabled = disabled || !selectedZoneId;
  const getWrapperClass = (isDisabled: boolean) => 
    `w-full transition-opacity duration-200 ${isDisabled ? 'opacity-50 pointer-events-none grayscale' : ''}`;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* [SỬA ĐỔI] Chỉ hiển thị nếu hideWarehouse = false */}
      {!hideWarehouse && (
          <div className={getWrapperClass(isWarehouseDisabled)}>
            <CustomDropdown
              id="warehouse-select"
              label={`${labelPrefix} Kho hàng`}
              placeholder="Chọn kho hàng..."
              value={selectedWarehouseId || ''}
              options={mapToOptions(warehouses, 'id', 'warehouseName')}
              onChange={(val) => onWarehouseChange(val)}
              fullWidth
            />
          </div>
      )}

      {!hideZoneAndLocation && (
        <>
          <div className={getWrapperClass(isZoneDisabled)}>
            <CustomDropdown
              id="zone-select"
              label={`${labelPrefix} Khu vực`}
              placeholder={!selectedWarehouseId ? "Vui lòng chọn Kho trước" : "Chọn khu vực..."}
              value={selectedZoneId || ''}
              options={mapToOptions(zones, 'id', 'zoneName')}
              onChange={(val) => onZoneChange(val)}
              fullWidth
            />
          </div>

          <div className={getWrapperClass(isLocationDisabled)}>
            <CustomDropdown
              id="location-select"
              label={`${labelPrefix} Vị trí`}
              placeholder={!selectedZoneId ? "Vui lòng chọn Khu vực trước" : "Chọn vị trí..."}
              value={selectedLocationId || ''}
              options={mapToOptions(locations, 'id', 'code')}
              onChange={(val) => {
                // [CẬP NHẬT] Tìm object location để lấy code
                const foundLoc = locations.find(l => l.id === val);
                onLocationChange(val, foundLoc?.code);
              }}
              fullWidth
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WarehouseZoneLocationSelector;