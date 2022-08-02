const DeepProxy = require('proxy-deep')
let vscode = {}
let isVsCode = false
try {
  vscode = require('vscode')
  isVsCode = true
} catch (error) {
  // 在非 vscode 的环境中运行程序
  vscode = {
    commands: {
      registerCommand(...arg) {
        let str = `注册成功 ${arg}`
        console.log(str)
        return str
      }
    }
  }
}
const vscode2 = proxyObj(vscode)

if(isVsCode === false) {
  // 测试非 vscode 环境下的运行情况
  console.log(
    vscode2.a.b.attr = 1,
    vscode2.commands.registerCommand(1, 2, 3),
    vscode2.commands.registerCommand2(),
    vscode2.a.b.attr,
    vscode2.a.b.fn(1, 2, 3),
  )
}

module.exports = vscode2

function proxyObj(obj) {
  const newObj = new DeepProxy(obj, {
    get(target, path, receiver) {
      const val = Reflect.get(target, path, receiver)
      if(typeof(val) !== `function`) {
        proxyLog(`get`, [...this.path, path], {
          getVal: val,
        })
      }
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
        if(isBase) {
          return val
        } else {
          // 只读属性不支持代理
          if(isPropertyWritable(target, path)) {
            return this.nest(val)
          } else {
            return val
          }
        }
      }
    },
    apply(target, thisArg, argList) {
      proxyLog(`run`, this.path, {
        fnArg: argList,
        fnRes: undefined,
      })
      return target(...argList)
    },
    set(target, key, val) {
      proxyLog(`set`, [...this.path, key], {
        setVal: val,
      })
      target[key] = val
    },
  })
  return newObj
}

/**
 * 在代理函数中打印 log
 * @param {*} type 
 * @param {*} path 
 * @param {*} param2 
 */
function proxyLog(type, path, {
  fnArg, // 函数参数
  fnRes, // 函数返回值
  getVal, // 属性值
  setVal, // 设置值
}) {
  try {
    const pathStr = path.join(`.`)
    if(type === `set`) {
      console.log(`${type}> ${pathStr} setVal: ${setVal}`)
    }
    if(type === `get` && getVal !== undefined) {
      console.log(`${type}> ${pathStr} getVal: ${getVal}`)
    }
    if(type === `run`) {
      console.log(`${type}> ${pathStr} fnArg: ${fnArg.join(`,`)} fnRes: ${fnRes}`)
    }
  } catch (error) {
    console.log(error)
  }
}

/**
 * 判断对象的属性是否可写
 * @param {*} obj 
 * @param {*} prop 
 * @returns 
 */
function isPropertyWritable(obj, prop) {
  const value = obj[prop];
  const sym = Symbol();

  try {
    obj[prop] = sym;
  } catch(ex) {
    // 解决在严格模式下报错问题
    return false;
  }

  const isWritable = obj[prop] === sym;
  obj[prop] = value;  // 恢复原来的值
  
  return isWritable;
}