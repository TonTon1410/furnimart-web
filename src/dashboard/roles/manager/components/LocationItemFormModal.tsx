// src/dashboard/roles/manager/components/LocationItemFormModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { z } from "zod";
import locationItemService from "@/service/locationItemService";

const schema = z.object({
  code: z.string().min(1, "Mã vị trí bắt buộc"),
  description: z.string().optional(),
  zoneId: z.string().min(1, "Cần chọn Zone"),
  columnNumber: z.number().min(1, "Số cột phải > 0"),
  rowLabel: z.string().min(1, "Label hàng bắt buộc"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof schema>;

export default function LocationItemFormModal({ data, onClose, onSuccess }: { data?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: data || {
      code: "",
      description: "",
      zoneId: "",
      columnNumber: 1,
      rowLabel: "",
      status: "ACTIVE",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (data) {
        await locationItemService.updateLocationItem(data.id, values);
        toast.success("Cập nhật vị trí thành công");
      } else {
        await locationItemService.createLocationItem(values);
        toast.success("Tạo vị trí thành công");
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
          <DialogTitle>{data ? "Chỉnh sửa Vị trí" : "Thêm Vị trí mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Mã vị trí</label>
            <Input {...register("code")} />
            {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Mô tả</label>
            <Input {...register("description")} />
          </div>
          <div>
            <label className="text-sm font-medium">Zone ID</label>
            <Input {...register("zoneId")} placeholder="VD: 1" />
            {errors.zoneId && <p className="text-red-500 text-sm">{errors.zoneId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Cột</label>
              <Input type="number" {...register("columnNumber", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium">Hàng</label>
              <Input {...register("rowLabel")} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Trạng thái</label>
            <select {...register("status")} className="w-full border rounded p-2">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
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
