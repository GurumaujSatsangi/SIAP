import express from "express";
import bodyParser from "body-parser";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import path from "path";
import { name } from "ejs";

const app = express();





dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



app.use(
  session({
    secret: process.env.SESSION_SECRET || "vitsiap",
    resave: false,
    saveUninitialized: false,
  })
);



// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_KEY
// );

const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use("/static", express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", async(req,res)=>{
    return res.render("home.ejs");
})

app.listen(3000,async()=>{
    console.log("Running on Port 3000!");
})