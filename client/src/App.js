import './style.css'
import './search.css'
import Footer from './Footer'
import Header from './Header';
import { useEffect, useState } from 'react';

function Item(props) {
  return (
    <div class="item">
      <div class="item-header center">
        <div class="item-imgWrap"></div>
      </div>
      <div class="item-container">
        <div class="item-title">{props.title}</div>
        <div class="item-description">{props.descript}</div>
        <div class="item-place">{props.place}</div>
      </div>

    </div>
  )
}

fetch('https://naver.com/')
    .then((res) => {
        return res.json()
        //이렇게 하면 json으로 데이터를 반환해서 Props로 받아올 수 있다.
    })
    .then((data) => {
        console.log(data)
    })

function App() {
  const [days, setDays] = useState([])
  console.log(days)
  return (
    <div class="root">
      <Header></Header>
      <div class="container">
        <Item title="쎈 미적분" descript="3학년" place="서령고 뒷문"></Item>
        <Item title="쎈 미적분" descript="3학년" place="서령고 뒷문"></Item>
      </div>
      <Footer></Footer>
    </div>
  )
}

export default App
