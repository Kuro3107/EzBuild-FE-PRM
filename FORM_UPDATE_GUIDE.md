# Hướng dẫn Cập nhật Form Register

## 🔄 Thay đổi chính

Form register đã được cập nhật để phù hợp với cấu trúc database có đầy đủ các trường:

### 📋 Các trường mới được thêm:

1. **Username** - Tên đăng nhập (required)
2. **Full Name** - Họ và tên đầy đủ (required)
3. **Email** - Email (required)
4. **Phone** - Số điện thoại (required)
5. **Date of Birth** - Ngày sinh (required)
6. **Address** - Địa chỉ (required)
7. **Password** - Mật khẩu (required)

### 🎨 Layout cải tiến:

- **Grid Layout**: Sử dụng grid 2 cột cho các trường phù hợp
- **Responsive**: Tự động chuyển thành 1 cột trên mobile
- **Validation**: Tất cả trường đều required
- **Placeholders**: Có placeholder mẫu cho từng trường

### 🔧 Cấu trúc code:

#### State Management:

```typescript
const [formData, setFormData] = useState({
  username: "",
  fullname: "",
  email: "",
  password: "",
  phone: "",
  dob: "",
  address: "",
});
```

#### Input Handler:

```typescript
function handleInputChange(field: keyof typeof formData) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };
}
```

#### API Integration:

```typescript
const data = await ApiService.register({
  username: formData.username,
  fullname: formData.fullname,
  email: formData.email,
  password: formData.password,
  phone: formData.phone,
  dob: formData.dob,
  address: formData.address,
});
```

### 📱 UI/UX Improvements:

1. **Grid Layout**:

   - Username + Full Name trên cùng 1 hàng
   - Phone + Date of Birth trên cùng 1 hàng
   - Email, Address, Password chiếm toàn bộ width

2. **Input Types**:

   - `type="tel"` cho phone
   - `type="date"` cho date of birth
   - `type="email"` cho email
   - `type="password"` cho password với show/hide toggle

3. **Placeholders**:
   - Username: "username"
   - Full Name: "fullname"
   - Email: "email"
   - Phone: "phone"
   - Address: "address"

### 🔒 Security Features:

- **Password Visibility Toggle**: Có thể show/hide password
- **Input Validation**: Tất cả trường required
- **Type Safety**: TypeScript interfaces cho type safety
- **Sanitized Logging**: Không log thông tin nhạy cảm

### 🧪 Testing:

API Debugger đã được cập nhật để test form mới:

- Test với dữ liệu mẫu đầy đủ
- Sanitized output để bảo mật
- Test cả raw API và service calls

### 📊 Database Mapping:

Form fields map với database columns:

- `username` → `username`
- `fullname` → `fullname`
- `email` → `email`
- `password` → `password` (sẽ được hash)
- `phone` → `phone`
- `dob` → `dob`
- `address` → `address`
- `role` → sẽ được set mặc định bởi backend
- `created_at` → sẽ được set tự động bởi database

### 🚀 Kết quả:

- ✅ Form đầy đủ thông tin theo database schema
- ✅ UI/UX tốt hơn với grid layout
- ✅ Type safety với TypeScript
- ✅ Security với sanitized logging
- ✅ Responsive design
- ✅ Easy testing với API Debugger
