const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/Users'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
connectDB();
const app = express();

// Configure CORS properly
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body);

    try {
        const { username, password, firstname, lastname, securityQuestion, securityAnswer } = req.body;

        // Validate required fields
        if (!username || !password || !firstname || !lastname || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ 
                message: 'All fields are required',
                received: req.body 
            });
        }
        if (username.length < 4 || !/^[a-zA-Z]/.test(username)) {
            return res.status(400).json({ 
                message: 'Username must be at least 4 characters and start with a letter' 
            });
        }
        
        if (password.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters and contain at least one special character' 
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
            securityAnswer,
            points: 0
        });

        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user data and token
        res.status(201).json({ 
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                points: newUser.points
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);
        
        // Validate input
        if (!username || !password) {
            console.log('Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Find user
        const user = await User.findOne({ username });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Verify password
        console.log('Comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');
        
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT token
        console.log('Generating token...');
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user data and token
        console.log('Login successful for:', username);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                points: user.points,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Request password reset endpoint
app.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email (username)
        const user = await User.findOne({ username: email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return the security question
        res.json({ 
            securityQuestion: user.securityQuestion 
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Verify security answer endpoint
app.post('/verify-security-answer', async (req, res) => {
    try {
        const { email, answer } = req.body;
        
        // Find user by email (username)
        const user = await User.findOne({ username: email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify security answer
        if (user.securityAnswer.toLowerCase() !== answer.toLowerCase()) {
            return res.status(401).json({ message: 'Incorrect security answer' });
        }
        
        // Generate temporary token for password reset
        const resetToken = jwt.sign(
            { id: user._id, username: user.username, purpose: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.json({ 
            message: 'Security answer verified',
            resetToken 
        });
    } catch (error) {
        console.error('Security answer verification error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset password endpoint
app.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (!decoded || decoded.purpose !== 'reset') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        
        // Validate password
        if (newPassword.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters and contain at least one special character' 
            });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update user password
        await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Debug endpoint to check if a user exists (for debugging only)
app.get('/check-user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        console.log('Checking if user exists:', username);
        
        const user = await User.findOne({ username });
        
        if (user) {
            console.log('User found:', username);
            return res.json({ 
                exists: true, 
                username: user.username,
                // Don't send sensitive data like password
                hasPassword: !!user.password,
                passwordLength: user.password ? user.password.length : 0
            });
        } else {
            console.log('User not found:', username);
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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

// Update profile image
app.put('/update-profile-image', async (req, res) => {
  try {
    const { userId, profileImage } = req.body;
    
    if (!userId || profileImage === undefined) {
      return res.status(400).json({ message: 'User ID and profile image are required' });
    }
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true } // Return updated document
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the updated user without sensitive data
    return res.status(200).json({ 
      message: 'Profile image updated successfully', 
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        points: updatedUser.points,
        profileImage: updatedUser.profileImage
      }
    });
    
  } catch (error) {
    console.error('Error updating profile image:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});