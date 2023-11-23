"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const jwtSecret = process.env.JWT_SECRET || 'secret';
class RefreshToken {
    constructor(refreshToken) {
        this.refreshToken = refreshToken;
    }
    /**
     * Create a token for the given user ID.
     *
     * @param {number} userId - The ID of the user.
     * @return {Promise<RefreshToken | null>} A promise that resolves to a RefreshToken object or null if an error occurred.
     */
    static async createToken(userId) {
        try {
            const token = jsonwebtoken_1.default.sign({ userId }, jwtSecret, { expiresIn: '7d' });
            const newToken = await prisma.refreshToken.create({
                data: {
                    userId,
                    token,
                },
            });
            return new RefreshToken(newToken);
        }
        catch (error) {
            console.error('Error creating token:', error);
            return null;
        }
    }
    /**
     * Destroys the token.
     *
     * @return {Promise<void>} A promise that resolves when the token is destroyed.
     */
    async destroyToken() {
        try {
            await prisma.refreshToken.delete({
                where: { id: this.refreshToken.id },
            });
        }
        catch (error) {
            console.error('Error deleting token:', error);
        }
    }
    /**
     * Check the validity of the token asynchronously.
     *
     * @return {Promise<boolean>} A boolean indicating the validity of the token.
     */
    async checkTokenValidity() {
        try {
            jsonwebtoken_1.default.verify(this.refreshToken.token, jwtSecret);
            return true;
        }
        catch (error) {
            console.error('Error checking token expiry:', error);
            return false;
        }
    }
    /**
     * Retrieves a refresh token by user ID.
     *
     * @param {number} userId - The ID of the user.
     * @return {Promise<RefreshToken | null>} A promise that resolves to the refresh token for the user, or null if no token is found.
     */
    static async getTokenByUserId(userId) {
        try {
            const token = await prisma.refreshToken.findFirst({
                where: { userId },
            });
            return token ? new RefreshToken(token) : null;
        }
        catch (error) {
            console.error('Error fetching token:', error);
            return null;
        }
    }
}
exports.default = RefreshToken;
