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


    // quest score methods


    async getScores() {
       return await this.all(
	       `
	WITH regular_scores AS (
            SELECT
                SUBSTR(key, INSTR(key, ':') + 1) AS address,
                COUNT(key) AS score,
                MAX(value) AS last_activity
            FROM info
            WHERE key NOT LIKE '%_daily'
            GROUP BY address
        ),
        daily_scores AS (
            SELECT
                SUBSTR(key, INSTR(key, ':') + 1) AS address,
                SUM(CAST(value AS INTEGER)) AS score
            FROM info
            WHERE key LIKE '%_daily'
            GROUP BY address
        )

        SELECT
            r.address,
            (IFNULL(r.score, 0) + IFNULL(d.score, 0)) AS total_score,
            r.last_activity
        FROM regular_scores r
        LEFT JOIN daily_scores d ON r.address = d.address

        UNION ALL

        SELECT
            d.address,
            d.score AS score,
            NULL AS last_activity
        FROM daily_scores d
        LEFT JOIN regular_scores r ON d.address = r.address
        WHERE r.address IS NULL
	       `
       );
    }
}

module.exports = {
  Database
}
