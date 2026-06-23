import pool from "./db.js"

const [result] = await pool.execute(`
  INSERT INTO users (username, email, password, role, employee_id, is_active) VALUES
  ('admin', 'admin@hrm.com', '$2b$10$BwYzWgSWws2NYtjHQig.c.da1mKx28d4odUdF4lQ8kLKj5c7uXXF6', 'admin', NULL, 1),
  ('hr001', 'hr@hrm.com', '$2b$10$BwYzWgSWws2NYtjHQig.c.da1mKx28d4odUdF4lQ8kLKj5c7uXXF6', 'hr', 2, 1),
  ('manager', 'manager@hrm.com', '$2b$10$BwYzWgSWws2NYtjHQig.c.da1mKx28d4odUdF4lQ8kLKj5c7uXXF6', 'manager', 1, 1),
  ('nv001', 'nv001@hrm.com', '$2b$10$BwYzWgSWws2NYtjHQig.c.da1mKx28d4odUdF4lQ8kLKj5c7uXXF6', 'employee', 4, 1)
`)
console.log("✅ Insert users thành công!", result)
process.exit(0)