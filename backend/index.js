const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/Users'); 
const Donation = require('./models/Donation');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const sharp = require('sharp');
const { getGridFSBucket } = require('./config/gridfs');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const multer = require('multer');
const upload = multer();

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

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is invalid' });
    }
};

// Add a simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

app.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body);

    try {
        const { username, password, firstname, lastname, securityQuestion, securityAnswer, userType } = req.body;

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
            points: 0,
            userType: userType || 'donor'
        });

        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username, userType: newUser.userType },
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
                points: newUser.points,
                userType: newUser.userType
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
            { id: user._id, username: user.username, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Return user data and token
        console.log('Login successful for:', username);
        
        // Create URL for profile image if it exists
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const profileImageUrl = user.profileImage ? `${baseUrl}/profile-image/${user.profileImage}` : null;
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                points: user.points,
                profileImage: profileImageUrl,
                userType: user.userType
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

// Update profile image using GridFS
app.post('/update-profile-image', (req, res, next) => {
  console.log('==== PROFILE IMAGE UPDATE REQUEST RECEIVED ====');
  console.log('Request headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Continue with multer middleware
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('==== PROFILE IMAGE UPDATE REQUEST ====');
    console.log('Request body:', req.body);
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    if (req.file) {
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
      });
    }
    
    const { userId, clearImage } = req.body;
    console.log('Update profile image request received');
    console.log('User ID:', userId);
    console.log('Clear image flag:', clearImage);
    
    // Handle image clearing if explicitly requested
    if (clearImage === 'true' || clearImage === true) {
      console.log('Clearing profile image for user:', userId);
      
      // Find the user to get the current profile image ID
      const user = await User.findById(userId);
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ message: 'User not found' });
      }
      
      // If user has a profile image, delete it from GridFS
      if (user.profileImage) {
        console.log('Deleting existing profile image from GridFS:', user.profileImage);
        try {
          const objectId = new mongoose.Types.ObjectId(user.profileImage);
          await gfs.delete(objectId);
          console.log('Existing profile image deleted successfully');
        } catch (deleteError) {
          console.error('Error deleting profile image:', deleteError);
          // Continue even if delete fails
        }
      }
      
      // Update user to remove profile image reference
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $unset: { profileImage: "" } },
        { new: true }
      );
      
      console.log('User updated, profile image cleared');
      return res.status(200).json({ 
        message: 'Profile image cleared successfully', 
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          firstname: updatedUser.firstname,
          lastname: updatedUser.lastname,
          points: updatedUser.points,
          profileImage: null,
          userType: updatedUser.userType
        }
      });
    }
    
    // If no file was uploaded and we're not explicitly clearing, return an error
    if (!req.file) {
      console.log('No image file provided and clearImage not set to true');
      return res.status(400).json({ message: 'Image file is required for upload' });
    }
    
    // Handle uploading a new profile image
    
    // If we're clearing the image, we've already handled it above
    if (clearImage) {
      return; // The response has already been sent in the clearImage block
    }
    
    console.log('Proceeding with image upload...');
    
    // Process image with sharp to optimize it
    console.log('Processing image with Sharp...');
    const processedImageBuffer = await sharp(req.file.buffer)
      // First resize maintaining aspect ratio to cover a 300x300 square
      .resize(300, 300, { fit: 'cover', position: 'center' })
      // Then extract the center portion to ensure a perfect square
      .extract({ left: 0, top: 0, width: 300, height: 300 })
      // Optimize as JPEG with good quality
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
    console.log('Image processed. New size:', processedImageBuffer.length, 'bytes');
    
    // Get GridFS bucket
    const bucket = getGridFSBucket();
    
    // Create readable stream from buffer
    console.log('Creating readable stream from buffer...');
    const readableStream = new Readable();
    readableStream.push(processedImageBuffer);
    readableStream.push(null);
    
    // Generate unique filename
    const filename = `profile_${userId}_${Date.now()}`;
    console.log('Generated filename:', filename);
    
    // Check if user already has a profile image and delete it
    console.log('Finding user to check for existing profile image...');
    const existingUser = await User.findById(userId);
    if (existingUser && existingUser.profileImage) {
      console.log('User has existing profile image with ID:', existingUser.profileImage);
      try {
        // We already have a bucket instance from above, reuse it
        await bucket.delete(existingUser.profileImage);
        console.log('Deleted previous profile image successfully');
      } catch (err) {
        console.log('Error deleting previous image:', err);
        // Continue even if delete fails
      }
    } else {
      console.log('No existing profile image to delete or user not found');
    }
    
    // Upload new image to GridFS
    console.log('Opening upload stream...');
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'image/jpeg',
      metadata: { userId }
    });
    
    // Create promise to handle stream completion
    console.log('Setting up upload promise...');
    
    // In GridFS, the id is assigned when the stream is created, not when it finishes
    // So we can get it directly from the uploadStream
    const uploadId = uploadStream.id;
    console.log('GridFS assigned file ID:', uploadId);
    console.log('GridFS bucket:', bucket.s.name);
    console.log('GridFS upload options:', {
      contentType: 'image/jpeg',
      metadata: { userId }
    });
    
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        console.log('Upload finished successfully');
        console.log('Upload stream ID at finish:', uploadStream.id);
        console.log('Using previously captured ID:', uploadId);
        // Use the ID we captured earlier
        resolve(uploadId);
      });
      uploadStream.on('error', (err) => {
        console.error('Upload stream error:', err);
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
        reject(err);
      });
    });
    
    // Pipe the readable stream to the upload stream
    console.log('Piping data to upload stream...');
    console.log('Readable stream:', readableStream ? 'Created successfully' : 'Failed to create');
    console.log('Upload stream:', uploadStream ? 'Created successfully' : 'Failed to create');
    console.log('Buffer size:', processedImageBuffer.length, 'bytes');
    readableStream.pipe(uploadStream);
    
    // Wait for upload to complete
    console.log('Waiting for upload to complete...');
    let uploadedFileId;
    try {
      uploadedFileId = await uploadPromise;
      console.log('Upload completed successfully. File ID:', uploadedFileId);
    } catch (uploadError) {
      console.error('Error during upload promise resolution:', uploadError);
      console.error('Error message:', uploadError.message);
      throw uploadError; // Re-throw to be caught by the outer try-catch
    }
    
    // Update user with new profile image ID
    console.log('Updating user document with new profile image ID...');
    const updatedUserWithImage = await User.findByIdAndUpdate(
      userId,
      { profileImage: uploadedFileId },
      { new: true }
    );
    console.log('User updated successfully. Profile image ID:', updatedUserWithImage.profileImage);
    console.log('==== PROFILE IMAGE UPLOAD SUCCESSFUL ====');
    console.log('GridFS file ID:', uploadedFileId);
    console.log('User ID:', userId);
    console.log('Image can be accessed at: /profile-image/' + uploadedFileId);
    
    if (!updatedUserWithImage) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return success response with updated user data
    console.log('Preparing success response...');
    const responseData = {
      message: 'Profile image updated successfully',
      user: {
        id: updatedUserWithImage._id,
        username: updatedUserWithImage.username,
        firstname: updatedUserWithImage.firstname,
        lastname: updatedUserWithImage.lastname,
        points: updatedUserWithImage.points,
        profileImage: uploadedFileId.toString(),
        userType: updatedUserWithImage.userType
      }
    };
    console.log('Response data:', responseData);
    console.log('==== PROFILE IMAGE UPDATE COMPLETED ====');
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error updating profile image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get profile image by ID
app.get('/profile-image/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    
    if (!imageId || !mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({ message: 'Valid image ID is required' });
    }
    
    const bucket = getGridFSBucket();
    
    // Check if the file exists
    const file = await mongoose.connection.db.collection('profileImages.files').findOne({
      _id: new mongoose.Types.ObjectId(imageId)
    });
    
    if (!file) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Set the appropriate headers
    res.set('Content-Type', file.contentType);
    res.set('Content-Length', file.length);
    
    // Create a download stream and pipe it to the response
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(imageId));
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error('Error retrieving profile image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

    const totalItems = (clothingItems?.length || 0) + (toyItems?.length || 0);


    // Create a single donation with all items
    const newDonation = new Donation({
      userId,
      donationType,
      status: 'pending',
      clothingItems: donationType === 'clothes' ? clothingItems : [],
      toyItems: donationType === 'toys' ? toyItems : [],
      size: totalItems
    });

    await newDonation.save();
    
    // Return success response
    return res.status(201).json({ 
      message: 'Donation saved successfully',
      donation: newDonation
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
  console.log('Scheduling pickup for donation:', req.body);
  try {
    const { donationId, pickupDate, userId, location, deliveryMessage } = req.body;

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

    // Find the donation
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

    // Only allow scheduling if donation is currently 'pending'
    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Donation cannot be scheduled because its status is '${donation.status}'. Only 'pending' donations can be scheduled.`
      });
    }

    // Update the donation status, pickup date, address, and notes
    donation.status = 'scheduled';
    donation.pickupDate = new Date(pickupDate);
    if (location.type === 'gps') {
      donation.pickupAddress = location.address;
      if (location.latitude && location.longitude) {
        donation.location.latitude = location.latitude;
        donation.location.longitude = location.longitude;
      } else {
        console.log('GPS type but no coordinates available');
      }
    } else if (location.type === 'manual') {
      donation.pickupAddress = location.address;
    }
    
    if (deliveryMessage) {
      donation.pickupNotes = deliveryMessage;
    }

    // Save and check if the update was successful
    await donation.save();

    // Double-check the update
    const updatedDonation = await Donation.findById(donationObjectId);

    if (updatedDonation.status !== 'scheduled') {
      console.error('Failed to update donation status to scheduled');
      return res.status(500).json({
        success: false,
        message: 'Failed to update donation status'
      });
    }

    console.log('Pickup scheduled successfully, status:', updatedDonation.status);

    return res.status(200).json({
      success: true,
      message: 'Pickup scheduled successfully',
      donation: updatedDonation
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

// Google Cloud Vision API for color analysis
const axios = require('axios');

// Helper function to convert base64 to buffer
const base64ToBuffer = (base64String) => {
  // Remove data URL prefix if present
  if (base64String.includes('data:image')) {
    base64String = base64String.split(',')[1];
  }
  return Buffer.from(base64String, 'base64');
};

// Endpoint to analyze image color
app.post('/api/analyze-color', async (req, res) => {
  try {
    const { image } = req.body;
    const API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    console.log('Received image data, length:', image.length);
    
    try {
      // Convert base64 to buffer
      const imageBuffer = base64ToBuffer(image);
      
      // Process the image with sharp
      // Resize to a smaller size to reduce data sent to Vision API
      // Format as JPEG with 80% quality
      const processedImageBuffer = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Convert processed image back to base64 for Vision API
      const processedBase64 = processedImageBuffer.toString('base64');
      console.log('Processed image size:', processedBase64.length);
      
      // Use the Vision API with your API key directly
      console.log('Sending request to Vision API...');
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
        {
          requests: [
            {
              image: {
                content: processedBase64
              },
              features: [
                {
                  type: 'IMAGE_PROPERTIES',
                  maxResults: 5
                }
              ]
            }
          ]
        }
      );
      
      console.log('Vision API response status:', response.status);
      
      // Check if we have valid results
      if (
        response.data.responses &&
        response.data.responses[0] &&
        response.data.responses[0].imagePropertiesAnnotation &&
        response.data.responses[0].imagePropertiesAnnotation.dominantColors &&
        response.data.responses[0].imagePropertiesAnnotation.dominantColors.colors &&
        response.data.responses[0].imagePropertiesAnnotation.dominantColors.colors.length > 0
      ) {
        // Sort colors by score (pixel fraction)
        const colors = response.data.responses[0].imagePropertiesAnnotation.dominantColors.colors;
        colors.sort((a, b) => b.pixelFraction - a.pixelFraction);
        
        // Get the top 3 dominant colors (or fewer if less are available)
        const topColors = colors.slice(0, Math.min(3, colors.length));
        
        // Convert RGB to hex for each color
        const dominantColors = topColors.map(color => {
          return {
            hex: rgbToHex(
              color.color.red,
              color.color.green,
              color.color.blue
            ),
            score: color.pixelFraction
          };
        });
        
        console.log('Dominant colors extracted:', dominantColors);
        res.json({ dominantColors });
      } else {
        console.error('Invalid response format from Vision API:', JSON.stringify(response.data));
        if (response.data.responses && response.data.responses[0] && response.data.responses[0].error) {
          console.error('Vision API error details:', JSON.stringify(response.data.responses[0].error));
        }
        // Return default colors instead of an error
        res.json({ 
          dominantColors: [
            { hex: '#4287f5', score: 0.5 },
            { hex: '#42f5a7', score: 0.3 },
            { hex: '#f54242', score: 0.2 }
          ] 
        });
      }
    } catch (apiError) {
      console.error('Error calling Vision API:', apiError.message);
      if (apiError.response) {
        console.error('API response:', apiError.response.data);
      }
      // Return default colors instead of an error
      res.json({ 
        dominantColors: [
          { hex: '#4287f5', score: 0.5 },
          { hex: '#42f5a7', score: 0.3 },
          { hex: '#f54242', score: 0.2 }
        ] 
      });
    }
  } catch (error) {
    console.error('Error analyzing color:', error.message);
    // Return default colors instead of an error
    res.json({ 
      dominantColors: [
        { hex: '#4287f5', score: 0.5 },
        { hex: '#42f5a7', score: 0.3 },
        { hex: '#f54242', score: 0.2 }
      ] 
    });
  }
});

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
  return '#' + [
    Math.round(r).toString(16).padStart(2, '0'),
    Math.round(g).toString(16).padStart(2, '0'),
    Math.round(b).toString(16).padStart(2, '0')
  ].join('');
}

// Endpoint to get API keys for frontend
app.get('/api/config', (req, res) => {
  res.json({
    huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY
  });
});

// Driver specific endpoints

// Update driver location
app.post('/driver/location', auth, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        user.currentLocation = { latitude, longitude };
        await user.save();

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
});

// Get available pickups for driver
app.get('/driver/available-pickups', auth, async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        // Find all donations that are scheduled but not assigned
        const availablePickups = await Donation.find({
            status: 'scheduled',
            assignedDriver: { $exists: false }
        }).populate('userId', 'firstname lastname');

        // Calculate distance for each pickup if coordinates are provided
        if (latitude && longitude) {
            const pickupsWithDistance = availablePickups.map(pickup => {
                const distance = calculateDistance(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    pickup.location.latitude,
                    pickup.location.longitude
                );
                return {
                    ...pickup.toObject(),
                    distance
                };
            });

            // Sort by distance
            pickupsWithDistance.sort((a, b) => a.distance - b.distance);
            return res.json(pickupsWithDistance);
        }

        res.json(availablePickups);
    } catch (error) {
        console.error('Available pickups error:', error);
        res.status(500).json({ message: 'Error fetching available pickups', error: error.message });
    }
});



// Assign pickup to driver
app.post('/driver/assign-pickup/:donationId', auth, async (req, res) => {
    try {
        const { donationId } = req.params;
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.status !== 'scheduled' || donation.assignedDriver) {
            return res.status(400).json({ message: 'Donation is not available for pickup' });
        }

        // Assign donation to driver
        donation.assignedDriver = user._id;
        donation.status = 'assigned';
        donation.assignedAt = new Date();
        await donation.save();

        // Add to driver's active pickups
        user.activePickups.push(donationId);
        await user.save();

        res.json({ message: 'Pickup assigned successfully', donation });
    } catch (error) {
        console.error('Assign pickup error:', error);
        res.status(500).json({ message: 'Error assigning pickup', error: error.message });
    }
});

// Mark pickup as completed
app.post('/driver/complete-pickup/:donationId', auth, async (req, res) => {
    try {
        const { donationId } = req.params;
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (donation.assignedDriver.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to complete this pickup' });
        }

        // Calculate points for donor based on donation type and items
        let donorPoints = 0;
        if (donation.donationType === 'clothes') {
            donorPoints = donation.clothingItems.reduce((total, item) => total + (item.quantity * 10), 0);
        } else if (donation.donationType === 'toys') {
            donorPoints = donation.toyItems.reduce((total, item) => total + (item.quantity * 15), 0);
        }

        // Calculate points for driver (base points + bonus for quick completion)
        const driverPoints = calculateDriverPoints(donation);

        // Update donation status
        donation.status = 'completed';
        donation.pickedUpAt = new Date();
        await donation.save();

        // Update donor points
        const donor = await User.findById(donation.userId);
        if (donor) {
            donor.points += donorPoints;
            await donor.save();
        }

        // Update driver points
        user.points += driverPoints;
        await user.save();

        // Remove from driver's active pickups
        user.activePickups = user.activePickups.filter(id => id.toString() !== donationId);
        await user.save();

        res.json({ 
            message: 'Pickup completed successfully', 
            donation,
            donorPointsAwarded: donorPoints,
            driverPointsAwarded: driverPoints
        });
    } catch (error) {
        console.error('Complete pickup error:', error);
        res.status(500).json({ message: 'Error completing pickup', error: error.message });
    }
});

// Helper function to calculate driver points
function calculateDriverPoints(donation) {
    // Base points for completing a pickup
    let points = 20;

    // Bonus points based on number of items
    const totalItems = donation.donationType === 'clothes' 
        ? donation.clothingItems.reduce((total, item) => total + item.quantity, 0)
        : donation.toyItems.reduce((total, item) => total + item.quantity, 0);
    
    // Add 5 points per item
    points += totalItems * 5;

    // Bonus for quick completion (if completed within 24 hours of assignment)
    if (donation.assignedAt) {
        const completionTime = new Date();
        const timeDiff = completionTime - new Date(donation.assignedAt);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
            points += 15; // Quick completion bonus
        }
    }

    return points;
}

// Get driver's active pickups
app.get('/driver/active-pickups', auth, async (req, res) => {
    try {
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find all donations assigned to this driver
        const activePickups = await Donation.find({
            assignedDriver: user._id,
            status: 'assigned'
        }).populate('userId', 'firstname lastname');

        res.json(activePickups);
    } catch (error) {
        console.error('Active pickups error:', error);
        res.status(500).json({ message: 'Error fetching active pickups', error: error.message });
    }
});

// Get driver's completed donations
app.get('/driver/completed-donations', auth, async (req, res) => {
    try {
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find all donations assigned to this driver and completed
        const completedDonations = await Donation.find({
            assignedDriver: user._id,
            status: 'completed'
        }).populate('userId', 'firstname lastname');

        res.json(completedDonations);
    } catch (error) {
        console.error('Completed donations error:', error);
        res.status(500).json({ message: 'Error fetching completed donations', error: error.message });
    }
});

// Get detailed donation information for popup
app.get('/driver/donation/:donationId', auth, async (req, res) => {
    try {
        const { donationId } = req.params;
        const user = req.user;

        if (user.userType !== 'driver') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find the donation with all details
        const donation = await Donation.findById(donationId)
            .populate('userId', 'firstname lastname');

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        res.json(donation);
    } catch (error) {
        console.error('Get donation details error:', error);
        res.status(500).json({ message: 'Error fetching donation details', error: error.message });
    }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
app.get("/gemini-api-key", (req, res) => {
  res.json({apiKey: process.env.GEMINI_API_KEY});
});

// Get combined leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        // Get all users (both donors and drivers)
        const users = await User.find()
            .select('firstname lastname points profileImage userType')
            .sort({ points: -1 })
            .limit(50);

        // Use https for production environment (Render)
        const isProduction = req.get('host').includes('onrender.com');
        const protocol = isProduction ? 'https' : req.protocol;
        const baseUrl = `${protocol}://${req.get('host')}`;
        
        res.json({
            success: true,
            leaderboard: users.map((user, index) => ({
                rank: index + 1,
                name: `${user.firstname} ${user.lastname}`,
                points: user.points,
                profileImage: user.profileImage ? `${baseUrl}/profile-image/${user.profileImage}` : null,
                userType: user.userType // 'donor' or 'driver'
            }))
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching leaderboard', 
            error: error.message 
        });
    }
});