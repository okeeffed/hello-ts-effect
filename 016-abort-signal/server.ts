import express from "express";
const app = express();
const port = 3000;

// Route that simulates a delayed response
app.get("/delayed", (req, res) => {
  console.log("Request received");

  let aborted = false;

  const timeoutId = setTimeout(() => {
    if (!aborted) {
      res.json({ message: "This is a delayed response" });
      console.log("Response sent");
    }
  }, 1000); // 5-second delay

  // Listen for the 'aborted' event to detect if the client aborts the request
  req.on("aborted", () => {
    console.log("Request aborted by the client");
    aborted = true;
    clearTimeout(timeoutId); // Clear the timeout to prevent sending the response
  });

  // Listen for the 'close' event on the response
  res.on("close", () => {
    if (!res.headersSent) {
      console.log("Response closed before headers were sent");
      clearTimeout(timeoutId); // Clear the timeout to prevent sending the response
    } else {
      console.log("Response closed after headers were sent");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
