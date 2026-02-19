import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout.tsx";
import { DashboardPage } from "@/pages/DashboardPage.tsx";
import { EndpointDetailPage } from "@/pages/EndpointDetailPage.tsx";
import { CreateEndpointPage } from "@/pages/CreateEndpointPage.tsx";
import { EditEndpointPage } from "@/pages/EditEndpointPage.tsx";
import { ApiTesterPage } from "@/pages/ApiTesterPage.tsx";
import { LoginPage } from "@/pages/LoginPage.tsx";
import { NotFoundPage } from "@/pages/NotFoundPage.tsx";
import { PrivateRoute } from "@/components/auth/PrivateRoute.tsx";

/**
 * SentinelAI route definitions.
 *
 * /login is public (no layout).
 * All other routes are wrapped in <PrivateRoute /> which redirects
 * unauthenticated users to /login, then <Layout /> for sidebar + top bar.
 * Catch-all * routes render a 404 page.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "endpoints/:id", element: <EndpointDetailPage /> },
          { path: "endpoints/:id/edit", element: <EditEndpointPage /> },
          { path: "endpoints/new", element: <CreateEndpointPage /> },
          { path: "api-tester", element: <ApiTesterPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
