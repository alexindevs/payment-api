import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors'

import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(String(process.env.FLUTTERWAVE_PUBLIC_KEY), String(process.env.FLUTTERWAVE_SECRET_KEY));

app.use(cors());
app.use(express.json());



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

