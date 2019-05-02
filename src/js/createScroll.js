import Scroll from './Scroll.js'
import { pullDownEnterHook, pullDownLeaveHook, pullDownRefreshPromise, pullUpLoadPromise } from './mockAjax.js'

export default function scrollInit() {
  //Scroll实例
  const scroll = new Scroll("#app")

  //监听滚动，可以实时获取滚动坐标
  scroll.on('scroll', function (pos) {
  })

  //顶部下拉的钩子函数，这里演示了刷新功能
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
        success()
      })
      .catch(() => {
        fail()
      })
    }
  })

  //底部上拉钩子函数，这里演示了加载功能
  scroll.on('pullUp', function (success, fail) {
    //pullUpLoadContent()返回一个promise实例
    pullUpLoadPromise().then(() => {
      success()
    })
    .catch(() => {
      fail()
    })
  })
}