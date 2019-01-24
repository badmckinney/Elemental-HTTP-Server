const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

/*********************
 * CONFIG
 ********************/

const PORT = process.env.PORT || 8080;

/*********************
 * AUTH
 ********************/

const authorized = {
  "mario": "itsame",
  "pacman": "wakawaka",
};

/*********************
 * SERVER
 ********************/
const server = http.createServer((req, res) => {

  /*
  * GET METHOD
  */

  if (req.method === "GET") {
    if (req.url === "/") {
      fs.readFile('./public/index.html', 'utf8', (err, data) => {
        if (err) {
          return res.end(`Error: ${err}`);
        } else {
          return res.end(data);
        }
      });
    }

    fs.readFile(`./public${req.url}`, 'utf8', (err, data) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404);
          fs.readFile('./public/404.html', 'utf8', (err, data) => {
            if (err) {
              return res.end(`Error: ${err}`);
            } else {
              return res.end(data);
            }
          });
        } else {
          return res.end(`Error: ${err}`);
        }
      } else {
        res.end(data);
      }
    });

    /*
    * POST METHOD
    */

  } else if (req.url === "/elements" && req.method === "POST") {
    if (req.headers.authorization) {
      const encodedString = req.headers.authorization.slice(6);
      const base64Buffer = new Buffer(encodedString, 'base64');
      const decodedString = base64Buffer.toString();
      let user = decodedString.slice(0, decodedString.indexOf(':'));
      let pass = decodedString.slice(decodedString.indexOf(':') + 1);

      if (authorized.hasOwnProperty(user) && authorized[user] === pass) {
        let body = "";

        req.on('data', (chunk) => { body += chunk; });

        req.on('end', (chunk) => {
          if (chunk) { body += chunk; }
          else {
            let bodyData = querystring.parse(body);
            let newPageTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <title>The Elements - ${bodyData.elementName}</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    
    <body>
      <h1>${bodyData.elementName}</h1>
      <h2>${bodyData.elementSymbol}</h2>
      <h3>Atomic number ${bodyData.elementAtomicNumber}</h3>
      <p>${bodyData.elementDescription}</p>
      <p><a href="/">back</a></p>
    </body>
    
    </html>
    `;

            fs.writeFile(`./public/${bodyData.elementName.toLowerCase()}.html`, newPageTemplate, (err, data) => {
              if (err) {
                res.writeHead(500);
                return res.end('{ "success": false }');
              }
              fs.readdir('./public', (err, files) => {
                if (err) { throw new Error(err); }
                else {
                  let blacklist = ['404.html', 'index.html', '.keep', 'css'];
                  let htmlList = "";
                  let elementCount = 0;

                  files.forEach(file => {
                    if (!blacklist.includes(file)) {
                      elementCount++;
                      let fileName = file.slice(0, file.indexOf('.'));
                      fileName = fileName[0].toUpperCase() + fileName.slice(1);

                      htmlList += `
                        <li>
                          <a href="${file}">${fileName}</a>
                        </li>
                      `;
                    }
                  });

                  let newIndexTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <title>The Elements</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    
    <body>
      <h1>The Elements</h1>
      <h2>These are all the known elements.</h2>
      <h3>These are ${elementCount}</h3>
      <ol>
        ${htmlList}
      </ol>
    </body>
    
    </html>
    `;

                  fs.writeFile('./public/index.html', newIndexTemplate, (err, data) => {
                    if (err) {
                      console.log(error);
                    }
                  });
                }
              });
              res.writeHead(200, { 'Content-Type': 'application/json' })
              return res.end('{ "success": true }');
            });
          }
        });
      } else {
        res.writeHead(401, { "WWW-Authenticate": 'Basic realm="SecureArea"' });
        return res.end(`<html><body>Invalid Authentication Credentials</body></html>`);
      }
    } else {
      res.writeHeader(401, { 'WWW-Authenticate': 'Basic realm="SecureArea"' });
      return res.end(`<html><body>Not Authorized</body></html>`);
    }

    /*
    * PUT METHOD
    */

  } else if (req.method === "PUT") {
    if (req.headers.authorization) {
      const encodedString = req.headers.authorization.slice(6);
      const base64Buffer = new Buffer(encodedString, 'base64');
      const decodedString = base64Buffer.toString();
      let user = decodedString.slice(0, decodedString.indexOf(':'));
      let pass = decodedString.slice(decodedString.indexOf(':') + 1);

      if (authorized.hasOwnProperty(user) && authorized[user] === pass) {
        fs.stat(`./public/${req.url}`, (err, stats) => {
          if (err == null) {
            let body = "";

            req.on('data', (chunk) => { body += chunk; });

            req.on('end', (chunk) => {
              if (chunk) { body += chunk; }
              else {
                let bodyData = querystring.parse(body);
                let newPageTemplate = `
                  <!DOCTYPE html>
                  <html lang="en">
    
                  <head>
                    <meta charset="UTF-8">
                    <title>The Elements - ${bodyData.elementName}</title>
                    <link rel="stylesheet" href="/css/styles.css">
                  </head>
    
                  <body>
                    <h1>${bodyData.elementName}</h1>
                    <h2>${bodyData.elementSymbol}</h2>
                    <h3>Atomic number ${bodyData.elementAtomicNumber}</h3>
                    <p>${bodyData.elementDescription}</p>
                    <p><a href="/">back</a></p>
                  </body>
    
                  </html>
                `;

                fs.writeFile(`./public/${bodyData.elementName.toLowerCase()}.html`, newPageTemplate, (err, data) => {
                  if (err) {
                    res.writeHead(500);
                    return res.end('{ "success": false }');
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  return res.end('{ "success": true }');
                });
              }
            });
          } else if (err.code === "ENOENT") {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(`{ "error" : "resource ${req.url} does not exist" }`);
          } else {
            res.writeHead(err.status, { "Content-Type": "application/json" });
            res.end(`{ "Error" : ${err.code} }`);
          }
        });
      } else {
        res.writeHead(401, { "WWW-Authenticate": 'Basic realm="SecureArea"' });
        return res.end(`<html><body>Invalid Authentication Credentials</body></html>`);
      }

    } else {
      res.writeHeader(401, { 'WWW-Authenticate': 'Basic realm="SecureArea"' });
      return res.end(`<html><body>Not Authorized</body></html>`);
    }

    /*
    * DELETE METHOD
    */

  } else if (req.method === "DELETE") {
    if (req.headers.authorization) {
      const encodedString = req.headers.authorization.slice(6);
      const base64Buffer = new Buffer(encodedString, 'base64');
      const decodedString = base64Buffer.toString();
      let user = decodedString.slice(0, decodedString.indexOf(':'));
      let pass = decodedString.slice(decodedString.indexOf(':') + 1);

      if (authorized.hasOwnProperty(user) && authorized[user] === pass) {
        fs.stat(`./public/${req.url}`, (err, stats) => {
          if (err == null) {
            fs.unlink(`./public/${req.url}`, (err) => {
              if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(`{ "Server error" : "Could not delete file" }`);
              } else {
                fs.readdir('./public', (err, files) => {
                  if (err) { throw new Error(err); }
                  else {
                    let blacklist = ['404.html', 'index.html', '.keep', 'css'];
                    let htmlList = "";
                    let elementCount = 0;

                    files.forEach(file => {
                      if (!blacklist.includes(file)) {
                        elementCount++;
                        let fileName = file.slice(0, file.indexOf('.'));
                        fileName = fileName[0].toUpperCase() + fileName.slice(1);

                        htmlList += `
    <li>
      <a href="${file}">${fileName}</a>
    </li>
    `;
                      }
                    });

                    let newIndexTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      
      <head>
        <meta charset="UTF-8">
        <title>The Elements</title>
        <link rel="stylesheet" href="/css/styles.css">
      </head>
      
      <body>
        <h1>The Elements</h1>
        <h2>These are all the known elements.</h2>
        <h3>These are ${elementCount}</h3>
        <ol>
          ${htmlList}
        </ol>
      </body>
      
      </html>
      `;

                    fs.writeFile('./public/index.html', newIndexTemplate, (err, data) => {
                      if (err) {
                        console.log(error);
                      }
                    });
                  }
                });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(`{ "success" : true }`);
              }
            });
          } else if (err.code === "ENOENT") {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(`{ "error" : "resource ${req.url} does not exist" }`);
          } else {
            res.writeHead(err.status, { "Content-Type": "application/json" });
            res.end(`{ "Error" : ${err.code} }`);
          }
        });
      } else {
        res.writeHead(401, { "WWW-Authenticate": 'Basic realm="SecureArea"' });
        return res.end(`<html><body>Invalid Authentication Credentials</body></html>`);
      }

    } else {
      res.writeHeader(401, { 'WWW-Authenticate': 'Basic realm="SecureArea"' });
      return res.end(`<html><body>Not Authorized</body></html>`);
    }
  }
});


server.listen(PORT, () => {
  console.log(`Running on PORT: ${PORT}`);
});