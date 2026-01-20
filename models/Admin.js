/**
 * Admin Model
 * Mongoose schema for the admins collection
 * Matches existing admin data in MongoDB
 */

import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        name: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            default: 'admin',
        },
    },
    {
        timestamps: true,
        collection: 'admins', // Explicitly set collection name
    }
);

// Do NOT add password hashing middleware here
// Passwords are already hashed in the database

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
