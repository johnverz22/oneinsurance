import { db } from './database'

const migrate = () => {
  db.serialize(() => {
    db.run(
      `
                CREATE TABLE IF NOT EXISTS payment_auth(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL
                );
            `
    ),
      (err: Error) => {
        if (err) {
          console.error(err.message)
        }
        console.log('payment_auth table created successfully.')
      }
  })
}

migrate()
