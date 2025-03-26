import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Grades from "./Grades";
import StudentSchedule from "./StudentSchedule";
import Fees from "./Fees";
import MakeUpClasses from "./MakeUpClasses";
import TeacherGradesInput from "./TeacherGradesInput";
import TeacherSchedule from "./TeacherSchedule"; // New component for teacher schedule
import ManageGroups from "./ManageGroups";
import FinanceReports from "./FinanceReports";
import ManageTeachers from "./ManageTeachers";
import ManageStudents from "./ManageStudents";
import ManageSchedules from "./ManageSchedules";
import ManageFeesSalaries from "./ManageFeesSalaries";
import ManageNotifications from "./ManageNotifications";
import SystemManagement from "./SystemManagement"; // Import System Management page
import "bootstrap/dist/css/bootstrap.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import BackupRestore from "./BackupRestore";
import SendNotification from "./SendNotification";
import Notifications from "./Notifications";
import RegisterGroup from "./RegisterGroup";
import Payments from "./Payments";
import TeacherClassRegister from "./TeacherClassRegister";
import Documents from "./Documents";
import StudentList from "./StudentList";
import TeacherList from "./TeacherList";
import Courses from "./Courses";
import "antd/dist/reset.css";
import TuitionSalary from "./TuitionSalary";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* Trang Home: Kiểm tra nếu có user mới cho phép vào trang Home */}
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />

        <Route path="/register" element={<Register />} />

        {/* Trang Home (Lại): Kiểm tra nếu có user mới cho phép vào trang Home */}
        <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/login" />} />

        {/* Các trang yêu cầu đăng nhập */}
        <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
        <Route path="/grades" element={user ? <Grades user={user} /> : <Navigate to="/login" />} />
        <Route path="/schedule" element={user ? <StudentSchedule user={user} /> : <Navigate to="/login" />} />
        <Route path="/fees" element={user ? <Fees user={user} /> : <Navigate to="/login" />} />

        {/* Trang lớp học bù: Dùng user.id thay vì hardcode */}
        <Route path="/makeup-classes" element={user ? <MakeUpClasses studentId={user.id} /> : <Navigate to="/login" />} />
        <Route path="/student-grades-input" element={<TeacherGradesInput />} /> {/* ✅ Route nhập điểm */}
        <Route path="/teaching-schedule" element={<TeacherSchedule />} />
        <Route path="/manage-groups" element={<ManageGroups />} />
        <Route path="/finance-reports" element={<FinanceReports />} />
        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/manage-schedules" element={<ManageSchedules />} />
        <Route path="/system-management" element={<SystemManagement />} /> {/* ✅ Thêm đường dẫn cho System Management */}
        <Route path="/backup-restore" element={<BackupRestore />} />
        <Route path="/send-notification" element={<SendNotification />} />
        <Route path="/notifications" element={user ? <Notifications user={user} /> : <Navigate to="/login" />} />
        <Route path="/register-group" element={<RegisterGroup />} />
        <Route path="/payments" element={<Payments studentId={user?.id} />} />
        <Route path="/register-class" element={<TeacherClassRegister />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/student-list" element={<StudentList />} />
        <Route path="/teachers" element={<TeacherList />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/tuition-salary" element={<TuitionSalary />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
