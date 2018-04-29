'use strict';
var vscode = require('vscode');
var path = require('path');
var fs = require('fs');
var url = require('url');
var mdfilename = '';

function activate(context) {
  init();

  var commands = [
    vscode.commands.registerCommand('extension.markdown-pdf.settings', function () { MarkdownPdf('settings'); }),
    vscode.commands.registerCommand('extension.markdown-pdf.pdf', function () { MarkdownPdf('pdf'); }),
    vscode.commands.registerCommand('extension.markdown-pdf.html', function () { MarkdownPdf('html'); }),
    vscode.commands.registerCommand('extension.markdown-pdf.png', function () { MarkdownPdf('png'); }),
    vscode.commands.registerCommand('extension.markdown-pdf.jpeg', function () { MarkdownPdf('jpeg'); }),
    vscode.commands.registerCommand('extension.markdown-pdf.all', function () { MarkdownPdf('all'); })
  ];
  commands.forEach(function (command) {
    context.subscriptions.push(command);
  });
  
  var isConvertOnSave = vscode.workspace.getConfiguration('markdown-pdf')['convertOnSave'];
  if (isConvertOnSave) {
    var disposable_onsave = vscode.workspace.onDidSaveTextDocument(function () { MarkdownPdfOnSave(); });
    context.subscriptions.push(disposable_onsave);
  }
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

function MarkdownPdf(option_type) {
  // check active window
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active Editor!');
    return;
  }

  // check markdown mode
  var mode = editor.document.languageId;
  if (mode != 'markdown') {
    vscode.window.showWarningMessage('It is not a markdown mode!');
    return;
  }

  mdfilename = editor.document.fileName;
  var ext = path.extname(mdfilename);
  if (!isExistsPath(mdfilename)) {
    if (editor.document.isUntitled) {
      vscode.window.showWarningMessage('Please save the file!');
      return;
    }
    vscode.window.showWarningMessage('File name does not get!');
    return;
  }

  var types_format = ['html', 'pdf', 'png', 'jpeg'];
  var filename = '';
  var types = [];
  if (types_format.indexOf(option_type) >= 0) {
    types[0] = option_type;
  } else if (option_type === 'settings') {
    var types_tmp = vscode.workspace.getConfiguration('markdown-pdf')['type'] || 'pdf';
    if (types_tmp && !Array.isArray(types_tmp)) {
        types[0] = types_tmp;
    } else {
      types = vscode.workspace.getConfiguration('markdown-pdf')['type'] || 'pdf';
    }
  } else if (option_type === 'all') {
    types = types_format;
  } else {
    vscode.window.showErrorMessage('ERROR: MarkdownPdf().1 Supported formats: html, pdf, png, jpeg.');
    return;
  }

  var title = path.basename(mdfilename);
  // convert and export markdown to pdf, html, png, jpeg
  if (types && Array.isArray(types) && types.length > 0) {
    for (var i = 0; i < types.length; i++) {
      var type = types[i];
      if (types_format.indexOf(type) >= 0) {
        filename = mdfilename.replace(ext, '.' + type);
        filename = getOutputDir(filename);
        var content = convertMarkdownToHtml(mdfilename, type);
        var html = makeHtml(content, title);
        exportPdf(html, filename, type);
      } else {
        vscode.window.showErrorMessage('ERROR: MarkdownPdf().2 Supported formats: html, pdf, png, jpeg.');
        return;
      }
    }
  } else {
    vscode.window.showErrorMessage('ERROR: MarkdownPdf().3 Supported formats: html, pdf, png, jpeg.');
    return;
  }
}

function MarkdownPdfOnSave() {
  var editor = vscode.window.activeTextEditor;
  var mode = editor.document.languageId;
  if (mode != 'markdown') {
    return;
  }
  if (!isMarkdownPdfOnSaveExclude()) {
    MarkdownPdf('settings');
  }
}

