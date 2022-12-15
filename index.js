/*
    Author: @zjorge96
    Date: 2022-10-01
    Description: This project is used to scrape the options chain from marketwatch.com.
    The data is then categorized by strike price and expiration date with visualization
    via a website running on a local server.
*/

/**** Packages and Modules ****/
const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const flash = require('connect-flash');
const bodyParser = require('body-parser');
const options = require('./options.js');
const User = require('./models/user.js');

/**** Initialize Express ****/
const app = express();
const port = process.env.PORT || 3000;
app.use('/static', express.static('static')); // Load static files
app.use(bodyParser.urlencoded({ extended: true })); // Parse the body of the request
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});

/**** Configure Mongoose ****/
mongoose.set('strictQuery', false); // Supress deprecation warning
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authenticate')
    .then(() => console.log('Connection successful...'))
    .catch(err => console.error('Could not connect...'));

/**** Configure Nunjucks ****/
nunjucks.configure('templates', {
    autoescape: true,
    express: app
});

/**** Configure Passport ****/
app.use(require('express-session')({
    secret: 'CSU Chico 1S 7H3 B357',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
// app.use(flash());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    // res.locals.error = req.flash('error');
    // res.locals.success = req.flash('success');
    next();
});

// Load the home page
app.get('/', (req, res) => {
    res.render('core/home.html', {user: req.user});
});

// Load the login page
app.get('/login', (req, res) => {
    res.render('core/login.html', {user: req.user});
});
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    // failureFlash: "Invalid username or password."
    }), (req, res) => {
        res.redirect('/?user=' + req.user.username);
    }
);

// Logout
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

// Load the join page
app.get("/join", (req, res) => {
    res.render('core/join.html', {user: req.user});
});
app.post("/join", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    User.register(new User({ username: username, email: email, password: password }), password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render('core/join.html', {user: req.user});
        }
        passport.authenticate('local')(req, res, () => {
            res.redirect('/?user=' + req.user.username);
        });
    }
)});

// Load the about page
app.get('/about', (req, res) => {
    res.render('core/about.html', {user: req.user});
});

// Load the page to select a sector
app.get('/lists', async (req, res) => {
    const sectors = await options.getLists();
    res.render('options/lists.html', { sectors: sectors, user: req.user });
});

// Load the options RoI page
app.post('/options', async (req, res) => {
    const tickers = await options.getTickers(req.body.sector);
    // Get the options chain for each ticker
    const promises = tickers.map(ticker => options.getOptionsChain(ticker));
    var results = await Promise.all(promises);
    // Remove any Invalid Dates
    for (var i = 0; i < results.length; i++)
        if (results[i].Expiration == "Invalid Date")
            results.splice(i, 1);
    // Sort the results by RoI
    results = results.sort((a, b) => b.Call.RoI - a.Call.RoI).filter(option => option.Call.RoI != 0)
    // Render the options page returning top 5 results
    res.render('options/options.html', { results: results.slice(0, 5), sector: req.body.sector, user: req.user });
});

// Load the add_list page
app.get('/add_list', (req, res) => {
    res.render('options/add_list.html', {user: req.user});
});
app.post('/add_list', async (req, res) => {
    // Add the list to the database
    res.redirect('/lists');
});

// Load the add_ticker page
app.get('/add_ticker', (req, res) => {
    res.render('options/add_ticker.html', {user: req.user});
});
app.post('/add_ticker', async (req, res) => {
    // Add the ticker to the database
    res.redirect('/lists');
});

// Load the delete_list page
app.get('/delete_list', (req, res) => {
    res.render('options/delete_list.html', {user: req.user});
});
app.post('/delete_list', async (req, res) => {
    // Delete the list from the database
    res.redirect('/lists');
});

// Load the delete_ticker page
app.get('/delete_ticker', (req, res) => {
    res.render('options/delete_ticker.html', {user: req.user});
});
app.post('/delete_ticker', async (req, res) => {
    // Delete the ticker from the database
    res.redirect('/lists');
});