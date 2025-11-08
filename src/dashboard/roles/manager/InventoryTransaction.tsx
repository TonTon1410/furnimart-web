/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, 
  Collapse,
} from '@mui/material';
import InboundForm from './components/InboundForm';   
import OutboundForm from './components/OutboundForm'; 
import TransferForm from './components/TransferForm'; 

type TransactionType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER';

const InventoryTransaction: React.FC = () => {
  const [type, setType] = useState<TransactionType>('INBOUND');

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TransactionType,
  ) => {
    if (newType !== null) {
      setType(newType);
    }
  };

  const handleSuccess = () => {
    // Logic sau khi giao dịch thành công (ví dụ: hiển thị thông báo)
    console.log(`${type} transaction completed successfully!`);
    // Có thể reset form hoặc chuyển tab sau này
  }

  return (
    <Box>
      <Typography variant="h6" mb={2}>Thực hiện Nghiệp vụ Kho</Typography>

      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={handleChange as any} // Ép kiểu vì ToggleButtonGroup không hoàn toàn tương thích với TS
        sx={{ mb: 3 }}
      >
        <ToggleButton value="INBOUND">
          Nhập Kho (Nhận hàng)
        </ToggleButton>
        <ToggleButton value="OUTBOUND">
          Xuất Kho (Bán/Hủy)
        </ToggleButton>
        <ToggleButton value="TRANSFER">
          Chuyển Kho Nội bộ
        </ToggleButton>
      </ToggleButtonGroup>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Collapse in={type === 'INBOUND'} unmountOnExit>
          <Box>
            <Typography variant="h5" color="primary" mb={2}>1. Nhập Kho</Typography>
            <InboundForm onSuccess={handleSuccess} />
          </Box>
        </Collapse>

        <Collapse in={type === 'OUTBOUND'} unmountOnExit>
          <Box>
            <Typography variant="h5" color="error" mb={2}>2. Xuất Kho</Typography>
            <OutboundForm onSuccess={handleSuccess} />
          </Box>
        </Collapse>

        <Collapse in={type === 'TRANSFER'} unmountOnExit>
          <Box>
            <Typography variant="h5" color="warning" mb={2}>3. Chuyển Kho</Typography>
            <TransferForm onSuccess={handleSuccess} />
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default InventoryTransaction;