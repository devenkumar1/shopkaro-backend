const { model } = require('mongoose');
const dbcmd = require('../db/dbcmd');
const Razorpay = require('razorpay');
const crypto = require('crypto');
// const Productdb = require('../db/productdb');
const productModle = require('../db/productSchema');
const bcrypt = require('../db/bcrypt');
const jwt = require('../jwt/jwt');
const { uploadToCloudinary } = require('../utility/cloudinary');
const User = require('../db/userSchema');
const Order = require('../db/orderSchema');
const { response } = require('../routes/routes');
// var cookie = require('cookie');

module.exports.login_get = (req, res) => {

    res.send('Login get');
}
module.exports.login_post = async (req, res) => {
    var { email, password } = (req.body && req.body.data) || {};
    // const { email, password } = req.body?.data;
    email = email?.toLowerCase();
    var check = await dbcmd.findEmail(email);
    if (check) {
        check = await dbcmd.getPassword(email, password);
        if (check) {
            var id = await dbcmd.getId(email);
            const token = await jwt.createjwt(email);
            const user = await dbcmd.getuserdetails(id);
            res.cookie('jwt', token, {
                maxAge: 1000 * 60 * 60 * 24 * 31,
                httpOnly: true,
                // domain: 'localhost', // Replace 'localhost' with your desired domain
                secure: true,
                sameSite: 'None', // Set to 'Strict', 'Lax', or 'None'
            });

            // res.setHeader('Set-Cookie', cookie.serialize('jwt', String(jwt), {
            //     httpOnly: true,
            //     maxAge: 1000 * 60 * 60
            // }));
            req.flash("email", email);
            res.json({ message: "Succesfull login", userRole: user.role, userId: user._id });
        }
        else {

            res.json({ message: "Password incorrect" });
        }
    }
    else {
        res.json({ message: 'Email not found' });
    }
}
module.exports.signup_get = (req, res) => {
    res.send('Sign up get ');
}
module.exports.signup_post = async (req, res) => {
    var { name, email, password } = req.body.data || [];
    var message = { Name: "", Email: "", Password: "" };

    console.log(name, email, password);
    email = email.toLowerCase();
    // Validate email using regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name?.length < 3) {
        message.Name = "Name should contain at least 3 characters";
    }
    if (!email || email?.length < 1) {
        message.Email = "Please enter an email";
    } else if (!emailRegex.test(email)) {
        message.Email = "Invalid email format";
    }
    if (!password || password?.length < 1) {
        message.Password = "Password must be longer than 1 character";
    }

    if (name?.length >= 3 && emailRegex.test(email) && password?.length >= 1) {
        let Check = await dbcmd.findEmail(email);
        if (Check) {
            res.json({ message: "User Already exists" });
        } else {
            Check = await dbcmd.NewUser(name, email, password);
            if (Check) {
                res.json({ message: "User Created Successfully" });
            }
        }
    } else {
        res.send(message);
    }
}

module.exports.updatePassword = async (req, res) => {
    try {
        // console.log(req.body);
        const email = req.flash("email")[0] || '';
        const newPAss = req.body.Newpassword;
        const data = await dbcmd.getPassword(email, req.body?.Password);
        // console.log("data is " + data);
        console.log(email, newPAss, data);
        if (data) {
            const hash = await bcrypt.createHash(newPAss);
            const NewPassFlag = await dbcmd.updatePassword(email, hash);
            res.json(NewPassFlag);
        }
        else {
            req.json({ success: "false", data: data });
        }
    } catch (error) {
        res.json({ success: "false", error })
    }
}
module.exports.getprofile = async (req, res) => {
    try {
        // Extracting ID from the path
        const id = req.path.split('/').pop();
        console.log(id);
        const userdetails = await dbcmd.getuserdetails(id);


        // console.log(userdetails);
        // Omitting the password field if it exists in userdetails
        if (userdetails && userdetails.password) {
            userdetails.password = undefined
        }
        // Sending a response
        res.json({ userdetails });
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
}
module.exports.getRazerToken = async (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    res.json({ keyId });
}
module.exports.editProfile = async (req, res) => {
    // console.log(req)
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const response = await uploadToCloudinary(req.file.path, req.file.filename);
        if (!response || !response.url) {
            throw new Error('Failed to upload to Cloudinary');
        }

        const ack = await dbcmd.updateProfileImage(response.url, req.params.id);
        if (!ack.acknowledged) {
            throw new Error('Failed to update profile image in the database');
        }

        res.json({ message: ack.acknowledged });
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }

}

