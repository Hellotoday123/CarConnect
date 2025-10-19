require('dotenv').config();

const express = require('express');
const cors = require('cors');

const usersRouter = require('./routes/users');
const carsRouter = require('./routes/cars');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API routes
app.use('/api/users', usersRouter);
app.use('/api/cars', carsRouter);

// ✅ Base route for testing
app.get('/', (_, res) => res.send('CarConnect backend is running'));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));