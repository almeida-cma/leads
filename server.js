const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();

// Configurar SQLite
const db = new sqlite3.Database('./sampleDB.sqlite', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database");
});

// Criar tabelas para Users e user
const sql_create_users = `CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);`;

const sql_create_user = `CREATE TABLE IF NOT EXISTS user (
    name text NOT NULL,
    email text NOT NULL,
	celular text
);`;

db.run(sql_create_users, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful creation of the 'Users' table");
});

db.run(sql_create_user, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful creation of the 'user' table");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware for sessions
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Static files
app.use(express.static('public'));

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        const sql_insert = `INSERT INTO Users (username, password) VALUES (?, ?)`;
        db.run(sql_insert, [username, hash], (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            return res.status(201).json({ message: 'User created!' });
        });
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql_select = `SELECT * FROM Users WHERE username = ?`;

    db.get(sql_select, [username], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!row) {
            return res.status(400).json({ error: 'User not found. Please register!' });
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (result) {
                req.session.loggedin = true;
                req.session.username = username;
                return res.status(200).json({ message: 'Login successful!' });
            } else {
                return res.status(401).json({ message: 'Password is incorrect' });
            }
        });
    });
});

app.get('/admin', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, '/public/admin.html'));
    } else {
        res.send('Please login to view this page! <a href="/">Login</a>');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/dados', (req, res) => {
    let sql = `INSERT INTO user (name, email, celular) VALUES (?, ?, ?)`;
    let values = [req.body.name, req.body.email, req.body.celular];

    db.run(sql, values, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Rows inserted ${this.changes}`);
    });

    res.redirect('/return.html');
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/users', (req, res) => {
    let sql = "SELECT rowid as id, name, email FROM user";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email } = req.body;
    let sql = `UPDATE user SET name = ?, email = ? WHERE rowid = ?`;
    db.run(sql, [name, email, userId], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "User updated", changes: this.changes });
    });
});

app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    let sql = `DELETE FROM user WHERE rowid = ?`;
    db.run(sql, userId, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "User deleted", changes: this.changes });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
