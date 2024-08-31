const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    address: { type: String, default: 'Shop No 1, Lala Compound, Mahakalicave Rd, Near Holy Street Hospital, Andheri (west)' }
});

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    addresses: [addressSchema],
    img: { type: String, default: '' },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
