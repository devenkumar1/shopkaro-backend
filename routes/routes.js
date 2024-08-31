const express = require('express');
const authcontrol = require('../controller/authcontroll');
const routes = express();
const upload = require('../middleware/fileupl');
const middlewares = require('../middleware/privateroute');
const uploadUserProfile = require('../middleware/userprofileupload');
// login page
routes.use(express.json());

// user
// routes.get('/auth/user/login', authcontrol.login_get);
routes.post('/auth/user/login', authcontrol.login_post);
// routes.get('/auth/user/signup', authcontrol.signup_get);
routes.post('/auth/user/signup', authcontrol.signup_post);
routes.put('/auth/user/updatePassword', middlewares.checkjwt, authcontrol.updatePassword);
routes.get('/auth/user/profile/:id', middlewares.checkjwt, authcontrol.getprofile);
routes.post('/auth/user/profile/:id/edit/profileimage', uploadUserProfile, middlewares.checkjwt, authcontrol.editProfile);
routes.post('/auth/user/profile/:id/edit/profile/details', middlewares.checkjwt, authcontrol.updateUserDetails);
routes.post('/auth/user/profile/:id/edit/profile/address', middlewares.checkjwt, authcontrol.updateOrDeleteAdress);
routes.get('/auth/user/logout', middlewares.checkjwt, authcontrol.logout);
routes.get('/auth/user/getrazerToken', middlewares.checkjwt, authcontrol.getRazerToken);

// admin page
routes.get('/auth/admin/dashboard', middlewares.AdminRoute, authcontrol.dashboard);
routes.get('/auth/admin/check', middlewares.AdminRoute, authcontrol.adminCheck);
routes.get('/auth/user/profile/:id', middlewares.AdminRoute, authcontrol.getprofile);
routes.get('/auth/admin/allorders', middlewares.AdminRoute, authcontrol.allorders);
routes.post('/auth/admin/allorders/status', middlewares.AdminRoute, authcontrol.orderStatus);
routes.post('/auth/admin/addproduct', uploadUserProfile, middlewares.AdminRoute, authcontrol.addProduct);
routes.post('/auth/admin/userrole', middlewares.AdminRoute, authcontrol.userRoleUpdate);
routes.put('/auth/admin/updateproduct/:id', uploadUserProfile, middlewares.AdminRoute, authcontrol.updateproduct);
routes.get('/auth/admin/allusers', middlewares.AdminRoute, authcontrol.allusers);
routes.delete('/auth/admin/deleteuser/:id', middlewares.AdminRoute, authcontrol.deleteuser);
routes.delete('/auth/admin/deleteprodcut/:id', middlewares.AdminRoute, authcontrol.deleteprodcut);
// file upload
// routes.post('/auth/admin/fileupload', authcontrol.fileUpload);

//getProduct
routes.post('/order', authcontrol.order);
routes.post('/verifyPayment', authcontrol.verifyPayment);
routes.get('/productList', authcontrol.allproductList)
routes.post('/product/review', middlewares.checkjwt, authcontrol.productupdate)
routes.get('/product/:', authcontrol.Oneproduct);
routes.post('/cartList', authcontrol.CartProductList);
//ORDERS
routes.post('/auth/user/profile/:id/orders/createorder', middlewares.checkjwt, authcontrol.createOrders);
routes.get('/auth/user/profile/:id/orders', middlewares.checkjwt, authcontrol.userOrder);
// home page
routes.get('/', authcontrol.homepage_get);

module.exports = routes;