function isMarkdownPdfOnSaveExclude() {
  var editor = vscode.window.activeTextEditor;
  var filename = path.basename(editor.document.fileName);
  var patterns = vscode.workspace.getConfiguration('markdown-pdf')['convertOnSaveExclude'] || '';
  var pattern;
  var i;
  if (patterns && Array.isArray(patterns) && patterns.length > 0) {
    for (i = 0; i < patterns.length; i++) {
      pattern = patterns[i];
      var re = new RegExp(pattern);
      if (re.test(filename)) {
        return true;
      }
    }
  }
  return false;
}

/*
 * convert markdown to html (markdown-it)
 */
function convertMarkdownToHtml(filename, type) {
  var statusbarmessage = vscode.window.setStatusBarMessage('$(markdown) Converting (convertMarkdownToHtml) ...');
  var hljs = require('highlight.js');
  var breaks = vscode.workspace.getConfiguration('markdown-pdf')['breaks'];
  try {
    var md = require('markdown-it')({
      html: true,
      breaks: breaks,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            str = hljs.highlight(lang, str, true).value;
          } catch (e) {
            str = md.utils.escapeHtml(str);

            vscode.window.showErrorMessage('ERROR: markdown-it:highlight');
            vscode.window.showErrorMessage(e.message);
          }
        } else {
          str = md.utils.escapeHtml(str);
        }
        return '<pre class="hljs"><code><div>' + str + '</div></code></pre>';
      }
    });
  } catch (e) {
    statusbarmessage.dispose();
    vscode.window.showErrorMessage('ERROR: require(\'markdown-it\')');
    vscode.window.showErrorMessage(e.message);
  }

  // convert the img src of the markdown  
  var cheerio = require('cheerio');
  var defaultRender = md.renderer.rules.image;
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    var token = tokens[idx];
    var href = token.attrs[token.attrIndex('src')][1];
    // console.log("original href: " + href);
    if (type === 'html') {
      href = decodeURIComponent(href).replace(/("|')/g, '');
    } else {
      href = convertImgPath(href, filename);
    }
    // console.log("converted href: " + href);
    token.attrs[token.attrIndex('src')][1] = href;
    // // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };

  if (type !== 'html') {
    // convert the img src of the html
    md.renderer.rules.html_block = function (tokens, idx) {
      var html = tokens[idx].content;
      var $ = cheerio.load(html);
      $('img').each(function () {
        var src = $(this).attr('src');
        var href = convertImgPath(src, filename);
        $(this).attr('src', href);
      });
      return $.html();
    };
  }

  // checkbox
  md.use(require('markdown-it-checkbox'));

  // emoji
  var f = vscode.workspace.getConfiguration('markdown-pdf')['emoji'];
  if (f) {
    var emojies_defs = require(path.join(__dirname, 'data', 'emoji.json'));
    try {
      var options = {
        defs: emojies_defs
      };
    } catch (e) {
      statusbarmessage.dispose();
      vscode.window.showErrorMessage('ERROR: markdown-it-emoji:options');
      vscode.window.showErrorMessage(e.message);
    }
    md.use(require('markdown-it-emoji'), options);
    md.renderer.rules.emoji = function (token, idx) {
      var emoji = token[idx].markup;
      var emojipath = path.join(__dirname, 'node_modules', 'emoji-images', 'pngs', emoji + '.png');
      var emojidata = readFile(emojipath, null).toString('base64');
      if (emojidata) {
        return '<img class="emoji" alt="' + emoji + '" src="data:image/png;base64,' + emojidata + '" />';
      } else {
        return ':' + emoji + ':';
      }
    };
  }

  // toc
  // https://github.com/leff/markdown-it-named-headers
  var options = {
    slugify: Slug
  }
  md.use(require('markdown-it-named-headers'), options);
  
  statusbarmessage.dispose();
  return md.render(fs.readFileSync(filename, 'utf-8'));
}

/*
 * https://github.com/Microsoft/vscode/blob/b3a1b98d54e2f7293d6f018c97df30d07a6c858f/extensions/markdown/src/markdownEngine.ts
 * https://github.com/Microsoft/vscode/blob/b3a1b98d54e2f7293d6f018c97df30d07a6c858f/extensions/markdown/src/tableOfContentsProvider.ts
 */
function Slug(string) {
  var stg = encodeURI(string.trim()
    .toLowerCase()
    .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^\-+/, '')
    .replace(/\-+$/, ''));
  return stg;
}

