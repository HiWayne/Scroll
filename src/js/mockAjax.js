import ajax, { newContentList } from './util.js'
import contentList from './variable.js'

//模拟ajax请求更新content_wrapper内容
export function ajaxGetContent() {
  const content_wrapper = document.getElementById('content-wrapper')
  //模拟dom异步更新
  setTimeout(() => {
    content_wrapper.innerHTML = `
    <div id="top" style="position:absolute;left:0;top:0;transform:translate3d(0,-100%,0);width:100%;">上拉刷新</div>
      <div id="content" style="padding:5px 0;">
      </div>
    <div id="button" style="position:absolute;left:0;bottom:0;transform:translate3d(0,100%,0);width:100%;">上拉加载更多</div>`
    //页面回流
    let _reflow = content_wrapper.offsetHeight
    const content = document.getElementById('content')
    console.log(content)
    ajax(content)
    ajax(content, true)
  }, 5000)
}

//刚开始下拉时(pos.y大于0)执行的方法
export function pullDownEnterHook() {
  const topDiv = document.getElementById('top')
  topDiv.innerHTML = '松手刷新'
}

//刚离开下拉时(pos.y小于0或下拉被释放)执行的方法
export function pullDownLeaveHook() {
  const topDiv = document.getElementById('top')
  topDiv.innerHTML = '上拉刷新'
}

//下拉释放刷新方法
export function pullDownRefreshPromise() {
  const topDiv = document.getElementById('top')
  topDiv.innerHTML = '正在刷新……'
  return new Promise(function (resolve) {
    setTimeout(() => {
      topDiv.innerHTML = '已刷新'
      newContentList = contentList.slice()
      console.log(newContentList)
      resolve()
      alert('已刷新')
    }, 1000)
  })
}

//上拉释放加载方法
export function pullUpLoadPromise() {
  const content = document.getElementById('content')
  const buttonDiv = document.getElementById('button')
  buttonDiv.innerHTML = '正在加载……'
  return new Promise(function (resolve) {
    setTimeout(() => {
      ajax(content, true)
      buttonDiv.innerHTML = '上拉加载'
      resolve()
    }, 1000)
  })
}