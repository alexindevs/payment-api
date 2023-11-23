"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware to handle CORS
app.use((0, cors_1.default)());
// Middleware to parse JSON requests
app.use(express_1.default.json());
// Routes
console.log(process.env.TEST_ENV);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
