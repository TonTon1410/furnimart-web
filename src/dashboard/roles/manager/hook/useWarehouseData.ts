/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import warehousesService from "@/service/warehousesService";
import zoneService from "@/service/zoneService";
import locationItemService from "@/service/locationItemService";
import { useToast } from "@/context/ToastContext";
import { authService } from "@/service/authService";
import storeService from "@/service/storeService";

export function useWarehouseData() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setWarehouses([]);
      setStoreId(null);

      // --- 1. Lấy User ID ---
      const profile = await authService.getProfile(); // <-- Gọi API /users/profile
      
      if (!profile || !profile.id) {
        showToast({
          type: "error",
          title: "Lỗi xác thực",
          description: "Không tìm thấy thông tin hồ sơ người dùng.",
        });
        setWarehouses([]);
        setLoading(false);
        return;
      }
      
      const employeeId = profile.id; // <-- LẤY UUID "bfe63af4..."
      console.log("Employee ID (UUID):", employeeId);

      // --- 2. Lấy Store ID từ User ID ---
      const { data: storesRes } = await storeService.getStoresByEmployeeID(employeeId);
      const userStores = storesRes.data; 
      console.log("User Stores:", userStores);

      if (!userStores || userStores.length === 0) {
        showToast({
          type: "info",
          title: "Không tìm thấy cửa hàng",
          description: "Người dùng này chưa được gán vào cửa hàng nào.",
        });
        setWarehouses([]);
        setLoading(false);
        return;
      }

      const storeId = userStores[0].id; 
      if (!storeId) {
        throw new Error("Không thể lấy được ID cửa hàng từ thông tin người dùng.");
      }

      setStoreId(storeId);

      // --- 3. Lấy Kho theo Store ID ---
      // [SỬA LỖI] Xử lý cả trường hợp API trả về MẢNG hoặc OBJECT
      const { data: warehouseRes } = await warehousesService.getWarehouseByStore(storeId);
      const warehouseData = warehouseRes.data; 

      let warehouseList: any[] = [];
      if (Array.isArray(warehouseData)) {
        warehouseList = warehouseData; // TH 1: API trả về mảng
      } else if (warehouseData && typeof warehouseData === 'object' && warehouseData.id) {
        warehouseList = [warehouseData]; // TH 2: API trả về 1 object (như JSON mẫu)
      }

      // Check nếu không có kho nào
      if (warehouseList.length === 0) {
        showToast({
          type: "info",
          title: "Không tìm thấy kho",
          description: "Cửa hàng này chưa có kho nào được thiết lập.",
        });
        setWarehouses([]);
        setLoading(false);
        return;
      }

      // --- 4. & 5. Lấy Zone và Location (từ danh sách) ---
      const warehousesWithZones = await Promise.all(
        warehouseList.map(async (wh: any) => {
          
          // Lấy zone theo warehouseId
          const { data: zonesRes } = await zoneService.getZoneByWarehouse(wh.id);
          let zones = zonesRes.data; // Đây là danh sách tóm tắt zone

          // [SỬA LỖI] Dự phòng trường hợp API /zones trả về rỗng nhưng data kho có 'zone'
          if ((!zones || zones.length === 0) && Array.isArray(wh.zone)) {
             zones = wh.zone;
          }

          // Lấy location theo zoneId
          const zonesWithLocations = await Promise.all(
            zones.map(async (z: any) => {
              const { data: locRes } = await locationItemService.getLocationByZone(z.id);
              // [SỬA LỖI] Đảm bảo locRes.data là mảng
              return { ...z, locations: Array.isArray(locRes.data) ? locRes.data : [] }; 
            })
          );
          
          // WarehouseMap dùng wh.zones, nên chúng ta gán 'zones' ở đây
          return { ...wh, zones: zonesWithLocations }; 
        })
      );

      setWarehouses(warehousesWithZones);
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Lỗi tải dữ liệu kho",
        description: error.message || "Đã xảy ra lỗi không xác định",
      });
      setWarehouses([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { warehouses, loading, refetch: fetchData, storeId };
}