const express = require('express');
const mongoose = require('mongoose');
require("dotenv").config();

const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require("body-parser");

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(bodyParser.json());
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail
      pass: process.env.EMAIL_PASS, // Use App Password (not your Gmail password)
    },
  });

mongoose.connect('mongodb://127.0.0.1:27017/Main_Blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        
        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }
  
      // Send the user info in the response
      const userInfo = {
        username: user.username, // Make sure you return necessary user info
      };
  
      res.status(200).json({ message: 'Login successful', userInfo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    externalLink: { type: String, required: false },
    likes: {
      type: Number,
      default: 0,  // Set default value for likes
    },
    createdAt: { type: Date, default: Date.now },

});

// Create Blog Model
const Blog = mongoose.model('Blog', BlogSchema);

// Add Blog Route
app.post('/blogs/create', async (req, res) => {
    const { title, content, author, category, externalLink } = req.body;

    // Validate required fields
    if (!title || !content || !author || !category) {
        return res.status(400).json({ message: 'Please fill all the required fields' });
    }

    try {
        const newBlog = new Blog({
            title,
            content,
            author,
            category,
            externalLink,
        });

        // Save the blog post to the database
        await newBlog.save();
        res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Error creating blog, please try again' });
    }
});

// Get blogs by specific author
app.get('/myblogs/:username', async (req, res) => {
    const username = req.params.username;

    if (!username) {
        return res.status(400).json({ message: 'Username is required to fetch blogs' });
    }

    try {
        const blogs = await Blog.find({ author: username });

        if (blogs.length === 0) {
            return res.status(404).json({ message: "No blogs found for this author." });
        }

        res.status(200).json({ blogs });
    } catch (error) {
        console.error('Error fetching author blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});

// Get all blogs
app.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({ blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});

// Delete Blog Route
app.delete('/blogs/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedBlog = await Blog.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Error deleting blog, please try again' });
    }
});
app.put('/blogs/update/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
  
    try {
      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { content },
        { new: true } // Return the updated blog after the update operation
      );
  
      if (!updatedBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }
  
      res.status(200).json(updatedBlog); // Send the updated blog back in the response
    } catch (error) {
      console.error('Error updating blog:', error);
      res.status(500).json({ message: 'Error updating blog, please try again' });
    }
  });
  app.put("/blogs/like/:id", async (req, res) => {
    try {
      const blog = await Blog.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: 1 } }, // Increment likes count
        { new: true }
      );
  
      // If the blog is not found, return an error
      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }
  
      res.json(blog);
    } catch (error) {
      res.status(500).json({ error: "Error liking the blog" });
    }
  });
  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Make the POST request to the backend using fetch
      const response = await fetch("http://localhost:4000/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: subscribeEmail }),  // Send the email in the request body
      });
  
      const data = await response.json(); // Parse the JSON response
  
      // Check if the request was successful
      if (response.ok) {
        setSubscribeSuccess("Thank you for subscribing!"); // Show success message
      } else {
        // If there's an error, show the error message
        setSubscribeSuccess(data.error || "Something went wrong. Please try again!");
      }
  
      // Clear the input field
      setSubscribeEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      setSubscribeSuccess("Something went wrong. Please try again!"); // Handle errors
    }
  };
  
  
app.listen(4000, () => {
    console.log('Server is running on port http://localhost:4000');
});