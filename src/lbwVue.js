class lbwVue {
  constructor(options) {
    this.$options = options;
    this.$data = options.data;
    // 数据响应化
    this.observe(this.$data);
    // 开启编译器
    new Compile(options.el, this);

    if (options.created) {
      options.created.call(this)
    }
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return
    }
    // 遍历该对象
    Object.keys(value).forEach(key => {
      this.defineReactive(value, key, value[key])
      this.proxyData(key)
    })
  }

//  数据响应化
  defineReactive(obj, key, val) {
    // 递归解决对象数组嵌套问题
    this.observe(val);
    const dep = new Dep();

    // 添加get set函数
    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.addDep(Dep.target);
        return val
      },
      set(newVal) {
        // 如果新值与老值相等 返回
        if (newVal === val) return;
        val = newVal;
        dep.notify()
      }
    })
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal
      }
    })
  }
}

// 用来管理watcher
class Dep {
  constructor() {
    // 依赖数组
    this.deps = []
  }

  // 添加依赖
  addDep(dep) {
    this.deps.push(dep)
  }

  notify() {
    // 通知依赖进行更新
    this.deps.forEach(dep => dep.update())
  }
}

// 观察者
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;

    // 将当前watcher的实例指定到Dep静态属性target
    Dep.target = this;
    // 触发getter 添加依赖
    this.vm[this.key];
    Dep.target = null;
  }

  update() {
    this.cb.call(this.vm, this.vm[this.key])
  }
}

// 编译器
class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;

    //   编译
    if (this.$el) {
      // 转换容器内容为片段
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      //  将编译完的html结果追加至$el
      this.$el.appendChild(this.$fragment);
    }
  }

  // 将宿主元素中代码片段拿出来遍历,可以优化性能
  node2Fragment(el) {
    const frag = document.createDocumentFragment();
    //  将el中所有的子元素搬家至frag中
    let child;
    while (child = el.firstChild) {
      frag.appendChild(child)
    }
    return frag;
  }

  // 编译过程
  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 类型判断
      if (this.isElement(node)) {
        // 元素
        const nodeAttrs = node.attributes;
        // 查找 l- @ :
        Array.from(nodeAttrs).forEach(attr => {
          const attrName = attr.name; // 属性名
          const exp = attr.value; // 属性值
          if (this.isDirective(attrName)) {
            //  l-text
            const dir = attrName.substring(2);
            //  执行指令
            this[dir] && this[dir](node, this.$vm, exp)
            //
          }
          if (this.isEvent(attrName)) {
            const dir = attrName.substring(1); // 绑定事件
            this.eventHandle(node, this.$vm, exp, dir)
          }
        })
      } else if (this.isInterpolation(node)) {
        // 文本
        this.compileText(node)
      }
      //  递归字节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node)
      }
    })
  }

  // 编译文本
  compileText(node) {
    this.update(node, this.$vm, RegExp.$1, 'text')
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updateFn = this[dir + 'Updater'];
    // 初始化
    updateFn && updateFn(node, vm[exp]);
    // 依赖搜集
    new Watcher(vm, exp, value => {
      updateFn && updateFn(node, value);
    })
  }

  // l-html 指令
  html(node, vm, exp) {
    this.update(node, vm, exp, 'html')
  }

  htmlUpdater(node, value) {
    node.innerHTML = value
  }

  // l-text 指令
  text(node, vm, exp) {
    this.update(node, vm, exp, 'text')
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  // l-model 双向数据绑定
  model(node, vm, exp) {
    // 指定input的value值
    this.update(node, vm, exp, 'model');

    node.addEventListener('input', e => {
      vm[exp] = e.target.value
    })
  }

  modelUpdater(node, value) {
    node.value = value
  }

  // 事件处理
  eventHandle(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }

  // 是否元素
  isElement(node) {
    return node.nodeType === 1
  }

  // 是否插值文本
  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  //  是否指令
  isDirective(attr) {
    return attr.indexOf('l-') === 0;
  }

  //  是否事件
  isEvent(attr) {
    return attr.indexOf('@') === 0;
  }

}