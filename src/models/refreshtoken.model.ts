import { PrismaClient, RefreshToken as PrismaRefreshToken, User } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const jwtSecret = process.env.JWT_SECRET || 'secret';

class RefreshToken {
  private refreshToken: PrismaRefreshToken;

  constructor(refreshToken: PrismaRefreshToken) {
    this.refreshToken = refreshToken;
  }

  /**
   * Create a token for the given user ID.
   *
   * @param {number} userId - The ID of the user.
   * @return {Promise<RefreshToken | null>} A promise that resolves to a RefreshToken object or null if an error occurred.
   */
  static async createToken(userId: number): Promise<RefreshToken | null> {
    try {
      const token = jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });

      const newToken = await prisma.refreshToken.create({
        data: {
          userId,
          token,
        },
      });

      return new RefreshToken(newToken);
    } catch (error) {
      console.error('Error creating token:', error);
      return null;
    }
  }

  /**
   * Destroys the token.
   *
   * @return {Promise<void>} A promise that resolves when the token is destroyed.
   */
  async destroyToken(): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { id: this.refreshToken.id },
      });
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  }

  /**
   * Check the validity of the token asynchronously.
   *
   * @return {Promise<boolean>} A boolean indicating the validity of the token.
   */
  async checkTokenValidity(): Promise<boolean> {
    try {
      jwt.verify(this.refreshToken.token, jwtSecret);
      return true;
    } catch (error) {
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
  static async getTokenByUserId(userId: number): Promise<RefreshToken | null> {
    try {
      const token = await prisma.refreshToken.findFirst({
        where: { userId },
      });

      return token ? new RefreshToken(token) : null;
    } catch (error) {
      console.error('Error fetching token:', error);
      return null;
    }
  }
}

export default RefreshToken;
