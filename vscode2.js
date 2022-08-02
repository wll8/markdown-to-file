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
        const str = `已注册命令 ${arg.join(`,`)}`
        console.log(str)
        return str
      }
    }
  }
}

const vscode2 = watchObj(vscode)

if(isVsCode === false) {
  console.log(
    vscode2.commands.registerCommand(1, 2, 3),
    vscode2.commands.registerCommand2(),
    vscode2.a.b.attr,
    vscode2.a.b.fn(1, 2, 3),
  )
  vscode2.a.b.c.d.e = 11
}


module.exports = vscode2

/**
 * 查看某个对象的调用情况
 */
function watchObj(obj) {
  const rootKey = Symbol(`_isRoot`)
  obj[rootKey] = true
  const handler = {
    get(target, key) {
      const val = target[key]
      if(target[rootKey]) {
        obj[rootKey] = [key]
      } else {
        obj[rootKey].push(key)
      }
      const pathStr = obj[rootKey].join(`.`)

      // 如果是只读属性, 那么原样返回
      if(isPropertyWritable(target, key)) {
        // 如果是函数时记录调用的参数和返回值
        if(typeof(val) === `function`) {
          return function (...args) {
            const res = val.apply(this, args);
            console.log(`run> ${pathStr} ${typeof(val)} args:${args.join(`,`)} res:${res}`)
            return res
          }
        }
        
        console.log(`get> ${pathStr} type:${typeof(val)}`)
        // 如果是引用类型时, 进行深层代理
        if(typeof(val) === `object` && val !== null) {
          return new Proxy(val, handler)
        }
      } else {
        return val
      }
      // 没有子属性时模板民一个避免报错
      if(val === undefined) {
        return new Proxy(() => {}, handler)
      }
      return val
    },
    set(target, key, val) {
      if(target[rootKey]) {
        obj[rootKey] = [key]
      } else {
        obj[rootKey].push(key)
        const pathStr = obj[rootKey].join(`.`)
        console.log(`set> ${obj[rootKey].join(`.`)} type:${typeof(val)}`)
      }
      target[key] = val;
    }
  }
  return new Proxy(obj, handler)
}

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