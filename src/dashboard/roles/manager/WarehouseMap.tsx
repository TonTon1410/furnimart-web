/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Typography, Card, CardContent, Tooltip, Grid } from "@mui/material";

const statusColors: Record<string, string> = {
  ACTIVE: "#4caf50",
  INACTIVE: "#9e9e9e",
};

const WarehouseMap = ({ warehouses }: { warehouses: any[] }) => {
  return (
    <Grid
      container
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: 2,
      }}
    >
      {warehouses.map((wh) => (
        <Box key={wh.id}>
          <Card variant="outlined" sx={{ borderRadius: 2, borderColor: "#ddd" }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                {wh.warehouseName} ({wh.status})
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 1,
                }}
              >
                {wh.zones.map((zone: any) => (
                  <Box
                    key={zone.id}
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 2,
                      p: 1,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Typography fontWeight="bold" mb={1}>
                      {zone.zoneCode} - {zone.zoneName}
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 0.5,
                      }}
                    >
                      {zone.locations.map((loc: any) => (
                        <Tooltip
                          key={loc.id}
                          title={`Mã: ${loc.code}\nHàng: ${loc.rowLabel}, Cột: ${loc.columnNumber}`}
                        >
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              bgcolor: statusColors[loc.status] || "#eeeeee",
                              color: "#fff",
                              textAlign: "center",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              "&:hover": {
                                opacity: 0.8,
                              },
                            }}
                          >
                            {loc.code}
                          </Box>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Grid>
  );
};

export default WarehouseMap;
