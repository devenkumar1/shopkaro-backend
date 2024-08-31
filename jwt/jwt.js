const jwt = require('jsonwebtoken');
const dbcmd = require('../db/dbcmd');
const key = process.env.SECRETKEY;

module.exports.createjwt = async (email) => {
    try {
        const user_id = await dbcmd.getId(email);
        const expiresInDays = 31;
        const token = jwt.sign({ user_id }, key, { expiresIn: `${expiresInDays}d` }); // Signing the user_id payload

        return token;
    } catch (err) {
        console.log(err.message);
        throw new Error('Failed to create JWT token');
    }
};
module.exports.verifytoken = (token) => {
    try {
        const decoded = jwt.verify(token, key);

        // console.log(decoded);
        return { success: 1, user: decoded };
        // res.status(200).json({ data: decoded, message: 'Token verified successfully' });
    } catch (error) {
        // console.error(error);
        if (error instanceof jwt.TokenExpiredError) {
            // Token has expired
            // res.status(401).json({ message: 'Token has expired' });
            console.log("Token is expired");
        } else {
            // Other verification errors
            // res.status(401).json({ message: 'Token verification failed' });
            console.log("Token verification failed")
        }
        return { success: 0 };
    }
}

