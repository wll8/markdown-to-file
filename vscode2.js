const DeepProxy = require('proxy-deep')
let vscode = {}
let isVsCode = false
try {
  vscode = require('vscode')
  isVsCode = true
} catch (error) {
  vscode = {
    commands: {
      registerCommand(...arg) {
        console.log(`已有函数被运行 registerCommand`, arg)
      }
    }
  }
}
const vscode2 = new DeepProxy(vscode, {
  get(target, path, receiver) {
    console.log(`attr`, [...this.path, path])
    const val = Reflect.get(target, path, receiver);
    if(isVsCode) {
      return val
    } else {
      if(val === undefined) {
        return this.nest(()=>{})
      } else {
        // 是否是基本数据类型
        const isBase = [
          `string`,
          `number`,
          `bigint`,
          `boolean`,
          `null`,
          `undefined`,
          `symbol`,
        ].includes(typeof(val))
        return isBase ? val : this.nest(val)
      }
    }
  },
  apply(target, thisArg, argList) {
    console.log(`run`, this.path, target, argList)
    return target(...argList);
  }
})

if(isVsCode === false) {
  console.log(
    vscode2.commands.registerCommand(1, 2, 3),
    vscode2.commands.registerCommand2(),
    vscode2.a.b.attr,
    vscode2.a.b.fn(1, 2, 3),
  )
}

module.exports = vscode2
