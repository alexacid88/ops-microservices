const express = require('express');
const http = require('http');
const app = express();
app.get('/', (req, res) => {
  res.send({msg: 'Request sent'})
})

app.get('/build', (req, res) => {

    http.get("http://builder.localhost.com/crumbIssuer/api/json", (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk
        })

        response.on('end', () => {
            console.log(data)
        })
    })

    res.send({msg: 'Build sent'})
})

app.listen(5000, () => console.log('Server is up and running'));