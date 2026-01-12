import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.BACK_URL}/TeamOps`)
        console.log('MongoDB Connected Successfully');

    } catch (error) {
        throw new Error('Failed to connect to MongoDB',error);
    }
}


mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Disconnected');
});
mongoose.connection.on('error', (error) => {
    console.log('MongoDB Connection Error: ', error);
});


export { connectDB };
