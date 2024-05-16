import { BrowserRouter } from "react-router-dom";
import "./App.css";

import UserRouters from "./routers/useRouters.jsx";
import { Link } from "react-router-dom"
// import Maine from "./pages/Maine/main.jsx"


function App() {
  return (
    <BrowserRouter>
   <UserRouters/>
   <Link to="/" ></Link>
   <Link to="/room/:id" ></Link>
      {/* <Maine/> */}
     
    </BrowserRouter>
  );
}

export default App;
