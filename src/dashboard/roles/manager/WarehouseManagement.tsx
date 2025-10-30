import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import WarehouseMap from "./WarehouseMap";
import WarehouseTable from "./WarehouseTable";
import { useWarehouseData } from "./hook/useWarehouseData";
import LoadingPage from "@/pages/LoadingPage";

const WarehouseManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { warehouses, loading } = useWarehouseData();

  if (loading) return <LoadingPage />

  return (
    <Box p={3}>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Sơ đồ kho" />
        <Tab label="Danh sách kho" />
      </Tabs>

      {tab === 0 && <WarehouseMap warehouses={warehouses} />}
      {tab === 1 && <WarehouseTable warehouses={warehouses} />}
    </Box>
  );
};

export default WarehouseManagement;
