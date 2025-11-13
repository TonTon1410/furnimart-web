/* eslint-disable @typescript-eslint/prefer-as-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Stack,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query"; 
import inventoryService from "@/service/inventoryService";

// Khai báo kiểu dữ liệu cho Entity Type (Đã có trong file gốc)
type EntityType = "WAREHOUSE" | "ZONE" | "LOCATION";

// Kiểu dữ liệu cho một Phiếu Kho (Inventory Document)
interface InventoryDocument {
  id: number;
  employeeId: string;
  type: "IMPORT" | "EXPORT" | "TRANSFER" | "ADJUSTMENT" | "RESERVE" | "RELEASE";
  purpose: string;
  date: string;
  note: string;
  warehouseName: string;
  warehouseId: string;
}

interface InventoryTableListModalProps {
  open: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  entityType: EntityType;
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", md: 800 },
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
};

const InventoryTableListModal: React.FC<InventoryTableListModalProps> = ({
  open,
  onClose,
  entityId,
  entityName,
  entityType,
}) => {
  // Hàm gọi API dựa trên entityType
  const fetchInventory = async () => {
    switch (entityType) {
      case "WAREHOUSE":
        return inventoryService.getInventoryByWarehouse(entityId);
      case "ZONE":
        return inventoryService.getInventoryByZone(entityId);
      case "LOCATION":
        // API inventoryService.getInventoryByLocationItem đã bị loại bỏ theo inventoryService.ts
        // Giả lập trả về mảng rỗng hoặc xử lý lỗi đặc biệt.
        console.warn("API for LOCATION inventory is not available.");
        return { data: [] }; // Trả về cấu trúc giả định rỗng
      default:
        return { data: [] };
    }
  };

  // Sử dụng react-query để fetch data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventoryDocuments", entityType, entityId],
    queryFn: fetchInventory,
    enabled: open,
    // 💡 ĐÃ SỬA LỖI: Thêm .data để truy cập vào mảng phiếu kho
    select: (res: any) => res.data.data as InventoryDocument[], 
});

  const inventoryDocuments = data || [];

  const getTitle = () => {
    switch (entityType) {
      case "WAREHOUSE":
        return `Danh sách Phiếu Kho tại Kho: ${entityName}`;
      case "ZONE":
        return `Danh sách Phiếu Kho tại Khu vực: ${entityName}`;
      case "LOCATION":
        return `Danh sách Phiếu Kho tại Vị trí: ${entityName} (API đã bị loại bỏ)`;
      default:
        return "Danh sách Phiếu Kho";
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="inventory-modal-title">
      <Box sx={modalStyle}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography id="inventory-modal-title" variant="h6" component="h2">
            {getTitle()}
          </Typography>
          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        </Stack>
        
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Typography color="error" textAlign="center" py={4}>
            Đã xảy ra lỗi khi tải dữ liệu phiếu kho.
          </Typography>
        )}

        {!isLoading && !isError && (
          <>
            {inventoryDocuments.length === 0 ? (
              <Typography textAlign="center" py={4} color="text.secondary">
                Không tìm thấy phiếu kho nào.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={1}>
                <Table size="small" aria-label="inventory documents table">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell>Mục đích</TableCell>
                      <TableCell>Ngày</TableCell>
                      <TableCell>Ghi chú</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {doc.id}
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.purpose}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>{doc.note || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Modal>
  );
};

export default InventoryTableListModal;