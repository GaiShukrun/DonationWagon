const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/Users'); 
const bcrypt = require('bcrypt');


// Connect to MongoDB
connectDB();
const app = express();

app.use(cors({
    origin: [
        'http://localhost:19006',
        'http://localhost:19000', 
        'http://localhost:8081',
        'http://localhost:3000'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body); // Add this for debugging

    try {
        const { username, password, firstname, lastname, securityQuestion, securityAnswer } = req.body;

        // Validate required fields
        if (!username || !password || !firstname || !lastname || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ 
                message: 'All fields are required',
                received: req.body 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
            firstname,
            lastname,
            securityQuestion,
            securityAnswer: securityAnswer.toLowerCase()
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});


// Test endpoint
app.get('/', (req, res) => {
    res.send('Server is running');
  });

app.get('/test-db', async (req, res) => {
    try {
        // You can add a test query here once you set up your models
        res.json({ message: 'Database connection working!' });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});