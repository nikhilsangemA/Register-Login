const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// Register user API
app.post("/users/", async (request, response) => {
  const { username, name, gender, password, location } = request.body;
  const encryptedPassword = await bcrypt.hash(password, 10);
  const selectUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbresponse = await db.get(selectUser);
  console.log(dbresponse);
  if (dbresponse === undefined) {
    const createNewUser = `INSERT INTO user (username, name, password, gender, location)
                           VALUES ('${username}','${name}','${encryptedPassword}','${gender}','${location}')`;
    const dbresponse2 = await db.run(createNewUser);
    response.send("New User is Created");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//LOGIN User API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username = '${username}'`;
  const dbresponse = await db.get(selectUser);
  if (dbresponse === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const encryptedPasswordCompare = await bcrypt.compare(
      password,
      dbresponse.password
    );
    if (encryptedPasswordCompare === true) {
      response.send("Login Successfully");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
