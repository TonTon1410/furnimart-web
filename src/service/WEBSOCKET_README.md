# WebSocket Service - Rate Limiting & Retry Mechanism

## Tổng quan

WebSocket service đã được cải tiến với cơ chế **retry limit** và **exponential backoff** để tránh spam requests khi kết nối thất bại.

## Tính năng

### 1. **Max Retry Limit**
- Giới hạn tối đa: **5 lần retry**
- Sau 5 lần thất bại, WebSocket sẽ **ngừng tự động reconnect**
- User cần **refresh trang** để thử kết nối lại

### 2. **Exponential Backoff**
Thời gian chờ giữa các lần retry tăng dần theo cấp số nhân:

| Lần thử | Thời gian chờ |
|---------|---------------|
| 1       | 5 giây        |
| 2       | 10 giây       |
| 3       | 20 giây       |
| 4       | 40 giây       |
| 5       | 80 giây       |

### 3. **Auto Reset**
- Counter được **reset về 0** khi kết nối thành công
- Counter được **reset về 0** khi disconnect thủ công

## Cách sử dụng

### Kết nối WebSocket
```typescript
import { webSocketService } from '@/service/websocketService';

// Kết nối
webSocketService.connect();
```

### Ngắt kết nối
```typescript
// Ngắt kết nối (sẽ reset retry counter)
webSocketService.disconnect();
```

### Reset retry counter thủ công
```typescript
// Nếu cần reset counter mà không disconnect
webSocketService.resetReconnectAttempts();
```

### Subscribe to messages
```typescript
const unsubscribe = webSocketService.subscribe((data) => {
    console.log('Received:', data);
});

// Cleanup khi component unmount
unsubscribe();
```

## Console Logs

### Khi đang retry:
```
[WS] Scheduling reconnect attempt 1/5 in 5s...
[WS] Scheduling reconnect attempt 2/5 in 10s...
[WS] Scheduling reconnect attempt 3/5 in 20s...
```

### Khi đạt max retry:
```
[WS] Max reconnect attempts (5) reached. Stopping reconnection.
[WS] Please refresh the page to try connecting again.
```

### Khi kết nối thành công:
```
[WS] Connected
```

## Cấu hình

Có thể điều chỉnh các tham số trong `websocketService.ts`:

```typescript
private maxReconnectAttempts: number = 5;      // Số lần retry tối đa
private baseReconnectDelay: number = 5000;     // Delay ban đầu (ms)
```

## Lợi ích

✅ **Giảm tải server**: Không spam requests liên tục  
✅ **Tiết kiệm bandwidth**: Giảm số lượng failed requests  
✅ **Trải nghiệm tốt hơn**: User biết khi nào cần refresh  
✅ **Dễ debug**: Console logs rõ ràng về trạng thái retry  

## Lưu ý

⚠️ **Vấn đề CORS hiện tại**: Backend đang trả về duplicate CORS headers. Cần fix ở backend trước khi WebSocket có thể hoạt động bình thường.

## Troubleshooting

### WebSocket không kết nối được?
1. Kiểm tra console logs
2. Nếu thấy CORS error → Fix backend CORS configuration
3. Nếu đạt max retry → Refresh trang
4. Kiểm tra token authentication

### Muốn retry ngay lập tức?
```typescript
// Reset counter và connect lại
webSocketService.resetReconnectAttempts();
webSocketService.connect();
```
