import { model, Schema } from "mongoose";

interface ITrack {
    trackingId: string;
    opens: number;
    userEmails: string[];
}

const trackSchema = new Schema<ITrack>( {
    trackingId: { type: String, required: true },
    opens: { type: Number, default: 0 },
    userEmails: { type: [String], default: [] }
} )

const track = model<ITrack>( 'track', trackSchema );

export default track;