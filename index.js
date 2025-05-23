/**
 * Cloudflare Worker 图片上传服务
 * 接收 JSON 格式的 base64 编码图片，上传到 R2 存储桶，并返回图片链接
 */

export default {
  async fetch(request, env, ctx) {
    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('只接受 POST 请求', { status: 405 });
    }

    try {
      // 获取请求体内容并解析 JSON
      const contentType = request.headers.get('content-type') || '';
      
      if (!contentType.includes('application/json')) {
        return new Response(JSON.stringify({
          success: false,
          message: '请求头必须包含 Content-Type: application/json'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // 解析 JSON 请求体
      let jsonData;
      try {
        jsonData = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({
          success: false,
          message: '无效的 JSON 格式'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // 支持嵌套的 img 对象
      if (jsonData.img) {
        jsonData = jsonData.img;
      }
      
      // 检查 JSON 中是否包含必要字段
      if (!jsonData || !jsonData.imageData) {
        return new Response(JSON.stringify({
          success: false,
          message: 'JSON 必须包含 imageData 字段'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // 获取图片类型，默认为 jpeg
      const imageType = jsonData.imageType || 'jpeg';
      // 清理 base64 字符串中的换行符和空格
      const imageData = jsonData.imageData.replace(/[\r\n\s]/g, '');
      
      // 验证 base64 数据是否有效 (修改后的验证方法)
      if (!isValidBase64(imageData)) {
        return new Response(JSON.stringify({
          success: false,
          message: '请提供有效的 base64 编码数据'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // 生成唯一的文件名
      const fileName = generateUniqueFileName(imageType);
      
      // 将 base64 解码为二进制数据
      const binaryData = base64ToArrayBuffer(imageData);
      
      // 上传到 R2 存储桶
      await env.MY_BUCKET.put(fileName, binaryData, {
        httpMetadata: {
          contentType: `image/${imageType}`,
        },
      });
      
      // 构建图片 URL
      const imageUrl = `${env.PUBLIC_URL}/${fileName}`;
      
      // 返回成功响应
      return new Response(JSON.stringify({
        success: true,
        url: imageUrl,
        message: '图片上传成功'
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // 处理错误
      console.error('上传过程中出错:', error);
      return new Response(JSON.stringify({
        success: false,
        message: '上传失败: ' + error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
};

/**
 * 检查字符串是否为有效的 base64 编码
 */
function isValidBase64(str) {
  try {
    // 检查是否为有效的 base64 字符串
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(str);
  } catch (e) {
    return false;
  }
}

/**
 * 生成唯一的文件名
 */
function generateUniqueFileName(imageType) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomString}.${imageType}`;
}

/**
 * 将 base64 字符串转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}