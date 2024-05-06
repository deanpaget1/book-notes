import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import { stringify } from "querystring";

const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b/isbn/";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book",
  password: "123456",
  port: 5432,
});

db.connect();

let bookInfo = await db.query("SELECT * FROM books");
let books = bookInfo.rows;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Sort book reviews based on users wants
async function sortBooks(sortType) {
  switch (sortType) {
    case "datePosted":
      bookInfo = await db.query("SELECT * FROM books ORDER BY id ASC");
      break;
    case "titleAZ":
      bookInfo = await db.query("SELECT * FROM books ORDER BY title");
      break;
    case "authorAZ":
      bookInfo = await db.query("SELECT * FROM books ORDER BY author");
      break;
  }
  books = bookInfo.rows;
}

//render home page
app.get("/", async (req, res) => {
  res.render("index.ejs", {
    bookItems: books,
    bookImage: API_URL,
  });
});

//sort book reviews via sortBooks function
app.post("/sort", async (req, res) => {
  sortBooks(req.body.sortType);
  res.redirect("/");
});

//go to form page to add new book review
app.get("/add", async (req, res) => {
  res.render("addBook.ejs");
});

//add new book review
app.post("/post", async (req, res) => {
  try {
    await db.query(
      "INSERT INTO books (title, author, review, rating, isbn) VALUES ($1, $2, $3, $4, $5);",
      [
        req.body.title,
        req.body.author,
        req.body.review,
        req.body.rating,
        req.body.isbn,
      ]
    );
    bookInfo = await db.query("SELECT * FROM books");
    books = bookInfo.rows;
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.render("index.ejs", {
      bookItems: books,
      bookImage: API_URL,
      error: "Inputted data incorrect"
    });
  }
});

//delete selected book review
app.post("/delete", async (req, res) => {
  await db.query("DELETE FROM books WHERE id = $1;", [req.body.deleteItemId]);
  bookInfo = await db.query("SELECT * FROM books");
  books = bookInfo.rows;
  res.redirect("/");
});

//update selected book review
app.post("/update", async (req, res) => {
  await db.query("UPDATE books SET review = $1 WHERE id = $2;", [
    req.body.updatedItemReview,
    req.body.updateItemId,
  ]);
  bookInfo = await db.query("SELECT * FROM books");
  books = bookInfo.rows;
  res.redirect("/");
});

//listen on port 3000
app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
