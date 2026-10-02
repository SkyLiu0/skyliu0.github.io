# Tianhao Liu · Academic Homepage

这是一个使用原生 HTML、CSS 和 JavaScript 构建的 GitHub Pages 学术主页。页面内容主要由 `src/data/` 下的 JSON 文件驱动，日常更新论文、个人信息和链接时通常不需要修改 HTML。

## 目录结构

```text
index.html              页面结构和少量静态文案
css/reset.css           样式重置
css/site.css            页面样式、主题和响应式布局
js/content.js           JSON 加载、渲染和交互逻辑
src/data/about.json     About 区域、联系方式和社交链接
src/data/research.json  Research 介绍和研究方向
src/data/publications.json 论文列表
img/                    肖像和社交图标
```

## 本地预览

在项目根目录运行一个静态服务器：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。直接双击 `index.html` 可能导致浏览器阻止 JSON 的 `fetch` 请求，因此建议使用静态服务器。

## `about.json`

### 常用字段

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `name` | string | 姓名 |
| `initials` | string | 顶栏缩写 |
| `role` | string | About 顶部职位 |
| `headline` | array | 主标题，目前会拼接数组中的文字 |
| `bio` | string | 自我介绍 |
| `affiliation` | array | affiliation 的多行内容 |
| `location` | string | 所在地 |
| `email` | string | 邮箱主数据源 |
| `portrait` | string | 肖像图片路径 |
| `links` | object | 社交链接 URL |
| `previousVisit` | string | 访问经历 |
| `advisors` | array | 导师信息，当前暂未显示 |
| `keywords` | array | 关键词，当前暂未显示 |
| `quickFacts` | array | About 下方的快速信息 |
| `profileIcons` | array | Contact 区域的社交图标和链接 |

### `quickFacts`

每项必须有 `label`，内容可以直接写在 `value` 中，也可以用 `key` 引用 `about.json` 顶层字段。两者不要同时使用。

```json
"quickFacts": [
  {
    "label": "Based in",
    "key": "location"
  },
  {
    "label": "Research",
    "key": "researchInterests"
  },
  {
    "label": "Email",
    "key": "email",
    "hrefPrefix": "mailto:"
  },
  {
    "label": "Availability",
    "value": "Open to collaboration"
  }
]
```

- `key`：读取已有字段，例如 `location`、`email`。
- `value`：直接写显示内容。
- `href`：直接把这一项变成链接。
- `hrefPrefix`：和 `key` 一起使用，根据字段值自动生成链接，例如 `mailto:`。

### `profileIcons`

每项需要 `label` 和 `icon`。链接可以用 `key` 引用 `links`，也可以直接使用 `url`。

```json
"profileIcons": [
  {
    "key": "scholar",
    "label": "Google Scholar",
    "icon": "img/icons/google-scholar.svg"
  },
  {
    "url": "https://example.com",
    "label": "Personal site",
    "icon": "img/icons/personal.svg"
  }
]
```

- 有 `url` 时优先使用 `url`。
- 没有 `url` 时使用 `links[key]`。
- `icon` 可以填写仓库中的 SVG 或其他图片路径。

### `authorHighlight`

用于控制论文作者列表中的自动加粗：

```json
"authorHighlight": {
  "enabled": true,
  "names": ["Tianhao Liu", "Tianhao L."]
}
```

- `names`：可能出现在论文作者列表中的姓名变体。
- `enabled: false`：关闭自动作者加粗。
- 不填写 `authorHighlight` 时，默认使用顶层的 `name`。
- 论文作者字段中手写 `**作者名**` 时，会直接手动加粗。

### 文本格式

通过 JavaScript 动态渲染的文本支持：

```text
**加粗**
*斜体*
<i>斜体</i>
```

例如：

```json
"bio": "My research focuses on **linear programming** and *optimization*."
```

JSON 中需要换行时使用 `\n`，空一行使用 `\n\n`。

## `research.json`

```json
{
  "_template": {
    "intro": "A short description of your research focus.",
    "number": "01",
    "title": "Research topic"
  },
  "intro": "My research mainly focuses on **linear programming algorithms**.",
  "items": [
    {
      "number": "01",
      "title": "Linear programming"
    }
  ]
}
```

- `intro`：Research 区域的介绍段落。
- `items`：研究方向列表。
- `title` 支持 `**加粗**` 和 `*斜体*`。

## `publications.json`

论文放在 `items` 数组中，按希望展示的时间倒序排列。每条记录支持以下字段：

```json
{
  "year": "2026",
  "type": "Preprint",
  "title": "Paper title",
  "authors": "Author One, Tianhao Liu, Author Two",
  "venue": "arXiv preprint",
  "links": [
    {
      "label": "arXiv",
      "url": "https://arxiv.org/abs/0000.00000"
    }
  ]
}
```

字段缺失时会显示为空，空对象 `{}` 也会被接受为一条空白记录，不会让整个列表停止渲染。

论文显示数量由 `js/content.js` 顶部两个变量控制：

```js
const DEFAULT_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;
```

- 初始显示 `DEFAULT_VISIBLE_COUNT` 篇；
- 每次点击 `Show more` 增加 `LOAD_MORE_COUNT` 篇；
- 全部显示后按钮变为 `Show less`；
- 点击 `Show less` 回到默认数量；
- DOM 只渲染当前需要显示的论文。

## GitHub Pages 部署

1. 将项目推送到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择包含 `index.html` 的分支和根目录 `/ (root)`。
5. 保存后访问 GitHub 提供的 Pages 地址。

GitHub 仓库主页会显示 `README.md`，而 GitHub Pages 网站会使用 `index.html`。

## 更新建议

- 修改个人资料：编辑 `src/data/about.json`。
- 修改研究介绍和方向：编辑 `src/data/research.json`。
- 添加论文：编辑 `src/data/publications.json`。
- 新增社交平台：在 `about.json` 的 `links` 和 `profileIcons` 中添加对应数据。
- 修改显示数量：编辑 `js/content.js` 顶部的两个分页变量。
- 只有需要改变页面结构或交互方式时，才需要修改 `index.html`、`css/site.css` 或 `js/content.js`。
