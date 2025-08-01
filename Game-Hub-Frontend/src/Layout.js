// src/Layout.js
import Navbar from "./components/Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Navbar /> {/* يظهر في كل الصفحات */}
      <div style={{ padding: "20px" }}>
        <Outlet /> {/* هنا بتظهر كل صفحة حسب الراوت */}
      </div>
    </div>
  );
}

export default Layout;
