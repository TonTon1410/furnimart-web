/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress, Alert, 
} from '@mui/material';
import inventoryService from '@/service/inventoryService'; 

const TransactionHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cập nhật: Hàm fetchHistory không còn tham số phân trang
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ THAY ĐỔI: Gọi API getTransactionHistory() không cần tham số phân trang
      // Giả sử ta muốn xem lịch sử cho tất cả sản phẩm và khu vực
      const response = await inventoryService.getTransactionHistory({
          productColorId: '', // Cần thêm bộ lọc Product/Zone nếu muốn lọc dữ liệu
          zoneId: '',
      });
      // ✅ CẬP NHẬT: API mới không rõ cấu trúc trả về, giả định data là mảng records
      setHistory(response.data || []); 
      // setTotalRecords(response.data.totalRecords || 0); // Loại bỏ totalRecords

    } catch (err) {
      setError("Không thể tải lịch sử giao dịch.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(); 
  }, []);

  return (
    <Box>
      <Typography variant="h6" mb={2}>Lịch sử Tồn kho</Typography>
      
      {error && <Alert severity="error">{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f4f4f4' }}>
              <TableCell>Mã GD</TableCell>
              <TableCell>Thời gian</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell align="right">Số lượng</TableCell>
              <TableCell>Từ/Đến Vị trí</TableCell>
              <TableCell>Người thực hiện</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={20} /></TableCell></TableRow>
            ) : history.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">Không có giao dịch nào được ghi nhận.</TableCell></TableRow>
            ) : (
              history.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.transactionCode}</TableCell>
                  <TableCell>{new Date(tx.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{tx.type}</TableCell> {/* INBOUND, OUTBOUND, TRANSFER, ADJUSTMENT */}
                  <TableCell>{tx.productName} ({tx.sku})</TableCell>
                  <TableCell align="right">{tx.quantity}</TableCell>
                  <TableCell>{tx.fromLocationName} &rarr; {tx.toLocationName}</TableCell>
                  <TableCell>{tx.userName}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransactionHistory;