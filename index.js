import app from "./server.js";
import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log("app listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("database connection error--", error);
  });
