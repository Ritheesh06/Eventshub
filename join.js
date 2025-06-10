const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to the events data file
const eventsFilePath = path.join(__dirname, 'events.json');

// Helper function to read the events file
function readEvents() {
  if (!fs.existsSync(eventsFilePath)) {
    fs.writeFileSync(eventsFilePath, JSON.stringify([]));
  }
  const data = fs.readFileSync(eventsFilePath);
  return JSON.parse(data);
}

// Helper function to write to the events file
function writeEvents(events) {
  fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
}

// API to fetch all events
app.get('/events', (req, res) => {
  const events = readEvents();
  res.status(200).json(events);
});

// API to fetch a single event by ID
app.get('/events/:id', (req, res) => {
  const events = readEvents();
  const event = events.find(event => event.id === req.params.id);
  if (event) {
    res.status(200).json(event);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// API to create a new event
app.post('/events', (req, res) => {
  const events = readEvents();
  const newEvent = {
    id: Date.now().toString(),
    ...req.body,
  };
  events.push(newEvent);
  writeEvents(events);
  res.status(201).json(newEvent);
});

// API to update an event
app.put('/events/:id', (req, res) => {
  const events = readEvents();
  const eventIndex = events.findIndex(event => event.id === req.params.id);
  if (eventIndex !== -1) {
    events[eventIndex] = { ...events[eventIndex], ...req.body };
    writeEvents(events);
    res.status(200).json(events[eventIndex]);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// API to delete an event
app.delete('/events/:id', (req, res) => {
  const events = readEvents();
  const filteredEvents = events.filter(event => event.id !== req.params.id);
  if (filteredEvents.length !== events.length) {
    writeEvents(filteredEvents);
    res.status(200).json({ message: 'Event deleted successfully' });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
