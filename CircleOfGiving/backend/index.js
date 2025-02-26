const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/Users'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Connect to MongoDB
connectDB();
const app = express();

app.use(cors({
    origin: '*',

    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body); // Log request body

    try {
        const { username, password, firstname, lastname } = req.body;

        // Validate required fields
        if (!username || !password || !firstname || !lastname ) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({ 
                message: 'All fields are required',
                received: req.body 
            });
        }
        if (username.length < 4 || !/^[a-zA-Z]/.test(username)) {
            console.log('Validation failed: Invalid username');
            return res.status(400).json({ 
                message: 'Username must be at least 4 characters and start with a letter' 
            });
        }
        
        if (password.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            console.log('Validation failed: Invalid password');
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters and contain at least one special character' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('User already exists:', username);
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
        });

        await newUser.save();
        console.log('User created successfully:', username);
        res.status(201).json({ message: 'User created successfully' });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Sign-In Endpoint
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Sign in successful', token });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Server error' });
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