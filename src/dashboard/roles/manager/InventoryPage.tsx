// src/dashboard/roles/manager/InventoryPage.tsx
import { useEffect, useState } from "react";
import inventoryService from "@/service/inventoryService";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, RefreshCcw } from "lucide-react";
import InventoryAdjustModal from "./components/InventoryAdjustModal";
import { toast } from "react-hot-toast";

export default function InventoryPage() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventories();
      setInventories(res.data);
    } catch (err) {
      toast.error("Không thể tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Inventory Management</h1>
        <Button onClick={fetchInventories}>
          <RefreshCcw className="w-4 h-4 mr-1" /> Làm mới
        </Button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Sản phẩm</th>
              <th className="p-2 text-left">Zone</th>
              <th className="p-2 text-left">Physical</th>
              <th className="p-2 text-left">Available</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {inventories.map((inv: any) => (
              <tr key={inv.id} className="border-t">
                <td className="p-2">{inv.productName}</td>
                <td className="p-2">{inv.zoneName}</td>
                <td className="p-2">{inv.physicalStock}</td>
                <td className="p-2">{inv.availableStock}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" onClick={() => { setSelected(inv); setShowModal(true); }}>
                    <ArrowUpDown className="w-4 h-4" /> Điều chỉnh
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <InventoryAdjustModal
          data={selected}
          onClose={() => setShowModal(false)}
          onSuccess={fetchInventories}
        />
      )}
    </div>
  );
}
