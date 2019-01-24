const http = require('http');
const fs = require('fs');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
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
          res.readFile('./public/404.html', 'utf8', (err, data) => {
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
  } else if (req.url === "/elements" && req.method === "POST") {
    let body = "";

    req.on('data', (chunk) => { body += chunk; });

    req.on('end', (chunk) => {
      if (chunk) { body += chunk; }
      else {
        let bodyData = body.split('&');
        let elementName = bodyData[0].slice(bodyData[0].indexOf('=') + 1);
        let elementSymbol = bodyData[1].slice(bodyData[1].indexOf('=') + 1);
        let elementAtomicNumber = bodyData[2].slice(bodyData[2].indexOf('=') + 1);
        let description = bodyData[3].slice(bodyData[3].indexOf('=') + 1);
        let elementDescription = description.split('%20').join(' ').split('%2C').join(' ');
        let newPageTemplate = `
                <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="UTF-8">
          <title>The Elements - ${elementName}</title>
          <link rel="stylesheet" href="/css/styles.css">
        </head>

        <body>
          <h1>${elementName}</h1>
          <h2>${elementSymbol}</h2>
          <h3>Atomic number ${elementAtomicNumber}</h3>
          <p>${elementDescription}</p>
          <p><a href="/">back</a></p>
        </body>

        </html>
                `;

        fs.writeFile(`./public/${elementName.toLowerCase()}.html`, newPageTemplate, (err, data) => {
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
                  console.log(fileName);
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
  }
});

server.listen(PORT, () => {
  console.log(`Running on PORT: ${PORT}`);
});