module.exports.updateUserDetails = async (req, res) => {
    try {
        const { name, email, label, address } = req.body;
        const id = req.params.id;

        if (!name && !email && !label && !address) {
            return res.status(400).json({ message: "Provide the data " });
        }

        if (name && email) {

            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== id) {
                return res.status(400).json({ message: "Email already exists for another user" });
            }
            const updatedFields = {};
            if (name) updatedFields.name = name;
            if (email) updatedFields.email = email;

            try {
                const result = await User.findByIdAndUpdate(
                    { _id: id },
                    updatedFields,
                    { new: true } // To get the updated document
                );

                if (!result) {
                    return res.status(404).json({ message: "User not found" });
                }

                // result.password = undefined;/
                return res.json({ message: "User details updated successfully" });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Error updating user details", error });
            }
        }
        else {
            try {
                console.log(id);
                const user = await User.findById(id);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                const newAddress = { label, address };
                user.addresses.push(newAddress);
                const result = await user.save();
                // result.password = undefined;
                return res.json({ message: "User address updated successfully" });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "Error updating user address", error });
            }
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error });
    }
};
module.exports.updateOrDeleteAdress = async (req, res) => {
    // console.log(req.body);
    try {
        const userId = req.params.id;
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ message: "User not found" });
            // console.log('User not found');
        }

        // Update the addresses in the user document
        user.addresses = req.body;
        // Save the updated user
        const updatedUser = await user.save();
        updatedUser.password = undefined;
        res.json({ message: "Updated Succesfully", user: updatedUser });
        // console.log('User updated:', updatedUser);
    } catch (error) {
        console.log(error);
        return res.json({ message: "Error updating addresses" });
    }
}
module.exports.logout = (req, res) => {
    res.clearCookie("jwt").status(200).json({ message: "Successfully logged out" });
}
//orders
module.exports.order = async (req, res) => {
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // setting up options for razorpay order.
    const options = {
        amount: Number(req.body.amount),
        currency: "INR",
        // receipt: req.body.receipt,
        // payment_capture: 1
    };
    try {
        const response = await razorpay.orders.create(options)
        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
        })
    } catch (err) {
        console.log(err);
        res.status(400).send('Not able to create order. Please try again!');
    }
}
module.exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    let hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    if (razorpay_signature === generated_signature) {
        // let checkOrderUpdate = await Order.findOneAndUpdate({ _id }, { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature }, { new: true });
        // console.log(checkOrderUpdate);
        res.json({ "success": true, message: "Payment has been verified" })
    }
    else
        res.json({ message: "Payment verification failed" })
}
module.exports.createOrders = async (req, res) => {
    const id = req.params.id;
    if (!id) return res.json({ message: "Authentication Failed" });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log(req.body);
    // return;
    const data = req.body.data;
    console.log(id);
    console.log(data);
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (data.length <= 0) {
            return res.json({ message: "Add the Product in the Cart" });
        }
        const productOutOfStock = [];
        for (const element of data) {
            const product = await productModle.findById(element.id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${element.id} not found` });
            }

            if (element.numberOfItems <= product.Stock) {
                const order = new Order({
                    userId: id,
                    items: {
                        productName: product.ProductName,
                        quantity: element.numberOfItems,
                        price: product.ProductPrice,
                        image: product.img[0],
                        discount: element.discount,
                        address: element.address,
                        total: (parseInt(element.numberOfItems) * parseInt(product.ProductPrice)) - (parseInt(element.discount) || 0)
                    },
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature
                });
                await order.save();
                user.orders.push(order._id);

                product.Stock -= element.numberOfItems;
                await product.save();
            } else {
                productOutOfStock.push({ id: element.id, message: `This product (${product.ProductName}) has only ${product.Stock} in stock` });
            }
        }

        await user.save();

        if (productOutOfStock.length > 0) {
            return res.status(200).json({ message: "Some products are out of stock", productOutOfStock });
        }
        return res.json({ message: "Orders placed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating orders" });
    }
};

module.exports.allorders = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    let skip = (page - 1) * limit;
    const { isOrderChangeView } = req.query;
    console.log(isOrderChangeView)
    const totalItems = await Order.find().countDocuments();
    const lastPage = Math.ceil(totalItems / limit);
    const Allorder = await Order.find({
        orderStatus: isOrderChangeView
    }).populate('userId').skip(skip).limit(limit).exec();
    Allorder.forEach((value) => {
        value.userId.password = undefined;
        value.userId.addresses = undefined;
        value.userId.orders = undefined;
        value.userId.email = undefined;
    })
    res.json({ "order": Allorder, lastPage });
}
module.exports.userOrder = async (req, res) => {
    const id = req.params.id;
    try {
        const orders = await Order.find({ userId: id });
        res.json({ "Orders": orders });
    } catch (error) {
        res.json({ "Error": error.message });
    }
    // console.log(id);
}
module.exports.orderStatus = async (req, res) => {
    const data = req.body.data || [];
    console.log(data);
    if (data.length <= 0) {
        return res.json({ "message": "Please provide data" });
    }
    try {
        const updateStatus = async () => {
            await Order.findByIdAndUpdate(
                { _id: data.orderId },
                { orderStatus: data.orderStatus },
            );
        }
        updateStatus();
        res.json({ "message": "Changes Succesfully updated", "success": "true" })
    } catch (error) {
        console.log(error);
        res.json({ "message": "error" });
    }
}
module.exports.userRoleUpdate = async (req, res) => {
    const data = req.body.data || [];
    console.log(data);

    if (data?.length <= 0) {
        return res.json({ "message": "Please provide data" });
    }
    try {
        data.forEach(async (value, i) => {
            await User.findByIdAndUpdate(
                { _id: value.userID },
                { role: value.role },
            );
        })
        res.json({ "message": "Changes Succesfully updated", "success": "true" })
    } catch (error) {
        console.log(error);
        res.json({ "message": 'err' });
    }

}
// admin page

// this is mysql
// module.exports.addProduct = async (req, res) => {
//     const { ProductId, ProductName, ProductPrice, description, Category, rating, Stock, img } = req.body;
//     console.log(img);
//     const Result = await Productdb.InsertNewProduct(ProductId, ProductName, ProductPrice, Category, description, rating, Stock);
//     console.log(Result);
//     if (Result === "ER_DUP_ENTRY: Duplicate entry '1' for key 'product.ProductId'") {

//         return res.json({ sucess: "false", message: "Product already there" });
//     }
//     res.json({ sucess: "true" })
// }
// this is mongo
module.exports.allusers = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    let skip = (page - 1) * limit;
    const totalItems = await User.find().countDocuments();
    const lastPage = Math.ceil(totalItems / limit);
    const users = await User.find().skip(skip).limit(limit);
    users.forEach((value) => {
        value.password = undefined;
        value.addresses = undefined;
        value.orders = undefined;
    })
    res.json({ users, lastPage });
}
module.exports.deleteuser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find all products where the user's rating needs to be removed
        const products = await productModle.find({ 'RatingMessage.userId': userId });

        // Remove the user from the User model
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.json({ message: "User does not exist" });
        }
        const updatePromises = products.map(async (product) => {

            let totalRating = 0;
            let count = 0;
            product.RatingMessage.forEach((ratingMessage) => {
                if (ratingMessage.userId.toString() !== userId) {
                    totalRating += ratingMessage.Rating;
                    count++;
                }
            });
            const newRating = count > 0 ? totalRating / count : 0;

            product.Rating = newRating;
            product.RatingMessage = product.RatingMessage.filter((ratingMessage) => ratingMessage.userId.toString() !== userId);

            return product.save();
        });

        await Promise.all(updatePromises);

        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.log(err.message);
        res.send({ message: "Error" });
    }
}
module.exports.adminCheck = async (req, res) => {
    res.json({ message: "Admin true" });
}
module.exports.dashboard = async (req, res) => {
    const details = {};
    try {
        details.productCount = await productModle.countDocuments();
        details.userCount = await User.countDocuments();
        details.orderCount = await Order.countDocuments();
        const products = await productModle.find();
        const amountEarned = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$items.total" }
                }
            }
        ]);
        details.amountEarned = amountEarned[0]?.totalAmount || 0;
        let OutOfStock = 0;
        let InStock = 0;
        products.forEach((value) => {
            if (value.Stock <= 0) {
                OutOfStock++;
            } else {
                InStock++;
            }
        });
        details.OutOfStock = OutOfStock;
        details.InStock = InStock;
        res.json(details);
    } catch (error) {
        console.log(error);
        res.json({ message: "Error" });
    }
};

module.exports.addProduct = async (req, res) => {
    const err = { ProductName: "", ProductPrice: "", Category: "", HighligthPoint: "" };
    var imgUrl = '';
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }
        const response = await uploadToCloudinary(req.file.path, req.file.filename);
        if (!response || !response.url) {
            throw new Error('Failed to upload to Cloudinary');
        }
        imgUrl = response.url;
        console.log("Uploaded ")
    } catch (error) {
        // console.error('Error:', error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });

    }
    try {
        // if req.img is not available, file not uploaded
        // const imagePath = req.img.replace(/\\/g, '/')?.replace('uploads/', '');
        // console.log(imagePath);

        const data = new productModle(req.body);
        let arr = JSON.parse(req.body.HighligthPoint).split(","); // Convert string to array
        data.HighligthPoint = arr;
        // console.log(data);
        if (data?.ProductName && data?.ProductPrice && data?.Category[0]?.split(" ")?.join("").length > 1) {
            // console.log(data?.Category?.length);
            const result = await data.save();
            let user = await productModle.findOne({
                _id: result._id
            })
            user.img.push(imgUrl);
            await user.save();
            return res.json({ success: "True", data });
        }
        else {
            // console.log(data?.Category[0]?.length);
            // console.log(data?.Category.length);
            if (!data?.ProductName) {
                err.ProductName = "Enter Product name";
            }
            if (!data?.ProductPrice) {
                err.ProductPrice = "Enter Product Price";
            }
            if (!(data?.Category[0]?.length > 1) || !(data?.Category.length > 1)) {
                err.Category = "Enter the Product Category";
            }
            if (!(data?.HighligthPoint?.length > 1)) {
                err.HighligthPoint = "Enter the Product HighligthPoint";
            }
            return res.json({ success: "False", err });
        }
    }
    catch (err) {
        console.log(err?.message);
        res.send(err.message);
    }
}

module.exports.updateproduct = async (req, res) => {
    const id = req.params.id;
    var imgUrl = '';
    try {
        if (req.file) {
            const response = await uploadToCloudinary(req.file.path, req.file.filename);
            if (!response || !response.url) {
                throw new Error('Failed to upload to Cloudinary');
            }
            imgUrl = response.url;
        }
    } catch (error) {
        // console.error('Error:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
    let updateFields = {
        ProductPrice: req.body?.ProductPrice,
        ProductName: req.body?.ProductName,
        Description: req.body?.Description,
        Stock: req.body?.Stock,
        Category: req.body?.Category,
        HighligthPoint: req.body?.HighligthPoint ? JSON.parse(req.body?.HighligthPoint) : ''
    };
    // console.log(updateFields.HighligthPoint.split(','));
    if (req.file) {

        updateFields.img = imgUrl;
    }
    try {
        const data = await productModle.updateOne(
            { _id: id },
            { $set: updateFields }
        );
        res.send({ success: "true", message: "Product Updated Success" });
    } catch (err) {
        console.log(err.message);
        res.json({ message: err.message });
    }

}
module.exports.deleteprodcut = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await productModle.deleteOne(
            {
                _id: id
            }
        )
        if (data.deletedCount == 0) {
            return res.json({ message: "Product Does not exist" });
        }
        // console.log(data);
        res.json({ success: "true", message: "Product deleted Success" });
    } catch (err) {
        console.log(err.message);
        res.json({ message: "Error" });
    }

}
//Get Product

module.exports.allproductList = async (req, res) => {

    const { rating, category, price, productname } = req.query;
    let query = {};
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    let skip = (page - 1) * limit;
    const totalItems = await productModle.find().countDocuments();
    const lastPage = Math.ceil(totalItems / limit);
    // If productname is provided, search for it in ProductName, Category, and Description
    if (productname) {
        query.$or = [
            { ProductName: { $regex: productname, $options: 'i' } },
            { Category: { $regex: productname, $options: 'i' } },
            { Description: { $regex: productname, $options: 'i' } }
        ];
        if (rating) {
            query.Rating = { $gte: parseInt(rating) };
        }
        if (price) {
            const [minPrice, maxPrice] = price.split('-').map(parseFloat);
            query.ProductPrice = { $gte: minPrice, $lte: maxPrice };
        }
        if (category) {
            query.Category = { $regex: category, $options: 'i' };
        }
    } else {
        // If productname is not provided, apply other filters (if available)
        if (rating) {
            query.Rating = { $gte: parseInt(rating) };
        }
        if (price) {
            const [minPrice, maxPrice] = price.split('-').map(parseFloat);
            query.ProductPrice = { $gte: minPrice, $lte: maxPrice };
        }
        if (category) {
            query.Category = { $regex: category, $options: 'i' };
        }
    }

    try {
        let filterProduct = await productModle.find(query).skip(skip).limit(limit);
        return res.json({ filterProduct, lastPage });
    } catch (error) {
        console.log(error);
        return res.json({ "err": "Provide wrong parameter" });
    }

}

module.exports.productupdate = async (req, res) => {
    const { userID, productID, rating, message } = req.body;
    console.log(userID, productID, rating, message)
    try {
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const product = await productModle.findById(productID);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        if (message.length < 1) {
            return res.status(400).json({ message: "Message must not be empty" });
        }
        const ratingMessage = {
            Rating: rating,
            message,
            userId: userID
        };
        // console.log(product)
        var userCheck = product.RatingMessage.find((value) => value.userId == userID);
        // console.log(userCheck)
        if (userCheck) {
            product.RatingMessage.forEach((value) => {
                if (value.userId == userID) {
                    value.Rating = rating;
                    value.message = message;
                }
            })
            let totalRating = 0;
            product.RatingMessage.forEach((rating) => {
                totalRating += rating.Rating;
            });
            product.Rating = totalRating / (product.RatingMessage.length);
            await product.save();
            return res.json({ message: "Rating and message updated successfully" });

        }
        product.RatingMessage.push(ratingMessage);
        let totalRating = 0;
        product.RatingMessage.forEach((rating) => {
            totalRating += rating.Rating;
        });
        totalRating += rating;
        product.Rating = totalRating / (product.RatingMessage.length + 1);
        await product.save();

        return res.json({ message: "Rating and message added successfully" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error adding rating and message" });
    }
}
module.exports.Oneproduct = async (req, res) => {
    try {
        const id = req.query.id;
        const data = await productModle.findById(id).populate('RatingMessage.userId').exec();
        console.log(data);

        data.RatingMessage.forEach((value) => {
            if (value.userId) {
                value.userId.password = undefined;
                value.userId.addresses = undefined;
                value.userId.orders = undefined;
                value.userId.email = undefined;
                value.userId.role = undefined;
            }

        })

        let SuggestedProduct = JSON.parse(data.Category[0]);
        var SuggestedProductList = await productModle.find({});
        let temp = []
        SuggestedProduct.forEach((val) => {
            let temp1 = SuggestedProductList.filter((value) => value.Category[0].toLocaleLowerCase().match(val.toLocaleLowerCase()))
            temp1.forEach((value) => {
                if (value._id != id && !temp.includes(value)) {
                    temp.push(value);
                }
            })
        })
        let FinalSuggestedproduct = [];
        temp.forEach((value) => {
            FinalSuggestedproduct.push({
                ProductName: value.ProductName,
                ProductPrice: value.ProductPrice,
                img: value.img[0],
                _id: value._id,
                Rating: value.Rating,
                Description: value.Description,
            });
        })

        data.SuggestedProduct = FinalSuggestedproduct;//iF you want to add the suggested product or some other data first we need to declare the data in the schema
        res.json(data);
    }
    catch (err) {
        console.log(err.message);
        res.json({ "err": "Provide wrong parameter" });
    }
}
module.exports.CartProductList = async (req, res) => {
    const CartItemsId = req.body;
    try {
        const promises = CartItemsId.map(async (element) => {
            return await productModle.findById(element.id).exec();
        });

        const responseObject = await Promise.all(promises);

        // Rearrange the responses according to the original order
        const orderedResponse = CartItemsId.map((element) => {
            const found = responseObject.find((item) => item._id.equals(element.id));
            return found;
        });

        res.json(orderedResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports.fileUpload = (req, res) => {
    console.log(req.flash("test"));
    res.send("hlo");
}

// home page

module.exports.homepage_get = (req, res) => {
    res.json({ Id: "2@#g", ProductName: "Clothes", Productimg: "/img/?", Price: "50%" });
}