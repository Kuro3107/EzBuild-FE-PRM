# Staff Management System - Order & Payment Flow

## Order Status Flow

```
PENDING → DEPOSITED → PAID 25% → SHIPPING → PAID → DONE
   ↓         ↓           ↓          ↓        ↓
 CANCEL   CANCEL     CANCEL     CANCEL   CANCEL
```

### Chi tiết từng trạng thái:

1. **PENDING** 
   - Trạng thái ban đầu sau khi tạo đơn hàng
   - Hiển thị ở trang quản lý đơn của staff
   - Staff có thể chuyển thành DEPOSITED

2. **DEPOSITED** 
   - Staff chuyển khi khách hàng đã cọc
   - Staff có thể chuyển thành PAID 25%
   - Staff thực hiện ở trang quản lý order

3. **PAID 25%**
   - Staff chuyển khi khách hàng đã cọc 25%
   - Staff có thể chuyển thành SHIPPING
   - Staff thực hiện ở trang quản lý order

4. **SHIPPING**
   - Staff chuyển sau khi chuẩn bị hàng xong
   - Staff có thể chuyển thành PAID
   - Staff thực hiện ở trang quản lý order

5. **PAID**
   - Staff chuyển khi thanh toán đầy đủ
   - Staff có thể chuyển thành DONE
   - Tự động chuyển thành DONE sau 3 ngày

6. **DONE**
   - Khách hàng feedback xong
   - Tự động chuyển sau 3 ngày từ trạng thái PAID
   - Staff có thể chuyển thủ công từ PAID → DONE

7. **CANCEL**
   - Khách hàng hủy đơn
   - Có thể chuyển từ bất kỳ trạng thái nào

## Payment Status Flow

```
PENDING → PAID
```

### Chi tiết từng trạng thái:

1. **PENDING**
   - Trạng thái ban đầu sau khi tạo payment
   - Chưa thanh toán

2. **PAID**
   - Tự động chuyển khi khách hàng xác nhận thanh toán
   - Tự động cập nhật order status thành DEPOSITED
   - Staff chỉ có thể xem, không thể chỉnh sửa

## API Endpoints

### Order Management
- `GET /api/order` - Lấy tất cả orders
- `GET /api/order/{id}` - Lấy order theo ID
- `PUT /api/order/{id}/status` - Cập nhật trạng thái order

### Payment Management
- `GET /api/payment` - Lấy tất cả payments
- `GET /api/payment/{id}` - Lấy payment theo ID
- `PUT /api/payment/{id}` - Cập nhật payment
- `POST /api/payment` - Tạo payment mới

## Staff Pages

1. **Dashboard** (`/staff/dashboard`)
   - Tổng quan thống kê
   - Số liệu orders và payments
   - Doanh thu

2. **Order Management** (`/staff/orders`)
   - Danh sách tất cả orders
   - Filter theo trạng thái
   - Cập nhật trạng thái order thủ công
   - Xem chi tiết order
   - Staff có thể chuyển: PENDING → DEPOSITED → PAID 25% → SHIPPING → PAID → DONE

3. **Payment Management** (`/staff/payments`)
   - Danh sách tất cả payments
   - Filter theo trạng thái
   - Chỉ xem thông tin, không chỉnh sửa
   - Thanh toán được cập nhật tự động

## Auto-Update Logic

Khi khách hàng xác nhận thanh toán:
- Payment: `PENDING` → `PAID` (tự động)
- Order: `PENDING` → `DEPOSITED` (tự động)

Tự động cập nhật order status:
- `PAID` → `DONE`: Tự động chuyển sau 3 ngày từ trạng thái PAID

## Staff Manual Control

Staff có thể cập nhật thủ công tất cả trạng thái order:
- `PENDING` → `DEPOSITED` (khi khách hàng đã cọc)
- `DEPOSITED` → `PAID 25%` (khi khách hàng cọc 25%)
- `PAID 25%` → `SHIPPING` (khi chuẩn bị hàng xong)
- `SHIPPING` → `PAID` (khi giao hàng xong)
- `PAID` → `DONE` (khi hoàn tất)

## Staff Permissions

- Chỉ user có role "Staff" mới có thể truy cập
- Protected routes với `ProtectedRoute` component
- Tất cả API calls đều cần authentication token
