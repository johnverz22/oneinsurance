import sqlite from 'sqlite3'

export const db = new sqlite.Database(
  './auth.db',
  sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error(err.message)
    }
    console.log('Connected to the profile database.')
  }
)

export async function getTokenFromDB(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT token FROM payment_auth ORDER BY id DESC LIMIT 1',
      [],
      (err, row: { token: string } | undefined) => {
        if (err) {
          console.error('Database error:', err)
          return reject(err)
        }
        if (row) {
          resolve(row.token)
        } else {
          resolve(null)
        }
      }
    )
  })
}

export async function saveTokenToDB(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO payment_auth (token) VALUES (?)', [token], (err) => {
      if (err) {
        console.error('Database error:', err)
        return reject(err)
      }
      resolve()
    })
  })
}
