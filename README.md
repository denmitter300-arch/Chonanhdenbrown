# DENBROWN PHOTO SELECTION — V2

Giao diện mới theo mẫu DENBROWN: nền trắng, tông xanh lá, bố cục tối giản, tương thích điện thoại và máy tính.

## Tính năng
- Quản trị studio đăng nhập bằng Supabase Auth; khách hàng không cần mật khẩu album.
- Tạo nhiều album, link riêng, thời hạn mặc định 30 ngày, khóa/mở album.
- Tải nhiều ảnh JPG/PNG/WebP lên Supabase Storage.
- Giữ nguyên tên file gốc khi tải ảnh từ thiết bị lên.
- Khách mở link album riêng, xem ảnh, phóng to ảnh, thả tim và lưu lựa chọn.
- Tải các ảnh đã chọn thành ZIP; tạo QR cho link album.
- Tùy chọn cho phép tải ảnh gốc, ghi chú và giới hạn số ảnh chọn.
- Đọc ảnh từ link thư mục Google Drive công khai không cần Google API. Việc đọc phụ thuộc cách Drive hiển thị thư mục; một số thư mục có thể bị Google giới hạn. Tên file được giữ theo dữ liệu tên gốc mà Drive cung cấp.

## Cài đặt Supabase
1. Mở dự án Supabase đã cấu hình trong `index.html`.
2. Chạy toàn bộ `supabase-setup.sql` trong SQL Editor.
3. Trong Authentication → Users, tạo tài khoản quản trị.
4. Chỉ dùng publishable key trên trình duyệt; tuyệt đối không đưa service_role/secret key vào website.
5. Triển khai website qua HTTPS, đăng nhập quản trị, tạo album và thử bằng cửa sổ riêng tư.

## Deploy
Repository triển khai qua GitHub Pages. Mỗi commit trên nhánh `main` sẽ kích hoạt workflow Pages nếu GitHub Pages đã bật nguồn **GitHub Actions** trong Settings → Pages.

## Lưu ý
- Album khách không có mật khẩu; link riêng là cách truy cập album.
- Mật khẩu đăng nhập chỉ dành cho khu vực quản trị studio.
- Album hết hạn sẽ bị ẩn với khách nhưng ảnh vẫn được giữ trong Storage, không tự xóa.
- Google Drive không dùng API key. Nếu Google chặn việc đọc thư mục, hãy tải ảnh gốc trực tiếp lên album.
- Cần kiểm thử trên dự án Supabase thật trước khi gửi link cho khách hàng.
