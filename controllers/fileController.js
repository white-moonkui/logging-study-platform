const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/File');
const Organization = require('../models/Organization');
const { createReadStream } = require('fs');

// 配置文件存储
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()  }-${  Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname  }-${  uniqueSuffix  }${ext}`);
    },
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB 限制
    },
});

class FileController {
    // 获取文件类型
    static getFileType(mimetype) {
        if (mimetype.startsWith('video/')) {return 'video';}
        if (mimetype === 'application/pdf') {return 'pdf';}
        if (mimetype.includes('word')) {return 'word';}
        if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {return 'excel';}
        if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) {return 'ppt';}
        if (mimetype.startsWith('image/')) {return 'image';}
        return 'other';
    }

    // 计算文件校验和
    static calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(filePath);

            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    // 上传文件
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: '没有上传文件' });
            }

            const file = req.file;
            const { organizationId } = req.body;
            const userId = req.user._id;

            // 检查单位存储配额
            const org = await Organization.findById(organizationId);
            if (!org) {
                return res.status(404).json({ message: '单位不存在' });
            }

            if (org.stats.storageUsed + file.size > org.config.storageQuota) {
                fs.unlinkSync(file.path);
                return res.status(400).json({ message: '存储空间不足' });
            }

            // 确定存储方式
            const sizeThreshold = 10 * 1024 * 1024; // 10MB
            const storageType = file.size > sizeThreshold ? 'local' : 'gridfs';

            // 生成唯一文件名
            const ext = path.extname(file.originalname);
            const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

            let localPath = null;
            let gridfsId = null;

            if (storageType === 'local') {
                // 大文件存储到本地
                const targetDir = path.join(__dirname, '../../uploads/files', organizationId);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                localPath = path.join('files', organizationId, uniqueName);
                const targetPath = path.join(__dirname, '../../uploads', localPath);

                fs.renameSync(file.path, targetPath);
            } else {
                // 小文件存储到 GridFS
                const conn = req.app.locals.dbConnection;
                const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'uploads',
                });

                const uploadStream = bucket.openUploadStream(uniqueName, {
                    metadata: {
                        originalName: file.originalname,
                        uploadedBy: userId,
                        organizationId,
                    },
                });

                const readStream = createReadStream(file.path);
                await new Promise((resolve, reject) => {
                    readStream
                        .pipe(uploadStream)
                        .on('error', reject)
                        .on('finish', () => {
                            gridfsId = uploadStream.id;
                            resolve();
                        });
                });

                fs.unlinkSync(file.path);
            }

            // 计算校验和
            const filePath =
                storageType === 'local'
                    ? path.join(__dirname, '../../uploads', localPath)
                    : file.path;
            const checksum = await FileController.calculateChecksum(filePath);

            // 检查重复文件
            const existingFile = await File.findOne({ checksum });
            if (existingFile) {
                // 删除重复文件
                if (storageType === 'local' && localPath) {
                    fs.unlinkSync(path.join(__dirname, '../../uploads', localPath));
                }
                return res.json({
                    message: '文件已存在',
                    file: existingFile,
                });
            }

            // 保存文件记录
            const fileRecord = await File.create({
                originalName: file.originalname,
                fileName: uniqueName,
                storageType,
                gridfsId,
                localPath,
                mimeType: file.mimetype,
                size: file.size,
                extension: ext.substring(1),
                type: FileController.getFileType(file.mimetype),
                checksum,
                uploadedBy: userId,
                organizationId,
            });

            // 更新单位存储统计
            org.stats.storageUsed += file.size;
            await org.save();

            res.json({
                message: '上传成功',
                file: fileRecord,
            });
        } catch (error) {
            console.error('文件上传错误:', error);
            // 清理临时文件
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: '上传失败', error: error.message });
        }
    }

    // 流式播放视频
    static async stream(req, res) {
        try {
            const { id } = req.params;
            const file = await File.findById(id);

            if (!file) {
                return res.status(404).json({ message: '文件不存在' });
            }

            // 检查权限
            if (!(await FileController.checkPermission(req.user, file))) {
                return res.status(403).json({ message: '无权访问' });
            }

            if (file.storageType === 'local') {
                const filePath = path.join(__dirname, '../../uploads', file.localPath);

                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({ message: '文件不存在' });
                }

                const stat = fs.statSync(filePath);
                const fileSize = stat.size;
                const range = req.headers.range;

                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = end - start + 1;

                    res.writeHead(206, {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': file.mimeType,
                    });

                    fs.createReadStream(filePath, { start, end }).pipe(res);
                } else {
                    res.writeHead(200, {
                        'Content-Length': fileSize,
                        'Content-Type': file.mimeType,
                    });

                    fs.createReadStream(filePath).pipe(res);
                }
            } else {
                // GridFS 流式传输
                const conn = req.app.locals.dbConnection;
                const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'uploads',
                });

                const downloadStream = bucket.openDownloadStream(file.gridfsId);

                res.set('Content-Type', file.mimeType);
                downloadStream.pipe(res);
            }

            // 更新访问统计
            await file.incrementView();
        } catch (error) {
            console.error('文件流式传输错误:', error);
            res.status(500).json({ message: '传输失败', error: error.message });
        }
    }

    // 获取文件预览URL
    static async preview(req, res) {
        try {
            const { id } = req.params;
            const file = await File.findById(id);

            if (!file) {
                return res.status(404).json({ message: '文件不存在' });
            }

            // 检查权限
            if (!(await FileController.checkPermission(req.user, file))) {
                return res.status(403).json({ message: '无权访问' });
            }

            let previewUrl;

            if (file.type === 'video') {
                previewUrl = `/api/files/${id}/stream`;
            } else if (file.type === 'pdf') {
                previewUrl = `/api/files/${id}/stream`;
            } else if (['word', 'excel', 'ppt'].includes(file.type)) {
                // Office Online 预览
                const fileUrl = `${req.protocol}://${req.get('host')}/api/files/${id}/download?token=${req.token}`;
                previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
            } else {
                previewUrl = `/api/files/${id}/download`;
            }

            res.json({
                file,
                previewUrl,
            });
        } catch (error) {
            console.error('获取预览错误:', error);
            res.status(500).json({ message: '获取预览失败', error: error.message });
        }
    }

    // 下载文件
    static async download(req, res) {
        try {
            const { id } = req.params;
            const file = await File.findById(id);

            if (!file) {
                return res.status(404).json({ message: '文件不存在' });
            }

            // 检查权限
            if (!(await FileController.checkPermission(req.user, file))) {
                return res.status(403).json({ message: '无权访问' });
            }

            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(file.originalName)}"`
            );

            if (file.storageType === 'local') {
                const filePath = path.join(__dirname, '../../uploads', file.localPath);
                res.sendFile(filePath);
            } else {
                const conn = req.app.locals.dbConnection;
                const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'uploads',
                });

                const downloadStream = bucket.openDownloadStream(file.gridfsId);
                downloadStream.pipe(res);
            }
        } catch (error) {
            console.error('文件下载错误:', error);
            res.status(500).json({ message: '下载失败', error: error.message });
        }
    }

    // 删除文件
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const file = await File.findById(id);

            if (!file) {
                return res.status(404).json({ message: '文件不存在' });
            }

            // 检查权限（只有上传者或管理员可以删除）
            if (!file.uploadedBy.equals(req.user._id) && req.user.role !== 'admin') {
                return res.status(403).json({ message: '无权删除' });
            }

            // 删除物理文件
            if (file.storageType === 'local') {
                const filePath = path.join(__dirname, '../../uploads', file.localPath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } else {
                const conn = req.app.locals.dbConnection;
                const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'uploads',
                });
                await bucket.delete(file.gridfsId);
            }

            // 更新单位存储统计
            const org = await Organization.findById(file.organizationId);
            if (org) {
                org.stats.storageUsed = Math.max(0, org.stats.storageUsed - file.size);
                await org.save();
            }

            // 删除记录
            await file.deleteOne();

            res.json({ message: '删除成功' });
        } catch (error) {
            console.error('删除文件错误:', error);
            res.status(500).json({ message: '删除失败', error: error.message });
        }
    }

    // 检查权限
    static async checkPermission(user, file) {
        // 管理员有所有权限
        if (user.role === 'admin') {return true;}

        // 同单位用户可以访问
        return user.organization?.unitId?.toString() === file.organizationId.toString();
    }

    // 获取上传中间件
    static getUploadMiddleware() {
        return upload.single('file');
    }
}

module.exports = FileController;
