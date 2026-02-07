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
        plainPassword: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            default: 'manager',
        },
        fcmToken: {
            type: String,
            default: '',
        },
        employees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee',
            },
        ],
    },
    {
        timestamps: true,
        collection: 'managers',
    }
);

// Hash password before saving and store plain password
managerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    // Store plain password before hashing
    this.plainPassword = this.password;
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
