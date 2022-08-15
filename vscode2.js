const fs = require(`fs`)
const path = require(`path`)
const pkg = require(`./package.json`)
let log = console.log
log = () => {}
const print = (...arg) => {
  console.log(...arg)
}
global.SET = (key, val) => {
  log(`SET`, key, val)
  global[`${pkg.name}_${key}`] = val
  return val
}
global.GET = (key) => {
  return global[`${pkg.name}_${key}`]
}
global.SET(`pkg`, pkg)

const DeepProxy = require('proxy-deep')
let vscode = {}
try {
  vscode = require('vscode')
  global.SET(`isVsCode`, true)
} catch (error) {
  let [input, type, ...arg] = process.argv.slice(2)
  const cli = type ? parseArgv([type, ...arg]) : {}
  type = type || `pdf`
  if(typeof(input) !== `string` || fs.existsSync(input) === false) {
    print(`${pkg.name} v${pkg.version}`)
    print(``)
    print(`Converts Markdown files to pdf, html, png or jpeg files.`)
    print(``)
    print(`Usage: m2f <md> [type] [options...]`)
    print(`       md      -- path to markdown file to convert`)
    print(`       type    -- Output file format: pdf|html|jpeg|png|all`)
    print(`       options -- See: https://github.com/wll8/markdown-to-file`)
    print(`   Eg: `)
    print(`       m2f README.md`)
    print(`       m2f README.md html`)
    print(`       m2f README.md pdf outputDirectory=./mydoc/ markdown-it-include.enable=false`)
    process.exit()
  }
  input = path.isAbsolute(input) ? input : `${process.cwd()}/${input}`
  const properties = global.GET(`pkg`).contributes.configuration.properties
  const defaultConfig =  Object.entries(properties).reduce((acc, [key, val]) => {
    acc = deepSet(acc, key, val.default)
    return acc
  }, {})
  const userConfig = JSON.parse(JSON.stringify(defaultConfig))
  Object.entries(cli).forEach(([key, val]) => {
    deepSet(userConfig, `markdown-pdf.${key}`, val)
  })
  print(`options:`, cli)
  global.SET(`defaultConfig`, defaultConfig)
  global.SET(`userConfig`, userConfig)
  // 在非 vscode 的环境中运行程序
  vscode = {
    Uri: {
      // 获取某个文件的 file:// 协议地址
      file(file) {
        // return 'file:///d%3A/temp/readme_tmp.html'
        const fileUrl = encodeURI(`file:///${file}`.replace(/[\/\\]/g, `/`))
        log(`fileUrl`, fileUrl)
        return fileUrl
      },
    },
    workspace: {
      getConfiguration(...arg) {
        const [type] = arg
        const config = global.GET(`userConfig`)[type]
        return config || {}
      },
    },
    window: {
      withProgress(info, fn) {
        print(`::withProgress`, info.title)
        fn()
      },
      showWarningMessage(...arg) {
        print(`::showWarningMessage`, ...arg)
        return proxyObj(()=>{})
      },
      setStatusBarMessage(title, time) {
        print(`::setStatusBarMessage`, title)
        return proxyObj(()=>{})
      },
      activeTextEditor: {
        document: {
          uri: {
            fsPath: input,
          },
          languageId: `markdown`,
          getText() {
            return require(`fs`).readFileSync(input, `utf8`)
          },
        },
      },
    },
    commands: {
      // 注册命令
      registerCommand(out, fn) {
        log(`::registerCommand`, out, fn)
        ;`extension.markdown-pdf.${type}` === out && fn();
        return ``
      }
    }
  }
}
const vscode2 = proxyObj(vscode)
global.SET(`util.proxyObj`, proxyObj)

module.exports = vscode2

/**
 * 代理一个对象
 * [ ] fix: 对不存在的对象调用 toString 时会报错 TypeError: Cannot convert object to primitive value
 *  - 这是由于不存在的属性默认是一个 Proxy 对象, 而 String(Proxy) 出现了错误
 * @param {*} obj 
 * @returns 
 */
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
        const fn = function (){}
        let proxyFn
        // fix: 不用使用 直接使用 this.nest 否则会报错 TypeError: Cannot convert a Symbol value to a string
        // see: https://www.mattzeunert.com/2016/07/20/proxy-symbol-tostring.html
        // see: https://gist.github.com/dotproto/f4bb65ad97fc90bb4217434f39297feb
        fn[Symbol.toPrimitive] = function () { return ``}
        proxyFn = new Proxy(fn, {
          get : (target, name) => {
            if (!(name in target)) {
              return proxyFn
            }
            return target[name]
          }
        })
        return proxyFn
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
      const fnRes = target(...argList) || (() => {})
      proxyLog(`run`, this.path, {
        fnArg: argList,
        fnRes,
      })
      return fnRes
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
      log(`${type}> ${pathStr} setVal: ${setVal}`)
    }
    if(type === `get` && getVal !== undefined) {
      log(`${type}> ${pathStr} getVal: ${getVal}`)
    }
    if(type === `run`) {
      log(`${type}> ${pathStr} fnArg: ${fnArg.filter(item => (typeof(item) !== `function`)).join(`,`)}`)
    }
    {
      const val = setVal || getVal || fnRes
      typeof(val) !== `function` && log(`${type}Val>`, val);
    }
  
  } catch (error) {
    // log(error)
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

/**
 * 解析命令行参数
 * @param {*} arr 
 * @returns 
 */
function parseArgv(arr) {
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, ...v] = arg.split(`=`)
    v = v.join(`=`) // 把带有 = 的值合并为字符串
    acc[k] = v === `` // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === `true`
        : (
          /[\d|.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}

/**
 * 深层设置对象值
 * @param {*} object 
 * @param {*} keys 
 * @param {*} val 
 * @returns 
 */
function deepSet(object, keys, val) {
  keys = Array.isArray(keys) ? keys : keys
    .replace(/\[/g, `.`)
    .replace(/\]/g, ``)
    .split(`.`)
  if (keys.length > 1) {
    object[keys[0]] = object[keys[0]] || {}
    deepSet(object[keys[0]], keys.slice(1), val)
    return object
  }
  object[keys[0]] = val
  return object
}