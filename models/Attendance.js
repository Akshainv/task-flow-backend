import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    clockInTime: {
        type: Date,
        required: true
    },
    clockOutTime: {
        type: Date
    },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    photoUrl: {
        type: String
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'On Leave'],
        default: 'Present'
    }
}, {
    timestamps: true
});

// Index removed to resolve duplicate key error and allow multiple sessions per day

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
