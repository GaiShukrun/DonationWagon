const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/Users'); 
const Donation = require('./models/Donation');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const sharp = require('sharp');

// Connect to MongoDB
connectDB();
const app = express();

// Configure CORS to allow all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Increase JSON payload size limit for image processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add a simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

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

// Donation Endpoints
// Save donation to cart
app.post('/donations', async (req, res) => {
  try {
    const { userId, donationType, clothingItems, toyItems } = req.body;
    
    if (!userId || !donationType) {
      return res.status(400).json({ message: 'User ID and donation type are required' });
    }
    
    // Validate donation type
    if (donationType !== 'clothes' && donationType !== 'toys') {
      return res.status(400).json({ message: 'Invalid donation type' });
    }
    
    // Validate items based on donation type
    if (donationType === 'clothes' && (!clothingItems || clothingItems.length === 0)) {
      return res.status(400).json({ message: 'Clothing items are required for clothes donation' });
    }
    
    if (donationType === 'toys' && (!toyItems || toyItems.length === 0)) {
      return res.status(400).json({ message: 'Toy items are required for toys donation' });
    }
    
    // Handle multiple donations
    const donationsToSave = donationType === 'clothes' ? clothingItems : toyItems;
    const savedDonations = [];

    for (const item of donationsToSave) {
      const newDonation = new Donation({
        userId,
        donationType,
        status: 'pending',
        clothingItems: donationType === 'clothes' ? [item] : [],
        toyItems: donationType === 'toys' ? [item] : []
      });
      await newDonation.save();
      savedDonations.push(newDonation);
    }
    
    // Return success response
    return res.status(201).json({ 
      message: 'Donations saved successfully',
      donations: savedDonations
    });
    
  } catch (error) {
    console.error('Error saving donations:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's donations
app.get('/donations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    console.log('Fetching donations for userId:', userId);
    
    // Convert string userId to MongoDB ObjectId
    const mongoose = require('mongoose');
    let userObjectId;
    
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    // Find all donations for the user using ObjectId
    const donations = await Donation.find({ userId: userObjectId }).sort({ createdAt: -1 });
    
    console.log(`Found ${donations.length} donations for user ${userId}`);
    
    // Return empty array if no donations found
    return res.status(200).json({ 
      success: true,
      donations: donations || [] 
    });
    
  } catch (error) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get a single donation by ID
app.get('/donation/:donationId', async (req, res) => {
  try {
    const { donationId } = req.params;
    
    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }
    
    console.log('Fetching donation with ID:', donationId);
    
    // Convert string donationId to MongoDB ObjectId
    const mongoose = require('mongoose');
    let donationObjectId;
    
    try {
      donationObjectId = new mongoose.Types.ObjectId(donationId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err.message);
      return res.status(400).json({ message: 'Invalid donation ID format' });
    }
    
    // Find the donation
    const donation = await Donation.findById(donationObjectId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    console.log('Donation found');
    
    return res.status(200).json({ donation });
    
  } catch (error) {
    console.error('Error retrieving donation:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update donation status
app.put('/donations/:donationId', async (req, res) => {
  try {
    const { donationId } = req.params;
    const { status, pickupDate, pickupAddress, pickupNotes } = req.body;
    
    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }
    
    // Find donation
    const donation = await Donation.findById(donationId);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Update donation fields
    if (status) donation.status = status;
    if (pickupDate) donation.pickupDate = pickupDate;
    if (pickupAddress) donation.pickupAddress = pickupAddress;
    if (pickupNotes) donation.pickupNotes = pickupNotes;
    
    // Save updated donation
    await donation.save();
    
    return res.status(200).json({ 
      message: 'Donation updated successfully',
      donation
    });
    
  } catch (error) {
    console.error('Error updating donation:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a donation
app.delete('/donation/:donationId', async (req, res) => {
  try {
    const { donationId } = req.params;
    
    if (!donationId) {
      return res.status(400).json({ 
        success: false,
        message: 'Donation ID is required' 
      });
    }
    
    console.log('Deleting donation with ID:', donationId);
    
    // Convert string donationId to MongoDB ObjectId
    const mongoose = require('mongoose');
    let donationObjectId;
    
    try {
      donationObjectId = new mongoose.Types.ObjectId(donationId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid donation ID format' 
      });
    }
    
    // Find and delete the donation
    const result = await Donation.findByIdAndDelete(donationObjectId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: 'Donation not found' 
      });
    }
    
    console.log('Donation deleted successfully');
    
    return res.status(200).json({ success: true, message: 'Donation deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting donation:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Schedule pickup for a donation
app.post('/schedule-pickup', async (req, res) => {
  try {
    const { donationId, pickupDate, userId } = req.body;
    
    if (!donationId || !pickupDate || !userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Donation ID, pickup date, and user ID are required' 
      });
    }
    
    console.log('Scheduling pickup for donation:', donationId);
    console.log('Pickup date:', pickupDate);
    
    // Convert string donationId to MongoDB ObjectId
    const mongoose = require('mongoose');
    let donationObjectId;
    
    try {
      donationObjectId = new mongoose.Types.ObjectId(donationId);
    } catch (err) {
      console.error('Invalid ObjectId format:', err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid donation ID format' 
      });
    }
    
    // Find the donation and update its status and pickup date
    const donation = await Donation.findById(donationObjectId);
    
    if (!donation) {
      return res.status(404).json({ 
        success: false,
        message: 'Donation not found' 
      });
    }
    
    // Verify that the donation belongs to the user
    if (donation.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not authorized to schedule this donation' 
      });
    }
    
    // Update the donation
    donation.status = 'scheduled';
    donation.pickupDate = new Date(pickupDate);
    await donation.save();
    
    console.log('Pickup scheduled successfully');
    
    return res.status(200).json({ 
      success: true,
      message: 'Pickup scheduled successfully',
      donation
    });
    
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});


app.get("/gemini-api-key", (req, res) => {
  res.json({apiKey: process.env.GEMINI_API_KEY});
});













const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});