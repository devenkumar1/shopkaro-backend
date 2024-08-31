const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    orderStatus: { type: String, default: "Pending" },
    items: {
        productName: String,
        quantity: { type: Number, default: 1 },
        price: Number,
        image: String,
        discount: { type: Number, default: 0 },
        address: String,
        total: Number
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String

})
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;