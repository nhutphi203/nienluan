# Hệ thống quản lý trung tâm dạy thêm

## 1. Chào hỏi và mở đầu
Kính thưa cô và các bạn,  
Em xin đại diện nhóm trình bày đề tài niên luận với tên gọi: “Hệ thống quản lý trung tâm dạy thêm” – được thực hiện bởi hai thành viên: Trần Phi Nhựt – B2110092 và Đặng Thái Bình – B2110070, dưới sự hướng dẫn của cô Ông Thị Mỹ Linh.

Trong bài thuyết trình hôm nay, nhóm em xin trình bày các nội dung chính gồm: lý do chọn đề tài, mục tiêu hệ thống, chức năng nổi bật, kiến trúc tổng thể và kết quả triển khai.

## 2. Lý do chọn đề tài & Đặt vấn đề
Hiện nay, nhu cầu học thêm ở học sinh ngày càng tăng, trong khi các trung tâm lại gặp khó khăn trong việc quản lý thủ công như: xếp lịch, quản lý học phí, theo dõi điểm số và chuyên cần.  
Ngoài ra, quy định về việc dạy thêm ngày càng nghiêm ngặt, khiến các trung tâm cần phải hoạt động chuyên nghiệp và minh bạch hơn.  
Từ thực tế đó, nhóm em quyết định xây dựng một hệ thống quản lý trung tâm dạy thêm đơn giản – dễ sử dụng – nhưng vẫn đảm bảo đầy đủ các tính năng cần thiết.

## 3. Mục tiêu và đối tượng sử dụng
Mục tiêu của hệ thống là:
- Quản lý học viên, giáo viên và thời khóa biểu một cách khoa học.
- Tự động lập lịch dạy và chia nhóm học viên theo năng lực.
- Quản lý học phí, chấm công, tính lương – tất cả được số hóa và lưu trữ an toàn.

Đối tượng sử dụng bao gồm 4 vai trò: Học viên, Giáo viên, Quản lý và Admin.

## 4. Các chức năng chính
Hệ thống bao gồm hơn 20 chức năng, trong đó nổi bật có:
- **Quản lý là người đầu tiên khởi tạo các thành phần của hệ thống:

Tạo nhóm học:

Chọn khối lớp (6/7/8), phân loại nhóm (thường – nâng cao).

Gắn thời gian học cụ thể (thứ – buổi – giờ).

Gán giáo viên cho nhóm:

Chọn giáo viên phù hợp với khối/lịch học.

Giáo viên có thể đăng ký nếu còn nhóm trống.

Cập nhật danh sách học viên:

Nhập thủ công hoặc thêm học viên từ file.

Cấu hình học phí và hình thức thanh toán:

Theo tháng, quý, học kỳ hoặc năm.

Cài đặt lịch giảng dạy chung, phân phối giờ dạy cho từng nhóm.

🎓 B. HỌC VIÊN – ĐĂNG KÝ & HỌC TẬP
Sau khi nhóm học được tạo, học viên bắt đầu tham gia hệ thống.

Đăng ký tài khoản và đăng nhập.

Đăng ký nhóm học phù hợp:

Dựa theo điểm đầu vào hoặc nguyện vọng.

Hệ thống hiển thị nhóm còn chỗ – thời gian học tương thích.

Thanh toán học phí:

Chọn hình thức đóng học phí.

Hệ thống cập nhật biên nhận thanh toán và thông báo trên giao diện.

Tham gia học tập:

Xem lịch học theo nhóm đã chọn.

Tải tài liệu được giáo viên cung cấp.

Nhận thông báo nhắc học hoặc thay đổi lịch.

Theo dõi kết quả học tập:

Xem điểm từng môn, từng bài kiểm tra.

Lịch sử chuyên cần.

👨‍🏫 C. GIÁO VIÊN – GIẢNG DẠY & ĐÁNH GIÁ
Giáo viên là người tham gia giảng dạy và đánh giá kết quả học viên.

Đăng ký nhóm giảng dạy:

Chọn từ danh sách nhóm còn trống.

Xem lịch dạy và xác nhận chấm công:

Có thể chọn chấm công thủ công hoặc hệ thống tự động cập nhật sau mỗi buổi dạy.

Đăng tải tài liệu & thông báo:

Cung cấp tài liệu học cho từng nhóm.

Gửi thông báo bài tập, dời lịch học…

Chấm điểm và cập nhật kết quả:

Nhập điểm trực tiếp trên hệ thống.

Điểm được học viên theo dõi tại trang cá nhân.

📊 D. QUẢN LÝ – GIÁM SÁT & BÁO CÁO
Sau khi hệ thống vận hành, quản lý tiếp tục kiểm tra – giám sát:

Theo dõi chuyên cần:

Hệ thống cảnh báo khi học viên vắng > 5 buổi liên tiếp.

Xem và xuất báo cáo học phí:

Học viên nào đã đóng, còn nợ, lịch sử giao dịch.

Xuất báo cáo lương giáo viên:

Tự động tính dựa trên số buổi dạy – mức lương quy định.

Thống kê toàn trung tâm:

Số lượng học viên – nhóm – kết quả học tập – doanh thu theo tháng.

## 5. Kiến trúc hệ thống
Về mặt kỹ thuật, hệ thống được xây dựng theo mô hình Client – Server:
- **Frontend**: dùng ReactJS để tối ưu giao diện người dùng.
- **Backend**: sử dụng NodeJS với Express để xử lý logic.
- **Database**: MySQL – giúp lưu trữ dữ liệu người dùng, lớp học, điểm số, tài liệu, thanh toán, v.v.

## 6. Kết quả và demo
Hiện tại, nhóm đã hoàn thiện:
- Giao diện các vai trò với tính năng đăng ký, đăng nhập, xem điểm, đăng ký lớp,...
- Chức năng tự động cập nhật lịch học và xuất báo cáo.
- Kiểm thử đầy đủ các chức năng chính, đảm bảo hệ thống vận hành ổn định.

## 7. Kết luận và cảm ơn
Qua đề tài này, nhóm em đã có cơ hội áp dụng kiến thức thực tế vào giải quyết một bài toán rõ ràng trong giáo dục.  
Dù vẫn còn một số hạn chế, nhưng nhóm sẽ tiếp tục cải tiến và mong nhận được những góp ý từ cô để hoàn thiện hệ thống tốt hơn trong tương lai.  
Xin chân thành cảm ơn cô và các bạn đã lắng nghe!
