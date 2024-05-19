const express = require('express')
const app = express()
const fs = require('fs')
const mysql = require('mysql')
const multer = require('multer');

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const path = require('path')

//Session
const session = require('express-session')
const Memorystore = require('memorystore')
const cookieParser = require("cookie-parser");
const { count } = require('console')


//Express Setting
app.use(express.static('public'))
app.use('/views', express.static('views'))

//Multer
const uuid4 = require('uuid4');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/img/item/')
    },
    filename: async (req, file, cb) => {
        const randomID = uuid4();
        const ext = path.extname(file.originalname);
        const filename = randomID + ext;
        cb(null, filename)
    },
})

const storage2 = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/file/item/')
    },
    filename: (req, file, callback) => {
        const randomID = uuid4();
        const ext = path.extname(file.originalname);
        const filename = randomID + ext;
        callback(null, filename)
    }
})

const upload = multer({ storage })
const upload2 = multer({ storage: storage2 })

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

//TP1
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
    .map(([key, value]) => [value, key])

const CategoryDetail = {
    "koraen": [
        "국어", "문학", "독서", "화법과 작문", "언어와 매체", "심화 국어"
    ],
    "english": [
        "영어", "영어I", "영어II", "영어 독해와 작문", "심화 영어"
    ],
    "math": [
        "수학(상)", "수학(하)", "수학I", "수학II", "미적분", "확룰과 통계", "기하"
    ],
    "science": [
        "통합과학", "화학I", "물리학I", "지구과학I", "생명과학I"
    ],
    "society": [
        "통합사회"
    ],
    "etc": [
        "정보"
    ]
}
const COUNT_PER_PAGE = 20
const reportCategoryPOST = [
    "부적절한 사진",
    "부적절한 제목/글",
    "부적절한 댓글",
    "거래 사기",
]
//TP2
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

function goBackCode() {
    return `<script>window.location.href = document.referrer</script>`
}


async function renderFile(req, path, replaceItems = {}) {
    var content = await readFile(path)

    var alertIMG = 'alert'
    if (req.session.isLogined) {
        var alertResult = await sqlQuery(`select * from alert where isRead=0 and listener_num=${req.session.num} limit 1`)
        if (alertResult.length) {
            alertIMG = 'alertPing'
        }
    }
    content = content.replace('{{alert_state}}', alertIMG)

    for (i in replaceItems) {
        content = content.replaceAll(`{{${i}}}`, replaceItems[i])
    }

    return `
        <link rel="icon" href="/img/icon/logo.png"/>
        <script>
            function goBack(){
                window.location.href = document.referrer
            }
        </script>
    ` + content
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

function isFileList(imgName) {
    if (imgName[0] == '[') {
        return true
    }
    return false
}

/** !isLogined = 로그인 X -> res.send */
function isLogined(req, res) {
    if (req.session.uid == undefined) {
        res.send(forcedMoveWithAlertCode("로그인이 필요한 서비스입니다.", '/login'))
        return false
    }
    return true
}

function checkPost(req, res, path = 'write', isNotImg = false) {
    const body = req.body
    var title = body.title ? body.title : ''
    var content = body.content ? body.content : ''
    var category = body.category ? body.category : ''
    var caller = ''
    try {
        var price = body.price ? body.price : 0
        price = Number(price)
    } catch {
        const link = `/${path}?title=${title}&content=${content}&price=${price}&category=${category}`
        res.send(forcedMoveWithAlertCode("가격은 0 이상의 정수를 입력해주세요.", link))
        return false
    }
    try {
        const { originalname, filename, size } = req.file;
    } catch {
        if (!isNotImg && req.files == undefined) {
            const link = `/${path}?title=${title}&content=${content}&price=${price}&category=${category}`
            res.send(forcedMoveWithAlertCode("파일을 선택해주세요.", link))
            return false
        }
    }

    if (!body.title || !body.content || !body.category) {
        const link = `/${path}?title=${title}&content=${content}&price=${price}&category=${category}`
        res.send(forcedMoveWithAlertCode("입력란에 빈칸이 없어야 합니다.", link))
        return false
    } else if (price < 0) {
        const link = `/${path}?title=${title}&content=${content}&price=${price}`
        res.send(forcedMoveWithAlertCode("가격은 음수가 아니여야합니다.", link))
        return false
    }
    if (body.title.length < 4) {
        const link = `/${path}?title=${title}&content=${content}&price=${price}&category=${category}`
        res.send(forcedMoveWithAlertCode("제목의 길이는 4글자 이상이여야 합니다.", link))
        return false
    }
    if (price > 1000000) {
        const link = `/${path}?title=${title}&content=${content}&price=${1000000}&category=${category}`
        res.send(forcedMoveWithAlertCode("가격은 1,000,000원 이하의 정수여야 합니다.", link))
        return false
    }
    return true
}

function getCategoryForm(select) {
    var _HTML = ''
    for (var i in CategoryToKOR) {
        _HTML += `<option value="${i}" ${select == i ? 'selected' : ''}>${CategoryToKOR[i]}</option>`
    }
    return _HTML
}

function loginGuest(req) {
    req.session.name = 'guest'
    req.session.nickname = 'guest'
    req.session.uid = 'guest'
    req.session.num = 1
    req.session.isLogined = true
}

function loginAdmin(req) {
    req.session.name = '관리자'
    req.session.nickname = '관리자'
    req.session.uid = 'admin'
    req.session.num = 4
    req.session.isLogined = true
}

/** 성공시 Number, 실패시 0 */
function toNumber(value) {
    try {
        var result = value ? Number(value) : 0
        return result
    } catch {
        return 0
    }
}

function isAdmin(req) {
    if (req.session.uid === 'admin') {
        return true
    }
    return false
}

function getCallerHTML(req, sqlResult) {
    if (!req.session.num) {
        return ''
    }
    return `
    <div class="wrapCaller center">
        <div class="caller">
            <div class="caller-header">
                <div class="caller-title center">연락처 </div>
                <div class="closeBtn center">x</div>
            </div>
            <div class="caller-container center">
                <div class="textWrap">
                    ${sqlResult.contact}
                </div>
            </div>
        </div>
    </div>`
}

async function sendAlert(req, content, link, listener_num = '') {
    var listener_num = listener_num ? listener_num : req.session.num
    var query = `insert into alert (listener_num, content, post_time, isRead, link) value (${listener_num}, '${content}', '${formatDatetimeInSQL(new Date())}', 0, '${link}');`
    await sqlQuery(query)
}

function toShort(text, length) {
    var result = ''
    for (var i in text) {
        if (length - 3 <= i) {
            result += '...'
            break
        }
        result += text[i]
    }
    for (var i = text.length - 6; i < text.length; i++) {
        result += text[i]
    }
    return result
}

async function isWrongWithParam(req, res) {
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)
    try {
        Number(req.params.num)
    } catch {
        res.send(forcedMoveWithAlertCode('링크 형식이 잘못되었습니다.', '/'))
        return true
    }
    try {
        if (result.length === 0) {
            res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
            return true
        }
    } catch {
        res.send(forcedMoveWithAlertCode('해당 게시물을 찾을 수 없습니다.', '/'))
        return true
    }
    if (result[0].seller_num != req.session.num && !isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('게시물을 수정할 수 있는 권한이 없습니다.', '/'))
        return true
    }
    return false
}

