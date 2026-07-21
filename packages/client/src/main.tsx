
import { createRoot } from "react-dom/client";
import { ContractShareApp } from "./App.tsx";
import AdminApp from "./admin/AdminApp.tsx";
import "./index.css";

const isContractRoute = /^\/contracts\/[^/]+\/?$/.test(window.location.pathname);
const RootComponent = isContractRoute ? ContractShareApp : AdminApp;
const isAdminRoute = !isContractRoute;

document.body.classList.toggle("app--public", !isAdminRoute);
document.body.classList.toggle("app--admin", isAdminRoute);

createRoot(document.getElementById("root")!).render(<RootComponent />);
  