/*
 * make html
 */
function makeHtml(data, title) {
  try {
    // read styles
  var style = '';
  style += readStyles();

  // read template
  var filename = path.join(__dirname, 'template', 'template.html');
  var template = readFile(filename);

  // compile template
  var mustache = require('mustache');

  // try {
    var view = {
      title: title,
      style: style,
      content: data
    };
  } catch (e) {
    vscode.window.showErrorMessage('ERROR: mustache:view');
    vscode.window.showErrorMessage(e.message);
  }

  return mustache.render(template, view);
}

/*
 * export a html to a html file
 */
function exportHtml(data, filename) {
  fs.writeFile(filename, data, 'utf-8', function (err) {
    if (err) {
      vscode.window.showErrorMessage('ERROR: exportHtml()');
      vscode.window.showErrorMessage(err.message);
      return;
    }
  });
}

/*
 * export a html to a pdf file (html-pdf)
 */
function exportPdf(data, filename, type) {
  
  if (!checkPuppeteerBinary()) {
    return;
  }
  
  var StatusbarMessageTimeout = vscode.workspace.getConfiguration('markdown-pdf')['StatusbarMessageTimeout'];
  vscode.window.setStatusBarMessage('');
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '[Markdown PDF]: Exporting (' + type + ') ...'
    }, async () => {
      try {
        // export html
        if (type == 'html') {
          exportHtml(data, filename);
          vscode.window.setStatusBarMessage('$(markdown) ' + filename, StatusbarMessageTimeout);
          return;
        }
        
        const puppeteer = require('puppeteer');
        // create temporary file
        var f = path.parse(filename);
        var tmpfilename = path.join(f.dir, f.name + '_tmp.html');
        tmpfilename = getOutputDir(tmpfilename);
        exportHtml(data, tmpfilename);
        
        var options = {
          executablePath: vscode.workspace.getConfiguration('markdown-pdf')['executablePath'] || undefined
        }
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(`file://${tmpfilename}`, { waitUntil: 'networkidle0' });

        // generate pdf
        // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
        if (type == 'pdf') {
          // If width or height option is set, it overrides the format option.
          // In order to set the default value of page size to A4, we changed it from the specification of puppeteer.
          var width_option = vscode.workspace.getConfiguration('markdown-pdf')['width'] || '';
          var height_option = vscode.workspace.getConfiguration('markdown-pdf')['height'] || '';
          var format_option = '';
          if (!width_option && !height_option) {
            format_option = vscode.workspace.getConfiguration('markdown-pdf')['format'] || 'A4';
          }
          var landscape_option;
          if (vscode.workspace.getConfiguration('markdown-pdf')['orientation'] == 'landscape') {
              landscape_option = true;
          } else {
            landscape_option = false;
          }
          var options = {
            path: filename,
            scale: vscode.workspace.getConfiguration('markdown-pdf')['scale'],
            displayHeaderFooter: vscode.workspace.getConfiguration('markdown-pdf')['displayHeaderFooter'],
            headerTemplate: vscode.workspace.getConfiguration('markdown-pdf')['headerTemplate'] || '',
            footerTemplate: vscode.workspace.getConfiguration('markdown-pdf')['footerTemplate'] || '',
            printBackground: vscode.workspace.getConfiguration('markdown-pdf')['printBackground'],
            landscape: landscape_option,
            pageRanges: vscode.workspace.getConfiguration('markdown-pdf')['pageRanges'] || '',
            format: format_option,
            width: vscode.workspace.getConfiguration('markdown-pdf')['width'] || '',
            height: vscode.workspace.getConfiguration('markdown-pdf')['height'] || '',
            margin: {
              top: vscode.workspace.getConfiguration('markdown-pdf')['margin']['top'] || '', 
              right: vscode.workspace.getConfiguration('markdown-pdf')['margin']['right'] || '',
              bottom: vscode.workspace.getConfiguration('markdown-pdf')['margin']['bottom'] || '',
              left: vscode.workspace.getConfiguration('markdown-pdf')['margin']['left'] || ''
            }
          }
          if (checkPuppeteerBinary()) {
            await page.pdf(options);
          }
        }

        // generate png and jpeg
        // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions
        if (type == 'png' || type == 'jpeg') {
          // Quality options do not apply to PNG images.
          var quality_option;
          if (type == 'png') {
            quality_option = undefined;
          }
          if (type == 'jpeg') {
            quality_option = vscode.workspace.getConfiguration('markdown-pdf')['quality'] || 100;
          }

          // screenshot size
          var clip_x_option = vscode.workspace.getConfiguration('markdown-pdf')['clip']['x'];
          var clip_y_option = vscode.workspace.getConfiguration('markdown-pdf')['clip']['y'];
          var clip_width_option = vscode.workspace.getConfiguration('markdown-pdf')['clip']['width'];
          var clip_height_option = vscode.workspace.getConfiguration('markdown-pdf')['clip']['height'];
          var options;
          if (clip_x_option !== null && clip_y_option !== null && clip_width_option !== null && clip_height_option !== null) {
            options = {
              path: filename,
              quality: quality_option,
              fullPage: false,
              clip: {
                x: clip_x_option,
                y: clip_y_option,
                width: clip_width_option,
                height: clip_height_option,
              },
              omitBackground: vscode.workspace.getConfiguration('markdown-pdf')['omitBackground'],          
            }
          } else {
            options = {
              path: filename,
              quality: quality_option,
              fullPage: true,
              omitBackground: vscode.workspace.getConfiguration('markdown-pdf')['omitBackground'],          
            }
          }
          if (checkPuppeteerBinary()) {
            await page.screenshot(options);
          }
        }

        await browser.close();

        // delete temporary file
        var debug = vscode.workspace.getConfiguration('markdown-pdf')['debug'] || false;
        if (!debug) {
          if (isExistsPath(tmpfilename)) {
            deleteFile(tmpfilename);
          }
        }

        vscode.window.setStatusBarMessage('$(markdown) ' + filename, StatusbarMessageTimeout);
      } catch (e) {
        // vscode.window.showErrorMessage('ERROR: exportPdf()');
        // vscode.window.showErrorMessage(e.message);
      }
    } // async
  ); // vscode.window.withProgress
}

