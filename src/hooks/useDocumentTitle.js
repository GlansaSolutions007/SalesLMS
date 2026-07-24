import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "../config/menuConfig.js";

export default function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} · Sales LMS`;
  }, [pathname]);
}
