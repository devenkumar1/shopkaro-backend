const bcrypt = require('bcrypt');
const saltRounds = 10;
module.exports.createHash = async (password) => {

    const hashPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                // console.log(hash);
                resolve(hash);
            }
        });
    });
    // console.log(hashPassword);
    return hashPassword;
}
module.exports.checkPassword = async (password, hash) => {

    const PasswordChecker = await new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) {
                console.log(err.message);
                reject(err.message);
            }
            else {
                // console.log(result);
                resolve(result);
            }
        });
    });
    // console.log(hashPassword);
    return PasswordChecker;
}