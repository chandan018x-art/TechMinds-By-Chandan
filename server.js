const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create uploads folder if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed'));
    }
  }
});

// Routes
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  res.json({ success: true, filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

app.get('/videos', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not read uploads' });
    const videos = files.map(f => ({ name: f, url: `/uploads/${f}` }));
    res.json(videos);
  });
});

app.delete('/delete/:filename', (req, res) => {
  const { password } = req.body;
  if (password !== 'admin123') return res.status(401).json({ error: 'Wrong password' });
  
  const filepath = path.join('uploads', req.params.filename);
  fs.unlink(filepath, (err) => {
    if (err) return res.status(404).json({ error: 'File not found' });
    res.json({ success: true });
  });
});


app.listen(3000, () => console.log('Server running at http://localhost:3000'));
