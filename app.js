const express = require('express')
const app = express()
const fs = require('fs')
const mysql = require('mysql')
const multer = require('multer');

//Session
const session = require('express-session')
const Memorystore = require('memorystore')
const cookieParser = require("cookie-parser");
const { count } = require('console')


//Express Setting
app.use(express.static('public'))
app.use('/views', express.static('views'))

//Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/item/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

const upload = multer({ storage })

//Mysql
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1790',
    database: 'seodang'
})
connection.connect();

async function sqlQuery(query) {
    let promise = new Promise((resolve, reject) => {
        const rows = connection.query(query, (error, rows, fields) => {
            resolve(rows)
        })
    })
    let result = await promise
    return result
}

//body Parser
const bodyParser = require('body-parser');
const { isUndefined } = require('util');
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

app.use(cookieParser('Seodang'))

app.use(session({
    secure: true,
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        Secure: true
    },
    name: 'data-session',
}))

const cookieConfig = {
    maxAge: 30000,
    path: '/',
    httpOnly: true,
    signed: true
}

//<----------Setting---------->
const CategoryToKOR = {
    "korean": "국어",
    "english": "영어",
    "math": "수학",
    "science": "과학",
    "society": "사회",
    "etc": "기타",
}
const CategoryToENG = Object
    .entries(CategoryToKOR)
    .map(([key, value]) => [value, key]);

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

    for (i in replaceItems) {
        content = content.replaceAll(`{{${i}}}`, replaceItems[i])
    }
    return content
}

/** res.send(renderFile(...)) */
async function sendRender(req, res, path, replaceItems = {}) {
    res.send(await renderFile(req, path, replaceItems))
}

function formatNum(value, len) {
    var result = value.toString()
    for (var i = 0; i < len - value.toString().length; i++) {
        result = "0" + result
    }
    return result
}

function formatDatetime(date, delta = 1) {
    var result = `${date.getFullYear()}년 ${date.getMonth() + delta}월 ${date.getDate()}일`
    result += ` ${formatNum(date.getHours(), 2)}:${formatNum(date.getMinutes(), 2)}:${formatNum(date.getSeconds(), 2)}`
    return result
}

function formatDatetimeInSQL(date, delta = 1) {
    var result = `${date.getFullYear()}-${date.getMonth() + delta}-${date.getDate()}`
    result += ` ${formatNum(date.getHours(), 2)}:${formatNum(date.getMinutes(), 2)}:${formatNum(date.getSeconds(), 2)}`
    return result
}


function toFormatMoney(point) {
    return point.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function isCorrectSQLResult(result) {
    try {
        if (result.length == 0) {
            return false
        }
        return true
    } catch {
        return false
    }
}

function isExistKeyword(text, keywords) {
    for (var i in keywords) {
        if (text.indexOf(keywords[i]) == -1) {
            return false
        }
    }
    return true
}

/** !isLogined = 로그인 X -> res.send */
function isLogined(req, res) {
    if (req.session.uid == undefined) {
        res.send(forcedMoveWithAlertCode("로그인이 필요한 서비스입니다.", '/login'))
        return false
    }
    return true
}

function checkPost(req, res, path='write') {
    const body = req.body
    var title = body.title ? body.title : ''
    var content = body.price ? body.content : ''
    try {
        var price = body.price ? body.price : 0
        price = Number(price)
    } catch {
        const link = `/${path}?title=${title}&content=${content}&price=${price}`
        res.send(forcedMoveWithAlertCode("가격에서 오류가 났습니다.", link))
        return false
    }
    try {
        const { originalname, filename, size } = req.file;
    } catch {
        const link = `/${path}?title=${title}&content=${content}&price=${price}`
        res.send(forcedMoveWithAlertCode("파일을 선택해주세요.", link))
        return false
    }
    if (!body.title || !body.content || !body.category) {
        const link = `/${path}?title=${title}&content=${content}&price=${price}`
        res.send(forcedMoveWithAlertCode("입력란에 빈칸이 없어야 합니다.", link))
        return false
    } else if (price < 0) {
        const link = `/${path}?title=${title}&content=${content}&price=${price}`
        res.send(forcedMoveWithAlertCode("가격은 음수가 아니여야합니다.", link))
        return false
    }
    return true
}

//<----------Server---------->
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send(forcedMoveCode('/home'))
})

app.get('/home', async (req, res) => {
    await sendRender(req, res, './views/home.html')
})

app.get('/search', async (req, res) => {
    const _find = req.query.data ? req.query.data.split(" ") : null
    const _cate = req.query.category ? req.query.category.toString() : ''
    const _condition = _cate ? ` where category='${_cate}'` : ''
    const result = await sqlQuery('select * from item' + _condition)
    var itemsHTML = ''
    for (var i in result) {
        if (_find) {
            var isInTitle = isExistKeyword(result[i].title, _find)
            var isInContent = isExistKeyword(result[i].content, _find)
            if (!isInTitle && !isInContent) {
                continue
            }
        }
        itemsHTML += `
        <a href="/item/${result[i].num}">
            <div class="item">
                <div class="item-header center">
                    <div class="item-imgWrap"><img src="/img/item/${result[i].imgName}"/></div>
                </div>
                <div class="item-container">
                    <div class="item-title">${result[i].title}</div>
                    <div class="item-description">${result[i].seller}</div>
                    <div class="item-price">${toFormatMoney(result[i].price)}원</div>
                </div>
            </div>
        </a>
    `
    }
    await sendRender(req, res, './views/search.html', {
        items: itemsHTML ? itemsHTML : "<div class='notFound'>게시물을 찾을 수 없습니다.</div>",
        category: _find ? "검색" : (req.query.category == undefined ? '거래' : CategoryToKOR[req.query.category])
    })
})