function toCommentHTML(req, comment, item, additon_class = '') {
    var delete_btn = ''
    if (comment.from_num === req.session.num || item.seller_num === req.session.num || isAdmin(req)) {
        delete_btn = `
        <a href="/delete-comment/${comment.num}">
            <div class="comment-button comment-delete">
                삭제
            </div>
        </a>`
    }
    return `
    <div class="comment ${additon_class}">
        <div class="comment-header">
            <img class="comment-img" src="/img/icon/user.png">
        </div>
        <div class="comment-container">
            <div class="comment-name">${comment.from_uid}</div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-button-wrap">
                <div class="comment-button comment-reply">답하기</div>
                ${delete_btn}
            </div>
            <div class="hidden comment-key">${comment.num}</div>
        </div>
    </div>`
}

async function getCommentHTML(req, item) {
    //(to_num, from_num, from_uid , reply_to, content, post_time)
    if (!req.session.isLogined) { return '' }
    var comments = await sqlQuery(`select * from comment where to_num=${item.num} and from_num=${req.session.num}`)
    if (req.session.num == item.seller_num || isAdmin(req)) {
        comments = await sqlQuery(`select * from comment where to_num=${item.num}`)
    }

    var commentsList = []
    var replyedList = []
    for (var i in comments) {
        if (replyedList.indexOf(`${i}`) != -1) {
            continue
        }
        commentsList.push(comments[i])
        var last = commentsList.length - 1
        commentsList[last].reply = []
        for (var j in comments) {
            if (comments[i].num === comments[j].reply_to) {
                commentsList[last].reply.push(comments[j])
                replyedList.push(j)
            }
        }
    }

    var commentHTML = ''
    for (var i in commentsList) {
        var _comment = commentsList[i]
        commentHTML += toCommentHTML(req, _comment, item)
        for (var j in _comment.reply) {
            var _replyed = _comment.reply[j]
            commentHTML += toCommentHTML(req, _replyed, item, 'comment-replyed')
        }
    }
    return commentHTML
}

function preventSQLI(text) {
    return connection.escape(text)
}

function isExistResult(sqlresult) {
    try {
        if (sqlresult.length == 0) {
            return false
        }
        return true
    } catch {
        return false
    }
}

function getTemp(tempValue) {
    return 36.5 + tempValue / 10
}

//TP3
//<----------Server---------->
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send(forcedMoveCode('/home'))
})

app.get('/home', async (req, res) => {
    loginGuest(req)
    await sendRender(req, res, './views/home.html')
})


