// Complete Events Exercise

const { EventEmitter } = require("events"); //Import “EventEmitter” from the events module
const { createServer } = require("http");
const { appendFile, readFile, createReadStream, read } = require("fs");
const path = require("path");

const NewsLetter = new EventEmitter(); // Using the EventEmitter class, create a new EventEmitter instance called “NewsLetter”

const server = createServer((req, res) => { //Instantiate a new server instance with createServer
    const { url, method } = req;

    req.on("error", (err) => { // Account for errors



        console.log(err); // Listen for error events on the request and response objects, and send back appropriate status codes and messages.
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "Invalid request" }));
        res.end();
    });

    res.on("error", (err) => { // Listen for error events on the request and response objects, and send back appropriate status codes and messages.
        console.log(err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "Server error" }));
        res.end();
    });


    const chunks = []; // pass chunks into an array

    req.on("data", (chunk) => { //Inside the server request handler, listen for the ‘data’ event to be emitted
        chunks.push(chunk); // and pass in a callback function that pushes each ‘chunk’ into an array named ‘chunks’
    });

    req.on("end", () => { //Listen for the request ReadStream ‘end’ event
        if (url === "/newsletter_signup" && method === "POST") { // check the request url and method, and if they are “POST” and “/newsletter_signup”, 
            const body = JSON.parse(Buffer.concat(chunks).toString()); // decode the chunks array with Buffer.concat().toString(), and use JSON.parse() on the result to access the request body values

            const newContact = `${body.name},${body.email}\n`; // emit a ‘signup’ event, and pass in the string value to be used by your event listener callback (name + email for csv record)
            NewsLetter.emit("signup", newContact, res); // fire event "NewsLetter"

            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "Successfully signed up for newsletter" })); // write response to the client
            res.end(); // end response

        } else { // Account for any method or url that is not “POST” + “/newsletter_signup”
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "Not a valid endpoint" }));
            res.end();
        }
    });

    NewsLetter.on("signup", (newContact, res) => { // Outside of your server request handler, add an event listener for a ‘signup’ event on the NewsLetter EventEmitter. Pass in a callback that takes in a ‘contact’ as a parameter
        appendFile( // This function should use fs.appendFile() to 
            path.join(__dirname, "./assets/newsletter.csv"), // add the contact to a csv file in your project directory
            newContact, (err) => {
                if (err) {
                    NewsLetter.emit("error", err, res);
                    return;
                };
                console.log("The file was updated successfully!");
            }
        );
    });

    NewsLetter.on("error", (err, res) => { // Listen for an error event on the NewLetter emitter, and 

        console.log(err);
        res.statusCode = 500; // send back a 500 server error status code 
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "Error adding new contact to newsletter" })); // with an appropriate response message.
        res.end();
    });

});