app.get('/item/:num', async (req, res) => {
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)
    try {
        if (result.length === 0) {
            res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
            return
        }
    } catch {
        res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
        return
    }
    const _item = result[0]
    //오류 처리
    const userResult = await sqlQuery(`select * from user where num=${_item.seller_num}`)
    const seller = userResult[0]
    await sendRender(req, res, './views/item-info.html', {
        num: req.params.num,
        date: formatDatetime(new Date(_item.post_time)),
        title: _item.title,
        content: _item.content,
        category: "#" + CategoryToKOR[_item.category],
        category_eng: _item.category,
        price: toFormatMoney(_item.price) + "원",
        imgName: _item.imgName
    })
})


app.get('/login', async (req, res) => {
    await sendRender(req, res, './views/login.html', {
        uid: req.query.uid == undefined ? '' : req.query.uid
    })
})

app.get('/logout', (req, res) => {
    req.session.name = null
    req.session.nickname = null
    req.session.uid = null
    req.session.num = null
    req.session.isLogined = false
    res.send(forcedMoveWithAlertCode('로그아웃 되셨습니다.', '/'))
})

app.post('/login-check', async (req, res) => {
    const body = req.body
    const uid = connection.escape(body.uid)
    const upw = connection.escape(body.upw)
    const result = await sqlQuery(`select * from user where uid=${uid} and upw=${upw}`)
    if (!isCorrectSQLResult(result)) {
        res.send(forcedMoveWithAlertCode('아이디/비밀번호가 잘못되었습니다.', "/login?uid=" + body.uid))
        return
    }
    req.session.name = result[0].name
    req.session.nickname = result[0].nickname
    req.session.uid = result[0].uid
    req.session.num = result[0].num
    req.session.isLogined = true
    res.send(forcedMoveWithAlertCode(`${result[0].nickname}님 환영합니다.`, "/"))
})

app.get('/write', async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    var title = req.query.title ? req.query.title : ''
    var content = req.query.content ? req.query.content : ''
    var price = req.query.price ? req.query.price : ''
    await sendRender(req, res, './views/write.html', {
        title: title,
        content: content,
        price: price
    })
})

app.post('/write-check', upload.single('itemImg'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    if (!checkPost(req, res)) {
        return
    }
    const body = req.body
    const { originalname, filename, size } = req.file;
    var price = body.price ? body.price : 0
    price = Number(price)
    var title = body.title.replaceAll('<', '< ')
    var content = body.content.replaceAll('<', '< ')

    var query = 'insert into item (title, content, category, price, contact, post_time, isSelled, seller, seller_num, imgName) '
    query += `values ("${title}"," ${content}", "${body.category}", ${price}, "010-0000-0000", "${formatDatetimeInSQL(new Date())}", 0, "${req.session.uid}", ${req.session.num}, "${originalname}");`
    await sqlQuery(query)
    await res.send(forcedMoveCode(`/search?category=${body.category}`))
})

app.get('/profile', async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    const result = await sqlQuery(`select * from user where num=${req.session.num}`)

    await sendRender(req, res, './views/profile.html', {
        nickname: result[0].nickname,
        uid: result[0].uid,
        schoolid: result[0].schoolid
    })
})

app.get('/modify/:num', async (req, res) => {
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)
    try {
        if (result.length === 0) {
            res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
            return
        }
    } catch {
        res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
        return
    }
    const _item = result[0]
    //오류 처리
    const userResult = await sqlQuery(`select * from user where num=${_item.seller_num}`)
    const seller = userResult[0]
    if (!seller.num == req.session.num) {
        res.send(forcedMoveWithAlertCode('게시물을 수정할 수 있는 권한이 없습니다.', '/'))
        return
    }
    await sendRender(req, res, './views/modify.html', {
        num: req.params.num,
        date: formatDatetime(new Date(_item.post_time)),
        title: _item.title,
        content: _item.content,
        price: _item.price,
        imgName: _item.imgName
    })
})

app.post('/modify-check/:num', upload.single('itemImg'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    if (!checkPost(req, res, 'modify')) {
        return
    }
    const body = req.body
    const { originalname, filename, size } = req.file;
    var price = body.price ? body.price : 0
    price = Number(price)
    var title = body.title.replaceAll('<', '< ')
    var content = body.content.replaceAll('<', '< ')

    var query = 'update item set '
    query += `title='${title}' , `
    query += `content='${content}' , `
    query += `category='${body.category}' , `
    query += `price=${price} , `
    query += `imgName='${originalname}' `
    query += `where num=${req.params.num}`
    await sqlQuery(query)
    await res.send(forcedMoveCode(`/item/${req.params.num}`))
})

app.listen(5500, () => console.log('Server run https://127.0.0.1:5500'))
