const express = require('express');
const http = require('http');
const app = express();

jenkins_host=process.env.JENKINS_HOST
auth_token=process.env.JENKINS_BASIC_AUTH_TOKEN

app.get('/', (req, res) => {
  res.send({msg: 'Request sent'})
})

auth_basic = "Basic " + auth_token.replace(/\s/g, '');

app.get('/build', (req, res) => {

    console.log("First Request")

    const options = {
        hostname: jenkins_host,
        path: "/crumbIssuer/api/json",
        method: "GET",
        headers: {
            "Authorization": auth_basic.toString()
        }
    }

    let crumb = "";

    const reqs = http.request(options, resp => {
        console.log(`statusCode: ${resp.statusCode}`)
        var cookies = resp.headers["set-cookie"];
        cookies = cookies[0].split(";") 
        const cookie = cookies[0]
        
        let body = ""

      
        resp.on('data', d => {
            body += d;
            process.stdout.write(d)
        })

        resp.on("end", () => {
            try {
                let json = JSON.parse(body);
                console.log(json)
                crumb = json.crumb;
            }catch(err){
                console.error(err.message)
            }

            crumb = crumb.toString()

            const data = ''

            const options_b = {
                hostname: jenkins_host,
                path: "/job/pipeline-groovy/build",
                method: "POST",
                headers: {
                    "Authorization": auth_basic.toString(),
                    "Cookie": cookie,
                    "Jenkins-Crumb": crumb,
                    "Content-Length": 0
                }
            }

            const reqs1 = http.request(options_b, resp1 => {
                console.log("Second Request")

                console.log(`statusCode: ${resp1.statusCode}`)
                      
                resp1.on('data', d1 => {
                    process.stdout.write(d1)
                })
        
            })
              
            reqs1.on('error', error => {
                console.error(error)
            })
            
            reqs1.write(data)
            reqs1.end()

        })

    })
      
    reqs.on('error', error => {
        console.error(error)
    })
      
    reqs.end()      

    res.send({msg: 'Job for execution sent'})
})

app.listen(5000, () => console.log('Server is up and running'));