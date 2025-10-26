// src/dashboard/roles/manager/components/ZoneFormModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { z } from "zod";
import zoneService from "@/service/zoneService";

const schema = z.object({
  name: z.string().min(1, "Tên zone bắt buộc"),
  code: z.string().min(1, "Mã zone bắt buộc"),
  maxCapacity: z.number().min(1, "Cần nhập sức chứa tối đa"),
  warehouseId: z.string().min(1, "Cần chọn warehouse"),
});

type FormValues = z.infer<typeof schema>;

export default function ZoneFormModal({ data, onClose, onSuccess }: { data?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data || { name: "", code: "", maxCapacity: 0, warehouseId: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (data) {
        await zoneService.updateZone(data.id, values);
        toast.success("Cập nhật zone thành công");
      } else {
        await zoneService.createZone(values);
        toast.success("Tạo zone thành công");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Lưu thất bại");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{data ? "Chỉnh sửa Zone" : "Thêm Zone mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Tên Zone</label>
            <Input {...register("name")} placeholder="Tên Zone" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Mã Zone</label>
            <Input {...register("code")} placeholder="Mã Zone" />
            {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Sức chứa tối đa</label>
            <Input type="number" {...register("maxCapacity", { valueAsNumber: true })} />
            {errors.maxCapacity && <p className="text-red-500 text-sm">{errors.maxCapacity.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Warehouse ID</label>
            <Input {...register("warehouseId")} placeholder="VD: 1" />
            {errors.warehouseId && <p className="text-red-500 text-sm">{errors.warehouseId.message}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
