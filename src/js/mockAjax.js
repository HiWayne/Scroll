import ajax from './util.js'

//模拟ajax请求更新content_wrapper内容
export function ajaxGetContent() {
  const content_wrapper = document.getElementById('content-wrapper')
  //模拟dom异步更新
  setTimeout(() => {
    content_wrapper.innerHTML = `
    <div id="top">上拉刷新</div>
      <div id="content">
      </div>
    <div id="bottom">上拉加载更多</div>`
    //页面回流
    let _reflow = content_wrapper.offsetHeight
    const content = document.getElementById('content')
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
      resolve()
      alert('已刷新')
    }, 1000)
  })
}

//上拉释放加载方法
export function pullUpLoadPromise() {
  const content = document.getElementById('content')
  const bottomDiv = document.getElementById('bottom')
  bottomDiv.innerHTML = '正在加载……'
  return new Promise(function (resolve) {
    setTimeout(() => {
      ajax(content, true)
      bottomDiv.innerHTML = '上拉加载'
      resolve()
    }, 1000)
  })
}