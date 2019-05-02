import scrollInit from './js/createScroll.js'
import { ajaxGetContent } from './js/mockAjax.js'

window.onload = function () {
  ajaxGetContent()
  scrollInit()
}