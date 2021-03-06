require('dotenv').config();
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");

const db = require("./models");

var PORT = 3000;

var app = express();
app.engine("handlebars", exphbs({
  defaultLayout: "main",
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/layout/'
}));
app.set("view engine", "handlebars");
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/", function (req, res) {
  res.render('index', {
    layout: false,
    title: 'Example title'
  })
});

app.get("/scrape", function (req, res) {
  axios.get("http://www.espn.com").then(function (response) {
    var $ = cheerio.load(response.data);

    const data = [];
    let articles = 0;

    $("article h2").each(function (i, element) {

      const title = $(this)
        .children("a")
        .text();
      const link = $(this)
        .children("a")
        .attr("href");
      const summary = $(this)
        .children("a")
        .attr("href");

      if (!title && !link && !summary) {
        return;
      }

      const result = {
        title, link, summary
      };

      articles += 1;

      db.Article.create(result)
        .then(function (dbArticle) {
          result.id = dbArticle._id;

          data.push(result);
          articles -= 1;

          if (!articles) {
            res.render('index', { data })
          }

          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    // res.send("Scrape Complete");
  });
});

app.post("/savecomment", function (req, res) {
  res.send(req.body);


});

app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {

      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.listen((process.env.PORT || 5000), function () {
  console.log("App running on port " + PORT + "!");
});
