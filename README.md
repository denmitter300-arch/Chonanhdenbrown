# DENBROWN PHOTO SELECTION — V2 Supabase
Website tĩnh độc lập, giao diện responsive cho điện thoại và máy tính.
## Tính năng
- Đăng nhập quản trị bằng Supabase Auth.
- Tạo nhiều album, link riêng, thời hạn mặc định 30 ngày, khóa/mở album.
- Tải ảnh JPG/PNG/WebP lên Supabase Storage.
- Khách mở link riêng, xem ảnh, thả tim; lựa chọn được lưu trong Supabase theo trình duyệt khách.
- Tải ảnh đã chọn thành ZIP; tạo QR cho link album.
## Cài đặt bắt buộc
1. Mở Supabase project đã cấu hình trong index.html.
2. Chạy toàn bộ file `supabase-setup.sql` trong SQL Editor.
3. Trong Authentication > Users, tạo tài khoản quản trị.
4. Không bao giờ đưa service_role/secret key lên website; index chỉ dùng publishable key.
5. Mở website sau khi deploy HTTPS, đăng nhập quản trị, tạo album và thử bằng cửa sổ riêng tư.
## Deploy
Repository này có thể triển khai trên Vercel (Other/static, output directory `.`) hoặc GitHub Pages. Commit mới sẽ cập nhật source; việc đổi URL domain hiện tại cần cấu hình hosting/DNS riêng.
## Lưu ý
Album hết hạn sẽ bị ẩn với khách nhưng dữ liệu ảnh vẫn được giữ lại, không tự xóa để tránh mất dữ liệu. Google Drive URL/API chưa tích hợp trong bản này. Cần kiểm thử với Supabase trước khi dùng cho khách thật.
