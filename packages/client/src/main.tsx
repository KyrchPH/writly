
import { createRoot } from "react-dom/client";
import { ContractShareApp } from "./App.tsx";
import AdminApp from "./admin/AdminApp.tsx";
import { LegalPage } from "./legal/LegalPage.tsx";
import "./index.css";

const legacySigningMatch = window.location.pathname.match(/^\/contracts\/([^/]+)\/?$/);
if (legacySigningMatch?.[1]) {
  window.history.replaceState(
    null,
    "",
    `/sign/${encodeURIComponent(decodeURIComponent(legacySigningMatch[1]))}`,
  );
} else if (window.location.pathname.startsWith("/admin/contracts/draft")) {
  window.history.replaceState(null, "", "/documents/new");
} else if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
  window.history.replaceState(null, "", "/documents");
}

const isContractRoute = /^\/sign\/[^/]+\/?$/.test(window.location.pathname);
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
  
