import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home";
import News from "../pages/News";
import Votes from "../pages/Votes";
import Store from "../pages/Store";
import Staff from "../pages/Staff";
import NewsDetails from "../pages/NewsDetails";
import Cart from "../pages/Cart";
import Login from "../pages/Login";

import AdminLayout from "../layouts/AdminLayout";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminNewsList from "../pages/admin/AdminNewsList";
import AdminNewsForm from "../pages/admin/AdminNewsForm";
import AdminStaffList from "../pages/admin/AdminStaffList";
import AdminStore from "../pages/admin/AdminStore";
import ProtectedRoute from "../components/admin/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "news", element: <News /> },
      { path: "news/:slug", element: <NewsDetails /> },
      { path: "votes", element: <Votes /> },
      { path: "store", element: <Store /> },
      { path: "staff", element: <Staff /> },
      { path: "cart", element: <Cart /> },
      { path: "login", element: <Login /> },
    ],
  },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminNewsList /> },
      { path: "news", element: <AdminNewsList /> },
      { path: "news/new", element: <AdminNewsForm /> },
      { path: "news/:id/edit", element: <AdminNewsForm /> },
      { path: "staff", element: <AdminStaffList /> },
      { path: "store", element: <AdminStore /> },
    ],
  },
]);
