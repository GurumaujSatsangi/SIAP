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



const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

app.get("/profile",async(req,res)=>{
  return res.render("student/profile.ejs");
})

app.get("/dashboard", async (req, res) => {
  try {

    const [internshipsResult, applicationsResult] = await Promise.all([
      supabase.from("internships").select("*"),
      supabase.from("applications").select("*")
    ]);

    const { data: internships, error: internshipsError } = internshipsResult;
    const { data: applications, error: applicationsError } = applicationsResult;

    if (internshipsError || applicationsError) {
      console.error("Supabase error:", internshipsError || applicationsError);
      return res.render("student/dashboard.ejs", {
        internships: [],
        applications: []
      });
    }

    return res.render("student/dashboard.ejs", {
      internships: internships || [],
      applications: applications || []
    });

  } catch (err) {

    console.error("Unexpected dashboard route error:", err);
    return res.render("student/dashboard.ejs", {
      internships: [],
      applications: []
    });
  }


});


app.get("/internship/:id", async (req, res) => {
  try {
    const { data, error } = await supabase.from("internships").select("*").eq("id",req.params.id).single();
    if (error) {
      return res.render("student/internship.ejs", { internship: [] });
    }
    return res.render("student/internship.ejs", { internship: data || [] });
  } catch (err) {
    return res.render("student/internship.ejs", { internship  : [] });
  }
});

app.listen(3000,async()=>{
    console.log("Running on Port 3000!");
})