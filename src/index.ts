import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
// import nodemailer from 'nodemailer';
import connectDB from './config/db';
import Track from './models/track.model';

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use( express.json() );

// Mail transport configuration using nodemailer
// const transporter = nodemailer.createTransport( {
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// } );

const generateTrackingId = (): string => {
    return Math.random().toString( 36 ).substring( 2, 10 ).toUpperCase();
};


// Route to send mail and save tracking details
app.post( '/api/send-mail', async ( req: Request, res: Response ) => {
    const { emails, password } = req.body;

    // Validate inputs
    if ( !emails || !password ) {
        res.status( 400 ).json( { message: 'Emails and password are required' } );
        return;
    }

    if ( password !== process.env.PASSWORD ) {
        res.status( 401 ).json( { message: 'Invalid password' } );
        return;
    }

    const trackingId = generateTrackingId();

    const emailList = Array.isArray( emails ) ? emails : [ emails ]; // Ensure emails is an array

    try {

        for ( const email of emailList ) {
            // Create a new email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Tracking ID',
                html: `
                    <h1>Hello!</h1>
                    <p>This email includes a tracking pixel for open tracking.</p>
                    <img src="http://your-server.com/api/track-email/${trackingId}?email=${email}" alt="tracking pixel" style="display:none;" />
                `,
            };
            // Send the email using nodemailer
            // await transporter.sendMail( mailOptions );
        }

        // Save tracking details in the Track model
        const newTrack = new Track( {
            trackingId: trackingId,
            opens: 0,
        } );

        await newTrack.save();

        res.json( { message: 'Email sent and tracking details saved!', track: newTrack } );
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { message: 'Failed to send email' } );
    }
} );

// Route to track email opens
app.get( '/api/track-email/:tracking_id', async ( req: Request, res: Response ) => {
    const { email } = req.query;
    const { tracking_id } = req.params;

    if ( !email || typeof email !== 'string' ) {
        res.status( 400 ).json( { message: 'Email is required in the query parameters' } );
        return;
    }

    try {
        // Find the track document by tracking ID
        const track = await Track.findOne( { trackingId: tracking_id } );

        if ( !track ) {
            res.status( 404 ).json( { message: 'Tracking ID not found' } );
            return;
        }

        // Check if the email is already in the userEmails array
        if ( !track.userEmails.includes( email ) ) {
            // If email is not in the array, add it and increment opens count
            track.userEmails.push( email );
            track.opens += 1;
            await track.save();
        }

        const imagePath = path.join( __dirname, 'public', 'image.png' );
        res.sendFile( imagePath );
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { message: 'Failed to track email' } );
    }
} );

// Start the server
app.listen( port, () => {
    console.log( `Server running on http://localhost:${port}` );
} );
