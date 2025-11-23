/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { authService } from "@/service/authService";
import storeService from "@/service/storeService";

export function useWarehouseData() {
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setStoreId(null);

      // --- 1. Lấy User ID ---
      const profile = await authService.getProfile();
      
      if (!profile || !profile.id) {
        showToast({
          type: "error",
          title: "Lỗi xác thực",
          description: "Không tìm thấy thông tin hồ sơ người dùng.",
        });
        setLoading(false);
        return;
      }
      
      const employeeId = profile.id;
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
        setLoading(false);
        return;
      }

      const foundStoreId = userStores[0].id; 
      if (!foundStoreId) {
        throw new Error("Không thể lấy được ID cửa hàng từ thông tin người dùng.");
      }

      setStoreId(foundStoreId);

    } catch (error: any) {
      showToast({
        type: "error",
        title: "Lỗi tải dữ liệu",
        description: error.message || "Đã xảy ra lỗi không xác định",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Return chỉ còn storeId, loading và refetch
  return { storeId, loading, refetch: fetchData };
}