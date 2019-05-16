import contentList from './variable.js'

//浅复制存放内容的数组contentList
export let newContentList = contentList.slice()

/**
 * 模拟后端获取内容
 * @param {*} element 元素
 * @param {*} add 如果是Boolean代表是否在原来基础上添加内容，否则覆盖原内容；如果是数字代表第一次覆盖原内容，然后在此基础上再添加(n - 1)次内容
 * @param {*} refresh 是否刷新页面(重置newContentList数组内容)
 */
export default function ajaxGetContent(element, add, refresh) {
  if (refresh) {
    refillContent(newContentList, contentList)
  }
  let content = getRandomContent()
  if (typeof (add) === 'number') {
    overwriteContent(element, content)
    for (let i = 1; i < add; i++) {
      content = getRandomContent()
      addContent(element, content)
    }
  }
  else if (add) {
    addContent(element, content)
  }
  else {
    overwriteContent(element, content)
  }
}

//随机不重复地获取内容，如果内容用尽则会重复
function getRandomContent() {
  let length = newContentList.length
  if (!length) {
    refillContent(newContentList, contentList)
    length = newContentList.length
  }
  let randomIndex = random(length)
  return newContentList.splice(randomIndex, 1)
}

//数组项随机选择方法
function random(length) {
  return Math.floor(Math.random() * length)
}

//重新填满newContentList数组
function refillContent(newContentList, contentList) {
  newContentList = contentList.slice()
  return newContentList
}

//在原有内容下面添加新内容
function addContent(element, content) {
  element.innerHTML += content
}

//用新内容覆盖原内容
function overwriteContent(element, content) {
  element.innerHTML = content
}