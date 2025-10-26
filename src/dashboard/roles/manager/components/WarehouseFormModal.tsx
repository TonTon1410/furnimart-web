// src/dashboard/roles/manager/components/WarehouseFormModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { z } from "zod";
import warehousesService from "@/service/warehousesService";

const schema = z.object({
  name: z.string().min(1, "Tên kho bắt buộc"),
  address: z.string().min(1, "Địa chỉ bắt buộc"),
  storeId: z.string().min(1, "Cần chọn store"),
});

type FormValues = z.infer<typeof schema>;

export default function WarehouseFormModal({ data, onClose, onSuccess }: { data?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data || { name: "", address: "", storeId: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (data) {
        await warehousesService.updateWarehouse(data.storeId, data.id, values);
        toast.success("Cập nhật kho thành công");
      } else {
        await warehousesService.createWarehouse(values.storeId, values);
        toast.success("Tạo kho thành công");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Lưu thất bại");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{data ? "Chỉnh sửa kho" : "Thêm kho mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Tên kho</label>
            <Input {...register("name")} placeholder="Nhập tên kho" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Địa chỉ</label>
            <Input {...register("address")} placeholder="Nhập địa chỉ" />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Store ID</label>
            <Input {...register("storeId")} placeholder="VD: 1" />
            {errors.storeId && <p className="text-red-500 text-sm">{errors.storeId.message}</p>}
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
