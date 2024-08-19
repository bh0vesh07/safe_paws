const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();


app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Set up storage for the uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to store images
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Name the file uniquely
  }
});

const upload = multer({ storage: storage });

// Serve the uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail', // You can use other services like 'Yahoo', 'Outlook', etc.
  auth: {
    user: 'rampathi07@gmail.com', // Replace with your email
    pass: 'Rampo@!999', // Replace with your email password or app password
  },
});

// Endpoint to send the email with an image
app.post('/send-email', upload.single('image'), (req, res) => {
  const { name, location } = req.body;
  const image = req.file;

  if (!name || !location || !image) {
    return res.status(400).send('All fields are required');
  }

  const imageUrl = `http://localhost:5000/uploads/${image.filename}`;

  const mailOptions = {
    from: 'rampathi07@gmail.com', // Sender's email address
    to: 'bhaveshsah88@gmail.com', // Recipient's email address
    subject: 'Rescue Request',
    text: `Rescue request from ${name} at location: ${location}.`,
    attachments: [
      {
        filename: image.filename,
        path: image.path, // Attach the image
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send email');
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Email sent successfully');
  });
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb+srv://Bhavesh:SafePaws123@animal-details.dgght.mongodb.net/?retryWrites=true&w=majority&appName=Animal-Details', {
 
});

// Animal schema
const animalSchema = new mongoose.Schema({
  name: String,
  breed: String,
  imageUrl: String,
  ownerContact: String,
});

const Animal = mongoose.model('Animal', animalSchema);

// Endpoint to add a new pet for adoption
app.post('/api/pets/add', upload.single('imageUrl'), async (req, res) => {
  try {
    const { name, breed, ownerContact } = req.body;
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

    const newPet = new Animal({
      name,
      breed,
      imageUrl,
      ownerContact,
    });

    await newPet.save();

    res.status(201).json({ message: 'Pet added successfully!' });
  } catch (err) {
    console.error('Error adding pet:', err);
    res.status(500).json({ error: 'Failed to add pet' });
  }
});

// Endpoint to get all animals
app.get('/api/animals', async (req, res) => {
  try {
    const animals = await Animal.find();
    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch animals' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
