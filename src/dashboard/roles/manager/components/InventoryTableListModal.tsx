/* eslint-disable @typescript-eslint/prefer-as-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { 
  Modal, Box, Typography, IconButton, Paper, Table, 
  TableContainer, TableHead, TableRow, TableCell, TableBody, 
  CircularProgress, Alert, Button, Tooltip, Stack 
} from '@mui/material';
import { X, Box as BoxIcon, Settings } from 'lucide-react';
import inventoryService from '@/service/inventoryService'; 
import InventoryAdjustmentModal from './InventoryAdjustmentModal'; 

type EntityType = 'WAREHOUSE' | 'ZONE' | 'LOCATION';

interface InventoryTableListModalProps {
  open: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  entityType: EntityType;
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: 800 },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  overflowY: 'auto',
};

const InventoryTableListModal: React.FC<InventoryTableListModalProps> = ({ 
  open, 
  onClose, 
  entityId, 
  entityName, 
  entityType 
}) => {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho Modal Điều chỉnh tồn kho
  const [openAdjustmentModal, setOpenAdjustmentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (entityType) {
        case 'LOCATION':
          // ✅ API mới theo đề xuất: Lấy tồn kho theo Location Item ID
          response = await inventoryService.getInventoryByLocationItem(entityId); 
          break;
        case 'ZONE':
          response = await inventoryService.getInventoryByZone(entityId);
          break;
        case 'WAREHOUSE':
          // Giả định có API: Lấy tồn kho theo Warehouse ID
          response = await inventoryService.getInventoryByWarehouse(entityId); 
          break;
        default:
          throw new Error("Invalid entity type");
      }
      setInventoryList(response.data || []);
    } catch (err) {
      setError("Không thể tải dữ liệu tồn kho. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && entityId) {
      fetchInventory();
    }
  }, [open, entityId, entityType]);

  const handleOpenAdjustment = (inventoryItem: any) => {
    setSelectedProduct(inventoryItem);
    setOpenAdjustmentModal(true);
  };

  const entityTypeLabel = 
    entityType === 'WAREHOUSE' ? 'Kho hàng' : 
    entityType === 'ZONE' ? 'Khu vực' : 'Vị trí';

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box sx={style}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              <BoxIcon size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Tồn kho của {entityTypeLabel}: **{entityName}**
            </Typography>
            <IconButton onClick={onClose}>
              <X />
            </IconButton>
          </Stack>

          {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}
          {error && <Alert severity="error">{error}</Alert>}
          
          {!loading && !error && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f4f4f4' }}>
                    <TableCell>Sản phẩm (Mã/Tên)</TableCell>
                    <TableCell align="right">Tồn Vật lý</TableCell>
                    <TableCell align="right">Dự trữ</TableCell>
                    <TableCell align="right">Khả dụng</TableCell>
                    {entityType === 'LOCATION' && <TableCell align="center">Thao tác</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryList.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">Không có tồn kho tại {entityTypeLabel} này.</TableCell></TableRow>
                  ) : (
                    inventoryList.map((item) => (
                      <TableRow key={item.productColorId}>
                        <TableCell>{item.productName || 'N/A'} ({item.productSku || item.productColorId})</TableCell>
                        <TableCell align="right">{item.physicalQty}</TableCell>
                        <TableCell align="right">{item.reservedQty}</TableCell>
                        <TableCell align="right">{item.availableQty}</TableCell>
                        {entityType === 'LOCATION' && (
                          <TableCell align="center">
                            <Tooltip title="Điều chỉnh tồn kho">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<Settings size={16} />}
                                onClick={() => handleOpenAdjustment(item)}
                              >
                                Điều chỉnh
                              </Button>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Modal>

      {/* Modal Điều chỉnh tồn kho */}
      {selectedProduct && (
        <InventoryAdjustmentModal
          open={openAdjustmentModal}
          onClose={() => setOpenAdjustmentModal(false)}
          inventoryItem={selectedProduct}
          locationName={entityName} // Truyền tên vị trí
          onSuccess={fetchInventory} // Refresh list sau khi điều chỉnh
        />
      )}
    </>
  );
};

export default InventoryTableListModal;