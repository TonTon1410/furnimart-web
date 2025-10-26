// src/dashboard/roles/manager/ZonePage.tsx
import { useEffect, useState } from "react";
import zoneService from "@/service/zoneService";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import ZoneFormModal from "./components/ZoneFormModal";
import { toast } from "react-hot-toast";

export default function ZonePage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await zoneService.getAllZones();
      setZones(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách zone");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa zone này?")) return;
    await zoneService.deleteZone(id);
    toast.success("Đã xóa zone");
    fetchZones();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Zone Management</h1>
        <Button onClick={() => { setSelected(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Thêm Zone
        </Button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Tên Zone</th>
              <th className="p-2 text-left">Mã</th>
              <th className="p-2 text-left">Sức chứa</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z: any) => (
              <tr key={z.id} className="border-t">
                <td className="p-2">{z.name}</td>
                <td className="p-2">{z.code}</td>
                <td className="p-2">{z.capacity}/{z.maxCapacity}</td>
                <td className="p-2">{z.status}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" onClick={() => { setSelected(z); setShowModal(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(z.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <ZoneFormModal
          data={selected}
          onClose={() => setShowModal(false)}
          onSuccess={fetchZones}
        />
      )}
    </div>
  );
}
