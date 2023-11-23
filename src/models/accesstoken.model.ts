import { PrismaClient, User as PrismaUser } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

class AccessTokenGenerator {
  private readonly secret: string = process.env.JWT_SECRET || 'hack_winner';
  private readonly expiresIn: string = '1h';

  /**
   * Generates an access token for a given user ID.
   *
   * @param {number} userId - The ID of the user.
   * @return {Promise<string | null>} The generated access token, or null if the user does not exist or there was an error.
   */
  public async generate(userId: number): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        const { password, ...userWithoutPassword } = user;

        const accessToken = jwt.sign({ user: userWithoutPassword }, this.secret, {
          expiresIn: this.expiresIn,
        });

        return accessToken;
      }

      return null;
    } catch (error) {
      console.error('Error generating access token:', error);
      return null;
    }
  }
}

export default AccessTokenGenerator;
