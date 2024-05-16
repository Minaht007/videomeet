import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

const Main = lazy(() => import("../pages/Maine/main"));
const Room = lazy(() => import("../pages/Room/index"));
const NotFound = lazy(() => import("../pages/NotFound/index"));

const UserRouters  = () => {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default UserRouters ;
