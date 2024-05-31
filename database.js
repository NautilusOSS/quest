const sqlite3 = require('sqlite3');

class Database {
    db;
    constructor(dbFilePath) {
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if (err) {
                console.log('Could not connect to database', err);
            } else {
                console.log('Connected to database');
		/*
                this.db.get("SELECT value FROM info WHERE key='syncRound'", (err, row) => {
                    if (err || !row) {
                        console.log('Database does not exist.');
                    }
                });
		*/
            }
        });
        this.db.configure('busyTimeout', 10000);
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    console.log('Error running sql ' + query);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(this);
                    //resolve({ id: this.lastID });
                }
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + query);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + query);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.log('error during database connection close', err);
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    }

    async getInfo(key) {
        return await this.get(
            `
            SELECT value FROM info WHERE key = ?
            `,
            [key]
        );
    }

    async searchInfo(key) {
        return await this.all(
            `
	    SELECT * FROM info WHERE key LIKE ?
            `,
            [`%${key}%`]
        );
    }

    async setInfo(key, value) {
        return await this.run(
            `
            INSERT OR REPLACE INTO info (key, value) VALUES (?, ?)
            `,
            [key, value]
        );
    }
}

module.exports = {
  Database
}
