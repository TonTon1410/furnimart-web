import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import InventoryTransaction from './InventoryTransaction';
import TransactionHistory from './TransactionHistory';
import { LayoutDashboard } from 'lucide-react'; // Icon cho trang

const InventoryManagement: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {/* <LayoutDashboard size={28} style={{ verticalAlign: 'middle', marginRight: 10 }} /> */}
        Quản lý Xuất Nhập Kho
      </Typography>

      <Paper elevation={1} sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="inventory tabs">
            <Tab label="Xuất Nhập & Chuyển Kho" />
            <Tab label="Lịch Sử Tồn kho" />
          </Tabs>
        </Box>
        
        {/* Tab 1: Xuất Nhập & Chuyển Kho */}
        {value === 0 && (
          <Box sx={{ p: 3 }}>
            <InventoryTransaction />
          </Box>
        )}

        {/* Tab 2: Lịch Sử Xuất nhập */}
        {value === 1 && (
          <Box sx={{ p: 3 }}>
            <TransactionHistory />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default InventoryManagement;