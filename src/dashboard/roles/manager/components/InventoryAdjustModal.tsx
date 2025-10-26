// src/dashboard/roles/manager/components/InventoryAdjustModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { z } from "zod";
import inventoryService  from "@/service/inventoryService";

const schema = z.object({
  quantity: z.number().min(1, "Số lượng phải > 0"),
  action: z.enum(["increase", "decrease"]),
});

type FormValues = z.infer<typeof schema>;

export default function InventoryAdjustModal({ data, onClose, onSuccess }: { data: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, action: "increase" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (values.action === "increase") {
        await inventoryService.increaseStock({ productColorId: data.productColorId, zoneId: data.zoneId, quantity: values.quantity });
      } else {
        await inventoryService.decreaseStock({ productColorId: data.productColorId, zoneId: data.zoneId, quantity: values.quantity });
      }
      toast.success("Điều chỉnh thành công");
      onSuccess();
      onClose();
    } catch {
      toast.error("Điều chỉnh thất bại");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Hành động</label>
            <select {...register("action")} className="w-full border rounded p-2">
              <option value="increase">Tăng</option>
              <option value="decrease">Giảm</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Số lượng</label>
            <Input type="number" {...register("quantity", { valueAsNumber: true })} />
            {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
