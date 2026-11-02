import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home";
import News from "../pages/News";
import Votes from "../pages/Votes";
import Store from "../pages/Store";
import Staff from "../pages/Staff";
import NewsDetails from "../pages/NewsDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import OrderStatus from "../pages/OrderStatus";
import CekPesanan from "../pages/CekPesanan";
import Login from "../pages/Login";

import AdminLayout from "../layouts/AdminLayout";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminNewsList from "../pages/admin/AdminNewsList";
import AdminNewsForm from "../pages/admin/AdminNewsForm";
import AdminStaffList from "../pages/admin/AdminStaffList";
import AdminStore from "../pages/admin/AdminStore";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCoupons from "../pages/admin/AdminCoupons";
import ProtectedRoute from "../components/admin/ProtectedRoute";
import RouteError from "../components/RouteError";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: "news", element: <News /> },
      { path: "news/:slug", element: <NewsDetails /> },
      { path: "votes", element: <Votes /> },
      { path: "store", element: <Store /> },
      { path: "staff", element: <Staff /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order/:ref", element: <OrderStatus /> },
      { path: "orders", element: <CekPesanan /> },
      { path: "login", element: <Login /> },
    ],
  },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    errorElement: <RouteError />,
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "news", element: <AdminNewsList /> },
      { path: "news/new", element: <AdminNewsForm /> },
      { path: "news/:id/edit", element: <AdminNewsForm /> },
      { path: "staff", element: <AdminStaffList /> },
      { path: "store", element: <AdminStore /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "coupons", element: <AdminCoupons /> },
    ],
  },
]);
