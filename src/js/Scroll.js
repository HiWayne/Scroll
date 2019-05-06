export default class Scroll {
  constructor(el, config) {
    //最外层元素
    this.el = el
    //最外层元素的子元素，即需要滚动的元素
    this.childNode = undefined
    //最外层元素高度
    this.wrapperNodeHeight = undefined
    //滚动元素高度
    this.scrollNodeHeight = undefined
    //配置对象
    this.config = config
    //开始触摸时的参数对象
    this.touchStart = undefined
    //临时储存触摸时的参数对象
    this.tempTouchMove = undefined
    //上一刻触摸时的参数对象
    this.lastTouchMove = undefined
    //当前触摸时的参数对象
    this.currentTouchMove = undefined
    //结束触摸时的参数对象
    this.touchEnd = undefined
    //每次调用touchmove时的移动距离
    this.onceScrollDistance = 0
    //累计滚动总距离
    this.scrollDistance = 0
    //限制超出滚动范围后最多只能拉到多少
    this.canScrollHeight = 0
    //储存事件的对象
    this.event = {
      //滚动事件
      scroll: {
        data: {
          flag: false
        },
        //触摸移动时的回调方法
        callback: undefined
      },
      pullDown: {
        data: {
          //判断该钩子函数是否已被触发
          done: undefined
        },
        //下拉释放时的回调方法
        callback: undefined,
        //进入下拉过程时执行的钩子函数
        enterHook: undefined,
        //离开下拉过程时执行的钩子函数
        leaveHook: undefined
      },
      pullUp: {
        data: {
          //判断该钩子函数是否已被触发
          done: undefined
        },
        //上拉释放时的回调方法
        callback: undefined,
        //进入上拉过程时执行的钩子函数
        enterHook: undefined,
        //离开上拉过程时执行的钩子函数
        leaveHook: undefined
      }
    }
    //缓动结束相关的配置
    this.transitionEndConfig = {
      callbackConfig: {
        callback: undefined,
        condition: undefined
      }
    }
    //设置el
    this._createWrapperElement()
    //设置childNode
    this._createWrapperChildElement()
    //设置wrapper高度
    this._getWrapperNodeHeight()
    //设置childNode高度
    this._getScrollNodeHeight()
    //向el注册触摸事件
    this._addScrollEvent()
    //设置canScrollHeight
    this._canEndScroll()
    //顶部尽头的位置
    this.upEnd = 0
    //底部尽头的位置
    this.downEnd = -this.scrollNodeHeight + this.wrapperNodeHeight
  }
  //外部方法，在dom变化或设备变化时更新相关的属性
  refresh() {
    this._getWrapperNodeHeight()
    this._getScrollNodeHeight()
    this._getDownEnd()
    this.isMobile()
  }
  //外部方法，监听事件
  on(eventName, parm) {
    if (this.event[eventName]) {
      if (parm instanceof Function) {
        this.event[eventName].callback = (...arg) => {
          //如果有参数，则是promise的resolve、reject
          if (arg.length) {
            parm(...arg)
          }
          //否则传入event[eventName][data]的数据
          else {
            parm(this.event[eventName]['data'])
          }
        }
      }
      else if (Object.prototype.toString.call(parm) === "[object Object]") {
        for (let i in parm) {
          if (parm[i] instanceof Function) {
            this.event[eventName][i] = (...arg) => {
              //如果有参数，则是promise的resolve、reject
              if (arg.length) {
                parm[i](...arg)
              }
              //否则传入event[eventName][data]的数据
              else {
                parm[i](this.event[eventName]['data'])
              }
            }
          }
          else {
            this.event[eventName][i] = pram[i]
          }
        }
      }
    }
  }
  scrollTo(target, time) {
    let targetPosition
    if (target instanceof HTMLElement) {
      targetPosition = target.offsetTop === 0 ? 0 : -target.offsetTop
    }
    else {
      if (typeof (target) === "number") {
        targetPosition = target === 0 ? 0 : -target
      }
      else if (typeof (target) === "string") {
        targetPosition = parseFloat(target) === 0 ? 0 : -parseFloat(target)
      }
    }
    this._setScrollTransform(targetPosition, 'y', time)
  }
  //获取最外层根元素，el参数可以是id或class，也可以直接是元素对象
  _createWrapperElement() {
    //通过id或者class获取元素
    if (typeof (this.el) === "string") {
      const el = this.el
      this.el = document.querySelector(el)
    }
    //直接输入元素
    else if (this.el instanceof HTMLElement) {
      this.el = this.el
    }
    else {
      throw new Error(`The property : "${this.el}" is not correct type`)
    }
    //最外层元素overflow必须是hidden
    const wrapperOverflow = window.getComputedStyle(this.el).overflow
    if (wrapperOverflow !== "hidden") {
      throw new Error(`The current wrapperNode's overflow is "${wrapperOverflow}", it should be "hidden"`)
    }
  }
  //获取wrapper元素下第一个子元素，即需要滚动的元素
  _createWrapperChildElement() {
    this.childNode = this.el.firstElementChild
    if (!(this.childNode instanceof HTMLElement)) {
      throw new Error(`The wrapperNode's childNode : "${this.childNode}" is not a Element`)
    }
  }
  //向this.childNode注册触摸事件
  _addScrollEvent() {
    if (this.isMobile()) {
      this.eventListener(this.childNode, 'touchstart', this._touchstart(), {passive: false})
      this.eventListener(this.childNode, 'touchmove', this._touchmove(), {passive: false})
      this.eventListener(this.childNode, 'touchend', this._touchend(), {passive: false})
    }
    else {
      this.eventListener(this.childNode, 'mousedown', this._touchstart(), {passive: false})
      this.eventListener(this.childNode, 'mousemove', this._touchmove(), {passive: false})
      this.eventListener(this.childNode, 'mouseup', this._touchend(), {passive: false})
    }
  }
  //开始触摸的事件方法，注意该方法会被this.el调用而不是实例调用，所以内部的this会指向this.el，这里利用闭包将指向实例的this缓存起来。
  _touchstart() {
    const _this = this
    return function (e) {
      //重新计算尺寸相关的属性，防止元素有更新
      _this.refresh()
      if (_this.wrapperNodeHeight >= _this.scrollNodeHeight) {
        _this.needMoreHeight = true
        return
      }
      else if (_this.wrapperNodeHeight < _this.scrollNodeHeight) {
        _this.needMoreHeight = undefined
      }
      e = e || window.event
      e.stopPropagation()
      //如果禁止click事件被移除了
      if (!_this._disableClick) {
        _this._disableClick = true
        _this._addDisableClickToChildNode()
      }
      //如果是移动端
      if (_this._isMobile) {
        _this.touchStart = e.changedTouches[0]
      }
      //如果是PC端
      else {
        if (_this._mouseEvent) {
          _this._mouseEvent.mouseDown = true
        }
        else {
          _this._mouseEvent = {}
          _this._mouseEvent.mouseDown = true
        }
        _this._savePCMousePosition('touchStart', e)
      }
      _this._startTouch()
    }
  }
  //开始触摸时的事件子方法
  _startTouch() {
    const transformObj = this._getCurrentTransform(this.childNode)
    if (!transformObj) {
      return
    }
    const matrix6 = transformObj.matrix6
    this.childNode.style.transitionDuration = "0ms"
    this.childNode.style.webkitTransitionDuration = "0ms"
    //强制浏览器重绘
    let rf = this.childNode.offsetHeight
    this._setScrollTransform(matrix6)
    if (!this.event.scroll.data.flag) {
      this.event.scroll.data.flag = true
    }
    this.onceScrollDistance = 0
  }
  //移动触摸的事件方法，注意该方法会被this.el调用而不是实例调用，所以内部的this会指向this.el，这里用闭包将指向实例的this缓存起来。
  _touchmove() {
    const _this = this
    return function (e) {
      if (_this.needMoreHeight) return
      e = e || window.event
      e.preventDefault()
      e.stopPropagation()
      //将上一刻触摸移动的数据存在this.lastTouchMove里
      //如果是移动端
      if (_this._isMobile) {
        _this.currentTouchMove = e.changedTouches[0]
        if (_this.tempTouchMove) {
          _this.lastTouchMove = {}
          _this.lastTouchMove.pageX = _this.tempTouchMove.pageX
          _this.lastTouchMove.pageY = _this.tempTouchMove.pageY
        }
        else {
          _this.tempTouchMove = {}
        }
        _this.tempTouchMove.pageX = _this.currentTouchMove.pageX
        _this.tempTouchMove.pageY = _this.currentTouchMove.pageY
      }
      //如果是PC端
      else {
        //如果没有mouseDown
        if (!_this._mouseEvent || !_this._mouseEvent.mouseDown) return
        //否则
        _this._savePCMousePosition('currentTouchMove', e)
        if (_this.tempTouchMove) {
          _this.lastTouchMove = {}
          _this.lastTouchMove.pageX = _this.tempTouchMove.pageX
          _this.lastTouchMove.pageY = _this.tempTouchMove.pageY
        }
        else {
          _this.tempTouchMove = {}
        }
        _this.tempTouchMove.pageX = _this.currentTouchMove.pageX
        _this.tempTouchMove.pageY = _this.currentTouchMove.pageY
      }
      //表明已经发生过移动了
      if (!_this._hasMoved) {
        _this._hasMoved = true
      }
      //移动触摸事件的子方法
      _this._scroll()
    }
  }
  //滚动方法
  _scroll() {
    //最外层元素高度，滚动元素高度
    let wrapperNodeHeight, scrollNodeHeight
    wrapperNodeHeight = this.wrapperNodeHeight
    scrollNodeHeight = this.scrollNodeHeight
    //如果滚动元素高度不超过最外层元素，不滚动
    if (wrapperNodeHeight >= scrollNodeHeight) return
    //计算一次滚动移动的距离
    this._computeOnceScrollDistance()
    //滚动范围不能超过0~scrollNodeHeight，滚动元素拉到底时的滚动距离是-scrollNodeHeight + wrapperNodeHeight
    let computeNextScrollDistance = this.scrollDistance + this.onceScrollDistance
    if (computeNextScrollDistance > this.upEnd) {
      //如果由于滚动太快，这一次将会超过滚动范围限制
      if (this.canScrollHeight && computeNextScrollDistance > this.canScrollHeight) {
        this.onceScrollDistance = this.canScrollHeight - this.scrollDistance
      }
      else if (!this.canScrollHeight) {
        this.scrollDistance = this.upEnd
        this._setScrollTransform(this.scrollDistance)
        return
      }
    }
    //如果由于滚动太快，这一次将会超过滚动范围限制
    else if (computeNextScrollDistance < this.downEnd) {
      if (this.canScrollHeight && computeNextScrollDistance < this.downEnd - this.canScrollHeight) {
        this.onceScrollDistance = this.downEnd - this.canScrollHeight - this.scrollDistance
      }
      else if (!this.canScrollHeight) {
        this.scrollDistance = this.downEnd
        this._setScrollTransform(this.scrollDistance)
        return
      }
    }
    computeNextScrollDistance = this.scrollDistance + this.onceScrollDistance
    if (computeNextScrollDistance > this.upEnd) {
      //如果不能超过尽头
      if (!this.canScrollHeight) return
      if (this.event.pullDown.enterHook && !this.event.pullDown.data.done) {
        //执行了一次就不会执行了，直到leaveHook被调用
        this.event.pullDown.data.done = true
        this.event.pullDown.enterHook(this.event.scroll.data)
      }
      this._endScrollMove(computeNextScrollDistance)
      this._setScrollTransform(this.scrollDistance)
      return
    }
    else if (computeNextScrollDistance < this.downEnd) {
      //如果不能超过尽头
      if (!this.canScrollHeight) return
      if (this.event.pullUp.enterHook && !this.event.pullUp.data.done) {
        //执行了一次就不会执行了，直到leaveHook被调用
        this.event.pullUp.data.done = true
        this.event.pullUp.enterHook(this.event.scroll.data)
      }
      this._endScrollMove(computeNextScrollDistance)
      this._setScrollTransform(this.scrollDistance)
      return
    }
    //同理leaveHook也只执行一次，直到enterHook被调用
    if (this.event.pullDown.data.done) {
      this.event.pullDown.data.done = undefined
      this.event.pullDown.leaveHook(this.event.scroll.data)
    }
    else if (this.event.pullUp.data.done) {
      this.event.pullUp.data.done = undefined
      this.event.pullUp.leaveHook(this.event.scroll.data)
    }
    this.scrollDistance += this.onceScrollDistance
    this._setScrollTransform(this.scrollDistance)
  }
  //结束触摸的事件方法，注意该方法会被this.el调用而不是实例调用，所以内部的this会指向this.el，这里用闭包将指向实例的this缓存起来。
  _touchend() {
    const _this = this
    return function (e) {
      if (_this.needMoreHeight) return
      e = e || window.event
      e.stopPropagation()
      if (!_this._hasMoved) {
        _this._removeDisableClickFromChildNode()
        _this._disableClick = undefined
      }
      //如果是移动端
      if (_this._isMobile) {
        _this.touchEnd = e.changedTouches[0]
      }
      //如果是PC端
      else {
        _this._mouseEvent.mouseDown = false
        _this._savePCMousePosition(['touchEnd'], e)
      }
      _this._hasMoved = undefined
      _this._endTouchCallback()
    }
  }
  //结束触摸时的事件子方法
  _endTouchCallback() {
    if (this.scrollDistance <= this.upEnd && this.scrollDistance >= this.downEnd && this.onceScrollDistance) {
      if (this.config && this.config.noInertia) return
      //想要惯性效果，添加缓动函数
      this.childNode.style.transitionTimingFunction = "cubic-bezier(0.23, 1, 0.32, 1)"
      this.childNode.style.webkitTransitionTimingFunction = "cubic-bezier(0.23, 1, 0.32, 1)"
      this.childNode.style.transitionDuration = "2500ms"
      this.childNode.style.webkitTransitionDuration = "2500ms"
      //手指一次滑动的距离
      let scrollTouchDistance = Math.abs(this.touchEnd.pageY - this.touchStart.pageY)
      //手指离开后惯性移动的距离
      let inertiaDistance = this._caculateInertia(scrollTouchDistance, this.onceScrollDistance)
      this.scrollDistance += inertiaDistance
      if (this.scrollDistance > this.upEnd || this.scrollDistance < this.downEnd) {
        //超出尽头的距离
        let moreDistance
        if (this.scrollDistance > this.upEnd) {
          moreDistance = Math.min(this.scrollDistance - this.upEnd, this.canScrollHeight / 4)
          this._setScrollTransform(this.scrollDistance)
          this._addListenScrollDistance(this._endEndInertiaTimeFunction, this.upEnd + moreDistance, this, (condition) => {
            return condition >= this.upEnd || condition <= this.downEnd
          })
        }
        else if (this.scrollDistance < this.downEnd) {
          moreDistance = Math.max(this.scrollDistance - this.downEnd, -this.canScrollHeight / 4)
          this._setScrollTransform(this.scrollDistance)
          this._addListenScrollDistance(this._endEndInertiaTimeFunction, this.downEnd + moreDistance, this, (condition) => {
            return condition >= this.upEnd || condition <= this.downEnd
          })
        }
        this._listenTransitionEnd(this._transitionEndFunction())
        this._resetTouchData()
        return
      }
      this._setScrollTransform(this.scrollDistance)
      this._resetTouchData()
    }
    else {
      this._springback(this.event.pullDown.callback, this.event.pullUp.callback)
      this._resetTouchData()
    }
  }
  //添加禁止click事件
  _addDisableClickToChildNode() {
    this.eventListener(this.childNode, 'click', this._disableClick)
  }
  //移除禁止click事件
  _removeDisableClickFromChildNode() {
    this.removeEvent(this.childNode, 'click', this._disableClick)
  }
  //禁止click事件
  _disableClick(e) {
    e = e || window.event
    let target = e.target
    e.preventDefault()
    e.stopPropagation()
    target.onclick = function () {
      target.onclick = null
    }
    this.onclick = function () {
      target.onclick = null
    }
  }
  //在PC环境下保存鼠标位置的方法
  _savePCMousePosition(property, event, $this) {
    if (!this._isObject(this[property])) {
      if (!$this) {
        this[property] = {
          pageX: event.clientX,
          pageY: event.clientY
        }
      }
      else {
        $this[property] = {
          pageX: event.clientX,
          pageY: event.clientY
        }
      }
    }
    else {
      if (!$this) {
        this[property].pageX = event.clientX
        this[property].pageY = event.clientY
      }
      else {
        $this[property].pageX = event.clientX
        $this[property].pageY = event.clientY
      }
    }
  }
  //滚动到尽头时执行的方法
  _endScrollMove(computeNextScrollDistance) {
    //当滚动到尽头时换算实际的一次滚动距离，达到越来越拉不动的效果
    let trueOnceDistance = this._computeTrueOnceDistance(computeNextScrollDistance)
    this.scrollDistance += trueOnceDistance
    this.scrollDistance = Math.min(this.scrollDistance, this.canScrollHeight)
  }
  //计算一次滚动移动的距离
  _computeOnceScrollDistance() {
    if (!this.lastTouchMove) {
      this.onceScrollDistance = (this.currentTouchMove.pageY - this.touchStart.pageY)
    }
    else if (this.lastTouchMove) {
      this.onceScrollDistance = (this.currentTouchMove.pageY - this.lastTouchMove.pageY)
    }
  }
  //当滚动到尽头时换算实际的一次滚动距离
  _computeTrueOnceDistance(computeNextScrollDistance) {
    //变量分别是：将实际距离计算成预期距离，存放一个比例数字
    let computeTrueOnceDistance, percent
    //根据实际触摸移动的距离，通过一种计算方式，达到越来越拉不动的效果
    if (computeNextScrollDistance > this.upEnd) {
      percent = (this.canScrollHeight - Math.abs(computeNextScrollDistance)) / this.canScrollHeight
    }
    else if (computeNextScrollDistance < this.downEnd) {
      percent = (this.canScrollHeight - Math.abs(computeNextScrollDistance) + (this.scrollNodeHeight - this.wrapperNodeHeight)) / this.canScrollHeight
    }
    computeTrueOnceDistance = (0.2 + percent * 0.1) * this.onceScrollDistance
    return computeTrueOnceDistance
  }
  //允许滚动到尽头后还能滚动一段距离
  _canEndScroll() {
    if (this.config && this.config.noSpringback) return
    //限制超出滚动范围后最多只能拉到最外层元素高度的多少，默认是4分之1或100
    else {
      if (this.config && this.config.endCanMoveDistance) {
        let canScrollHeight = this.config.endCanMoveDistance + ""
        //兼容小数0.x和.x
        const reg = /^0\.|\./i
        if (reg.test(canScrollHeight)) {
          this.canScrollHeight = this.wrapperNodeHeight * parseFloat(canScrollHeight)
        }
        else {
          this.canScrollHeight = parseFloat(canScrollHeight)
        }
        if (isNaN(this.canScrollHeight)) {
          throw new Error(`The current endCanMoveDistance is : "${this.config.endCanMoveDistance}, it should be number or stringNumber"`)
        }
      }
      else {
        this.canScrollHeight = Math.min(this.wrapperNodeHeight / 2, 200)
      }
    }
  }
  //获取最外层元素高度
  _getWrapperNodeHeight() {
    return this.wrapperNodeHeight = this.el.getBoundingClientRect().height
  }
  //获取滚动元素高度
  _getScrollNodeHeight() {
    return this.scrollNodeHeight = this.childNode.getBoundingClientRect().height
  }
  //获取底部尽头的位置
  _getDownEnd() {
    this.downEnd = -this.scrollNodeHeight + this.wrapperNodeHeight
  }
  //惯性滚到尽头改变transition方法，接收两个参数，尽头和实际目标
  _endEndInertiaTimeFunction(end, target) {
    this._setScrollTransform(end)
    this.childNode.style.transitionTimingFunction = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    this.childNode.style.webkitTransitionTimingFunction = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    this.childNode.style.transitionDuration = "500ms"
    this.childNode.style.webkitTransitionDuration = "500ms"
    //强制页面重绘
    let rf = this.childNode.offsetHeight
    this._setScrollTransform(target)
  }
  //监听缓动结束事件
  _listenTransitionEnd(fn) {
    this.eventListener(this.childNode, 'transitionEnd', fn)
    this.eventListener(this.childNode, 'webkitTransitionEnd', fn)
  }
  //缓动结束时的回调方法
  _transitionEndFunction() {
    let _this = this
    return function _tempTransitionEndFunction() {
      _this._springback()
      //移除事件
      _this._removeTransitionEnd(_this._tempTransitionEndFunction)
    }
  }
  //拉到尽头松手回弹
  _springback(...arg) {
    this.childNode.style.transition = "all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)"
    this.childNode.style.webkitTransition = "all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)"
    //强制浏览器重绘
    let rf = this.childNode.offsetHeight
    //kickBack也需要执行leaveHook，leaveHook也只执行一次，直到enterHook被调用
    if (this.event.pullDown.data.done) {
      this.event.pullDown.data.done = undefined
      this.event.pullDown.leaveHook(this.event.scroll.data)
    }
    else if (this.event.pullUp.data.done) {
      this.event.pullUp.data.done = undefined
      this.event.pullUp.leaveHook(this.event.scroll.data)
    }
    if (arg.length) {
      //下拉
      if (arg[0]) {
        if (this.scrollDistance > this.upEnd + Math.min(this.canScrollHeight, 30)) {
          //下拉回调
          return new Promise(arg[0])
            .then(() => {
              this._setScrollTransform(this.upEnd)
              this.scrollDistance = this.upEnd
              this.refresh()
            })
            .catch(() => {
              this._setScrollTransform(this.upEnd)
              this.scrollDistance = this.upEnd
            })
        }
      }
      //上拉
      if (arg[1]) {
        if (this.scrollDistance < this.downEnd - Math.min(this.canScrollHeight, 30)) {
          //上拉回调
          return new Promise(arg[1])
            .then(() => {
              this._setScrollTransform(this.downEnd - 20)
              this.scrollDistance = this.downEnd - 20
              this.refresh()
            })
            .catch(() => {
              this._setScrollTransform(this.downEnd)
              this.scrollDistance = this.downEnd
            })
        }
      }
    }
    if (this.scrollDistance > this.upEnd) {
      this._setScrollTransform(this.upEnd)
      this.scrollDistance = this.upEnd
    }
    else if (this.scrollDistance < this.downEnd) {
      this._setScrollTransform(this.downEnd)
      this.scrollDistance = this.downEnd
    }
    return
  }
  //监听滚动距离方法
  _listenScrollDistance(node) {
    this.event.scroll.data.flag = false
    //transition结束后停止刷新pos并注销该事件
    if (!this.transitionEndCallbackAndReset) {
      this.transitionEndCallbackAndReset = () => {
        this.event.scroll.data.flag = true
        this.event.scroll.data.listen = undefined
        this._removeTransitionEnd(this.transitionEndCallbackAndReset)
      }
    }
    if (!this.event.scroll.data.listen) {
      this.event.scroll.data.listen = true
      //注册缓动结束事件
      this._listenTransitionEnd(this.transitionEndCallbackAndReset)
    }
    let timeoutFn = () => {
      this.event.scroll.data.timeoutFlag = true
      setTimeout(() => {
        let transformObj = this._getCurrentTransform(node)
        let matrix5 = transformObj.matrix5
        let matrix6 = transformObj.matrix6
        this.event.scroll.data.x = this._limitNumber(matrix5)
        this.event.scroll.data.y = this._limitNumber(matrix6)
        //如果有this.transitionEndConfig.callbackConfig.callback回调方法，则满足终止条件时执行
        if (this.transitionEndConfig.callbackConfig.callback && this.transitionEndConfig.callbackConfig.condition(matrix6)) {
          this.event.scroll.data.timeoutFlag = undefined
          this.transitionEndConfig.callbackConfig.callback.call(this.transitionEndConfig.callbackConfig.$this, matrix6, this.transitionEndConfig.callbackConfig.parm)
          //_addListenScrollDistance方法加入的回调是一次性的
          this.transitionEndConfig.callbackConfig.callback = undefined
          return
        }
        //否则一直监听
        else {
          //如果注册了回调事件
          if (this.event.scroll.callback) {
            this.event.scroll.callback()
          }
          if (this.event.scroll.data.flag) {
            this.event.scroll.data.timeoutFlag = undefined
            return
          }
          timeoutFn()
        }
      }, 10)
    }
    if (!this.event.scroll.data.timeoutFlag) {
      timeoutFn()
    }
  }
  //向监听滚动距离方法中添加回调方法和执行条件
  _addListenScrollDistance(callback, parm, $this, condition) {
    this.transitionEndConfig.callbackConfig.callback = callback
    this.transitionEndConfig.callbackConfig.parm = parm
    this.transitionEndConfig.callbackConfig.$this = $this
    this.transitionEndConfig.callbackConfig.condition = condition
  }
  //移除监听缓动结束的事件
  _removeTransitionEnd(fn) {
    this.removeEvent(this.childNode, 'transitionEnd', fn)
    this.removeEvent(this.childNode, 'webkitTransitionEnd', fn)
  }
  //获得滚动元素此刻的滚动位置参数对象
  _getCurrentTransform(node) {
    let matrix1, matrix2, matrix3, matrix4, matrix5, matrix6
    let reg = /^matrix\(([^,\s]+),\s*([^,\s]+),\s*([^,\s]+),\s*([^,\s]+),\s*([^,\s]+),\s*([^,\s]+)\)$/
    const currentTransform = window.getComputedStyle(node, null).getPropertyValue("transform")
    if (reg.test(currentTransform)) {
      //String转Number
      matrix1 = parseFloat(RegExp.$1)
      matrix2 = parseFloat(RegExp.$2)
      matrix3 = parseFloat(RegExp.$3)
      matrix4 = parseFloat(RegExp.$4)
      matrix5 = parseFloat(RegExp.$5)
      matrix6 = parseFloat(RegExp.$6)
      return { currentTransform, matrix1, matrix2, matrix3, matrix4, matrix5, matrix6 }
    }
    else {
      return
    }
  }
  //设置滚动元素transform
  _setScrollTransform(pos, direction, time) {
    if (time) {
      let transitionTime
      if (typeof (time) === "number") {
        transitionTime = time + 'ms'
      }
      else if (typeof (time) === "string") {
        time = time.trim()
        let reg = /^(\d|\.)+(ms|s)$/
        let numReg = /^(\d)+$/
        if (reg.test(time)) {
          transitionTime = time
        }
        else if (numReg.test(time)) {
          transitionTime = time + 'ms'
        }
        else {
          throw new Error(`method scrollTo's second parameter is not correct`)
        }
      }
      this.childNode.style.transition = `all ${transitionTime} linear`
      this.childNode.style.webkitTransition = `all ${transitionTime} linear`
      this.childNode.style.msTransition = `all ${transitionTime} linear`
      //强制页面回流
      let rf = this.childNode.offsetHeight
    }
    if (typeof (pos) !== 'number') {
      pos = parseFloat(pos)
    }
    if (!direction || direction === 'y' || 'Y') {
      this.childNode.style.transform = `translate3d(0, ${pos}px, 0)`
      this.childNode.style.webkitTransform = `translate3d(0, ${pos}px, 0)`
    }
    else if (direction === 'x' || 'X') {
      this.childNode.style.transform = `translate3d(${pos}px, 0, 0)`
      this.childNode.style.webkitTransform = `translate3d(${pos}px, 0, 0)`
    }
    else {
      throw new Error(`method _setScrollTransform's parameters seem not be correct`)
    }
    this.scrollDistance = pos
    this._listenScrollDistance(this.childNode)
  }
  //判断是否是对象类型
  _isObject(object) {
    return Object.prototype.toString.call(object) === "[object Object]"
  }
  //事件监听兼容写法
  eventListener(node, eventName, fn, option) {
    if (window.addEventListener) {
      //新的event标准第三个参数可以是对象了
      node.addEventListener(eventName, fn, option)
    }
    else {
      node.attachEvent('on' + eventName, fn)
    }
  }
  //注销事件兼容写法
  removeEvent(node, eventName, fnName) {
    if (window.addEventListener) {
      node.removeEventListener(eventName, fnName)
    }
    else {
      node.detachEvent('on' + eventName, fnName)
    }
  }
  //判断是否是移动端
  isMobile() {
    return this._isMobile = /Android|webOS|iPhone|iPod|BlackBerry|iPad|windows ce|windows mobile|ucweb|Windows Phone|SymbianOS/i.test(navigator.userAgent)
  }
  //监听滚动坐标时，数字不会受滚动尽头的弹性影响
  _limitNumber(number) {
    let height = this._getScrollNodeHeight() - this._getWrapperNodeHeight()
    if (isNaN(number)) {
      number = parseFloat(number)
      if (isNaN(number)) {
        throw new Error(`The parm: ${number} can not be transformed Number`)
      }
    }
    if (number > 0) {
      number = 0
    }
    else if (number < -height) {
      number = height
    }
    return number
  }
  _caculateInertia(distance, velocity) {
    let inertiaScale = this.inertiaScale || 15
    let scale = distance / this.wrapperNodeHeight
    return velocity * inertiaScale + velocity * inertiaScale * scale
  }
  _resetTouchData() {
    //一次触摸滚动结束重置相关属性
    this.touchStart = undefined
    this.tempTouchMove = undefined
    this.lastTouchMove = undefined
    this.currentTouchMove = undefined
  }
}