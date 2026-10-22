# DENBROWN PHOTO SELECTION — mã nguồn tái tạo giao diện

Đây là bản tái tạo độc lập dựa trên ảnh chụp giao diện và mô tả tính năng mà người dùng cung cấp. Đây **không phải** mã nguồn gốc được trích xuất từ website `denbrown-chon-anh.denmitter300.chatgpt.site`.

## Tệp trong gói
- `index.html`: cấu trúc giao diện và các màn hình.
- `style.css`: thiết kế responsive cho điện thoại và máy tính.
- `app.js`: tạo album, cài đặt album, thêm/chọn ảnh, xuất CSV và tải ảnh.
- `README.md`: hướng dẫn này.

## Chức năng trong bản demo
- Giao diện tiếng Việt theo phong cách xanh lá/tối giản.
- Tạo nhiều album, đặt giới hạn số ảnh, đổi cài đặt và xóa album.
- Tải ảnh từ thiết bị và chọn/bỏ chọn ảnh.
- Xuất danh sách đã chọn dạng CSV.
- Tải từng ảnh hoặc lần lượt tải ảnh đã chọn.
- Lưu metadata bằng localStorage và ảnh bằng IndexedDB trên trình duyệt hiện tại.

## Chưa có / cần phát triển riêng trước khi dùng cho khách thật
- Không có đăng nhập, tài khoản khách hoặc phân quyền thật.
- Không có máy chủ hoặc đồng bộ album giữa nhiều thiết bị.
- Trường Google Drive hiện chỉ lưu URL; chưa kết nối Google Drive API nên chưa tự liệt kê/tải ảnh từ thư mục Drive.
- Dữ liệu cục bộ có thể mất nếu người dùng xóa dữ liệu website hoặc trình duyệt dọn bộ nhớ.
- Không nên dùng bản này làm nơi lưu trữ duy nhất cho ảnh khách hàng.

## Chạy thử
Mở `index.html` trong trình duyệt hiện đại. Một số trình duyệt có thể giới hạn IndexedDB khi mở tệp trực tiếp; nếu gặp lỗi, hãy chạy bằng máy chủ tĩnh hoặc triển khai lên Vercel.

## Đưa mã nguồn lên GitHub bằng iPhone
1. Tải và giải nén ZIP trong ứng dụng **Tệp**.
2. Mở https://github.com/ và đăng nhập.
3. Tạo repository mới, ví dụ `denbrown-photo-selection`. Chọn **Private** nếu muốn giữ mã nguồn riêng tư.
4. Mở repository → **Add file** → **Upload files** nếu mục này hiện trên giao diện.
5. Chọn và tải lên `index.html`, `style.css`, `app.js`, `README.md` (nằm trong thư mục `DENBROWN_PHOTO_SELECTION_SOURCE` sau khi giải nén).
6. Nhấn **Commit changes**.

## Triển khai trên Vercel bằng iPhone
1. Mở https://vercel.com/ và đăng nhập bằng GitHub.
2. Chọn **Add New → Project**.
3. Import repository `denbrown-photo-selection`.
4. Nếu Vercel hỏi framework, chọn **Other** cho website tĩnh. Không cần build command; output directory là `.` (thư mục gốc), nếu giao diện yêu cầu.
5. Nhấn **Deploy** và đợi hoàn tất.
6. Mở URL Vercel và thử tạo album, thêm ảnh, chọn ảnh và xuất CSV.

## Ghi chú
Vercel chỉ triển khai website mới; nó không tự nhập dữ liệu, ảnh, quyền truy cập hoặc chức năng riêng của website cũ. Hãy giữ website hiện tại hoạt động cho đến khi đã kiểm tra kỹ bản mới.
