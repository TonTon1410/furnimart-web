import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra sự cố</h2>
                        <p className="text-gray-600 mb-8">
                            Ứng dụng gặp một lỗi không mong muốn. Đừng lo lắng, dữ liệu của bạn vẫn an toàn.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={() => window.location.href = "/"}
                                className="w-full py-3 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-semibold hover:bg-emerald-50 transition-all active:scale-95"
                            >
                                Về trang chủ
                            </button>
                        </div>
                        {process.env.NODE_ENV === "development" && (
                            <details className="mt-6 text-left p-4 bg-gray-50 rounded-lg overflow-auto max-h-40">
                                <summary className="text-xs text-gray-500 cursor-pointer mb-2">Chi tiết lỗi (Chế độ DEV)</summary>
                                <pre className="text-[10px] text-red-500 whitespace-pre-wrap">
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
