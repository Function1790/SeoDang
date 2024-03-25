const express = require('express')
const app = express()
const fs = require('fs')
const a = require('./test')
console.log(a.A)


//Express Setting
app.use(express.static('public'))
app.use('/views', express.static('views'))

//body Parser
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

//<----------Function---------->
const print = (data) => console.log(data)

async function readFile(path) {
    return await new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            resolve(data)
        })
    })
}

function forcedMoveCode(url) {
    return `<script>window.location.href = "${url}"</script>`
}

function forcedMoveWithAlertCode(text, url) {
    return `<script>alert(\`${text}\`);window.location.href = "${url}"</script>`
}

function goBackWithAlertCode(text) {
    return `<script>alert("${text}");window.location.href = document.referrer</script>`
}

async function renderFile(req, path, replaceItems = {}) {
    var content = await readFile(path)

    if (req.session.uid == "admin") {
        content = content.replaceAll('{{loginStatus}}', 'manage')
        content = content.replaceAll('{{userName}}', '관리')
    }

    if (req.session.isLogined == true) {
        content = content.replaceAll('{{loginStatus}}', 'MY')
        content = content.replaceAll('{{userName}}', req.session.name)
    } else {
        content = content.replaceAll('{{loginStatus}}', 'login')
        content = content.replaceAll('{{userName}}', 'login')
    }

    for (i in replaceItems) {
        content = content.replaceAll(`{{${i}}}`, replaceItems[i])
    }
    return content
}

async function sendRender(req, res, path, replaceItems) {
    res.send(await renderFile(req, path, replaceItems))
}



app.listen(5500, () => console.log('Server run https://localhost:5500'))
