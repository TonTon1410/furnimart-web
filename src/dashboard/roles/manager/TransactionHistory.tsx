/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, CircularProgress, Alert, 
  TablePagination 
} from '@mui/material';
import inventoryService from '@/service/inventoryService'; 

const TransactionHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchHistory = async (currentPage: number, pageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      // Giả định API getTransactionHistory hỗ trợ phân trang
      const response = await inventoryService.getTransactionHistory({
        page: currentPage + 1, // API thường dùng 1-based index
        size: pageSize,
        // Có thể thêm filter, sortBy ở đây
      });
      setHistory(response.data.records || []);
      setTotalRecords(response.data.totalRecords || 0);
    } catch (err) {
      setError("Không thể tải lịch sử giao dịch.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Lịch sử Giao dịch Tồn kho</Typography>
      
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

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={totalRecords}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số dòng/trang:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} trong ${count}`
        }
      />
    </Box>
  );
};

export default TransactionHistory;