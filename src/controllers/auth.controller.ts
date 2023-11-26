import User from "../models/user.model";
import RefreshToken from "../models/refreshtoken.model";
import AccessTokenGenerator from "../models/accesstoken.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const AGT = new AccessTokenGenerator();

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.getUserByIdentifier(username) || await User.getUserByIdentifier(email);

        if (existingUser) {
            return res.status(409).json({ message: "User already exists!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.createAccount(username, email, hashedPassword);

        if (newUser) {
            const accessToken = await AGT.generate(newUser.user.id);
            const refreshToken = await RefreshToken.createToken(newUser.user.id);
            res.status(201).json({message: "User created successfully", token: accessToken});
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.getUserByIdentifier(username);

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await user.checkPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const oldToken = await RefreshToken.getTokenByUserId(user.user.id);

        if (oldToken) {
            await oldToken.destroyToken();
        }

        const accessToken = await AGT.generate(user.user.id);
        const refreshToken = await RefreshToken.createToken(user.user.id);

        res.status(200).json({message: "Login successful", token: accessToken });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function tokenVerification(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Always include the JWT in your headers!' });
    }
  
    try {
      const decodedToken = jwt.decode(token) as { exp: number; user: { id: number } };
      const expDate = decodedToken?.exp;
      const userId = decodedToken?.user.id;
  
      if (!expDate) {
        return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
      }
  
      if (expDate < Math.floor(Date.now() / 1000)) {
        const refreshToken = await RefreshToken.getTokenByUserId(userId);
  
        if (refreshToken) {
          const tokenIsValid = await refreshToken.checkTokenValidity();
  
          if (tokenIsValid) {
            const accessToken = await AGT.generate(userId);
  
            res.setHeader('Authorization', `Bearer ${accessToken}`);
            return next();
          } else {
            return res.status(404).json({ error: 'User not found' });
          }
        } else {
          return res.status(401).json({ error: 'Invalid or expired refresh token. Please login again.' });
        }
      } else {
        next();
      }
    } catch (error) {
      console.error('Error in tokenVerification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  