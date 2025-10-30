/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import warehousesService from "@/service/warehousesService";
import zoneService from "@/service/zoneService";
import locationItemService from "@/service/locationItemService";
import { useToastRadix } from "@/context/useToastRadix";

export function useWarehouseData() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastRadix();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Gọi danh sách kho
        const { data: warehouseRes } = await warehousesService.getWarehouseList();
        const warehouseList = warehouseRes.data;

        // Cho mỗi kho → lấy zone → lấy location
        const warehousesWithZones = await Promise.all(
          warehouseList.map(async (wh: any) => {
            const { data: zonesRes } = await zoneService.getZoneByWarehouse(wh.id);
            const zones = zonesRes.data;

            const zonesWithLocations = await Promise.all(
              zones.map(async (z: any) => {
                const { data: locRes } = await locationItemService.getLocationByZone(z.id);
                return { ...z, locations: locRes.data };
              })
            );

            return { ...wh, zones: zonesWithLocations };
          })
        );

        setWarehouses(warehousesWithZones);
      } catch (error: any) {
        showToast({
          type: "error",
          title: "Lỗi tải dữ liệu kho",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { warehouses, loading };
}
