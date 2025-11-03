import React, { useState } from "react";
import { Box, Tabs, Tab, Button, Stack } from "@mui/material";
import WarehouseMap from "./WarehouseMap";
import WarehouseTable from "./WarehouseTable";
import WarehouseForm from "./components/WarehouseForm";
import { useWarehouseData } from "./hook/useWarehouseData";
import LoadingPage from "@/pages/LoadingPage";
import { useToastRadix } from "@/context/useToastRadix";

const WarehouseManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { warehouses, loading, refetch } = useWarehouseData();
  const { ToastComponent } = useToastRadix();

  const [openForm, setOpenForm] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  if (loading) return <LoadingPage />;

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <h2>Quản lý kho hàng</h2>
        <Button variant="contained" color="primary" onClick={() => { setSelectedWarehouseId(null); setFormMode("create"); setOpenForm(true); }}>
          + Tạo kho hàng
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Sơ đồ kho" />
        <Tab label="Danh sách kho" />
      </Tabs>

      {tab === 0 && <WarehouseMap warehouses={warehouses} onSelectWarehouse={(id) => { setSelectedWarehouseId(id); setFormMode("edit"); setOpenForm(true); }} />}
      {tab === 1 && <WarehouseTable warehouses={warehouses} onSelectWarehouse={(id) => { setSelectedWarehouseId(id); setFormMode("edit"); setOpenForm(true); }} />}

      <WarehouseForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        mode={formMode}
        warehouseId={selectedWarehouseId || undefined}
        storeId="1"
        onSuccess={refetch} // ✅ Truyền refetch xuống
      />

      <ToastComponent />
    </Box>
  );
};

export default WarehouseManagement;
