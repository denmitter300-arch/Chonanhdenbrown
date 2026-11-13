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


## Nâng cấp tính năng album
- Mật khẩu riêng cho album: mật khẩu được băm SHA-256 ở trình duyệt và xác minh qua RPC `get_public_album`.
- Giới hạn số ảnh khách được chọn: giới hạn kiểm tra ở giao diện và trigger PostgreSQL.
- Ghi chú khách hàng: khách gửi ghi chú; quản trị xem ghi chú trong màn hình quản lý album.
- Cho phép/tắt tải ảnh gốc.
- Lịch sử quản trị: danh sách album, trạng thái khóa/mở và ngày hết hạn; link/QR riêng từng album.
- Google Drive: nhập link thư mục công khai và API key; bật Google Drive API trong Google Cloud để đọc danh sách ảnh. Tính năng này cần API key hợp lệ và quyền xem công khai của thư mục.
## Cập nhật cơ sở dữ liệu sau nâng cấp
Chạy lại toàn bộ `supabase-setup.sql` trong Supabase SQL Editor để thêm các cột, bảng ghi chú, hàm xác minh mật khẩu và trigger giới hạn ảnh. Không cần xóa dữ liệu album hiện tại.
