import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" assert { type: "json" };
import { upload } from "./middlewares/multer.middleware.js"; // Import the multer config

const app = express();

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors());

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Import api routes
import authRouter from "./routes/auth.routes.js";
import studentInformationRouter from "./routes/studentInformation.routes.js";
import companyRouter from "./routes/company.routes.js";
import countryRouter from "./routes/country.routes.js";
import instituteRouter from "./routes/institute.routes.js";

// User routes
app.use("/api/auth", authRouter);
app.use("/api/studentinformation", studentInformationRouter);
app.use("/api/company", companyRouter);
app.use("/api/country", countryRouter);
app.use("/api/institute", instituteRouter);

export default app;
