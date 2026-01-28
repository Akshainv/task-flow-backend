/**
 * Team Model
 * Mongoose schema for the teams collection
 */

import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Team name is required'],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Manager',
            required: [true, 'Manager ID is required'],
        },
        employeeIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employee',
            },
        ],
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
    },
    {
        timestamps: true,
        collection: 'teams',
    }
);

const Team = mongoose.model('Team', teamSchema);

export default Team;
