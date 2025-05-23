# Cloudflare Worker 图片上传服务

这是一个基于 Cloudflare Worker 的图片上传服务，可以接收 base64 编码的图片，将其上传到 Cloudflare R2 存储桶中，并返回可访问的图片链接，在用量不大时是完全免费的！

## 功能特点

- 接收 JSON 格式的 base64 编码图片
- 支持多种图片格式（JPEG、PNG、GIF、WebP 等）
- 自动生成唯一文件名
- 返回可直接访问的图片链接
- 支持苹果快捷指令等客户端工具

## 部署指南

### 前提条件

1. 拥有 Cloudflare 账户  
2. 已创建 Cloudflare R2 存储桶（github和bing上教程太多了，这里就不一一说明了）  
3. 安装 Wrangler CLI 工具  

### 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 登录到 Cloudflare 账户

```bash
wrangler login
```

### 配置 wrangler.toml

修改项目根目录下的 `wrangler.toml` 文件：

```toml
name = "image-uploader"
main = "index.js"
compatibility_date = "2025-01-01"

# 配置 R2 存储桶
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "your-bucket-name"  # 替换为您的 R2 存储桶名称

# 环境变量
[vars]
PUBLIC_URL = "https://your-bucket-public-url"  # 替换为您的 R2 存储桶公共访问 URL
```

请确保将 `bucket_name` 替换为您实际创建的 R2 存储桶名称，并将 `PUBLIC_URL` 替换为您的 R2 存储桶公共访问 URL。

### 部署 Worker

```bash
wrangler deploy
```

## 使用方法

### API 接口

- **URL**: 您的 Worker URL（部署后获得）
- **方法**: POST
- **请求头**: 
  ```
  Content-Type: application/json
  ```
- **请求体**:
  ```json
  {
    "imageType": "jpeg",
    "imageData": "base64编码的图片数据"
  }
  ```
  
  或者使用嵌套格式：
  
  ```json
  {
    "img": {
      "imageType": "jpeg",
      "imageData": "base64编码的图片数据"
    }
  }
  ```

- **参数说明**:
  - `imageType`: 图片类型（如 jpeg, png, gif 等），如果未提供则默认为 jpeg
  - `imageData`: base64 编码的图片数据（不包含 `data:image/xxx;base64,` 前缀）

- **响应**:
  ```json
  {
    "success": true,
    "url": "https://your-bucket-public-url/timestamp-randomstring.jpeg",
    "message": "图片上传成功"
  }
  ```

### 在苹果快捷指令中使用

1. 创建新的快捷指令
2. 添加"选取照片"操作
3. 添加"编码媒体"操作，设置编码格式为"Base64"
4. 最好添加一个调整图片大小的操作，以减少图片大小。
5. 添加"获取网页内容"操作：
   - URL: 您的 Worker URL
   - 方法: POST
   - 请求头部: Content-Type: application/json
   - 请求正文: JSON 格式，包含以下字段：
     ```json
     {
       "imageType": "jpeg",
       "imageData": "{{输入}}"
     }
     ```
6. 添加"获取词典中的值"操作，提取响应中的 URL
7. 添加"显示结果"或"复制到剪贴板"操作

### 在其他客户端中使用

#### cURL

```bash
curl -X POST https://your-worker-url.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"imageType":"jpeg","imageData":"base64编码的图片数据"}'
```

#### JavaScript

```javascript
const imageData = 'base64编码的图片数据';

fetch('https://your-worker-url.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageType: 'jpeg',
    imageData: imageData
  })
})
.then(response => response.json())
.then(data => console.log(data.url))
.catch(error => console.error('Error:', error));
```

#### Python

```python
import requests
import json

image_data = 'base64编码的图片数据'

response = requests.post(
    'https://your-worker-url.workers.dev',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({
        'imageType': 'jpeg',
        'imageData': image_data
    })
)

print(response.json()['url'])
```

## 注意事项

1. 对于大图片，建议在客户端进行压缩后再上传，以避免超出 Cloudflare Worker 的处理限制
2. 确保您的 R2 存储桶已正确配置公共访问权限
3. 为了增强安全性，您可能需要添加身份验证机制
4. 如果 base64 字符串包含换行符（如苹果设备生成的），服务会自动清理，但是最好不要有此类内容


## 贡献

欢迎通过 Issues 和 Pull Requests 提供反馈和改进建议。

## 联系方式

如有问题，请通过 GitHub Issues 联系我们。

        