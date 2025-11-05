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

app.get("/", async (req, res) => {
  // If the user is authenticated and is a student, send them to the dashboard.
  if (req.isAuthenticated() && req.user && req.user.role === "student") {
    return res.redirect("/dashboard");
  }

  const { data, error } = await supabase.from("announcements").select("*");
  return res.render("home.ejs", { announcements: data });
});

app.post("/create-profile",async(req,res)=>{

  const {fullname,vitemail,personal_email,contact_number,programme,branch,gender, arrears,class_x,class_xii,cgpa,resume,certifications,academic_gap,residence_type,hostelblock} = req.body;

  const {data,error} = await supabase.from("students").update({
    name:fullname,
    registration_number:registration_number,
    programme:programme,
    branch:branch,
    gender:gender,
    personal_email:personal_email,
    vit_email:vitemail,
    contact_number:contact_number,
    X:class_x,
    XII:class_xii,
    cgpa:cgpa,
    academic_gap:academic_gap,
    arrears:arrears,
    residence_type:residence_type,
    hostel_block:hostelblock,
    resume_link:resume,
    certifications:certifications,

  }).eq("uid",req.user.id);

  return res.redirect("/dashboard?message=Profile Updated Succesfully!");

});

app.get("/profile",async(req,res)=>{
  const message = req.query.message;
  return res.render("student/profile.ejs",{message: message || null});
})

app.get("/create-profile",async(req,res)=>{
  const message = req.query.message;
  return res.render("student/create-profile.ejs",{message: message || null});
})

app.get("/dashboard", async (req, res) => {
  // Require authentication for the dashboard. If not authenticated, start login.
  if (!req.isAuthenticated()) {
    return res.redirect("/auth/login/student");
  }
  try {

    const [internshipsResult, applicationsResult, announcementsResult] = await Promise.all([
      supabase.from("internships").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("announcements").select("*"),
    ]);

    const { data: internships, error: internshipsError } = internshipsResult;
    const { data: applications, error: applicationsError } = applicationsResult;
    const {data:announcements, error:announcementsError} = announcementsResult;
    if (internshipsError || applicationsError || announcementsError) {
      return res.render("student/dashboard.ejs", {
        internships: [],
        applications: [],
        announcements:[],
        user: req.user || null,
      });
    }

    return res.render("student/dashboard.ejs", {
      internships: internships || [],
      applications: applications || [],
      announcements: announcements||[],
      user:req.user,
    });

  } catch (err) {

    return res.render("student/dashboard.ejs", {
      internships: [],
      applications: [],
      user: req.user || null,
    });
  }


});

app.post("/update-profile", async (req, res) => {
  const { resume, cgpa, residence_type, hostel_block } = req.body;

  const { data, error } = await supabase.from("students").update({
    cgpa: cgpa,
    residence_type,
    hostel_block: hostel_block,
    resume_link: resume,
  });

  return res.redirect("/profile?message=Profile Updated Succesfully!");
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


passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    
      callbackURL: "http://localhost:3000/auth/login/student/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const result = await supabase
          .from("students")
          .select("*")
          .eq("uid", profile.id)
          .single();
        let user;
        if (!result.data) {
          const { error } = await supabase.from("students").insert([
            {
              uid: profile.id,
              name: profile.displayName,
              vit_email: profile.emails[0].value,
            },
          ]);
          if (error) {
            console.error("Error inserting user:", error);
            return cb(error);
          }
          const { data: newUser, error: fetchError } = await supabase
            .from("students")
            .select("*")
            .eq("uid", profile.id)
            .single();
          if (fetchError) {
            console.error("Fetch after insert failed:", fetchError);
            return cb(fetchError);
          }
          user = newUser;
        } else {
          user = result.data;
        }
        user.role = "student";
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);


app.get(
  "/auth/login/student/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: "/dashboard",
  })
);



app.get(
  "/auth/login/student",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

passport.serializeUser((user, cb) => {
  cb(null, { ...user, role: user.role });
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});