import { Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import StayingClose from "./pages/StayingClose";
import Faith from "./pages/Faith";
import Reading from "./pages/Reading";
import Money from "./pages/Money";
import PrayerBoard from "./pages/PrayerBoard";
import Memories from "./pages/Memories";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AppShell } from "./components/shell/AppShell";

export const routers = [
  {
    path: "/",
    element: (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "planner", element: <Planner /> },
      { path: "close", element: <StayingClose /> },
      { path: "faith", element: <Faith /> },
      { path: "reading", element: <Reading /> },
      { path: "money", element: <Money /> },
      { path: "prayer-board", element: <PrayerBoard /> },
      { path: "dreams", element: <PrayerBoard /> },
      { path: "memories", element: <Memories /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
