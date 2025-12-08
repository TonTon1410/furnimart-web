import { Clock } from "lucide-react";

interface ProcessOrder {
  id: number;
  status: string;
  createdAt: string;
}

interface ProcessStatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

interface OrderProcessTimelineProps {
  processOrders: ProcessOrder[];
  processStatusConfig: Record<string, ProcessStatusConfig>;
  formatDate: (dateString: string) => string;
  loading?: boolean;
  loadingMessage?: string;
}

export function OrderProcessTimeline({
  processOrders,
  processStatusConfig,
  formatDate,
  loading = false,
  loadingMessage = "Đang tải lịch sử đơn hàng...",
}: OrderProcessTimelineProps) {
  if (loading) {
    return (
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <div className="flex items-center justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {loadingMessage}
          </span>
        </div>
      </div>
    );
  }

  if (!processOrders || processOrders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Lịch sử xử lý đơn hàng
      </div>
      <div className="relative space-y-4">
        {processOrders.map((process, index) => {
          const isLast = index === processOrders.length - 1;
          const statusInfo = processStatusConfig[process.status] || {
            label: process.status,
            color:
              "bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
            icon: <Clock className="h-3 w-3" />,
          };

          return (
            <div key={process.id} className="flex gap-3">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isLast
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30"
                      : "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {statusInfo.icon || (
                    <div className="h-2 w-2 rounded-full bg-current" />
                  )}
                </div>
                {index < processOrders.length - 1 && (
                  <div className="h-full w-0.5 flex-1 bg-gray-300 dark:bg-gray-700 my-1 min-h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {formatDate(process.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
