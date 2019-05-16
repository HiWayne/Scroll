import Scroll from './Scroll.js'
import { pullDownEnterHook, pullDownLeaveHook, pullDownRefreshPromise, pullUpLoadPromise } from './mockAjax.js'

export default function scrollInit() {
  //计算距离元素
  const countDistanceText = document.getElementById('countDistance-text')
  //回到顶部按钮
  const returnTopButton = document.getElementById('returnTop')

  //Scroll实例
  const scroll = new Scroll("#app")

  //监听滚动，可以实时获取滚动坐标
  scroll.on('scroll', function (pos) {
    countDistanceText.innerHTML = Math.abs(Math.round(pos.y))
  })

  //监听顶部下拉动作，这里模拟了刷新功能
  scroll.on('pullDown', {
    //刚开始下拉时(pos.y大于0)
    enterHook: function (pos) {
      pullDownEnterHook()
    },
    //刚离开下拉时(pos.y小于0或下拉被释放)
    leaveHook: function (pos) {
      pullDownLeaveHook()
    },
    //下拉释放时
    callback: function (success, fail) {
      //pullDownRefreshContent()返回一个promise实例
      pullDownRefreshPromise().then(() => {
        //成功时
        success()
      })
      .catch(() => {
        //失败时
        fail()
      })
    }
  })

  //监听底部上拉动作，这里模拟了加载功能
  scroll.on('pullUp', function (success, fail) {
    //pullUpLoadContent()返回一个promise实例
    pullUpLoadPromise().then(() => {
      //成功时
      success()
    })
    .catch(() => {
      //失败时
      fail()
    })
  })

  //返回顶部按钮
  returnTopButton.onclick = function () {
    //滚动到指定目标或距离
    scroll.scrollTo(0, 400)
  }
}