// Step 1: Create an AbortController instance
const controller = new AbortController();

// Step 2: Get the AbortSignal from the controller
const signal = controller.signal;

// Step 3: Use fetch with the AbortSignal
fetch("http://localhost:3000/delayed", { signal: null })
  .then((response) => {
    console.log("Fetch successful");
    return response.json();
  })
  .then((data) => console.log(data))
  .catch((error) => {
    if (error.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Fetch error:", error);
    }
  });

// Simulate aborting the request after 1 second
setTimeout(() => {
  // Step 4: Abort the fetch request
  // console.log("Aborting fetch request");
  // controller.abort();
}, 1000);
