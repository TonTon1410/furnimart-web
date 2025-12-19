"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Eye,
  Shield,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { orderService } from "@/service/orderService";
import type { OrderItem } from "../types/order";
import { OrderProcessTimeline } from "@/components/OrderProcessTimeline";
import warrantyService, {
  type Warranty,
  type WarrantyClaimItem,
  type WarrantyClaim,
} from "@/service/warrantyService";
import { uploadToCloudinary } from "@/service/uploadService";
import { addressService, type Address } from "@/service/addressService";
import { authService } from "@/service/authService";
import { productService, type ProductColor } from "@/service/productService";

// Process status config
const processStatusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PRE_ORDER: {
    label: "Hàng đặt trước",
    color:
      "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800",
    icon: <Package className="h-3 w-3" />,
  },
  PENDING: {
    label: "Đang chờ",
    color:
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:ring-yellow-800",
    icon: <Clock className="h-3 w-3" />,
  },
  PAYMENT: {
    label: "Đã thanh toán",
    color:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ASSIGN_ORDER_STORE: {
    label: "Cửa hàng đã nhận đơn",
    color:
      "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-800",
    icon: <Package className="h-3 w-3" />,
  },
  MANAGER_ACCEPT: {
    label: "Đã xác nhận đơn",
    color:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  MANAGER_REJECT: {
    label: "Đã hủy đơn",
    color:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
  READY_FOR_INVOICE: {
    label: "Xuất hóa đơn",
    color:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800",
    icon: <Package className="h-3 w-3" />,
  },
  MANAGER_EXPORT_ORDER: {
    label: "Quản lý xuất đơn",
    color:
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:ring-teal-800",
    icon: <Package className="h-3 w-3" />,
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    color:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  PACKAGED: {
    label: "Đang đóng gói hàng",
    color:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800",
    icon: <Package className="h-3 w-3" />,
  },
  SHIPPING: {
    label: "Đang vận chuyển",
    color:
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-800",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    label: "Đã vận chuyển",
    color:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  FINISHED: {
    label: "Hoàn thành",
    color:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CANCELLED: {
    label: "Đã hủy",
    color:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

interface OrderDetailProduct {
  id: number;
  productColorId: string;
  quantity: number;
  price: number;
  productColor?: {
    product?: { name: string };
    color?: { colorName: string };
    images?: Array<{ image: string }>;
  };
}

interface OrderAddress {
  addressLine?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  phone?: string;
  userName?: string;
  name?: string;
}

const orderTabs = [
  { key: "all", label: "Tất cả", icon: ShoppingBag },
  { key: "PRE_ORDER", label: "Đặt trước", icon: Clock },
  { key: "PENDING_GROUP", label: "Chờ xử lý", icon: Clock },
  { key: "CONFIRMED_GROUP", label: "Đã xác nhận", icon: CheckCircle },
  { key: "SHIPPING", label: "Đang giao", icon: Truck },
  { key: "DELIVERED", label: "Đã giao", icon: CheckCircle },
  { key: "FINISHED", label: "Hoàn thành", icon: CheckCircle },
  { key: "CANCELLED", label: "Đã hủy", icon: XCircle },
  { key: "WARRANTY_CLAIMS", label: "Bảo hành", icon: Shield },
];

const getStatusColor = (status: string) => {
  const statusColors = {
    PRE_ORDER:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    PAYMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    ASSIGN_ORDER_STORE:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400",
    MANAGER_ACCEPT:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    READY_FOR_INVOICE:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
    MANAGER_REJECT:
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    MANAGER_EXPORT_ORDER:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400",
    CONFIRMED:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    PACKAGED:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
    SHIPPING:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    DELIVERED:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    FINISHED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    statusColors[status as keyof typeof statusColors] || statusColors.PENDING
  );
};

const getStatusLabel = (status: string) => {
  const statusLabels = {
    PRE_ORDER: "Đặt trước",
    PENDING: "Chờ xử lý",
    PAYMENT: "Chờ thanh toán",
    ASSIGN_ORDER_STORE: "Phân phối cho cửa hàng",
    MANAGER_ACCEPT: "Quản lý chấp nhận",
    READY_FOR_INVOICE: "Sẵn sàng xuất hóa đơn",
    MANAGER_REJECT: "Quản lý từ chối",
    MANAGER_EXPORT_ORDER: "Quản lý xuất đơn",
    CONFIRMED: "Đã xác nhận",
    PACKAGED: "Đã đóng gói",
    SHIPPING: "Đang giao hàng",
    DELIVERED: "Đã giao hàng",
    FINISHED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    COD: "Thanh toán khi nhận hàng",
    VNPAY: "VNPay",
    MOMO: "MoMo",
    BANK: "Chuyển khoản ngân hàng",
  };
  return labels[method] || method;
};

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<OrderItem[]>([]); // Cache tất cả orders
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] =
    useState<OrderItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Warranty states
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [selectedOrderForWarranty, setSelectedOrderForWarranty] =
    useState<OrderItem | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loadingWarranties, setLoadingWarranties] = useState(false);
  const [selectedWarranties, setSelectedWarranties] = useState<
    Map<number, WarrantyClaimItem>
  >(new Map());
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<number>>(
    new Set()
  );
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Warranty claims list
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [loadingWarrantyClaims, setLoadingWarrantyClaims] = useState(false);
  const [warrantyProductColors, setWarrantyProductColors] = useState<
    Map<string, ProductColor>
  >(new Map());

  const ordersPerPage = 10;

  // Load tất cả orders một lần khi component mount
  useEffect(() => {
    const loadAllOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Gọi API search/customer - lấy toàn bộ không giới hạn
        const result = await orderService.searchOrdersByCustomer();

        setAllOrders(result.orders || []);
      } catch (error) {
        console.error("Error loading orders:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách đơn hàng"
        );
        setAllOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, []); // Chỉ chạy 1 lần khi mount

  // Load warranty claims when WARRANTY_CLAIMS tab is selected
  useEffect(() => {
    const loadWarrantyClaims = async () => {
      if (activeTab !== "WARRANTY_CLAIMS") return;

      setLoadingWarrantyClaims(true);
      try {
        const profile = await authService.getProfile();
        const customerId = profile?.id || authService.getUserId();

        if (customerId) {
          const claims = await warrantyService.getWarrantyClaimsByCustomer(
            customerId
          );

          // Sắp xếp theo thứ tự mới nhất đến cũ nhất
          const sortedClaims = claims.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.claimDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.claimDate || 0).getTime();
            return dateB - dateA; // Mới nhất lên đầu
          });

          setWarrantyClaims(sortedClaims);

          // Load product color details for all items
          const productColorMap = new Map<string, ProductColor>();
          const uniqueProductColorIds = new Set<string>();

          claims.forEach((claim) => {
            claim.items?.forEach((item) => {
              if (item.productColorId) {
                uniqueProductColorIds.add(item.productColorId);
              }
            });
          });

          // Load all product colors in parallel
          await Promise.all(
            Array.from(uniqueProductColorIds).map(async (productColorId) => {
              try {
                const response = await productService.getProductColorById(
                  productColorId
                );
                if (response.data.data) {
                  productColorMap.set(productColorId, response.data.data);
                }
              } catch (error) {
                console.error(
                  `Error loading product color ${productColorId}:`,
                  error
                );
              }
            })
          );

          setWarrantyProductColors(productColorMap);
        }
      } catch (error) {
        console.error("Error loading warranty claims:", error);
        setError("Không thể tải danh sách yêu cầu bảo hành");
      } finally {
        setLoadingWarrantyClaims(false);
      }
    };

    loadWarrantyClaims();
  }, [activeTab]);

  // Filter và pagination ở frontend
  useEffect(() => {
    let filtered = [...allOrders];

    // Sắp xếp theo thứ tự mới nhất đến cũ nhất (dựa vào createdAt)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.orderDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.orderDate || 0).getTime();
      return dateB - dateA; // Mới nhất lên đầu
    });

    // Filter theo status
    if (activeTab !== "all" && activeTab !== "WARRANTY_CLAIMS") {
      if (activeTab === "PENDING_GROUP") {
        // Chờ xử lý: PENDING, PAYMENT, ASSIGN_ORDER_STORE
        filtered = filtered.filter((order) =>
          ["PENDING", "PAYMENT", "ASSIGN_ORDER_STORE"].includes(
            order.rawStatus || order.status
          )
        );
      } else if (activeTab === "CONFIRMED_GROUP") {
        // Đã xác nhận: MANAGER_ACCEPT, CONFIRMED, PACKAGED
        filtered = filtered.filter((order) =>
          ["MANAGER_ACCEPT", "CONFIRMED", "PACKAGED"].includes(
            order.rawStatus || order.status
          )
        );
      } else {
        filtered = filtered.filter(
          (order) => (order.rawStatus || order.status) === activeTab
        );
      }
    }

    // Filter theo search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.productName?.toLowerCase().includes(query) ||
          order.shopName?.toLowerCase().includes(query)
      );
    }

    // Pagination
    const totalFiltered = filtered.length;
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filtered.slice(startIndex, endIndex);

    setFilteredOrders(paginatedOrders);
    setTotalOrders(totalFiltered);
  }, [allOrders, activeTab, searchQuery, currentPage]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if order can be cancelled (before MANAGER_ACCEPT status)
  const canCancelOrder = (order: OrderItem) => {
    const cancelableStatuses = [
      "PRE_ORDER",
      "PENDING",
      "PAYMENT",
      "ASSIGN_ORDER_STORE",
    ];
    return cancelableStatuses.includes(order.rawStatus || order.status);
  };

  const handleCancelOrder = (order: OrderItem) => {
    setSelectedOrderToCancel(order);
    setShowCancelModal(true);
    setCancelReason("");
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrderToCancel) return;

    if (!cancelReason.trim()) {
      setError("Vui lòng nhập lý do hủy đơn hàng");
      return;
    }

    setCancellingOrderId(selectedOrderToCancel.id);
    setShowCancelModal(false);

    try {
      await orderService.cancelOrder(
        Number(selectedOrderToCancel.id),
        cancelReason
      );

      // Refresh orders - lấy toàn bộ không giới hạn
      const result = await orderService.searchOrdersByCustomer();
      setAllOrders(result.orders || []);

      setError(null);
    } catch (error) {
      console.error("Error cancelling order:", error);
      setError(
        error instanceof Error ? error.message : "Không thể hủy đơn hàng"
      );
    } finally {
      setCancellingOrderId(null);
      setSelectedOrderToCancel(null);
      setCancelReason("");
    }
  };

  const handleViewDetail = async (order: OrderItem) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setSelectedOrderDetail(null);

    try {
      const detail = await orderService.getOrderFullDetail(Number(order.id));
      setSelectedOrderDetail(detail);
    } catch (error) {
      console.error("Error loading order detail:", error);
      setError("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle warranty claim
  const handleWarrantyClaim = async (order: OrderItem) => {
    setSelectedOrderForWarranty(order);
    setShowWarrantyModal(true);
    setLoadingWarranties(true);
    setLoadingAddresses(true);
    setWarranties([]);
    setSelectedWarranties(new Map());
    setUserAddresses([]);
    const orderAddressId =
      typeof order.address === "object" && order.address?.id
        ? order.address.id
        : null;
    setSelectedAddressId(orderAddressId);

    try {
      // Get user addresses
      const profile = await authService.getProfile();
      const userId = profile?.id || authService.getUserId();
      if (userId) {
        const addressResponse = await addressService.getAddressesByUserId(
          userId
        );
        const addresses = addressResponse?.data || [];
        setUserAddresses(addresses);

        // Set default address or order address
        const defaultAddress = addresses.find((addr) => addr.isDefault);
        const orderAddress = orderAddressId
          ? addresses.find((addr) => addr.id === orderAddressId)
          : null;
        setSelectedAddressId(
          orderAddress?.id || defaultAddress?.id || addresses[0]?.id || null
        );
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }

    try {
      // Get full order details first
      const orderDetail = await orderService.getOrderFullDetail(
        Number(order.id)
      );

      // Get warranties list
      const warrantyList = await warrantyService.getWarrantiesByOrder(
        Number(order.id)
      );

      // Map warranties with product info from order details
      const warrantiesWithProductInfo = warrantyList
        .filter((w) => w.status === "ACTIVE")
        .map((warranty) => {
          // Find matching product from order details
          const matchedDetail = orderDetail.orderDetails?.find(
            (detail: OrderDetailProduct) =>
              detail.productColorId === warranty.productColorId
          );

          return {
            ...warranty,
            productColor: matchedDetail?.productColor,
          };
        });

      setWarranties(warrantiesWithProductInfo);
    } catch (error) {
      console.error("Error loading warranties:", error);
      setError("Không thể tải danh sách bảo hành");
    } finally {
      setLoadingWarranties(false);
    }
  };

  const handleWarrantySelect = (
    warranty: Warranty,
    checked: boolean,
    description: string
  ) => {
    const newSelected = new Map(selectedWarranties);
    if (checked) {
      newSelected.set(warranty.id, {
        warrantyId: warranty.id,
        quantity: 1,
        issueDescription: description,
        customerPhotos: [],
      });
    } else {
      newSelected.delete(warranty.id);
    }
    setSelectedWarranties(newSelected);
  };

  const handleWarrantyDescriptionChange = (
    warrantyId: number,
    description: string
  ) => {
    const newSelected = new Map(selectedWarranties);
    const item = newSelected.get(warrantyId);
    if (item) {
      item.issueDescription = description;
      newSelected.set(warrantyId, item);
      setSelectedWarranties(newSelected);
    }
  };

  const handlePhotoUpload = async (
    warrantyId: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    setUploadingPhotos((prev) => new Set(prev).add(warrantyId));

    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadToCloudinary(file, "image")
      );
      const uploadedUrls = await Promise.all(uploadPromises);

      const newSelected = new Map(selectedWarranties);
      const item = newSelected.get(warrantyId);
      if (item) {
        item.customerPhotos = [...(item.customerPhotos || []), ...uploadedUrls];
        newSelected.set(warrantyId, item);
        setSelectedWarranties(newSelected);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      setError("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(warrantyId);
        return newSet;
      });
    }
  };

  const handleRemovePhoto = (warrantyId: number, photoUrl: string) => {
    const newSelected = new Map(selectedWarranties);
    const item = newSelected.get(warrantyId);
    if (item && item.customerPhotos) {
      item.customerPhotos = item.customerPhotos.filter(
        (url) => url !== photoUrl
      );
      newSelected.set(warrantyId, item);
      setSelectedWarranties(newSelected);
    }
  };

  const handleSubmitWarrantyClaim = async () => {
    if (!selectedOrderForWarranty || selectedWarranties.size === 0) return;

    // Validate address selection
    if (!selectedAddressId) {
      setError("Vui lòng chọn địa chỉ nhận bảo hành");
      return;
    }

    // Validate descriptions
    for (const item of selectedWarranties.values()) {
      if (!item.issueDescription.trim()) {
        setError("Vui lòng mô tả vấn đề cho tất cả sản phẩm được chọn");
        return;
      }
    }

    setSubmittingClaim(true);
    try {
      await warrantyService.createWarrantyClaim({
        orderId: Number(selectedOrderForWarranty.id),
        addressId: selectedAddressId,
        items: Array.from(selectedWarranties.values()),
      });

      setShowWarrantyModal(false);
      setSelectedOrderForWarranty(null);
      setSelectedWarranties(new Map());
      setSelectedAddressId(null);
      setError(null);

      // Show success message
      alert("Yêu cầu bảo hành đã được gửi thành công!");
    } catch (error: unknown) {
      console.error("Error submitting warranty claim:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(
        errorMessage || "Không thể gửi yêu cầu bảo hành. Vui lòng thử lại."
      );
    } finally {
      setSubmittingClaim(false);
    }
  };

  const formatAddress = (address: OrderAddress) => {
    if (!address) return "N/A";
    const parts = [
      address.addressLine,
      address.street,
      address.ward,
      address.district,
      address.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className="bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            Đơn hàng nội thất
          </h3>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 sm:py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {orderTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1); // Reset về trang 1 khi đổi tab
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {error && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                aria-label="Đóng thông báo"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">
              Đang tải đơn hàng...
            </p>
          </div>
        ) : activeTab === "WARRANTY_CLAIMS" ? (
          loadingWarrantyClaims ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách bảo hành...
              </p>
            </div>
          ) : warrantyClaims.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                Chưa có yêu cầu bảo hành nào
              </h3>
              <p className="text-sm text-muted-foreground">
                Các yêu cầu bảo hành của bạn sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {warrantyClaims.map((claim) => (
                <motion.div
                  key={claim.id}
                  variants={fadeUp}
                  className="bg-muted/30 rounded-lg border border-border/50 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
                >
                  {/* Warranty Claim Header */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-foreground">
                          Yêu cầu bảo hành #{claim.id}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Đơn hàng: #{claim.orderId}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        claim.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : claim.status === "UNDER_REVIEW"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          : claim.status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : claim.status === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : claim.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : claim.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      }`}
                    >
                      {claim.status === "PENDING"
                        ? "Chờ xử lý"
                        : claim.status === "UNDER_REVIEW"
                        ? "Đang xem xét"
                        : claim.status === "APPROVED"
                        ? "Đã duyệt"
                        : claim.status === "REJECTED"
                        ? "Từ chối"
                        : claim.status === "RESOLVED"
                        ? "Đã xử lý"
                        : claim.status === "CANCELLED"
                        ? "Đã hủy"
                        : claim.status}
                    </span>
                  </div>

                  {/* Warranty Items */}
                  <div className="mb-3 space-y-2">
                    <h5 className="text-xs sm:text-sm font-semibold text-foreground">
                      Sản phẩm yêu cầu bảo hành:
                    </h5>
                    {claim.items?.map((item, idx) => {
                      const productColor = warrantyProductColors.get(
                        item.productColorId
                      );

                      return (
                        <div
                          key={idx}
                          className="p-2 bg-background/30 rounded-lg"
                        >
                          <div className="flex gap-3 items-start">
                            {/* Product Image */}
                            {productColor?.images?.[0]?.image && (
                              <img
                                src={productColor.images[0].image}
                                alt={productColor.product?.name || "Product"}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border shrink-0"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              {/* Product Name */}
                              {productColor?.product?.name && (
                                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                                  {productColor.product.name}
                                </p>
                              )}

                              {/* Color */}
                              {productColor?.color?.colorName && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  Màu: {productColor.color.colorName}
                                </p>
                              )}

                              {/* Quantity */}
                              <p className="text-xs text-muted-foreground mb-1">
                                Số lượng: {item.quantity}
                              </p>

                              {/* Issue Description */}
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Vấn đề:</span>{" "}
                                {item.issueDescription}
                              </p>

                              {/* Customer Photos */}
                              {item.customerPhotos &&
                                item.customerPhotos.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {item.customerPhotos.map(
                                      (photo, photoIdx) => (
                                        <img
                                          key={photoIdx}
                                          src={photo}
                                          alt={`Photo ${photoIdx + 1}`}
                                          className="w-12 h-12 object-cover rounded border border-border"
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Type and Resolution Info */}
                  {claim.actionType && (
                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                        Phương thức xử lý:
                      </p>
                      <div className="flex items-center gap-2">
                        {claim.actionType === "REPAIR" && (
                          <>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs dark:bg-orange-900/30 dark:text-orange-400">
                              Sửa chữa
                            </span>
                            {claim.repairCost !== null && (
                              <span className="text-xs text-muted-foreground">
                                Chi phí: {formatPrice(claim.repairCost)}
                              </span>
                            )}
                          </>
                        )}
                        {claim.actionType === "RETURN" && (
                          <>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs dark:bg-green-900/30 dark:text-green-400">
                              Hoàn trả
                            </span>
                            {claim.refundAmount !== null && (
                              <span className="text-xs text-muted-foreground">
                                Số tiền: {formatPrice(claim.refundAmount)}
                              </span>
                            )}
                          </>
                        )}
                        {claim.actionType === "DO_NOTHING" && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs dark:bg-red-900/30 dark:text-red-400">
                            Từ chối
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Response */}
                  {claim.adminResponse && (
                    <div className="mb-3 p-2 bg-background/50 rounded-lg">
                      <p className="text-xs font-medium text-foreground mb-1">
                        Phản hồi từ quản trị viên:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {claim.adminResponse}
                      </p>
                    </div>
                  )}

                  {/* Resolution Notes */}
                  {claim.resolutionNotes && (
                    <div className="mb-3 p-2 bg-background/50 rounded-lg">
                      <p className="text-xs font-medium text-foreground mb-1">
                        Ghi chú xử lý:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {claim.resolutionNotes}
                      </p>
                    </div>
                  )}

                  {/* Resolution Photos */}
                  {claim.resolutionPhotos &&
                    claim.resolutionPhotos.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-foreground mb-2">
                          Hình ảnh sau xử lý:
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {claim.resolutionPhotos.map((photo, photoIdx) => (
                            <img
                              key={photoIdx}
                              src={photo}
                              alt={`Resolution ${photoIdx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Timestamps */}
                  <div className="flex flex-col gap-1 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Tạo lúc: {formatDate(claim.createdAt)}</span>
                    </div>
                    {claim.resolvedDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Xử lý lúc: {formatDate(claim.resolvedDate)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Không có đơn hàng nào
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Bạn chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={fadeUp}
                className="bg-muted/30 rounded-lg border border-border/50 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-foreground">
                        {order.shopName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Mã đơn: #{order.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                      order.rawStatus || order.status
                    )}`}
                  >
                    {getStatusLabel(order.rawStatus || order.status)}
                  </span>
                </div>

                {/* Summary Info */}
                <div className="mb-3 p-2 sm:p-3 bg-background/50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {/* Số điện thoại khách hàng */}
                    {(order.user?.phone || order.phone) && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          SĐT khách hàng:
                        </span>
                        <span className="font-medium text-foreground">
                          {order.user?.phone || order.phone}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Số lượng:</span>
                      <span className="font-medium text-foreground">
                        {order.quantity} sản phẩm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Đặt hàng:</span>
                      <span className="font-medium text-foreground">
                        {formatDate(order.orderDate)}
                      </span>
                    </div>
                    {order.address && (
                      <div className="flex items-start gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">
                            Địa chỉ:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {typeof order.address === "string"
                              ? order.address
                              : order.address.fullAddress}
                          </span>
                        </div>
                      </div>
                    )}
                    {order.paymentMethod && (
                      <div className="flex items-center gap-2 col-span-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Thanh toán:
                        </span>
                        <span className="font-medium text-foreground">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                        {order.transactionCode && (
                          <span className="text-xs text-muted-foreground">
                            ({order.transactionCode})
                          </span>
                        )}
                      </div>
                    )}
                    {order.note && (
                      <div className="flex items-start gap-2 col-span-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">
                            Ghi chú:{" "}
                          </span>
                          <span className="text-foreground">{order.note}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                {order.orderDetails && order.orderDetails.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <h5 className="text-xs sm:text-sm font-semibold text-foreground mb-1.5">
                      Chi tiết sản phẩm:
                    </h5>
                    {order.orderDetails.map((detail, idx) => (
                      <div
                        key={detail.id}
                        className="flex gap-2 items-center p-2 bg-background/30 rounded-lg text-xs sm:text-sm"
                      >
                        {detail.productColor?.images?.[0]?.image && (
                          <img
                            src={detail.productColor.images[0].image}
                            alt={
                              detail.productColor?.product?.name ||
                              `Sản phẩm ${idx + 1}`
                            }
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-xs sm:text-sm">
                            {detail.productColor?.product?.name ||
                              `Sản phẩm ${idx + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Màu:{" "}
                            {detail.productColor?.color?.colorName || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-foreground text-xs">
                            x{detail.quantity}
                          </span>
                          <span className="font-medium text-foreground min-w-16 sm:min-w-20 text-right text-xs sm:text-sm">
                            {formatPrice(detail.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      {formatPrice(order.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Detail Button */}
                    <button
                      onClick={() => handleViewDetail(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Xem chi tiết
                      </span>
                    </button>

                    {/* Warranty Claim Button - Only show for FINISHED orders */}
                    {(order.rawStatus || order.status) === "FINISHED" && (
                      <button
                        onClick={() => handleWarrantyClaim(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-xs sm:text-sm font-medium">
                          Yêu cầu bảo hành
                        </span>
                      </button>
                    )}

                    {/* Cancel Button - Only show for cancelable orders */}
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                      >
                        {cancellingOrderId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                            <span className="text-xs sm:text-sm font-medium">
                              Đang hủy...
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-xs sm:text-sm font-medium">
                              Hủy đơn hàng
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalOrders > ordersPerPage && activeTab !== "WARRANTY_CLAIMS" && (
          <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t border-border/30">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Trang {currentPage} / {Math.ceil(totalOrders / ordersPerPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(Math.ceil(totalOrders / ordersPerPage), prev + 1)
                )
              }
              disabled={
                currentPage >= Math.ceil(totalOrders / ordersPerPage) || loading
              }
              className="px-3 py-2 text-sm border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-card rounded-xl max-w-4xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">
                  Đang tải chi tiết...
                </p>
              </div>
            ) : selectedOrderDetail ? (
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        Chi tiết đơn hàng #{selectedOrderDetail.id}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedOrderDetail.orderDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    aria-label="Đóng"
                  >
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Trạng thái đơn hàng
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                        selectedOrderDetail.status
                      )}`}
                    >
                      {getStatusLabel(selectedOrderDetail.status)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedOrderDetail.user && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Thông tin khách hàng
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Họ tên: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.fullName || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.email || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SĐT: </span>
                        <span className="font-medium text-foreground">
                          {selectedOrderDetail.user.phone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                {selectedOrderDetail.address && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Địa chỉ giao hàng
                    </h4>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-foreground">
                        {selectedOrderDetail.address.userName ||
                          selectedOrderDetail.address.name}
                      </p>
                      <p className="text-muted-foreground">
                        SĐT: {selectedOrderDetail.address.phone}
                      </p>
                      <p className="text-foreground">
                        {formatAddress(selectedOrderDetail.address)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                {selectedOrderDetail.payment && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Thông tin thanh toán
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Phương thức:{" "}
                        </span>
                        <span className="font-medium text-foreground">
                          {getPaymentMethodLabel(
                            selectedOrderDetail.payment.paymentMethod
                          )}
                        </span>
                      </div>
                      {selectedOrderDetail.payment.transactionCode && (
                        <div>
                          <span className="text-muted-foreground">
                            Mã giao dịch:{" "}
                          </span>
                          <span className="font-medium text-foreground">
                            {selectedOrderDetail.payment.transactionCode}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Trạng thái TT:{" "}
                        </span>
                        <span
                          className={`font-medium ${
                            selectedOrderDetail.payment.paymentStatus === "PAID"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {selectedOrderDetail.payment.paymentStatus === "PAID"
                            ? "Đã thanh toán"
                            : selectedOrderDetail.payment.paymentStatus ===
                                "PENDING" ||
                              selectedOrderDetail.payment.paymentStatus ===
                                "NOT_PAID"
                            ? "Chưa thanh toán"
                            : selectedOrderDetail.payment.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Details / Products */}
                {selectedOrderDetail.orderDetails &&
                  selectedOrderDetail.orderDetails.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">
                        Sản phẩm ({selectedOrderDetail.orderDetails.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedOrderDetail.orderDetails.map(
                          (detail: OrderDetailProduct, idx: number) => (
                            <div
                              key={detail.id || idx}
                              className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                              {detail.productColor?.images?.[0]?.image && (
                                <img
                                  src={detail.productColor.images[0].image}
                                  alt={
                                    detail.productColor?.product?.name ||
                                    "Product"
                                  }
                                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm mb-1">
                                  {detail.productColor?.product?.name ||
                                    `Sản phẩm ${idx + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Màu:{" "}
                                  {detail.productColor?.color?.colorName ||
                                    "N/A"}
                                </p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    x{detail.quantity}
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {formatPrice(detail.price)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Order Note */}
                {selectedOrderDetail.note && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Ghi chú đơn hàng
                    </h4>
                    <p className="text-sm text-foreground">
                      {selectedOrderDetail.note}
                    </p>
                  </div>
                )}

                {/* Process History Timeline */}
                <OrderProcessTimeline
                  processOrders={selectedOrderDetail.processOrders || []}
                  processStatusConfig={processStatusConfig}
                  formatDate={formatDate}
                />

                {/* Delivery Confirmation Photos */}
                {(selectedOrderDetail.deliveryConfirmationResponse
                  ?.deliveryPhotos ||
                  selectedOrderDetail.deliveryConfirmationResponse
                    ?.customerSignature) && (
                  <div className="mb-4 rounded-lg bg-muted/30 p-3">
                    <div className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Xác nhận giao hàng thành công
                    </div>

                    {selectedOrderDetail.deliveryConfirmationResponse
                      ?.deliveryPhotos &&
                      selectedOrderDetail.deliveryConfirmationResponse
                        .deliveryPhotos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            Hình ảnh giao hàng:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedOrderDetail.deliveryConfirmationResponse.deliveryPhotos.map(
                              (photo: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`Delivery photo ${idx + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-border"
                                />
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {selectedOrderDetail.deliveryConfirmationResponse
                      ?.customerSignature && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Chữ ký khách hàng:
                        </p>
                        <img
                          src={
                            selectedOrderDetail.deliveryConfirmationResponse
                              .customerSignature
                          }
                          alt="Customer signature"
                          className="w-full max-w-sm h-32 object-contain rounded-lg border border-border bg-white dark:bg-gray-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      Tổng cộng:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedOrderDetail.total)}
                    </span>
                  </div>
                  {selectedOrderDetail.depositPrice &&
                    selectedOrderDetail.depositPrice > 0 && (
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">Đã cọc:</span>
                        <span className="font-medium text-foreground">
                          {formatPrice(selectedOrderDetail.depositPrice)}
                        </span>
                      </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Không thể tải chi tiết đơn hàng
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrderToCancel && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-card rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Xác nhận hủy đơn hàng
              </h3>
            </div>

            <div className="mb-3">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5">
                Bạn có chắc chắn muốn hủy đơn hàng #{selectedOrderToCancel.id}?
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng tiền:{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(selectedOrderToCancel.price)}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="cancelReason"
                className="block text-xs sm:text-sm font-medium text-foreground mb-1.5"
              >
                Lý do hủy đơn <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground resize-none text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors text-xs sm:text-sm"
              >
                Đóng
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={!cancelReason.trim()}
                className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warranty Claim Modal */}
      {showWarrantyModal && selectedOrderForWarranty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Yêu cầu bảo hành
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Đơn hàng #{selectedOrderForWarranty.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWarrantyModal(false);
                  setSelectedOrderForWarranty(null);
                  setSelectedWarranties(new Map());
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Đóng modal bảo hành"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingWarranties ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-sm text-muted-foreground">
                    Đang tải danh sách bảo hành...
                  </p>
                </div>
              ) : warranties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Không có sản phẩm nào trong đơn hàng này có bảo hành khả
                    dụng
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Address Selection */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-border">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Địa chỉ nhận bảo hành{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {loadingAddresses ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span>Đang tải địa chỉ...</span>
                      </div>
                    ) : userAddresses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Không tìm thấy địa chỉ. Vui lòng thêm địa chỉ trong{" "}
                        <a
                          href="/address"
                          className="text-green-600 hover:underline"
                        >
                          trang quản lý địa chỉ
                        </a>
                        .
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {userAddresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                                : "border-border hover:border-green-300 hover:bg-muted"
                            }`}
                          >
                            <input
                              type="radio"
                              name="warranty-address"
                              value={address.id}
                              checked={selectedAddressId === address.id}
                              onChange={() => setSelectedAddressId(address.id)}
                              className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">
                                  {address.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {address.phone}
                                </span>
                                {address.isDefault && (
                                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded dark:bg-green-900/30 dark:text-green-400">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {[
                                  address.addressLine,
                                  address.street,
                                  address.ward,
                                  address.district,
                                  address.city,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-900 dark:text-blue-300">
                        <p className="font-medium mb-1">Lưu ý:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Chọn sản phẩm cần bảo hành và mô tả vấn đề</li>
                          <li>
                            Mỗi sản phẩm chỉ được yêu cầu bảo hành tối đa 3 lần
                          </li>
                          <li>Yêu cầu sẽ được xử lý trong 1-3 ngày làm việc</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {warranties.map((warranty) => {
                    const isSelected = selectedWarranties.has(warranty.id);
                    const selectedItem = selectedWarranties.get(warranty.id);

                    return (
                      <div
                        key={warranty.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected
                            ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                            : "border-border bg-background"
                        }`}
                      >
                        <div className="flex gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleWarrantySelect(
                                warranty,
                                e.target.checked,
                                selectedItem?.issueDescription || ""
                              )
                            }
                            className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            aria-label={`Chọn sản phẩm ${
                              warranty.productColor?.product?.name || "này"
                            } để yêu cầu bảo hành`}
                          />

                          <div className="flex-1">
                            <div className="flex gap-3 mb-3">
                              {warranty.productColor?.images?.[0]?.image && (
                                <img
                                  src={warranty.productColor.images[0].image}
                                  alt={
                                    warranty.productColor.product?.name ||
                                    "Product"
                                  }
                                  className="w-20 h-20 object-cover rounded-lg border border-border"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-1">
                                  {warranty.productColor?.product?.name ||
                                    "Sản phẩm"}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Màu:{" "}
                                  {warranty.productColor?.color?.colorName ||
                                    "N/A"}
                                </p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                    Bảo hành {warranty.warrantyDurationMonths}{" "}
                                    tháng
                                  </span>
                                  <span className="text-muted-foreground">
                                    Còn{" "}
                                    {warranty.maxClaims - warranty.claimCount}{" "}
                                    lần
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  HSD:{" "}
                                  {new Date(
                                    warranty.warrantyEndDate
                                  ).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">
                                    Mô tả vấn đề{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    value={selectedItem?.issueDescription || ""}
                                    onChange={(e) =>
                                      handleWarrantyDescriptionChange(
                                        warranty.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Mô tả chi tiết vấn đề của sản phẩm..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground resize-none text-sm"
                                  />
                                </div>

                                {/* Photo Upload Section */}
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">
                                    Hình ảnh minh chứng (Tùy chọn)
                                  </label>

                                  {/* Upload Button */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <label
                                      htmlFor={`photo-upload-${warranty.id}`}
                                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border bg-background hover:bg-muted transition-colors cursor-pointer ${
                                        uploadingPhotos.has(warranty.id)
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                    >
                                      {uploadingPhotos.has(warranty.id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                          <span className="text-sm text-muted-foreground">
                                            Đang tải...
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">
                                            Chọn ảnh
                                          </span>
                                        </>
                                      )}
                                    </label>
                                    <input
                                      id={`photo-upload-${warranty.id}`}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) =>
                                        handlePhotoUpload(
                                          warranty.id,
                                          e.target.files
                                        )
                                      }
                                      disabled={uploadingPhotos.has(
                                        warranty.id
                                      )}
                                      className="hidden"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      Tối đa 5 ảnh, mỗi ảnh dưới 5MB
                                    </span>
                                  </div>

                                  {/* Photo Preview Grid */}
                                  {selectedItem?.customerPhotos &&
                                    selectedItem.customerPhotos.length > 0 && (
                                      <div className="grid grid-cols-3 gap-2">
                                        {selectedItem.customerPhotos.map(
                                          (photoUrl, idx) => (
                                            <div
                                              key={idx}
                                              className="relative group aspect-square"
                                            >
                                              <img
                                                src={photoUrl}
                                                alt={`Photo ${idx + 1}`}
                                                className="w-full h-full object-cover rounded-lg border border-border"
                                              />
                                              <button
                                                onClick={() =>
                                                  handleRemovePhoto(
                                                    warranty.id,
                                                    photoUrl
                                                  )
                                                }
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Xóa ảnh"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {warranties.length > 0 && (
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowWarrantyModal(false);
                      setSelectedOrderForWarranty(null);
                      setSelectedWarranties(new Map());
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmitWarrantyClaim}
                    disabled={selectedWarranties.size === 0 || submittingClaim}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {submittingClaim ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>
                          Gửi yêu cầu ({selectedWarranties.size} sản phẩm)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
