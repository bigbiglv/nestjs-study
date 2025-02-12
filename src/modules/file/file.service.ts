import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** 文件保存路径 */
const FILE_DIR = path.join(process.cwd(), 'files/upload');

@Injectable()
export class FileService {
  /** 合并文件切片 */
  mergeChunks(chunksDir: string, total: number, outputPath: string = FILE_DIR) {
    if (!fs.existsSync(chunksDir)) throw new Error('文件切片目录不存在');
    try {
      const fileName = path.basename(chunksDir);
      const writeStream = fs.createWriteStream(path.join(outputPath, fileName));

      for (let i = 0; i < total - 1; i++) {
        const chunkPath = path.join(chunksDir, String(i));
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
      }

      writeStream.end();

      // 删除临时分片目录
      fs.rmSync(chunksDir, { recursive: true, force: true });

      return { message: '文件合并成功', data: outputPath };
    } catch (error) {
      throw new Error(`文件合并失败: ${error}`);
    }
  }

  /** 保存切片文件 */
  saveChunk({
    file,
    index,
    total,
    fileName,
  }: {
    file: Express.Multer.File;
    index: string;
    total: string;
    fileName: string;
  }) {
    const { buffer } = file;
    const chunksPath = path.join(
      process.cwd(),
      'files/upload/chunk/',
      fileName,
    );
    // 确保文件夹存在
    if (!fs.existsSync(chunksPath)) {
      fs.mkdirSync(chunksPath, { recursive: true });
    }
    // 修改文件名为下标并保存文件
    const filePath = path.join(chunksPath, String(index));
    fs.writeFileSync(filePath, buffer);
    // 校验分片数
    const missChunks = this.checkChunks(chunksPath, Number(total));
    if (missChunks.length) return { message: 'ok', data: missChunks };
    // 合并
    return this.mergeChunks(chunksPath, Number(total));
  }

  /** 校验切片数量 */
  checkChunks(chunkDir: string, chunkLength: number) {
    const files = fs.readdirSync(chunkDir);
    const chunkFiles = files
      .filter((file) => {
        const index = parseInt(path.basename(file), 10);
        return !isNaN(index); // 只保留文件名是数字的切片文件
      })
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10)); // 排序确保下标顺序
    const missChunks = [];
    for (let i = 0; i < chunkLength - 1; i++) {
      const chunkName = Number(chunkFiles[i]);
      if (Number.isNaN(chunkName) || chunkName !== i) missChunks.push(i);
    }
    return missChunks;
  }

  /** 保存文件 */
  saveFile(
    file: Express.Multer.File,
    uploadDir: string = FILE_DIR,
  ): { fileName: string; size: number } {
    const { originalname, buffer, size } = file;
    // 解决中文文件名乱码
    const fileName = Buffer.from(originalname, 'latin1').toString('utf8');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // 保存文件到指定路径
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return { fileName, size };
  }

  getFileStream(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    return {
      stats,
      fileStream,
      fileName,
    };
  }
}