function isExistsPath(path) {
  if (path.length === 0) {
    return false;
  }
  try {
    fs.accessSync(path);
    return true;
  } catch (e) {
    console.warn(e.message);
    return false;
  }
}

function isExistsDir(dirname) {
  if (dirname.length === 0) {
    return false;
  }
  try {
    if (fs.statSync(dirname).isDirectory()) {
      return true;
    } else {
      console.warn('Directory does not exist!') ;
      return false;
    }
  } catch (e) {
    console.warn(e.message);
    return false;
  }
}

function deleteFile (path) {
  var rimraf = require('rimraf')
  rimraf(path, function(err) {
    if (err) throw err;
  });
}

function getOutputDir(filename) {
  var output_dir = vscode.workspace.getConfiguration('markdown-pdf')['outputDirectory'] || '';
  if (output_dir.length !== 0) {
    if (isExistsDir(output_dir)) {
      return path.join(output_dir, path.basename(filename));
    } else {
      vscode.window.showWarningMessage('Output directory does not exist! (markdown-pdf.outputDirectory) : ' + output_dir);
      return filename;
    }
  }
  return filename;
}

function readFile(filename, encode) {
  if (filename.length === 0) {
    return '';
  }
  if (!encode && encode !== null) {
    encode = 'utf-8';
  }
  if (filename.indexOf('file://') === 0) {
    if (process.platform === 'win32') {
      filename = filename.replace(/^file:\/\/\//, '')
                 .replace(/^file:\/\//, '');
    } else {
      filename = filename.replace(/^file:\/\//, '');
    }
  }
  if (isExistsPath(filename)) {
    return fs.readFileSync(filename, encode);
  } else {
    return '';
  }
}

function convertImgPath(src, filename) {
  var href = decodeURIComponent(src);
  href = href.replace(/("|')/g, '')
         .replace(/\\/g, '/')
         .replace(/#/g, '%23');
  var protocol = url.parse(href).protocol;
  if (protocol === 'file:' && href.indexOf('file:///') !==0) {
    return href.replace(/^file:\/\//, 'file:///');
  } else if (protocol === 'file:') {
    return href;
  } else if (!protocol || path.isAbsolute(href)) {
    href = path.resolve(path.dirname(filename), href).replace(/\\/g, '/')
                                                     .replace(/#/g, '%23');
    if (href.indexOf('//') === 0) {
      return 'file:' + href;
    } else if (href.indexOf('/') === 0) {
      return 'file://' + href;
    } else {
      return 'file:///' + href;
    }
  } else {
    return src;
  }
}

function makeCss(filename) {
  var css = readFile(filename);
  if (css) {
    return '\n<style>\n' + css + '\n</style>\n';
  } else {
    return '';
  }
}

function readStyles() {
  var includeDefaultStyles;
  var style = '';
  var styles = '';
  var filename = '';
  var i;
  
  includeDefaultStyles = vscode.workspace.getConfiguration('markdown-pdf')['includeDefaultStyles'];
  
  // 1. read the style of the vscode.
  if (includeDefaultStyles) {
    filename = path.join(__dirname, 'styles', 'markdown.css');
    style += makeCss(filename);
  }
  
  // 2. read the style of the markdown.styles setting.
  if (includeDefaultStyles) {
    styles = vscode.workspace.getConfiguration('markdown')['styles'];
    if (styles && Array.isArray(styles) && styles.length > 0) {
      for (i = 0; i < styles.length; i++) {
        var href = filename = styles[i];
        var protocol = url.parse(href).protocol;
        if (protocol === 'http:' || protocol === 'https:') {
          style += '<link rel=\"stylesheet\" href=\"' + href + '\" type=\"text/css\">';
        } else if (protocol === 'file:') {
          style += makeCss(filename);
        }
      }
    }
  }

  // 3. read the style of the highlight.js.
  var highlightStyle = vscode.workspace.getConfiguration('markdown-pdf')['highlightStyle'] || '';
  var ishighlight = vscode.workspace.getConfiguration('markdown-pdf')['highlight'];
  if (ishighlight) {
    if (highlightStyle) {
      var css = vscode.workspace.getConfiguration('markdown-pdf')['highlightStyle'] || 'github.css';
      filename = path.join(__dirname, 'node_modules', 'highlight.js', 'styles', css);
      style += makeCss(filename);
    } else {
      filename = path.join(__dirname, 'styles', 'tomorrow.css');
      style += makeCss(filename);
    }
  }

  // 4. read the style of the markdown-pdf.
  if (includeDefaultStyles) {
    filename = path.join(__dirname, 'styles', 'markdown-pdf.css');
    style += makeCss(filename);
  }

  // 5. read the style of the markdown-pdf.styles settings.
  styles = vscode.workspace.getConfiguration('markdown-pdf')['styles'] || '';
  if (styles && Array.isArray(styles) && styles.length > 0) {
    for (i = 0; i < styles.length; i++) {
      var href = filename = styles[i];
      var protocol = url.parse(href).protocol;
      if (!path.isAbsolute(filename)) {
        if (protocol === 'http:' || protocol === 'https:') {
          style += '<link rel=\"stylesheet\" href=\"' + href + '\" type=\"text/css\">';
        } else {
          if (vscode.workspace.rootPath == undefined) {
            filename = path.join(path.dirname(mdfilename), filename);
          } else {
            filename = path.join(vscode.workspace.rootPath, filename);         
          }
          style += makeCss(filename);
        }
      } else {
        style += makeCss(filename);
      }
    }
  }

  return style;
}

function checkPuppeteerBinary() {
  // settings.json
  var executablePath = vscode.workspace.getConfiguration('markdown-pdf')['executablePath'] || ''
  if (isExistsPath(executablePath)) {
    return true;
  }

  // bundled Chromium
  const puppeteer = require('puppeteer');
  executablePath = puppeteer.executablePath();
  if (isExistsPath(executablePath)) {
    return true;
  } else {
    return false;
  }
}

function installPuppeteerBinary() {
  var StatusbarMessageTimeout = vscode.workspace.getConfiguration('markdown-pdf')['StatusbarMessageTimeout'];

  vscode.window.showInformationMessage('[Markdown PDF] Installing Puppeteer ...');
  var statusbarmessage = vscode.window.setStatusBarMessage('$(markdown) Installing Puppeteer ...');

  // proxy setting
  setProxy();

  // download check
  const puppeteer = require('puppeteer');
  const browserFetcher = puppeteer.createBrowserFetcher();
  const revision = require(path.join(__dirname, 'node_modules', 'puppeteer', 'package.json')).puppeteer.chromium_revision;
  browserFetcher.canDownload(revision)
    .then(function (r) {
      if (r) {
        puppeteer_installer(statusbarmessage);
          return;
    } else {
        statusbarmessage.dispose();
        vscode.window.setStatusBarMessage('$(markdown) ERROR: Failed to download Chromium!', StatusbarMessageTimeout);
        vscode.window.showErrorMessage('ERROR: Failed to download Chromium! If you are behind a proxy, set the http.proxy option to settings.json and restart Visual Studio Code.');
        return;
      }
    });
}

/*
 * puppeteer install.js
 * https://github.com/GoogleChrome/puppeteer/blob/master/install.js
 */
function puppeteer_installer(statusbarmessage) {
  var StatusbarMessageTimeout = vscode.workspace.getConfiguration('markdown-pdf')['StatusbarMessageTimeout'];
  const puppeteer = require('puppeteer');
  const browserFetcher = puppeteer.createBrowserFetcher();
  const revision = require(path.join(__dirname, 'node_modules', 'puppeteer', 'package.json')).puppeteer.chromium_revision;
  const revisionInfo = browserFetcher.revisionInfo(revision);
  
  browserFetcher.download(revisionInfo.revision)
      .then(() => browserFetcher.localRevisions())
      .then(onSuccess)
      .catch(onError);
  
  function onSuccess(localRevisions) {
    console.log('Chromium downloaded to ' + revisionInfo.folderPath);
    localRevisions = localRevisions.filter(revision => revision !== revisionInfo.revision);
    // Remove previous chromium revisions.
    const cleanupOldVersions = localRevisions.map(revision => browserFetcher.remove(revision));

    if (checkPuppeteerBinary()) {
      statusbarmessage.dispose();
      vscode.window.setStatusBarMessage('$(markdown) Puppeteer installation succeeded.', StatusbarMessageTimeout);
      vscode.window.showInformationMessage('[Markdown PDF:2] Puppeteer installation succeeded.');
      return Promise.all(cleanupOldVersions);
    }
  }
  
  function onError(error) {
    console.error(`ERROR: Failed to download Chromium r${revision}!`);
    statusbarmessage.dispose();
    vscode.window.setStatusBarMessage('$(markdown) ERROR: Failed to download Chromium!', StatusbarMessageTimeout);
    vscode.window.showErrorMessage('ERROR: Failed to download Chromium!');
    vscode.window.showErrorMessage(error);
    console.error(error);
    process.exit(1);
  } 
}

function setProxy() {
  var https_proxy = vscode.workspace.getConfiguration('http')['proxy'] || '';
  if (https_proxy) {
    process.env.HTTPS_PROXY = https_proxy;
    process.env.HTTP_PROXY = https_proxy;
  }
}

function init() {
  if (!checkPuppeteerBinary()) {
    installPuppeteerBinary();
  }
}
