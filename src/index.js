import scrollInit from './js/createScroll.js'
import { ajaxGetContent } from './js/mockAjax.js'

window.onload = function () {
  //异步更新content内容
  ajaxGetContent()
  //Scroll相关的操作
  scrollInit()
}