# Test Flow Thanh Toán

## Các bước test:

### 1. Tạo đơn hàng
1. Vào trang PC Builder
2. Chọn các sản phẩm
3. Nhấn "Checkout"
4. Điền thông tin và nhấn "Place Order"
5. Đơn hàng được tạo với status: PENDING

### 2. Thanh toán cọc 25%
1. Từ trang orders, nhấn "Thanh toán ngay" cho đơn PENDING
2. Trang payment hiển thị QR code
3. Nhấn "Đã thanh toán"
4. Trạng thái payment chuyển thành "PAID 25%"
5. Trạng thái order tự động chuyển thành "DEPOSITED"
6. Khách hàng thấy thông báo thành công và trạng thái đã cập nhật

### 3. Staff xử lý
1. Staff vào `/staff/orders`
2. Thấy đơn hàng với status "DEPOSITED"
3. Staff có thể chuyển thành "SHIPPING" khi chuẩn bị hàng xong
4. Staff có thể chuyển thành "PAID" khi thanh toán đầy đủ

### 4. Khách hàng theo dõi
1. Khách hàng vào `/orders`
2. Thấy trạng thái đơn hàng đã cập nhật
3. Có thông báo rõ ràng về trạng thái hiện tại
4. Có thể thanh toán tiếp nếu cần

## Các trạng thái hiển thị:

- **PENDING**: ⏳ Chờ thanh toán (màu vàng)
- **DEPOSITED**: 💰 Đã cọc (màu xanh dương)  
- **SHIPPING**: 🚚 Đang giao (màu tím)
- **PAID**: ✅ Đã thanh toán (màu xanh lá)
- **DONE**: 🎉 Hoàn thành (màu xanh emerald)
- **CANCEL**: ❌ Đã hủy (màu đỏ)

## Tính năng đã cải thiện:

1. **Hiển thị trạng thái rõ ràng** với icon và màu sắc
2. **Thông báo thành công** khi thanh toán
3. **Cập nhật real-time** trạng thái payment và order
4. **Hướng dẫn rõ ràng** cho khách hàng
5. **Tự động chuyển trang** sau khi thanh toán thành công
6. **Thông tin chi tiết** về trạng thái thanh toán
