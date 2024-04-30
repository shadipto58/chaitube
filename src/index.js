import 'dotenv/config'
import { app } from "./app.js";
import connectDB from "./db/database.js";


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at PORT : ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.log("Error in App", error);
      throw error;
    });
  })
  .catch((error) => {
    console.log("MONGODB CONNECTION ERROR !!", error);
  });
