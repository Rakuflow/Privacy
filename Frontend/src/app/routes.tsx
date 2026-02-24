import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { AppPage } from "./pages/AppPage";
import { RootLayout } from "./components/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Landing,
      },
      {
        path: "app",
        Component: AppPage,
      },
    ],
  },
]);