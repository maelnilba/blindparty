import { AuthGuardAdmin } from "@components/layout/auth";
import type { NextPageWithAuth } from "next";

const AdminHome: NextPageWithAuth = () => {
  return <div></div>;
};

AdminHome.auth = AuthGuardAdmin;

export default AdminHome;
