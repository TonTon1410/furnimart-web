// src/dashboard/roles/manager/LocationItemPage.tsx
import { useEffect, useState } from "react";
import locationItemService from "@/service/locationItemService";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import LocationItemFormModal from "./components/LocationItemFormModal";
import { toast } from "react-hot-toast";

export default function LocationItemPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await locationItemService.getAllLocationItems();
      setLocations(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách vị trí chứa hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa vị trí này?")) return;
    await locationItemService.deleteLocationItem(id);
    toast.success("Đã xóa vị trí");
    fetchLocations();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Location Item Management</h1>
        <Button onClick={() => { setSelected(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Thêm Vị trí
        </Button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Mã vị trí</th>
              <th className="p-2 text-left">Mô tả</th>
              <th className="p-2 text-left">Sức chứa</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc: any) => (
              <tr key={loc.id} className="border-t">
                <td className="p-2">{loc.code}</td>
                <td className="p-2">{loc.description}</td>
                <td className="p-2">{loc.capacity}</td>
                <td className="p-2">{loc.status}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" onClick={() => { setSelected(loc); setShowModal(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(loc.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <LocationItemFormModal
          data={selected}
          onClose={() => setShowModal(false)}
          onSuccess={fetchLocations}
        />
      )}
    </div>
  );
}
