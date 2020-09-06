"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var lbwVue = /*#__PURE__*/function () {
  function lbwVue(options) {
    _classCallCheck(this, lbwVue);

    this.$options = options;
    this.$data = options.data; // 数据响应化

    this.observe(this.$data); // 开启编译器

    new Compile(options.el, this);

    if (options.created) {
      options.created.call(this);
    }
  }

  _createClass(lbwVue, [{
    key: "observe",
    value: function observe(value) {
      var _this = this;

      if (!value || _typeof(value) !== 'object') {
        return;
      } // 遍历该对象


      Object.keys(value).forEach(function (key) {
        _this.defineReactive(value, key, value[key]);

        _this.proxyData(key);
      });
    } //  数据响应化

  }, {
    key: "defineReactive",
    value: function defineReactive(obj, key, val) {
      // 递归解决对象数组嵌套问题
      this.observe(val);
      var dep = new Dep(); // 添加get set函数

      Object.defineProperty(obj, key, {
        get: function get() {
          Dep.target && dep.addDep(Dep.target);
          return val;
        },
        set: function set(newVal) {
          // 如果新值与老值相等 返回
          if (newVal === val) return;
          val = newVal;
          dep.notify();
        }
      });
    }
  }, {
    key: "proxyData",
    value: function proxyData(key) {
      Object.defineProperty(this, key, {
        get: function get() {
          return this.$data[key];
        },
        set: function set(newVal) {
          this.$data[key] = newVal;
        }
      });
    }
  }]);

  return lbwVue;
}(); // 用来管理watcher


var Dep = /*#__PURE__*/function () {
  function Dep() {
    _classCallCheck(this, Dep);

    // 依赖数组
    this.deps = [];
  } // 添加依赖


  _createClass(Dep, [{
    key: "addDep",
    value: function addDep(dep) {
      this.deps.push(dep);
    }
  }, {
    key: "notify",
    value: function notify() {
      // 通知依赖进行更新
      this.deps.forEach(function (dep) {
        return dep.update();
      });
    }
  }]);

  return Dep;
}(); // 观察者


var Watcher = /*#__PURE__*/function () {
  function Watcher(vm, key, cb) {
    _classCallCheck(this, Watcher);

    this.vm = vm;
    this.key = key;
    this.cb = cb; // 将当前watcher的实例指定到Dep静态属性target

    Dep.target = this; // 触发getter 添加依赖

    this.vm[this.key];
    Dep.target = null;
  }

  _createClass(Watcher, [{
    key: "update",
    value: function update() {
      this.cb.call(this.vm, this.vm[this.key]);
    }
  }]);

  return Watcher;
}(); // 编译器


var Compile = /*#__PURE__*/function () {
  function Compile(el, vm) {
    _classCallCheck(this, Compile);

    this.$el = document.querySelector(el);
    this.$vm = vm; //   编译

    if (this.$el) {
      // 转换容器内容为片段
      this.$fragment = this.node2Fragment(this.$el); // 执行编译

      this.compile(this.$fragment); //  将编译完的html结果追加至$el

      this.$el.appendChild(this.$fragment);
    }
  } // 将宿主元素中代码片段拿出来遍历,可以优化性能


  _createClass(Compile, [{
    key: "node2Fragment",
    value: function node2Fragment(el) {
      var frag = document.createDocumentFragment(); //  将el中所有的子元素搬家至frag中

      var child;

      while (child = el.firstChild) {
        frag.appendChild(child);
      }

      return frag;
    } // 编译过程

  }, {
    key: "compile",
    value: function compile(el) {
      var _this2 = this;

      var childNodes = el.childNodes;
      Array.from(childNodes).forEach(function (node) {
        // 类型判断
        if (_this2.isElement(node)) {
          // 元素
          var nodeAttrs = node.attributes; // 查找 l- @ :

          Array.from(nodeAttrs).forEach(function (attr) {
            var attrName = attr.name; // 属性名

            var exp = attr.value; // 属性值

            if (_this2.isDirective(attrName)) {
              //  l-text
              var dir = attrName.substring(2); //  执行指令

              _this2[dir] && _this2[dir](node, _this2.$vm, exp); //
            }

            if (_this2.isEvent(attrName)) {
              var _dir = attrName.substring(1); // 绑定事件


              _this2.eventHandle(node, _this2.$vm, exp, _dir);
            }
          });
        } else if (_this2.isInterpolation(node)) {
          // 文本
          _this2.compileText(node);
        } //  递归字节点


        if (node.childNodes && node.childNodes.length > 0) {
          _this2.compile(node);
        }
      });
    } // 编译文本

  }, {
    key: "compileText",
    value: function compileText(node) {
      this.update(node, this.$vm, RegExp.$1, 'text');
    } // 更新函数

  }, {
    key: "update",
    value: function update(node, vm, exp, dir) {
      var updateFn = this[dir + 'Updater']; // 初始化

      updateFn && updateFn(node, vm[exp]); // 依赖搜集

      new Watcher(vm, exp, function (value) {
        updateFn && updateFn(node, value);
      });
    } // l-html 指令

  }, {
    key: "html",
    value: function html(node, vm, exp) {
      this.update(node, vm, exp, 'html');
    }
  }, {
    key: "htmlUpdater",
    value: function htmlUpdater(node, value) {
      node.innerHTML = value;
    } // l-text 指令

  }, {
    key: "text",
    value: function text(node, vm, exp) {
      this.update(node, vm, exp, 'text');
    }
  }, {
    key: "textUpdater",
    value: function textUpdater(node, value) {
      node.textContent = value;
    } // l-model 双向数据绑定

  }, {
    key: "model",
    value: function model(node, vm, exp) {
      // 指定input的value值
      this.update(node, vm, exp, 'model');
      node.addEventListener('input', function (e) {
        vm[exp] = e.target.value;
      });
    }
  }, {
    key: "modelUpdater",
    value: function modelUpdater(node, value) {
      node.value = value;
    } // 事件处理

  }, {
    key: "eventHandle",
    value: function eventHandle(node, vm, exp, dir) {
      var fn = vm.$options.methods && vm.$options.methods[exp];

      if (dir && fn) {
        node.addEventListener(dir, fn.bind(vm));
      }
    } // 是否元素

  }, {
    key: "isElement",
    value: function isElement(node) {
      return node.nodeType === 1;
    } // 是否插值文本

  }, {
    key: "isInterpolation",
    value: function isInterpolation(node) {
      return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
    } //  是否指令

  }, {
    key: "isDirective",
    value: function isDirective(attr) {
      return attr.indexOf('l-') === 0;
    } //  是否事件

  }, {
    key: "isEvent",
    value: function isEvent(attr) {
      return attr.indexOf('@') === 0;
    }
  }]);

  return Compile;
}();