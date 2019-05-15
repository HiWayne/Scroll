import contentList from './variable.js'

//浅复制存放内容的数组contentList
export let newContentList = contentList.slice()

/**
 * 模拟后端获取内容
 * @param {*} element 元素
 * @param {*} add 是否在原来基础上添加内容，否则覆盖原内容
 */
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
    newContentList = contentList.slice()
  }
  let randomIndex = random(length)
  return newContentList.splice(randomIndex, 1)
}

//数组项随机选择方法
function random(length) {
  return Math.floor(Math.random() * length)
}

//添加内容
function addContent(element, content) {
  element.innerHTML += content
}

//覆盖内容
function overwriteContent(element, content) {
  element.innerHTML = content
}