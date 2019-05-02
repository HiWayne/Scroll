import contentList from './variable.js'

//浅复制存放内容的数组contentList
export let newContentList = contentList.slice()

//模拟后端获取内容
export default function ajaxGetContent(element, add) {
  let content = getRandomContent()
  if (add) {
    addContent(element, content)
  }
  else {
    overwriteContent(element, content)
  }
}

//随机获取内容
function getRandomContent() {
  let length = newContentList.length
  if (!length) {
    return '没有更多内容'
  }
  let randomIndex = Math.floor(Math.random() * length)
  return newContentList.splice(randomIndex, 1)
}

//添加内容
function addContent(element, content) {
  element.innerHTML += content
}

//覆盖内容
function overwriteContent(element, content) {
  element.innerHTML = content
}