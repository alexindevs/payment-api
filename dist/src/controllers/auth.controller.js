"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenVerification = exports.loginUser = exports.createUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const refreshtoken_model_1 = __importDefault(require("../models/refreshtoken.model"));
const accesstoken_model_1 = __importDefault(require("../models/accesstoken.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AGT = new accesstoken_model_1.default();
const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await user_model_1.default.getUserByIdentifier(username) || await user_model_1.default.getUserByIdentifier(email);
        if (existingUser) {
            return res.status(409).json({ message: "User already exists!" });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await user_model_1.default.createAccount(username, email, hashedPassword);
        if (newUser) {
            const accessToken = await AGT.generate(newUser.user.id);
            const refreshToken = await refreshtoken_model_1.default.createToken(newUser.user.id);
            res.status(201).json({ message: "User created successfully", token: accessToken });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.createUser = createUser;
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = await user_model_1.default.getUserByIdentifier(username);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await user.checkPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const oldToken = await refreshtoken_model_1.default.getTokenByUserId(user.user.id);
        if (oldToken) {
            await oldToken.destroyToken();
        }
        const accessToken = await AGT.generate(user.user.id);
        const refreshToken = await refreshtoken_model_1.default.createToken(user.user.id);
        res.status(200).json({ message: "Login successful", token: accessToken });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.loginUser = loginUser;
async function tokenVerification(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Always include the JWT in your headers!' });
    }
    try {
        const decodedToken = jsonwebtoken_1.default.decode(token);
        const expDate = decodedToken?.exp;
        const userId = decodedToken?.user.id;
        if (!expDate) {
            return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
        }
        if (expDate < Math.floor(Date.now() / 1000)) {
            const refreshToken = await refreshtoken_model_1.default.getTokenByUserId(userId);
            if (refreshToken) {
                const tokenIsValid = await refreshToken.checkTokenValidity();
                if (tokenIsValid) {
                    const accessToken = await AGT.generate(userId);
                    res.setHeader('Authorization', `Bearer ${accessToken}`);
                    return next();
                }
                else {
                    return res.status(404).json({ error: 'User not found' });
                }
            }
            else {
                return res.status(401).json({ error: 'Invalid or expired refresh token. Please login again.' });
            }
        }
        else {
            next();
        }
    }
    catch (error) {
        console.error('Error in tokenVerification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
exports.tokenVerification = tokenVerification;
