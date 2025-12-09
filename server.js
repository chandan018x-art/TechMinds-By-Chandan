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

// Auto-download all background videos when Background button is clicked
bgBtn.addEventListener('click', async () => {
  // open modal (if you still want the modal to open)
  modal.classList.remove('active');
  bgModal.classList.add('active');

  try {
    const res = await fetch('/videos');
    if (!res.ok) throw new Error('Failed to fetch videos');
    const videos = await res.json();
    if (!videos || videos.length === 0) {
      alert('No background videos available to download.');
      return;
    }

    // trigger downloads
    videos.forEach(video => {
      const a = document.createElement('a');
      a.href = video.url;            // e.g. /uploads/12345.mp4
      a.download = video.name;      // suggest filename
      document.body.appendChild(a);
      a.click();
      a.remove();
    });

    // Note: some browsers block multiple automatic downloads. If blocked,
    // try the "download list" option below (shows explicit download buttons).
  } catch (err) {
    console.error(err);
    alert('Could not download videos. Check the server and try again.');
  }
});
