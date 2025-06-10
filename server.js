const express = require('express');   //importing express
const bodyParser = require('body-parser');   //importing body-praser #prase incoming request bodies in case you are working with json data
const cors = require('cors');                //CORS is a security feature that allows or restricts resource
const fs = require('fs');                  //importing file system
const path = require('path');              //include path of the file
const Joi = require('joi'); // Add for schema validation

const app = express();
const port = 3000;             //intializing port number

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON body
 // Parse JSON request bodies

// Path to the JSON data file
const dataFile = path.join(__dirname, 'data.json');

// Helper functions to read and write JSON data
function readData() {
    if (!fs.existsSync(dataFile)) {    //used to synchronously check if a file or directory exists at a specified path.
        fs.writeFileSync(dataFile, JSON.stringify({ participants: [], organizers: [] }, null, 2));
    }
    const rawData = fs.readFileSync(dataFile);
    return JSON.parse(rawData);
}

function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Schema Validation with Joi
const registerSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    branch: Joi.string().optional(),
    year: Joi.string().optional(),
    clubName: Joi.string().optional(),
    department: Joi.string().optional(),
    role: Joi.string().valid('participant', 'organizer').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('participant', 'organizer').required()
});

// Middleware for logging
app.use((req, res, next) => {
    console.log('Incoming Request:', {
        method: req.method,
        url: req.url,
        body: req.body
    });
    next();
});

// Registration route
app.post('/register', (req, res) => {
    try {
        // Validate the request body
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { fullName, email, password, branch, year, clubName, department, role } = value;

        const data = readData();

        // Check for duplicate email
        const existingEmail = role === 'participant'
            ? data.participants.find(user => user.email === email)
            : data.organizers.find(user => user.email === email);

        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists, please use a different email.' });
        }

        // Check for duplicate club name for organizers
        if (role === 'organizer' && data.organizers.find(user => user.clubName === clubName)) {
            return res.status(400).json({ message: 'A user is already registered for this club as an organizer.' });
        }

        const newUser = {
            fullName,
            email,
            password, // Hash passwords in production
            role,
            branch: role === 'participant' ? branch : undefined,
            year: role === 'participant' ? year : undefined,
            clubName: role === 'organizer' ? clubName : undefined,
            department: role === 'organizer' ? department : undefined
        };

        if (role === 'participant') {
            data.participants.push(newUser);
        } else {
            data.organizers.push(newUser);
        }

        writeData(data);
        res.status(200).json({ message: `Registration successful for ${role}.` });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: 'An internal error occurred. Please try again later.' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password, role } = req.body;

    // Validate incoming data
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required.' });
    }

    // Load data from the JSON file
    const data = readData();

    // Find user by role
    let user;
    if (role === 'participant') {
        user = data.participants.find(u => u.email === email);
    } else if (role === 'organizer') {
        user = data.organizers.find(u => u.email === email);
    } else {
        return res.status(400).json({ message: 'Invalid role provided.' });
    }

    // Check if user exists and password matches
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Success response
    res.status(200).json({
        message: `Login successful as ${role}.`,
        user: {
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
