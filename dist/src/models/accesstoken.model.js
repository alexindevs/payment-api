"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
class AccessTokenGenerator {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'secret';
        this.expiresIn = '1h';
    }
    /**
     * Generates an access token for a given user ID.
     *
     * @param {number} userId - The ID of the user.
     * @return {Promise<string | null>} The generated access token, or null if the user does not exist or there was an error.
     */
    async generate(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (user) {
                const { password, ...userWithoutPassword } = user;
                const accessToken = jsonwebtoken_1.default.sign({ user: userWithoutPassword }, this.secret, {
                    expiresIn: this.expiresIn,
                });
                return accessToken;
            }
            return null;
        }
        catch (error) {
            console.error('Error generating access token:', error);
            return null;
        }
    }
}
exports.default = AccessTokenGenerator;
