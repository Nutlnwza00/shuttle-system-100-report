import "dotenv/config";
import bcrypt from "bcryptjs";
import oracledb from "oracledb";
const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error("Usage: npm run set-password -- <username> <password>");
  process.exit(1);
}
const c = await oracledb.getConnection({
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
});
const hash = await bcrypt.hash(password, 12);
await c.execute(
  "UPDATE users SET password_hash=:hash WHERE username=:username",
  { hash, username },
  { autoCommit: true },
);
console.log("Updated password for", username);
await c.close();
