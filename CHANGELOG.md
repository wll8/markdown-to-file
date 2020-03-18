# Change Log

## 1.4.4 (2020/03/19)
* Change: mermaid javascript reads from URL instead of from local file
  * Add: `markdown-pdf.mermaidServer` option
  * add an option to disable mermaid [#175](https://github.com/yzane/vscode-markdown-pdf/issues/175)
* Add: `markdown-pdf.plantumlServer` option
  * support configuration of plantUML server [#139](https://github.com/yzane/vscode-markdown-pdf/issues/139)
* Add: configuration scope
  * extend setting 'headerTemplate' with scope\.\.\. [#184](https://github.com/yzane/vscode-markdown-pdf/pull/184)
* Update: [slug](https://github.com/yzane/vscode-markdown-pdf/commit/3f4aeaa724999c46fc37423d4b188fd7ce72ffce) for markdown-it-named-headers
* Update: markdown.css, markdown-pdf.css
* Update: dependent packages
* Fix: Fix for issue \#186 [#187](https://github.com/yzane/vscode-markdown-pdf/pull/187)
* Fix: move the Meiryo font to the end of the font-family setting
  * Meiryo font causing \\ to show as ¥ [#83](https://github.com/yzane/vscode-markdown-pdf/issues/83)
  * Backslash false encoded [#124](https://github.com/yzane/vscode-markdown-pdf/issues/124)
  * Errors in which 한글\(korean word\) is not properly printed [#148](https://github.com/yzane/vscode-markdown-pdf/issues/148)
* Fix: Improve the configuration schema of package.json
    * Some settings can now be set from the settings editor.

## 1.4.3 (2020/03/12)
* Fix: markdown-include regular expression
    * Fix: Unable to export to pdf from markdown [#166](https://github.com/yzane/vscode-markdown-pdf/issues/166)
    * Fix: python code export err [#178](https://github.com/yzane/vscode-markdown-pdf/issues/178)
* Fix: Add support for Ubuntu and Centos
    * Fix: Error: Failed to lanuch chrome! [#97](https://github.com/yzane/vscode-markdown-pdf/issues/97)
    * Fix: I failed to launch chrome in WSL [#160](https://github.com/yzane/vscode-markdown-pdf/issues/160)
    * Fix: Unable to export to pdf from markdown [#166](https://github.com/yzane/vscode-markdown-pdf/issues/166)

## 1.4.2 (2020/02/16)
* Add: Support [gray-matter](https://github.com/jonschlinkert/gray-matter) (preview)
    * Avoid to display front matter [#157](https://github.com/yzane/vscode-markdown-pdf/pull/157)
    * Currently, only some settings can be specified.
* Fix: Improve the configuration schema of package.json
    * Some settings can now be set from the settings editor.
* Fix: Specifying custom style sheets with a relative path does not work [#170](https://github.com/yzane/vscode-markdown-pdf/pull/170)
* Fix: Pass language to markdown-pdf puppeteer [#172](https://github.com/yzane/vscode-markdown-pdf/pull/172)
    * Date Format [#95](https://github.com/yzane/vscode-markdown-pdf/issues/95)
* Improve: Reduce Regex strictness of markdown-it-include [#174](https://github.com/yzane/vscode-markdown-pdf/pull/174)

## 1.4.1 (2019/10/28)
* Fix: "ReferenceError: MarkdownPdf is not defined" on auto create PDF on save in VSCodium [#156](https://github.com/yzane/vscode-markdown-pdf/issues/156)

## 1.4.0 (2019/10/27)
* Add: Support [mermaid](https://github.com/knsv/mermaid)
    * Added mermaid support. [#144](https://github.com/yzane/vscode-markdown-pdf/pull/144)

## 1.3.1 (2019/09/30)
* Update: README
* Update: CHANGELOG

## 1.3.0 (2019/09/30)
* Add: Support [markdown-it-include](https://github.com/camelaissani/markdown-it-include)
    * Integrate markdown-it-include plugin [#138](https://github.com/yzane/vscode-markdown-pdf/pull/138)
    * Add: `markdown-pdf.markdown-it-include.enable` option
* Update: README

## 1.2.1 (2019/09/23)
* Fix: fix typo, grammar [#122](https://github.com/yzane/vscode-markdown-pdf/pull/122)
* Add: Option to specify the plantuml delimiter [#104](https://github.com/yzane/vscode-markdown-pdf/pull/104)
* Update: dependencies packages
* Update: README
   * Delete the description of the obsolete options.

## 1.2.0 (2018/05/03)
* Add: Support [markdown-it-plantuml](https://github.com/gmunguia/markdown-it-plantuml)
    * Support for lightweight diagrams (PlantUML) [#60](https://github.com/yzane/vscode-markdown-pdf/issues/60)

## 1.1.0 (2018/05/03)
* Add: Support [markdown-it-container](https://github.com/markdown-it/markdown-it-container) [#72](https://github.com/yzane/vscode-markdown-pdf/issues/72)

## 1.0.5 (2018/05/03)
* Improve: Exception handling
* Improve: Chromium install check
* Add: Page break
    * Is it possible to insert page breaks? [#25](https://github.com/yzane/vscode-markdown-pdf/issues/25)
* Update: README
    * FAQ: Page break
* Update: markdown-pdf.css
    * Add: Meiryo to font-family

## 1.0.4 (2018/05/01)
* Fix: Display error message when downloading Chromium
* Improve: Chromium install. Display download progress on status bar

## 1.0.3 (2018/04/30)
* Fix: Support [Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces) with `markdown-pdf.styles` option
    * Japanese font is not good [#79](https://github.com/yzane/vscode-markdown-pdf/issues/79)
    * relative stylesheet paths are not working when multiple folders in workspace [#68](https://github.com/yzane/vscode-markdown-pdf/issues/68)
* Fix: `markdown-pdf.styles` option
    * [BUG] Custom PDF style not being used [#35](https://github.com/yzane/vscode-markdown-pdf/issues/35)
    * How to change font size of generated pdf [#40](https://github.com/yzane/vscode-markdown-pdf/issues/40)
    * How do you change font-family? [#64](https://github.com/yzane/vscode-markdown-pdf/issues/64)

* Improve: Support [Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces) with `markdown-pdf.outputDirectory` option
    * How do I specify a relative output directory? [#29](https://github.com/yzane/vscode-markdown-pdf/issues/29)

* Fix: File encoding
    * Not correctly rendering Windows 1252 encoding [#39](https://github.com/yzane/vscode-markdown-pdf/issues/39)
    * First H1 header not recognized if file starts with UTF-8 BOM [#44](https://github.com/yzane/vscode-markdown-pdf/issues/44)

* Fix: Can not convert pdf [#76](https://github.com/yzane/vscode-markdown-pdf/issues/76)

* Add: `markdown-pdf.outputDirectoryRelativePathFile` option
* Add: `markdown-pdf.stylesRelativePathFile` option

## 1.0.2 (2018/04/24)
* Improve: puppeteer install [#76](https://github.com/yzane/vscode-markdown-pdf/issues/76), [#77](https://github.com/yzane/vscode-markdown-pdf/issues/77)

## 1.0.1 (2018/04/21)
* Add: Allow online (https) CSS in `markdown-pdf.styles` [#67](https://github.com/yzane/vscode-markdown-pdf/issues/67)

## 1.0.0 (2018/04/15)
* Change: Replace pdf converter with puppeteer instead of html-pdf
* Add: Support multiple types in markdown-pdf.type option
    * Add: Define Multiple outputformats [#20](https://github.com/yzane/vscode-markdown-pdf/issues/20)
* Add: Support markdown-it-named-headers
    * Fix: TOC extension not working on Convert Markdown to PDF [#31](https://github.com/yzane/vscode-markdown-pdf/issues/31)
* Add: Increase menu items (pdf, html, png, jpeg)
* Update: dependencies packages

## 0.1.8 (2018/03/22)
* Add: markdown-pdf.includeDefaultStyles option [#49](https://github.com/yzane/vscode-markdown-pdf/issues/49)
* Fix: Inline code blocks do not use a proportional font [#26](https://github.com/yzane/vscode-markdown-pdf/issues/26)
* Update: dependencies packages

## 0.1.7 (2017/04/05)
* Change: Display completion message on status bar [#19](https://github.com/yzane/vscode-markdown-pdf/issues/19)
* Add: markdown-pdf.convertOnSaveExclude option [#16](https://github.com/yzane/vscode-markdown-pdf/issues/16)
* Fix: broken code-blocks [#18](https://github.com/yzane/vscode-markdown-pdf/pull/18)
* Fix: Image path error [#14](https://github.com/yzane/vscode-markdown-pdf/issues/14)
* Update: [markdown.css](https://github.com/Microsoft/vscode/blob/master/extensions/markdown/media/markdown.css) of the vscode
* Update: dependencies packages

## 0.1.6 (2017/02/05)
* Fix: Relative path error of markdown-pdf.styles [#9](https://github.com/yzane/vscode-markdown-pdf/issues/9)
* Fix: Output file is not created [#10](https://github.com/yzane/vscode-markdown-pdf/issues/10)
* Add: markdown-pdf.outputDirectory option

## 0.1.5 (2017/01/09)

* Add: Support for relative path in markdown-pdf.styles option [#5](https://github.com/yzane/vscode-markdown-pdf/issues/5)
* Fix: ERROR: phantomjs binary does not exist [#2](https://github.com/yzane/vscode-markdown-pdf/issues/2)
* Update: README
* Add: CHANGELOG
* Update: dependencies packages

## 0.1.4 (2016/09/19)

* Add: markdown-pdf.convertOnSave option

## 0.1.3 (2016/08/29)

* Fix: Color of the inline code (`)

## 0.1.2 (2016/08/20)

* Add: Ability to convert markdown file from editor context
* Update: README

## 0.1.1 (2016/08/16)

* Add: Japanese README

## 0.1.0 (2016/08/14)

* Initial release.
