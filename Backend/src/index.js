import { connectDB } from "./db/db.js";
import app from "./app.js";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
});


await connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, async () => {
            console.log(`Server is running on port ${process.env.PORT || 5000}`);
            
        });
    })
    .catch((error) => {
        console.error("Database connection failed:", error);
        process.exit(1);
    });




