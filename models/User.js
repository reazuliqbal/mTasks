const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: String,
    username: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true
    },
    access_token: String,
    services: [{ type: Schema.Types.ObjectId, ref:'service' }],
    orders: [{ type: Schema.Types.ObjectId, ref:'order' }],
    admin: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const User = mongoose.model('user', UserSchema);
module.exports = User;