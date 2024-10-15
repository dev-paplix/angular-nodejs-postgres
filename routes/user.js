const express = require('express');
const connection = require('../connection');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
require('dotenv').config();


var auth = require('../services/authentication')
var checkRole = require('../services/checkRole')

router.post('/signup', async (req, res) => {
    let user = req.body;

    // Check if the user already exists
    let query = `SELECT email, password, role, status FROM "users" WHERE email=$1`;

    try {
        const results = await connection.query(query, [user.email]);

        if (results.rowCount === 0) {
            // Hash the password before storing it
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Insert the new user into the database
            query = `INSERT INTO "users"(name, contactNumber, email, password, status, role)
                    VALUES($1, $2, $3, $4, 'false', 'user') RETURNING *`;

            const insertResult = await connection.query(query, [user.name, user.contactNumber, user.email, hashedPassword]);

            return res.status(200).json({ message: "Successfully Registered", user: insertResult.rows[0] });
        } else {
            return res.status(400).json({ message: "Email already exists." });
        }
    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const user = req.body;

    const query = `SELECT email, password, role, status FROM "users" WHERE email=$1`;
    try {
        const results = await connection.query(query, [user.email]);

        if (results.rowCount === 0 || !await bcrypt.compare(user.password, results.rows[0].password)) {
            return res.status(401).json({ message: "Incorrect Username or Password" });
        } else if (results.rows[0].status === 'false') {
            return res.status(401).json({ message: "Wait for approval" });
        } else {
            const response = { email: results.rows[0].email, role: results.rows[0].role };
            const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' });
            return res.status(200).json({ token: accessToken });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Nodemailer transporter setup
var transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.PASSWORD
    }
});

// Forgot password route
router.post('/forgotpassword', (req, res) => {
    const user = req.body;
    // Fix the typo: change 'wher' to 'WHERE'
    const query = "SELECT email, password FROM users WHERE email=$1"; 
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.rowCount <= 0) {
                return res.status(200).json({ message: "Password sent to your email" });
            } else {
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results.rows[0].email,
                    subject: 'Password by ticketsale',
                    html: '<p><b>Your Login details for the Ticket Sale</b><br><b>Email: </b>' + results.rows[0].email + '<br><b>Password: </b>' + results.rows[0].password + '<br></p>'
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent:' + info.response);
                    }
                });
                return res.status(200).json({ message: "Password sent to your email" });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

// Get user details route
router.get('/get',checkRole.checkRole, auth.authenticationToken , async (req, res) => {

    // Complete the SQL query with the FROM clause
    var query = "SELECT id, name, contactNumber, email, status, role FROM users where role='user'"; 
    try {
        const results = await connection.query(query);
        return res.status(200).json(results.rows);
    } catch (err) {
        return res.status(500).json(err);
    }
});

router.patch('/update',checkRole.checkRole, auth.authenticationToken, (req,res)=>{
    let user = req.body;
    var query = "UPDATE users SET status=$1 WHERE id=$2";

    connection.query(query, [user.status, user.id], (err, results)=>{
        if(!err){
            if(results.affectedRow == 0){
                return res.status(404).json({message:"User id is not exist"});
            }
            return res.status(200).json({message: "User updated"});
        }else{
            return res.status(500).json(err);
        }

    })
})

router.get('/checkToken',checkRole.checkRole ,auth.authenticationToken, (req,res)=>{
    return res.status(200).json({message:"true"});
})

router.post('/changePassword', auth.authenticationToken, (req, res) => {
    const user = req.body;
    const email = res.locals.email;
    
    var query = "SELECT * FROM users WHERE email=$1";
    
    // Fetch the user by email
    connection.query(query, [email], async (err, results) => {
        if (!err) {
            if (results.rowCount <= 0) {
                return res.status(400).json({ message: "User not found" });
            }

            // Compare the old password from the request body with the hashed password in the database
            const isMatch = await bcrypt.compare(user.oldPassword, results.rows[0].password);
            
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect old password" });
            }

            // Hash the new password before storing it
            const hashedNewPassword = await bcrypt.hash(user.newPassword, 10);
            
            // Update the user's password in the database
            query = "UPDATE users SET password=$1 WHERE email=$2";
            connection.query(query, [hashedNewPassword, email], (err, updateResults) => {
                if (!err) {
                    return res.status(200).json({ message: "Password updated successfully" });
                } else {
                    return res.status(500).json(err);
                }
            });
        } else {
            return res.status(500).json(err);
        }
    });
});

module.exports = router;
