``` sh
# 安装
npm i

# 编译成插件包
npm run build
```


由于 vscode 中含有不可写属性, 所以代理时出现错误:

``` txt
'get' on proxy: property 'prop' is a read-only and non-configurable data property on the proxy target but the proxy did not return its actual value (expected '#<Object>' but got '#<Object>')
```

参考:
- 深入了解 ES6：代理 https://hacks.mozilla.org/2015/07/es6-in-depth-proxies-and-reflect/

## 关于只读对象进行代理
- http://jsfiddle.net/cjsa92w0/1/
- https://codesandbox.io/s/vue-3-proxy-over-object-with-non-writable-non-configurable-property-56z7n?file=/src/components/HelloWorld.vue:299-313
- https://daily-dev-tips.com/posts/detect-object-changes-with-javascript-proxy/
- https://banyudu.com/posts/es6-deep-proxy.6106ff
- https://exploringjs.com/deep-js/ch_proxies.html