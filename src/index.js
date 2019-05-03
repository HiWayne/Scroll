import scrollInit from './js/createScroll.js'
import { ajaxGetContent } from './js/mockAjax.js'

window.onload = function () {
  //异步更新content内容
  ajaxGetContent()
  //实例化Scroll并使用其中的一些api
  scrollInit()
}