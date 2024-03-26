fetch('http://127.0.0.1:5500/api/')
    .then((res) => {
        return res.json()
        //이렇게 하면 json으로 데이터를 반환해서 Props로 받아올 수 있다.
    })
    .then((data) => {
        console.log(data)
    })