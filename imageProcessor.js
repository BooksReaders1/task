// imageProcessor.js - 图片处理工具，用于降低图片清晰度以加快预览渲染速度

/**
 * 将图片降低清晰度处理（仅适用于同源或支持 CORS 的图片）
 * @param {string} imageUrl - 原始图片 URL
 * @param {number} quality - 输出质量 (0.1 - 1.0)，默认 0.5
 * @param {number} scale - 缩放比例 (0.1 - 1.0)，默认 0.5
 * @returns {Promise<string>} - 返回处理后的 base64 数据 URL
 */
async function reduceImageQuality(imageUrl, quality = 0.5, scale = 0.5) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // 尝试设置 crossOrigin，如果服务器支持 CORS 则可以处理
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算缩小后的尺寸
                const newWidth = Math.max(1, Math.floor(img.width * scale));
                const newHeight = Math.max(1, Math.floor(img.height * scale));
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // 设置图像平滑处理
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'low';
                
                // 绘制缩小后的图像
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // 导出为 JPEG 格式，应用质量压缩
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            } catch (error) {
                // Canvas 被污染或其他错误，直接拒绝，调用方会使用原图
                console.warn('Canvas 处理失败（可能是跨域限制）:', error.message || error);
                reject(error);
            }
        };
        
        img.onerror = (error) => {
            const errorMsg = error instanceof Error ? error.message : String(error);
            reject(new Error(`Image load failed for ${imageUrl}: ${errorMsg}`));
        };
        
        img.src = imageUrl;
    });
}

/**
 * 为 Pixiv 类型图片创建低清晰度预览
 * 如果 Canvas 处理失败（跨域），则返回原 URL
 * @param {string} imageUrl - 原始图片 URL
 * @returns {Promise<string>} - 返回处理后的 base64 数据 URL 或原 URL
 */
async function createPixivPreview(imageUrl) {
    try {
        // Pixiv 图片通常较大，使用较低的质量和缩放比例
        return await reduceImageQuality(imageUrl, 0.4, 0.4);
    } catch (error) {
        // 如果处理失败（如跨域），返回原 URL
        console.log('Pixiv 图片无法压缩（跨域限制），使用原图');
        return imageUrl;
    }
}

/**
 * 为 JM 类型图片创建预览（不降低质量）
 * @param {string} imageUrl - 原始图片 URL
 * @returns {Promise<string>} - 返回原始 URL（JM 不需要处理）
 */
function createJmPreview(imageUrl) {
    // JM 类型不需要降低清晰度，直接返回原 URL
    return Promise.resolve(imageUrl);
}

/**
 * 根据来源类型处理图片预览
 * @param {string} imageUrl - 原始图片 URL
 * @param {string} sourceType - 来源类型 ('pixiv' | 'jm' | 'other')
 * @returns {Promise<string>} - 返回处理后的图片 URL 或 base64
 */
async function processPreviewImage(imageUrl, sourceType) {
    if (sourceType === 'pixiv') {
        return createPixivPreview(imageUrl);
    } else {
        // JM 和其他类型直接返回原 URL
        return createJmPreview(imageUrl);
    }
}
