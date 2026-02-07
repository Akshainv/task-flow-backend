/**
 * Employee Model
 * Mongoose schema for the employees collection
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const employeeSchema = new mongoose.Schema(
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
        contactNumber: {
            type: String,
            required: [true, 'Contact number is required'],
            trim: true,
        },
        designation: {
            type: String,
            required: [true, 'Designation is required'],
            trim: true,
        },
        plainPassword: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            default: 'employee',
        },
        fcmToken: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        collection: 'employees',
    }
);

// Hash password before saving and store plain password
employeeSchema.pre('save', async function (next) {
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
employeeSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
