import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";

const app = express();

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors());


// Import api routes
import authRouter from "./routes/auth.routes.js";
import studentInformationRouter from "./routes/studentInformation.routes.js";
import companyRouter from "./routes/company.routes.js";
import countryRouter from "./routes/country.routes.js";
import instituteRouter from "./routes/institute.routes.js";
import institutionRouter from "./routes/institution.routes.js";
import documentRouter from "./routes/document.routes.js";


// User routes
app.use("/api/auth", authRouter);
app.use("/api/studentinformation", studentInformationRouter);
app.use("/api/company", companyRouter);
app.use("/api/country", countryRouter);
app.use("/api/institute", instituteRouter);
app.use("/api/institution", institutionRouter);
app.use("/api/document", documentRouter);

export default app;
