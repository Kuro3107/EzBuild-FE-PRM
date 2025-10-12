# Hướng dẫn Debug "Không tìm thấy token trong response từ server"

## 🚨 Vấn đề

Lỗi này xảy ra khi backend phản hồi thành công nhưng không có token trong response.

## 🔍 Các bước debug chi tiết

### 1. Sử dụng API Debugger (Khuyến nghị)

1. Mở trang chủ trong development mode
2. Scroll xuống dưới tìm "API Debugger"
3. Nhập thông tin đăng nhập thực tế
4. Click "Test Raw API" để xem response chi tiết

### 2. Kiểm tra Console Logs

Mở Developer Tools (F12) → Console, sẽ thấy:

```
🔍 Full response from server: { ... }
🔍 Extracted token: null
🔍 Available fields in response: [ ... ]
❌ No token found. Response structure: { ... }
```

### 3. Các trường hợp phổ biến

#### A. Backend trả về success message thay vì token

```json
{
  "message": "Login successful",
  "status": "success"
}
```

**Giải pháp**: Backend cần trả về token

#### B. Token nằm trong field khác

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Giải pháp**: Cập nhật `extractTokenFromResponse` function

#### C. Token nằm trong nested object

```json
{
  "result": {
    "auth": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Giải pháp**: Cập nhật logic extract token

#### D. Backend trả về error nhưng status 200

```json
{
  "error": "Invalid credentials",
  "code": 401
}
```

**Giải pháp**: Kiểm tra logic backend

### 4. Cách fix nhanh

#### Nếu token nằm trong field khác:

Cập nhật `src/services/api.ts`:

```javascript
private static extractTokenFromResponse(data: AuthResponse): { token: string; user?: Record<string, unknown> } {
  // Thêm field mới vào đây
  const token = data.token ||
                data.accessToken ||
                data.access_token ||
                data.jwt ||                    // ← Thêm field mới
                data.auth?.token ||            // ← Thêm nested field
                data.data?.token ||
                data.data?.accessToken ||
                data.data?.access_token

  // ... rest of function
}
```

#### Nếu cần custom logic:

```javascript
private static extractTokenFromResponse(data: AuthResponse): { token: string; user?: Record<string, unknown> } {
  console.log('🔍 Full response from server:', JSON.stringify(data, null, 2))

  // Custom logic dựa trên response structure thực tế
  let token = null

  // Ví dụ: token nằm trong data.result.auth.token
  if (data.data?.result?.auth?.token) {
    token = data.data.result.auth.token
  }
  // Hoặc token nằm trong data.jwt
  else if (data.jwt) {
    token = data.jwt
  }
  // ... thêm các trường hợp khác

  if (!token) {
    console.error('❌ No token found. Response structure:', data)
    throw new Error(`Không tìm thấy token trong response từ server. Response: ${JSON.stringify(data)}`)
  }

  const user = data.user || data.data?.user
  return { token, user }
}
```

### 5. Test với curl để xác nhận

```bash
# Test login endpoint
curl -X POST http://localhost:8080/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-email@example.com","password":"your-password"}' \
  -v

# Xem response headers và body
```

### 6. Kiểm tra Swagger UI

1. Mở `http://localhost:8080/swagger-ui/index.html`
2. Test endpoint `/api/user/login`
3. Xem response schema và example

### 7. Liên hệ Backend Team

Nếu backend không trả về token, cần:

- Kiểm tra logic authentication
- Đảm bảo JWT được generate và trả về
- Kiểm tra response format trong Swagger

## 📝 Checklist Debug

- [ ] Backend có chạy không?
- [ ] Endpoint có đúng không?
- [ ] Response có status 200 không?
- [ ] Response có chứa token không?
- [ ] Token nằm trong field nào?
- [ ] Có cần cập nhật extract logic không?

## 🎯 Kết quả mong đợi

Sau khi fix, console sẽ hiển thị:

```
🔍 Full response from server: { "token": "eyJ...", "user": {...} }
🔍 Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Available fields in response: ["token", "user"]
```
