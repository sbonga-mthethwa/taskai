import { Outlet } from "react-router-dom";
import NavigationRail from "@/components/NavigationRail";
import MainTopbar from "@/components/MainTopbar";
import MobileNav from "@/components/MobileNav";

const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <MainTopbar />
      <div className="flex flex-1 overflow-hidden">
        <NavigationRail />
        <main className="flex-1 overflow-auto pb-14 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default AppLayout;
