import { PrismaClient, User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

class User {
  public user: PrismaUser;

  constructor(user: PrismaUser) {
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
  static async createAccount(
    username: string,
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password
        },
      });

      return new User(newUser);
    } catch (error) {
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
  async updateEmail(newEmail: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: this.user.id },
        data: { email: newEmail },
      });

      return true;
    } catch (error) {
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
  async updatePassword(newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: this.user.id },
        data: { password: hashedPassword },
      });

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  /**
   * Deletes the user account.
   *
   * @return {Promise<boolean>} Returns a Promise that resolves to true if the account was successfully deleted, or false if there was an error.
   */
  async deleteAccount(): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id: this.user.id },
      });

      return true;
    } catch (error) {
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
async checkPassword(password: string): Promise<boolean> {
  try {
    console.log('Provided password:', password);
    console.log('User password:', this.user.password);
    const passwordsMatch = await bcrypt.compare(password, this.user.password);
    console.log('Passwords match:', passwordsMatch);
    return passwordsMatch;
  } catch (error) {
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
  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user ? new User(user) : null;
    } catch (error) {
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
  static async getUserByIdentifier(identifier: string): Promise<User | null> {
    try {
      const condition = identifier.includes('@') ? { email: identifier } : { username: identifier };
      const user = await prisma.user.findFirst({ where: condition });

      return user ? new User(user) : null;
    } catch (error) {
      console.error('Error fetching user by identifier:', error);
      return null;
    }
  }  
}

export default User;
