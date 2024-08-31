const connection = require('./db');

const NewProduct = `
CREATE TABLE IF NOT EXISTS PRODUCT(
    ID VARCHAR(255) PRIMARY KEY,
    ProductId varchar(255) NOT NULL UNIQUE,
    Productname VARCHAR(255) NOT NULL,
    Productprice VARCHAR(255) NOT NULL,
    Category VARCHAR(255) NOT NULL,
    Description TEXT,
    Rating INT,
    Stock INT
)
`;
const ProductImg = `
CREATE TABLE IF NOT EXISTS IMAGES (
    ImageID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID VARCHAR(255), 
    ImageURL VARCHAR(255),
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ID)
);
`

connection.query(NewProduct, (err, data) => {
    if (err) {
        return console.log(err.message);
    }
    // console.log(data);
});
connection.query(ProductImg, (err, data) => {
    if (err) {
        return console.log(err.message);
    }
    // console.log(data);
});

module.exports.InsertNewProduct = async (productid, productname, productprice, des, category, rating, Stock) => {
    try {
        const Result = await new Promise((res, rej) => {
            const ans = connection.query(`insert into product(id,productid,productname,productprice,category,description,rating,stock) values  (UUID(),?,?,?,?,?,?,?) `, [productid, productname, productprice, des, category, rating, Stock], (err, data) => {
                if (err) {
                    rej(err.message);

                }
                res('g');
                // console.log(data);
            });
        });
        return Result;
    }
    catch (err) {
        // console.log(err);
        return err;
    }
    // connection.query(`select id from where productname="${productname}" && productprice`)
}



module.exports.InsertNewImg = (img) => {
    console.log(img);
}