app.get('/search', async (req, res) => {
    const _find = req.query.data ? req.query.data.split(" ") : ''
    const _cate = req.query.category ? req.query.category.toString() : ''
    const _page_index = toNumber(req.query.page)
    const _page = _page_index * COUNT_PER_PAGE
    var _condition = req.query.creator ? ' where is_hidden=0' : ` where is_buyed=0 and is_hidden=0`
    _condition += _cate ? ` and category='${_cate}'` : ''
    if (_condition) {
        _condition += req.query.creator ? ` and seller='${req.query.creator}'` : ''
    } else {
        _condition += req.query.creator ? ` seller='${req.query.creator}'` : ''
    }

    const result = await sqlQuery('select * from item' + _condition + ` order by num desc limit ${_page}, ${COUNT_PER_PAGE}`)
    var max_page = await sqlQuery('select count(num) from item' + _condition)
    max_page = Math.ceil(toNumber(max_page[0]['count(num)']) / COUNT_PER_PAGE)
    var itemsHTML = ''
    var past = req.query.creator ? `past=${req.query.creator}&` : ''
    var searcher = req.query.data ? `searcher=${req.query.data}` : ''
    for (var i in result) {
        if (_find) {
            var isInTitle = isExistKeyword(result[i].title, _find)
            var isInContent = isExistKeyword(result[i].content, _find)
            var isInNickname = isExistKeyword(result[i].seller_nickname, _find)
            if (!isInTitle && !isInContent && !isInNickname) {
                continue
            }
        }
        var imgSrc = result[i].is_file ? '/img/icon/carrot.png' : `/img/item/${result[i].imgName}`
        itemsHTML += `
        <a href="/item/${result[i].num}?${past}${searcher}">
            <div class="item ${result[i].is_buyed ? 'soldout' : ''}">
                <div class="item-header center">
                    <div class="item-imgWrap"><img src="${imgSrc}"/></div>
                </div>
                <div class="item-container">
                    <div class="item-title">${result[i].title}</div>
                    <div class="item-description">${result[i].seller_nickname}</div>
                    <div class="item-price">${result[i].price == 0 ? '무료' : toFormatMoney(result[i].price) + '원'}</div>
                </div>
            </div>
        </a>
    `
    }

    var url = `/search?data=${_find}&category=${_cate}&page=`
    var backHTML = '<div class="pageBtn center dontgo">←</div>'
    var nextHTML = '<div class="pageBtn center dontgo">→</div>'
    if (_page_index > 0) {
        backHTML = `<a href='${url}${_page_index - 1}'><div class="pageBtn center">←</div></a>`
    }
    if (_page_index < max_page - 1) {
        nextHTML = `<a href='${url}${_page_index + 1}'><div class="pageBtn center">→</div></a>`
    }
    await sendRender(req, res, './views/search.html', {
        items: itemsHTML ? itemsHTML : "<div class='notFound'>게시물을 찾을 수 없습니다.</div>",
        category: _find ? `검색 : ${req.query.data}` : (req.query.category == undefined ? '거래' : CategoryToKOR[req.query.category]),
        pageNum: _page_index + 1,
        gotoBack: backHTML,
        gotoNext: nextHTML
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
    var callBtn = _item.is_buyed ? `<div class="callBtn soldout">거래완료</div>` : ``

    const isSeller = req.session.num == _item.seller_num
    var modifyHTML = ''
    if (isSeller || isAdmin(req)) {
        callBtn = _item.is_buyed ? `
        <a class="callBtn soldout"><div >종료취소</div></a>
        ` : `<a class="callBtn" href="/soldout/${_item.num}"><div >거래종료</div></a>`
        modifyHTML = `
        <div class='wrapButton'>
            <a href="/modify/${_item.num}">
                <div class="modify-button center">수정하기</div>
            </a>
        </div>`
    } else {
        modifyHTML = `
            <div class='wrapButton'>
            <a href="/report/post/${_item.num}">
                <div class="modify-button center">신고하기</div>
            </a>
        </div>`
    }
    var imgHTML = `<img src="/img/item/${_item.imgName}" class="main-photo">`
    var filesHTML = ''
    if (_item.is_file) {
        imgHTML = ''
        var names = JSON.parse(_item.imgName)
        for (var i in names) {
            filesHTML += `
            <a href='/download?name=${names[i]}' target='_blank'>
                <div class='file-block'>
                    <div class='file-title'>파일${Number(i) + 1}</div>
                    <div class='file-content center'>${toShort(names[i], 10)}</div>
                </div>
            </a>
            `
        }
    }
    filesHTML = `<div class="filesWrap">${filesHTML}</div>`
    var callerHTML = _item.is_buyed ? '' : getCallerHTML(req, _item)
    var hashtag = `#${CategoryToKOR[_item.category]} #${_item.is_file ? '파일' : '이미지'}`
    await sendRender(req, res, './views/item-info.html', {
        num: req.params.num,
        date: formatDatetime(new Date(_item.post_time)),
        title: _item.title,
        content: _item.content,
        category: hashtag,
        category_eng: _item.category,
        price: _item.price == 0 ? '무료' : toFormatMoney(_item.price) + '원',
        modify: modifyHTML,
        caller: isSeller ? '' : callerHTML,
        callBtn: callBtn,
        imgHTML: imgHTML,
        files: filesHTML,
        comment: await getCommentHTML(req, _item),
        commentstate: req.session.isLogined ? '' : 'hidden',
        additon: req.query.past ? `${req.query.past}` : '',
        searcher: req.query.searcher ? `${req.query.searcher}` : '',
        sellerUid: seller.uid,
        sellerNickname: seller.nickname,
    })
})

app.get('/download', (req, res, next) => {
    const filename = req.query.name
    const fileroute = __dirname + `/public/file/item/${filename}`
    if (fs.existsSync(fileroute)) {
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`) // 이게 핵심 
        res.sendFile(__dirname + `/public/file/item/${filename}`)
        return
    }
    res.send('해당 파일이 없습니다.')
});


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
    var caller = req.query.caller ? req.query.caller : ''
    await sendRender(req, res, './views/write.html', {
        title: title,
        content: content,
        price: price,
        category: getCategoryForm(req.query.category),
        caller: caller,
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
    var caller = body.caller

    var query = 'insert into item (title, content, category, price, contact, post_time, isSelled, seller, seller_num, imgName, is_buyed, is_hidden, is_file, seller_nickname) '
    query += `values ("${title}"," ${content}", "${body.category}", ${price}, "${caller}", 
        "${formatDatetimeInSQL(new Date())}", 0, "${req.session.uid}", ${req.session.num},
        "${filename}", 0, 0, 0, ${req.session.nickname});`
    print(query)
    await sqlQuery(query)
    var lastIndex = await sqlQuery('select num from item order by num desc limit 1')

    await sendAlert(req, `<span class="bold">${title}</span> 게시물을 생성하였습니다.`, `/item/${lastIndex[0].num}`)
    res.send(forcedMoveCode(`/search?category=${body.category}`))
})

app.post('/write-check2', upload2.array('itemFile'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    if (!checkPost(req, res)) {
        return
    }
    const body = req.body
    var price = body.price ? body.price : 0
    price = Number(price)
    var title = body.title.replaceAll('<', '< ')
    var content = body.content.replaceAll('<', '< ')
    var caller = body.caller

    var _names = []
    for (var i in req.files) {
        _names.push(req.files[i].filename)
    }
    var _names = JSON.stringify(_names)

    var query = 'insert into item (title, content, category, price, contact, post_time, isSelled, seller, seller_num, imgName, is_buyed, is_hidden,is_file) '
    query += `values ("${title}"," ${content}", "${body.category}", ${price}, "${caller}", "${formatDatetimeInSQL(new Date())}", 0, "${req.session.uid}", ${req.session.num}, '${_names}', 0, 0, 1);`
    await sqlQuery(query)
    var lastIndex = await sqlQuery('select num from item order by num desc limit 1')

    await sendAlert(req, `<span class="bold">${title}</span> 게시물을 생성하였습니다.`, `/item/${lastIndex[0].num}`)
    res.send(forcedMoveCode(`/search?category=${body.category}`))
})

app.get('/view-profile', async (req, res) => {
    const result = await sqlQuery(`select * from user where uid='${req.query.uid}'`)

    if (!result) {
        await sendRender(req, res, './views/error.html')
        return
    }
    await sendRender(req, res, './views/profile.html', {
        nickname: result[0].nickname,
        uid: result[0].uid,
        schoolid: result[0].schoolid,
        isHidden: 'hidden',
        manageHTML: '',
        tempValue: getTemp(result[0].temp_value)
    })
})

app.get('/profile', async (req, res) => {
    if (!req.session.isLogined) {
        res.send(forcedMoveCode('/login'))
        return
    }
    const result = await sqlQuery(`select * from user where num=${req.session.num}`)

    await sendRender(req, res, './views/profile.html', {
        nickname: result[0].nickname,
        uid: result[0].uid,
        schoolid: result[0].schoolid,
        isHidden: '',
        tempValue: getTemp(result[0].temp_value),
        manageHTML: isAdmin(req) ? `<a href="/manage">
                        <div class="goto-btn-wrap">
                            <div class="goto-button">관리자</div>
                            <div class="btn-name center">관리하기</div>
                        </div>
                    </a>`: ''
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
    if (seller.num !== req.session.num && !isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('게시물을 수정할 수 있는 권한이 없습니다.', '/'))
        return
    }
    var filestate = 'img'
    var filesHTML = ''
    if (_item.is_file) {
        filestate = 'file'
        imgHTML = ''
        var files = JSON.parse(_item.imgName)
        for (var i in files) {
            filesHTML += `<div id="file${i}" class="filebox"><p class="name">${toShort(files[i], 10)}</p></div>`
        }
    }
    var hideBtn = isAdmin(req) ? `
        <a href="/hide/${req.params.num}">
            <div class="confirmBtn center">가리기</div>
        </a>
        <a href="/hide-cancel/${req.params.num}">
            <div class="confirmBtn center">가리기 취소</div>
        </a>` : ''
    await sendRender(req, res, './views/modify.html', {
        num: req.params.num,
        date: formatDatetime(new Date(_item.post_time)),
        title: _item.title,
        content: _item.content,
        price: req.query.price ? req.query.price : _item.price,
        imgName: _item.imgName,
        category: getCategoryForm(_item.category),
        files: filesHTML,
        state: filestate,
        hideBtn: hideBtn
    })
})

app.post('/modify-check/:num', upload.single('itemImg'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    if (!checkPost(req, res, `modify/${req.params.num}`, true)) {
        return
    }
    const body = req.body
    if (!req.file) {
        var originalname = ''
    } else {
        var { originalname, filename, size } = req.file;
    }
    var price = body.price ? body.price : 0
    price = Number(price)
    var title = body.title.replaceAll('<', '< ')
    var content = body.content.replaceAll('<', '< ')
    //var caller = body.caller.replaceAll('<', '< ')
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)
    const _item = result[0]
    //오류 처리
    const userResult = await sqlQuery(`select * from user where num=${_item.seller_num}`)
    const seller = userResult[0]
    if (seller.num !== req.session.num && !isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('게시물을 수정할 수 있는 권한이 없습니다.', '/'))
        return
    }
    var query = 'update item set '
    query += `title='${title}' , `
    query += `content='${content}' , `
    query += `category='${body.category}' , `
    query += `price=${price} `
    //query += `contact='${caller}' `
    query += !Boolean(filename) ? '' : `,imgName='${filename}' `
    query += `where num=${req.params.num}`

    await sqlQuery(query)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물이 수정되었습니다.`, `/item/${req.params.num}`)
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 수정되었습니다.`, `/item/${req.params.num}`, result[0].seller_num)
    }
    res.send(forcedMoveCode(`/item/${req.params.num}`))
})

app.post('/modify-check2/:num', upload2.array('itemFile'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    if (!checkPost(req, res, `modify/${req.params.num}`, true)) {
        return
    }
    const body = req.body
    var _names = []
    for (var i in req.files) {
        _names.push(req.files[i].filename)
    }
    var _names_str = JSON.stringify(_names)
    var price = body.price ? body.price : 0
    price = Number(price)
    var title = body.title.replaceAll('<', '< ')
    var content = body.content.replaceAll('<', '< ')
    //var caller = body.caller.replaceAll('<', '< ')
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)
    const _item = result[0]
    //오류 처리
    const userResult = await sqlQuery(`select * from user where num=${_item.seller_num}`)
    const seller = userResult[0]
    if (seller.num !== req.session.num && !isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('게시물을 수정할 수 있는 권한이 없습니다.', '/'))
        return
    }
    var query = 'update item set '
    query += `title='${title}' , `
    query += `content='${content}' , `
    query += `category='${body.category}' , `
    query += `price=${price} `
    //query += `contact='${caller}' `
    query += _names.length == 0 ? '' : `,imgName='${_names_str}' `
    query += `where num=${req.params.num}`
    await sqlQuery(query)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물이 수정되었습니다.`, `/item/${req.params.num}`)
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 수정되었습니다.`, `/item/${req.params.num}`, result[0].seller_num)
    }
    res.send(forcedMoveCode(`/item/${req.params.num}`))
})


app.get('/delete/:num', async (req, res) => {
    if (await isWrongWithParam(req, res)) {
        return
    }
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)

    var title = result[0].title
    await sqlQuery(`delete from item where num=${req.params.num}`)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물을 삭제하였습니다.`, '')
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 삭제되었습니다.`, '', result[0].seller_num)
    }
    res.send(forcedMoveCode(`/search?category=${result[0].category}`))
})

app.get('/hide/:num', async (req, res) => {
    if (await isWrongWithParam(req, res)) {
        return
    }
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)

    var title = result[0].title
    await sqlQuery(`update item set is_hidden=1 where num=${req.params.num}`)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물을 가렸습니다.`, `/item/${req.params.num}`)
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 가려졌습니다.`, `/item/${req.params.num}`, result[0].seller_num)
    }
    res.send(forcedMoveCode(`/search?category=${result[0].category}`))
})

app.get('/hide-cancel/:num', async (req, res) => {
    if (await isWrongWithParam(req, res)) {
        return
    }
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)

    var title = result[0].title
    await sqlQuery(`update item set is_hidden=0 where num=${req.params.num}`)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물에 가려짐을 취소하였습니다.`, `/item/${req.params.num}`)
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 가려짐이 취소되었습니다.`, `/item/${req.params.num}`, result[0].seller_num)
    }
    res.send(forcedMoveCode(`/search?category=${result[0].category}`))
})

app.get('/soldout/:num', async (req, res) => {
    if (await isWrongWithParam(req, res)) {
        return
    }
    const result = await sqlQuery(`select * from item where num=${req.params.num}`)

    var title = result[0].title
    await sqlQuery(`update item set is_buyed=1 where num=${req.params.num}`)
    await sendAlert(req, `<span class="bold">${title}</span> 게시물을 거래종료 하였습니다.`, `/item/${req.params.num}`)
    if (isAdmin(req)) {
        await sendAlert(req, `<span class="bold">${title}</span> 게시물이 <span class="bold">관리자</span>에 의해 거래종료 되었습니다.`, `/item/${req.params.num}`, result[0].seller_num)
    }
    res.send(forcedMoveCode(`/item/${req.params.num}`))
})

app.get('/alert', async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }

    const result = await sqlQuery(`select * from alert where listener_num=${req.session.num} order by num desc`)
    var alertHTML = ''
    for (var i in result) {
        alertHTML += `<a href="${result[i].link}">
            <div class="item ${result[i].isRead ? 'read' : ''}">
                <div class="item-header center">
                    <div class="item-imgWrap"><img src='/img/icon/carrot.png'></div>
                </div>
                <div class="item-container">
                    <div class="item-content">${result[i].content}</div>
                </div>
            </div>
        </a>`
    }
    await sendRender(req, res, './views/alert.html', {
        alert: alertHTML,
    })
    await sqlQuery(`update alert set isRead=1 where listener_num=${req.session.num} `)
})

app.get('/change-pwd', async (req, res) => {
    if (req.query.target && isAdmin(req)) {
        const result = await sqlQuery(`select * from user where uid='${req.query.target}'`)
        if (!isExistResult(result)) {
            goBackWithAlertCode("해당 계정이 존재하지 않습니다.")
            return
        }
        await sendRender(req, res, './views/change_pwd.html', {
            uid: "ID : " + result[0].uid,
            oldpw: "비번 : " + result[0].upw,
            type: "text",
            ruid: result[0].uid,
            addtion: "disabled"
        })
        return
    }
    await sendRender(req, res, './views/change_pwd.html', {
        uid: req.session.uid == undefined ? '로그인 정보가 없습니다' : req.session.uid,
        oldpw: '',
        type: "password"
    })
})

app.post('/change-pwd-check', async (req, res) => {

    const body = req.body
    if (isAdmin(req)) {
        await sqlQuery(`update user set upw='${body.newpw}' where uid='${body.uid}'`)
        res.send(forcedMoveWithAlertCode('비밀번호가 변경되었습니다.', `/manage/user?uid=${body.uid}`))
        return
    }
    const result = await sqlQuery(`select * from user where num=${req.session.num} and upw='${body.oldpw}'`)
    try {
        if (!result || !result.length || !body.oldpw || !body.newpw) {
            res.send(forcedMoveWithAlertCode("비밀번호가 옳바르지 않습니다.", "/change-pwd"))
            return
        }
    } catch {
        res.send(forcedMoveWithAlertCode("비밀번호가 옳바르지 않습니다.", "/change-pwd"))
        return
    }
    if (body.newpw.length < 4 || body.newpw.length > 20) {
        res.send(forcedMoveWithAlertCode("비밀번호는 4~20자리여야 합니다", "/change-pwd"))
        return
    }
    await sqlQuery(`update user set upw='${body.newpw}' where num=${req.session.num}`)
    res.send(forcedMoveWithAlertCode('비밀번호가 변경되었습니다.', '/logout'))
})

app.get('/chat', async (req, res) => {
    const uid = req.session.uid
    const to = req.query.to
    await sendRender(req, res, './views/chat.html', {
        uid: uid,
        to: to
    })
})

app.get('/manage', async (req, res) => {
    await sendRender(req, res, './views/manage.html', {

    })
})

app.get('/manage/soldcontent', async (req, res) => {
    if (!isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('권한이 적합하지 않습니다.', '/home'))
        return
    }
    const _find = req.query.data ? req.query.data.split(" ") : ''
    const _cate = req.query.category ? req.query.category.toString() : ''
    const _page_index = toNumber(req.query.page)
    const _page = _page_index * COUNT_PER_PAGE
    var _condition = ` where is_buyed=1`
    _condition += _cate ? ` and category='${_cate}'` : ''
    if (_condition) {
        _condition += req.query.creator ? ` and seller='${req.query.creator}'` : ''
    } else {
        _condition += req.query.creator ? ` seller='${req.query.creator}'` : ''
    }
    const result = await sqlQuery('select * from item' + _condition + ` order by num desc limit ${_page}, ${COUNT_PER_PAGE}`)
    var max_page = await sqlQuery('select count(num) from item' + _condition)
    max_page = Math.ceil(toNumber(max_page[0]['count(num)']) / COUNT_PER_PAGE)
    var itemsHTML = ''
    for (var i in result) {
        if (_find) {
            var isInTitle = isExistKeyword(result[i].title, _find)
            var isInContent = isExistKeyword(result[i].content, _find)
            if (!isInTitle && !isInContent) {
                continue
            }
        }
        var imgSrc = result[i].is_file ? '/img/icon/carrot.png' : `/img/item/${result[i].imgName}`
        itemsHTML += `
        <a href="/item/${result[i].num}">
            <div class="item">
                <div class="item-header center">
                    <div class="item-imgWrap"><img src="${imgSrc}"/></div>
                </div>
                <div class="item-container">
                    <div class="item-title">${result[i].title}</div>
                    <div class="item-description">${result[i].seller}</div>
                    <div class="item-price">${result[i].price == 0 ? '무료' : toFormatMoney(result[i].price) + '원'}</div>
                </div>
            </div>
        </a>
    `
    }

    var url = `/search?data=${_find}&category=${_cate}&page=`
    var backHTML = '<div class="pageBtn center dontgo">←</div>'
    var nextHTML = '<div class="pageBtn center dontgo">→</div>'
    if (_page_index > 0) {
        backHTML = `<a href='${url}${_page_index - 1}'><div class="pageBtn center">←</div></a>`
    }
    if (_page_index < max_page - 1) {
        nextHTML = `<a href='${url}${_page_index + 1}'><div class="pageBtn center">→</div></a>`
    }
    await sendRender(req, res, './views/admincontent.html', {
        items: itemsHTML ? itemsHTML : "<div class='notFound'>게시물을 찾을 수 없습니다.</div>",
        category: _find ? "검색" : (req.query.category == undefined ? '거래' : CategoryToKOR[req.query.category]),
        pageNum: _page_index + 1,
        gotoBack: backHTML,
        gotoNext: nextHTML,
        link: 'soldcontent'
    })
})

app.get('/manage/hiddencontent', async (req, res) => {
    if (!isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('권한이 적합하지 않습니다.', '/home'))
        return
    }
    const _find = req.query.data ? req.query.data.split(" ") : ''
    const _cate = req.query.category ? req.query.category.toString() : ''
    const _page_index = toNumber(req.query.page)
    const _page = _page_index * COUNT_PER_PAGE
    var _condition = ` where is_hidden=1`
    _condition += _cate ? ` and category='${_cate}'` : ''
    if (_condition) {
        _condition += req.query.creator ? ` and seller='${req.query.creator}'` : ''
    } else {
        _condition += req.query.creator ? ` seller='${req.query.creator}'` : ''
    }
    const result = await sqlQuery('select * from item' + _condition + ` order by num desc limit ${_page}, ${COUNT_PER_PAGE}`)
    var max_page = await sqlQuery('select count(num) from item' + _condition)
    max_page = Math.ceil(toNumber(max_page[0]['count(num)']) / COUNT_PER_PAGE)
    var itemsHTML = ''
    for (var i in result) {
        if (_find) {
            var isInTitle = isExistKeyword(result[i].title, _find)
            var isInContent = isExistKeyword(result[i].content, _find)
            if (!isInTitle && !isInContent) {
                continue
            }
        }
        var imgSrc = result[i].is_file ? '/img/icon/carrot.png' : `/img/item/${result[i].imgName}`
        itemsHTML += `
        <a href="/item/${result[i].num}">
            <div class="item">
                <div class="item-header center">
                    <div class="item-imgWrap"><img src="${imgSrc}"/></div>
                </div>
                <div class="item-container">
                    <div class="item-title">${result[i].title}</div>
                    <div class="item-description">${result[i].seller}</div>
                    <div class="item-price">${result[i].price == 0 ? '무료' : toFormatMoney(result[i].price) + '원'}</div>
                </div>
            </div>
        </a>
    `
    }


    var url = `/search?data=${_find}&category=${_cate}&page=`
    var backHTML = '<div class="pageBtn center dontgo">←</div>'
    var nextHTML = '<div class="pageBtn center dontgo">→</div>'
    if (_page_index > 0) {
        backHTML = `<a href='${url}${_page_index - 1}'><div class="pageBtn center">←</div></a>`
    }
    if (_page_index < max_page - 1) {
        nextHTML = `<a href='${url}${_page_index + 1}'><div class="pageBtn center">→</div></a>`
    }
    await sendRender(req, res, './views/admincontent.html', {
        items: itemsHTML ? itemsHTML : "<div class='notFound'>게시물을 찾을 수 없습니다.</div>",
        category: _find ? "검색" : (req.query.category == undefined ? '거래' : CategoryToKOR[req.query.category]),
        pageNum: _page_index + 1,
        gotoBack: backHTML,
        gotoNext: nextHTML,
        soldcontent: 'hiddencontent'
    })
})

app.get('/manage/user', async (req, res) => {
    if (!isAdmin(req)) {
        res.send(forcedMoveWithAlertCode('권한이 적합하지 않습니다.', '/home'))
        return
    }
    const result = await sqlQuery(`select * from user where uid='${req.query.uid}'`)
    if (result.length == 0) {
        await sendRender(req, res, './views/manage-user.html', {
            nickname: "존재하지 않습니다",
        })
        return
    }
    await sendRender(req, res, './views/manage-user.html', {
        nickname: result[0].nickname,
        uid: result[0].uid,
        schoolid: result[0].schoolid
    })
})

app.post('/comment-check/:num', upload2.array('itemFile'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    //게시물 존재 X
    const body = req.body
    const reply_to = body.reply ? body.reply : 'null'
    var content = body.content.replaceAll('<', '< ')
    var query = `insert into comment (to_num, from_num, from_uid , reply_to, content, post_time) value `
    query += `(${req.params.num}, ${req.session.num}, "${req.session.uid}", ${reply_to}, "${content}", "${formatDatetimeInSQL(new Date())}");`
    await sqlQuery(query)
    const _item = await sqlQuery(`select * from item where num=${req.params.num}`)
    if (!body.reply) {
        await sendAlert(req, `<span class="bold">${_item[0].title}</span> 게시물에 댓글을 달았습니다.`, `/item/${req.params.num}`)
        if (req.session.num !== _item[0].seller_num) {
            await sendAlert(req, `<span class="bold">${_item[0].title}</span> 게시물에 <span class="bold">${req.session.uid}</span>님이 새 댓글을 달았습니다.`, `/item/${req.params.num}`, _item[0].seller_num)
        }
    } else {
        const reply_data = await sqlQuery(`select * from comment where num=${body.reply}`)
        await sendAlert(req, `<span class="bold">${reply_data[0].from_uid}</span>님의 댓글에 답하였습니다.`, `/item/${req.params.num}`, req.session.num)
        if (req.session.num !== reply_data[0].from_num) {
            await sendAlert(req, `<span class="bold">${req.session.uid}</span>님이 <span class="bold">${_item[0].title}</span> 게시물에 답하였습니다.`, `/item/${req.params.num}`, reply_data[0].from_num)
        }
    }
    res.send(forcedMoveCode(`/item/${req.params.num}`))
})

app.get('/delete-comment/:num', async (req, res) => {
    //Exist
    const result = await sqlQuery(`select * from comment where num=${preventSQLI(req.params.num)}`)
    if (!isExistResult(result)) {
        res.send(goBackWithAlertCode("해당 댓글은 존재하지 않습니다."))
        return
    }
    const comment = result[0]
    const resultPost = await sqlQuery(`select * from item where num=${comment.to_num}`)
    if (!isExistResult(resultPost)) {
        res.send(goBackWithAlertCode("해당 게시물은 존재하지 않습니다."))
        return
    }
    //Access
    const item = resultPost[0]
    if (comment.from_num !== req.session.num && !isAdmin(req) && item.seller_num !== req.session.num) {
        res.send(goBackWithAlertCode("해당 게시물에 대한 권한이 거부되었습니다."))
        return
    }
    var deleter = ""
    if (req.session.num == comment.from_num) {
        deleter = "당신"
    } else if (req.session.num == item.seller_num) {
        deleter = "게시자"
    } else if (isAdmin(req)) {
        deleter = "관리자"
    }
    await sqlQuery(`delete from comment where num=${req.params.num}`)
    await sendAlert(req, `<span class="bold">${item.title}</span> 게시물에서 당신의 댓글이 <span class="bold">${deleter}</span>에 의해 삭제되었습니다.`, `/item/${comment.to_num}`, comment.from_num)
    res.send(goBackCode())
})

app.get('/report/post/:num', async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    const _item = await sqlQuery(`select * from item where num=${req.params.num}`)
    if (!isExistResult(_item)) {
        res.send(goBackWithAlertCode('존재하지 않는 게시물입니다.'))
        return
    }
    categoryHTML = ''
    for (var i in reportCategoryPOST) {
        categoryHTML += `<option value="${reportCategoryPOST[i]}" selected>${reportCategoryPOST[i]}</option>`
    }
    sendRender(req, res, './views/report.html', {
        postNum: req.params.num,
        title: _item[0].title,
        category: categoryHTML
    })
})

app.post('/report-check/post/:num', upload2.array('itemFile'), async (req, res) => {
    if (!isLogined(req, res)) {
        return
    }
    const body = req.body
    const _item = await sqlQuery(`select * from item where num=${req.params.num}`)
    if (!isExistResult(_item)) {
        res.send(goBackWithAlertCode('존재하지 않는 게시물입니다.'))
        return
    }
    /*target_num int not null,
    kind text not null,
    cause text not null,
    content text not null,
    post_time datetime not null,
    link text not null, */
    const link = `/item/${req.params.num}`
    const query = `insert into report (target_num, kind, post_time, link, cause, content) value (${req.params.num}, 'post', '${formatDatetimeInSQL(new Date())}', '${link}', '${body.cause}', '${body.content}');`
    await sqlQuery(query)
    res.send(forcedMoveCode(`/item/${req.params.num}`))
    await sendAlert(req, `<span class="bold">${_item[0].title}</span>님의 게시물에 신고를 접수하였습니다.`, link, req.session.num)
})

server.listen(5500, () => console.log('Server run https://127.0.0.1:5500'))