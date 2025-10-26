// src/dashboard/roles/manager/WarehousePage.tsx
import { useEffect, useState } from "react";
import warehousesService  from "@/service/warehousesService";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Ban } from "lucide-react";
import WarehouseFormModal from "./components/WarehouseFormModal";
import { toast } from "react-hot-toast";

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await warehousesService.getWarehouseList();
      setWarehouses(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa kho này?")) return;
    await warehousesService.deleteWarehouse(id);
    toast.success("Đã xóa kho");
    fetchWarehouses();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Warehouse Management</h1>
        <Button onClick={() => { setSelected(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Thêm Kho
        </Button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Tên kho</th>
              <th className="p-2 text-left">Địa chỉ</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Store</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((wh: any) => (
              <tr key={wh.id} className="border-t">
                <td className="p-2">{wh.name}</td>
                <td className="p-2">{wh.address}</td>
                <td className="p-2">{wh.status}</td>
                <td className="p-2">{wh.storeName}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" onClick={() => { setSelected(wh); setShowModal(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(wh.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <WarehouseFormModal
          data={selected}
          onClose={() => setShowModal(false)}
          onSuccess={fetchWarehouses}
        />
      )}
    </div>
  );
}
