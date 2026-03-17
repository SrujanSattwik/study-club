const getConnection = require("./db/oracle");

/**
 * Utility function to read Oracle CLOB as string
 */
async function readClob(lob) {
  if (lob === null) return null;

  return new Promise((resolve, reject) => {
    let data = "";
    lob.setEncoding("utf8");

    lob.on("data", chunk => {
      data += chunk;
    });

    lob.on("end", () => {
      resolve(data);
    });

    lob.on("error", err => {
      reject(err);
    });
  });
}

async function test() {
  let conn;

  try {
    console.log("Connecting to Oracle database...");
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT
         id,
         title,
         description,
         type,
         format,
         file_path,
         link,
         thumbnail,
         download_count,
         created_at
       FROM materials`
    );

    console.log(`\nMaterials found: ${result.rows.length}`);

    for (const row of result.rows) {
      // Convert CLOB to string
      row.DESCRIPTION = await readClob(row.DESCRIPTION);
      console.log(row);
    }

    console.log("\n✓ Database connected successfully!");
  } catch (err) {
    console.error("✗ Database error:", err);
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log("\n✓ Connection closed");
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}

test();
