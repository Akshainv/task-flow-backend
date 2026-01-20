/**
 * Manager Model
 * Mongoose schema for the managers collection
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const managerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
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
        company: {
            type: String,
            required: [true, 'Company is required'],
            trim: true,
        },
        contactNumber: {
            type: String,
            required: [true, 'Contact number is required'],
            trim: true,
        },
        role: {
            type: String,
            default: 'manager',
        },
    },
    {
        timestamps: true,
        collection: 'managers',
    }
);

// Hash password before saving
managerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
managerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Manager = mongoose.model('Manager', managerSchema);

export default Manager;
