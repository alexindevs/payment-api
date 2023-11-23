"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
class User {
    constructor(user) {
        this.user = user;
    }
    /**
     * Creates a new user account with the provided username, email, and password.
     *
     * @param {string} username - The username for the new account.
     * @param {string} email - The email address for the new account.
     * @param {string} password - The password for the new account.
     * @return {Promise<User | null>} A Promise that resolves to the created User object if successful, or null if there was an error.
     */
    static async createAccount(username, email, password) {
        try {
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                },
            });
            return new User(newUser);
        }
        catch (error) {
            console.error('Error creating user account:', error);
            return null;
        }
    }
    /**
     * Updates the email address of the user.
     *
     * @param {string} newEmail - The new email address for the user.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the email was successfully updated.
     */
    async updateEmail(newEmail) {
        try {
            await prisma.user.update({
                where: { id: this.user.id },
                data: { email: newEmail },
            });
            return true;
        }
        catch (error) {
            console.error('Error updating email:', error);
            return false;
        }
    }
    /**
     * Updates the user's password with the provided new password.
     *
     * @param {string} newPassword - The new password to update.
     * @return {Promise<boolean>} A Promise that resolves to true if the password was updated successfully, or false otherwise.
     */
    async updatePassword(newPassword) {
        try {
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: this.user.id },
                data: { password: hashedPassword },
            });
            return true;
        }
        catch (error) {
            console.error('Error updating password:', error);
            return false;
        }
    }
    /**
     * Deletes the user account.
     *
     * @return {Promise<boolean>} Returns a Promise that resolves to true if the account was successfully deleted, or false if there was an error.
     */
    async deleteAccount() {
        try {
            await prisma.user.delete({
                where: { id: this.user.id },
            });
            return true;
        }
        catch (error) {
            console.error('Error deleting account:', error);
            return false;
        }
    }
    /**
     * Check if the provided password matches the user's password.
     *
     * @param {string} password - The password to check against the user's password.
     * @return {Promise<boolean>} A Promise that resolves to true if the passwords match, and false otherwise.
     */
    async checkPassword(password) {
        try {
            return await bcrypt_1.default.compare(password, this.user.password);
        }
        catch (error) {
            console.error('Error comparing passwords:', error);
            return false;
        }
    }
    /**
     * Retrieves a user by their ID.
     *
     * @param {number} id - The ID of the user to retrieve.
     * @return {Promise<User | null>} A promise that resolves to the user object if found, otherwise null.
     */
    static async getUserById(id) {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            });
            return user ? new User(user) : null;
        }
        catch (error) {
            console.error('Error fetching user by id:', error);
            return null;
        }
    }
    /**
     * Retrieves a user based on the provided identifier.
     *
     * @param {string} identifier - The identifier of the user (email or username).
     * @return {Promise<User | null>} A promise that resolves with the user object if found, otherwise null.
     */
    static async getUserByIdentifier(identifier) {
        try {
            const condition = identifier.includes('@') ? { email: identifier } : { username: identifier };
            const user = await prisma.user.findFirst({ where: condition });
            return user ? new User(user) : null;
        }
        catch (error) {
            console.error('Error fetching user by identifier:', error);
            return null;
        }
    }
}
exports.default = User;
