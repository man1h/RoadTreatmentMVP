import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

export const loginUser = async (email: string, password: string) => {
    console.log(`Attempting login for: ${email}`);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
        console.log('User not found in database');
        throw new Error('User not found');
    }

    console.log(`User found: ${user.email}, Hash: ${user.password_hash}`);
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Password valid: ${validPassword}`);

    if (!validPassword) {
        throw new Error('Invalid password');
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            tmc_id: user.tmc_id,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tmc_id: user.tmc_id,
            name: user.name
        }
    };
};
