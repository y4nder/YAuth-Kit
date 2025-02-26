import {createBrowserRouter} from "react-router-dom";
import HomePage from "./pages/home-page";
import LoginPage from "./pages/login-page";

const createAppRouter = () => {
    return createBrowserRouter([
        {
            path:"/",
            element: <HomePage/>
        },
        {
            path:"/login",
            element: <LoginPage/>
        }
    ]);
}

export default createAppRouter;