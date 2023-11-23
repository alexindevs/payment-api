import { Router } from "express";
import  * as AuthController from "../controllers/auth.controller";

const AuthRouter = Router();

AuthRouter.post("/login", AuthController.loginUser);
AuthRouter.post("/register", AuthController.createUser);

export default AuthRouter;