const express = require('express');  //importing express
const multer = require('multer');    //importing multer 
const fs = require('fs');            //importing file system module
const path = require('path');        //importing path
const app = express();
const PORT = 3000;

// Path to store events data
const eventsFilePath = path.join(__dirname, 'events.json');

// Middleware for parsing JSON and serving static files
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// GET Endpoint to retrieve all events
app.get('/api/events', (req, res) => {
    fs.readFile(eventsFilePath, 'utf8', (err, data) => {    //reading the json file
        if (err) {
            if (err.code === 'ENOENT') {                    //describing the error
                return res.status(200).json([]); // Return an empty array if file doesn't exist
            }
            return res.status(500).json({ message: 'Error reading events file' });
        }

        try {
            const events = data ? JSON.parse(data) : [];
            res.status(200).json(events);
        } catch (parseError) {
            res.status(500).json({ message: 'Error parsing events file' });
        }
    });
});

app.post('/api/events', upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 }
]), (req, res) => {
  const {
      name, date, time, venue, eligibility, description, limitedParticipants, registrationFee
  } = req.body;

  let qrCodePath = null;

  // Handle QR code only if registrationFee is 'Yes'
  if (registrationFee === 'Yes' && req.files['qrCode']) {
      qrCodePath = `/uploads/${req.files['qrCode'][0].filename}`;
  }

  // Prepare the event object
  const newEvent = {
      name,
      date,
      time,
      venue,
      eligibility,
      description,
      limitedParticipants,
      registrationFee,
      poster: req.files['poster'] ? `/uploads/${req.files['poster'][0].filename}` : null,
      qrCode: qrCodePath
  };

  // Read current events
  fs.readFile(eventsFilePath, 'utf8', (err, data) => {
      if (err) {
          res.status(500).json({ message: 'Error reading events file' });
          return;
      }

      const events = JSON.parse(data);
      events.push(newEvent);

      // Save updated events
      fs.writeFile(eventsFilePath, JSON.stringify(events, null, 2), (err) => {
          if (err) {
              res.status(500).json({ message: 'Error saving event' });
              return;
          }
          res.status(200).json({
              message: 'Event created successfully',
              event: newEvent
          });
      });
  });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
