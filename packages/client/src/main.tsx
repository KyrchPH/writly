
import { createRoot } from "react-dom/client";
import { ContractShareApp } from "./App.tsx";
import AdminApp from "./admin/AdminApp.tsx";
import { LegalPage } from "./legal/LegalPage.tsx";
import "./index.css";

const isContractRoute = /^\/contracts\/[^/]+\/?$/.test(window.location.pathname);
const isTermsRoute = /^\/terms\/?$/.test(window.location.pathname);
const isPrivacyRoute = /^\/privacy\/?$/.test(window.location.pathname);
const isLegalRoute = isTermsRoute || isPrivacyRoute;
const RootComponent = isContractRoute
  ? ContractShareApp
  : isLegalRoute
    ? () => <LegalPage kind={isTermsRoute ? "terms" : "privacy"} />
    : AdminApp;
const isAdminRoute = !isContractRoute && !isLegalRoute;

document.body.classList.toggle("app--public", !isAdminRoute);
document.body.classList.toggle("app--admin", isAdminRoute);

createRoot(document.getElementById("root")!).render(<RootComponent />);
  
